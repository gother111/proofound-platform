/**
 * LinkedIn Verification Initiation
 *
 * POST /api/verification/linkedin/initiate
 *
 * This is where the magic happens:
 * 1. Gets LinkedIn profile URL from user's integration
 * 2. Runs automated Playwright scraper to check for verification badge
 * 3. Optionally runs third-party enrichment (Proxycurl)
 * 4. Combines all data and stores for admin review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { constructLinkedInProfileUrl, fetchLinkedInProfile } from '@/lib/linkedin';
import { checkLinkedInVerification } from '@/lib/linkedin-scraper';
import { enrichLinkedInProfile, combineVerificationData } from '@/lib/linkedin-enrichment';
import { sendLinkedInVerificationPendingReviewEmail } from '@/lib/email';
import {
  resolveCanonicalVerificationTier,
  type LinkedInVerificationLevel,
} from '@/lib/verification/tier';
import { resolveWorkEmailValidity } from '@/lib/verification/work-email-validity';
import {
  fetchLinkedInIdentityMe,
  fetchLinkedInVerificationReport,
  LinkedInRestApiError,
} from '@/lib/linkedin-verified';

type VerificationWarning = {
  code: string;
  message: string;
};

type AutomatedSignals = {
  hasVerificationBadge: boolean;
  connectionCount: number | null;
  experienceCount: number;
  profileCompleteness: number;
  hasProfilePhoto: boolean;
  accountAge: 'new' | 'medium' | 'old';
};

const DEFAULT_AUTOMATED_SIGNALS: AutomatedSignals = {
  hasVerificationBadge: false,
  connectionCount: null,
  experienceCount: 0,
  profileCompleteness: 0,
  hasProfilePhoto: false,
  accountAge: 'new' as const,
};

type AutomatedCheckSummary = {
  confidence: number;
  hasVerificationBadge: boolean;
  signals: AutomatedSignals;
  recommendation: 'approve' | 'review_manually' | 'reject';
  checkedAt: string;
  sources: string[];
  originalConfidence?: number;
};

function warningFromLinkedInError(endpoint: string, error: unknown): VerificationWarning {
  if (error instanceof LinkedInRestApiError) {
    if (error.status === 403) {
      return {
        code: `${endpoint}_scope_missing`,
        message:
          endpoint === 'verificationReport'
            ? 'LinkedIn verification scope is missing. Ask support to enable the Verified on LinkedIn scope (r_verify).'
            : 'LinkedIn profile-basic scope is missing. Ask support to enable r_profile_basicinfo.',
      };
    }

    return {
      code: `${endpoint}_request_failed`,
      message: `LinkedIn ${endpoint} request failed (${error.status}).`,
    };
  }

  return {
    code: `${endpoint}_request_failed`,
    message: `LinkedIn ${endpoint} request failed.`,
  };
}

export async function POST(_request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('individual_profiles')
      .select(
        'verified, verified_at, verification_method, verification_status, verification_tier, verification_tier_source, work_email_verified, work_email_verified_at, work_email_reverify_due_at'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingProfileError) {
      console.error('Failed to load current verification profile state:', existingProfileError);
      return NextResponse.json(
        { error: 'Failed to load verification state before LinkedIn check' },
        { status: 500 }
      );
    }

    const workEmailValidity = resolveWorkEmailValidity(existingProfile || {});

    // 2. Check if LinkedIn is connected
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(and(eq(userIntegrations.userId, user.id), eq(userIntegrations.provider, 'linkedin')))
      .limit(1);

    if (integration.length === 0) {
      return NextResponse.json(
        { error: 'LinkedIn not connected. Please connect your LinkedIn account first.' },
        { status: 400 }
      );
    }

    const linkedInIntegration = integration[0];

    // 3. Check if token is still valid
    if (linkedInIntegration.tokenExpiry && new Date() > linkedInIntegration.tokenExpiry) {
      return NextResponse.json(
        { error: 'LinkedIn token expired. Please reconnect your LinkedIn account.' },
        { status: 401 }
      );
    }

    const warnings: VerificationWarning[] = [];
    const accessToken = linkedInIntegration.accessToken!;

    let identityMe: Awaited<ReturnType<typeof fetchLinkedInIdentityMe>> | null = null;
    let verificationReport: Awaited<ReturnType<typeof fetchLinkedInVerificationReport>> | null =
      null;

    // 4. Query official LinkedIn Verified APIs first
    try {
      verificationReport = await fetchLinkedInVerificationReport(accessToken);
    } catch (error) {
      warnings.push(warningFromLinkedInError('verificationReport', error));
      console.warn('LinkedIn verificationReport call failed:', error);
    }

    try {
      identityMe = await fetchLinkedInIdentityMe(accessToken);
    } catch (error) {
      warnings.push(warningFromLinkedInError('identityMe', error));
      console.warn('LinkedIn identityMe call failed:', error);
    }

    const hasIdentityVerification = verificationReport?.hasIdentityVerification ?? false;
    const hasWorkplaceVerification = verificationReport?.hasWorkplaceVerification ?? false;

    const nowIso = new Date().toISOString();

    // 5. Derive profile URL from identity endpoint first.
    let profileUrl = identityMe?.profileUrl ?? null;
    let thirdPartyData = null;
    let automatedSummary: AutomatedCheckSummary;
    let linkedinVerificationStatus: 'verified' | 'pending';
    let linkedinVerificationLevel: LinkedInVerificationLevel;
    let identityGranted = false;

    if (hasIdentityVerification) {
      // Official LinkedIn identity signal is sufficient for auto-approval.
      automatedSummary = {
        confidence: 100,
        hasVerificationBadge: true,
        signals: {
          ...DEFAULT_AUTOMATED_SIGNALS,
          hasVerificationBadge: true,
        },
        recommendation: 'approve',
        checkedAt: nowIso,
        sources: ['linkedin-api'],
        originalConfidence: 100,
      };
      linkedinVerificationStatus = 'verified';
      linkedinVerificationLevel = 'identity';
      identityGranted = true;
    } else if (hasWorkplaceVerification) {
      automatedSummary = {
        confidence: 90,
        hasVerificationBadge: true,
        signals: {
          ...DEFAULT_AUTOMATED_SIGNALS,
          hasVerificationBadge: true,
        },
        recommendation: 'approve',
        checkedAt: nowIso,
        sources: ['linkedin-api'],
        originalConfidence: 90,
      };
      linkedinVerificationStatus = 'verified';
      linkedinVerificationLevel = 'workplace';
    } else {
      // Manual review path: gather secondary confidence signals.
      if (!profileUrl) {
        try {
          const profileData = await fetchLinkedInProfile(accessToken);
          profileUrl = constructLinkedInProfileUrl(profileData);
        } catch (error) {
          warnings.push({
            code: 'legacy_profile_fetch_failed',
            message:
              'Could not derive a LinkedIn profile URL for scraper-based confidence signals. API report was still captured.',
          });
          console.warn('LinkedIn legacy profile fetch failed:', error);
        }
      }

      console.log('Starting LinkedIn verification check for:', profileUrl);

      let automatedCheck:
        | Awaited<ReturnType<typeof checkLinkedInVerification>>
        | {
            success: true;
            confidence: number;
            signals: typeof DEFAULT_AUTOMATED_SIGNALS;
            recommendation: 'review_manually';
            checkedAt: string;
          };

      if (profileUrl) {
        const scraped = await checkLinkedInVerification(profileUrl);
        if (!scraped.success) {
          warnings.push({
            code: 'scraper_check_failed',
            message:
              'LinkedIn scraper check failed. Admin review will rely on API report and fallback signals.',
          });
          automatedCheck = {
            success: true,
            confidence: 0,
            signals: DEFAULT_AUTOMATED_SIGNALS,
            recommendation: 'review_manually',
            checkedAt: nowIso,
          };
        } else {
          automatedCheck = scraped;
        }
      } else {
        warnings.push({
          code: 'profile_url_unavailable',
          message:
            'LinkedIn profile URL unavailable. Scraper and enrichment checks were skipped; API report was captured.',
        });
        automatedCheck = {
          success: true,
          confidence: 0,
          signals: DEFAULT_AUTOMATED_SIGNALS,
          recommendation: 'review_manually',
          checkedAt: nowIso,
        };
      }

      const automatedConfidence =
        typeof automatedCheck.confidence === 'number' ? automatedCheck.confidence : 0;
      const automatedSignals = automatedCheck.signals ?? DEFAULT_AUTOMATED_SIGNALS;
      const automatedRecommendation = automatedCheck.recommendation ?? 'review_manually';
      const automatedCheckedAt = automatedCheck.checkedAt ?? nowIso;

      if (profileUrl) {
        try {
          thirdPartyData = await enrichLinkedInProfile(profileUrl);
          console.log('Third-party enrichment:', thirdPartyData?.success ? 'success' : 'skipped');
        } catch (error) {
          console.warn('Third-party enrichment failed:', error);
        }
      }

      const combinedData = thirdPartyData
        ? combineVerificationData(
            {
              confidence: automatedConfidence,
              signals: automatedSignals,
            },
            thirdPartyData
          )
        : {
            finalConfidence: automatedConfidence,
            hasVerificationBadge: automatedSignals.hasVerificationBadge,
            sources: ['playwright'],
          };
      const combinedConfidence =
        typeof combinedData.finalConfidence === 'number'
          ? combinedData.finalConfidence
          : automatedConfidence;
      const combinedHasVerificationBadge = Boolean(combinedData.hasVerificationBadge);
      const combinedSources =
        Array.isArray(combinedData.sources) && combinedData.sources.length > 0
          ? combinedData.sources
          : ['playwright'];

      automatedSummary = {
        confidence: combinedConfidence,
        hasVerificationBadge: combinedHasVerificationBadge,
        signals: automatedSignals,
        recommendation: automatedRecommendation,
        checkedAt: automatedCheckedAt,
        sources: combinedSources,
        originalConfidence: automatedConfidence,
      };
      linkedinVerificationStatus = 'pending';
      linkedinVerificationLevel = 'pending';
    }

    // 6. Store verification data
    const autoApproved =
      linkedinVerificationLevel === 'identity' || linkedinVerificationLevel === 'workplace';
    const verificationData = {
      hasIdentityVerification,
      hasWorkplaceVerification,
      linkedinVerificationLevel,
      hasVerificationBadge: automatedSummary.hasVerificationBadge,
      apiReport: {
        hasIdentityVerification,
        hasWorkplaceVerification,
        verifications: verificationReport?.verifications || [],
        identityMe: identityMe?.raw || null,
        verificationReport: verificationReport?.raw || null,
        warnings,
        checkedAt: nowIso,
      },
      automatedCheck: {
        confidence: automatedSummary.confidence,
        originalConfidence: automatedSummary.originalConfidence ?? automatedSummary.confidence,
        signals: automatedSummary.signals,
        recommendation: automatedSummary.recommendation,
        checkedAt: automatedSummary.checkedAt,
        sources: automatedSummary.sources,
      },
      thirdPartyData: thirdPartyData?.success ? thirdPartyData : null,
      adminReviewed: autoApproved,
      adminNotes:
        linkedinVerificationLevel === 'identity'
          ? 'Auto-approved via LinkedIn identity signal.'
          : linkedinVerificationLevel === 'workplace'
            ? 'Auto-approved via LinkedIn workplace signal.'
            : null,
      adminDecision: autoApproved ? 'approved' : null,
      reviewedAt: autoApproved ? nowIso : null,
      reviewedBy:
        linkedinVerificationLevel === 'identity'
          ? 'system:auto-linkedin-identity'
          : linkedinVerificationLevel === 'workplace'
            ? 'system:auto-linkedin-workplace'
            : null,
    };

    const canonicalTier = resolveCanonicalVerificationTier({
      currentTier: existingProfile?.verification_tier,
      currentTierSource: existingProfile?.verification_tier_source,
      verificationMethod: existingProfile?.verification_method,
      verificationStatus: existingProfile?.verification_status,
      verified: existingProfile?.verified,
      linkedinVerificationStatus,
      linkedinVerificationData: verificationData,
      workEmailCurrentlyVerified: workEmailValidity.isCurrentlyVerified,
    });

    const updatePayload: Record<string, unknown> = {
      linkedin_verification_data: verificationData,
      linkedin_verification_status: linkedinVerificationStatus,
      linkedin_verification_level: linkedinVerificationLevel,
      verification_tier: canonicalTier.verificationTier,
      verification_tier_source: canonicalTier.verificationTierSource,
    };

    if (profileUrl) {
      updatePayload.linkedin_profile_url = profileUrl;
    }

    if (linkedinVerificationLevel === 'identity' || linkedinVerificationLevel === 'workplace') {
      updatePayload.linkedin_verified_at = nowIso;
    }

    if (canonicalTier.verificationTier === 'identity_verified') {
      updatePayload.verification_status = 'verified';
      updatePayload.verification_method =
        canonicalTier.verificationTierSource === 'veriff' ? 'veriff' : 'linkedin';
      updatePayload.verified = true;
      updatePayload.verified_at = existingProfile?.verified_at || nowIso;
      identityGranted = linkedinVerificationLevel === 'identity';
    } else if (linkedinVerificationLevel === 'pending') {
      updatePayload.verification_status = 'pending';
      updatePayload.verification_method = 'linkedin';
      updatePayload.verified = false;
    } else {
      // Workplace-tier and unverified states do not grant identity badge.
      updatePayload.verification_status = 'unverified';
      updatePayload.verification_method =
        canonicalTier.verificationTierSource === 'work_email' ? 'work_email' : null;
      updatePayload.verified = false;
    }

    // 7. Persist profile updates
    const { error: updateError } = await supabase
      .from('individual_profiles')
      .update(updatePayload)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to store verification data' }, { status: 500 });
    }

    if (linkedinVerificationLevel === 'pending') {
      try {
        const { data: profileInfo } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();

        const candidateName =
          profileInfo?.display_name ||
          ((user.user_metadata?.full_name as string | undefined) ?? null) ||
          user.email?.split('@')[0] ||
          'Unknown user';

        await sendLinkedInVerificationPendingReviewEmail({
          candidateName,
          candidateEmail: user.email ?? null,
          candidateProfileId: user.id,
          confidence: automatedSummary.confidence,
          hasIdentityVerification,
          hasWorkplaceVerification,
          linkedinProfileUrl: profileUrl,
        });
      } catch (notificationError) {
        console.error(
          'Failed to send admin notification for LinkedIn manual review:',
          notificationError
        );
      }
    }

    console.log('LinkedIn verification initiated successfully');

    const bestWarning = warnings[0]?.message || null;
    const message =
      linkedinVerificationLevel === 'identity'
        ? 'LinkedIn identity verification signal detected. Your identity verification has been automatically approved.'
        : linkedinVerificationLevel === 'workplace'
          ? 'LinkedIn workplace verification signal detected. Workplace verification has been automatically approved.'
          : `Verification check complete. ${
              automatedSummary.confidence >= 80
                ? 'High confidence - pending quick admin review (typically < 1 hour).'
                : automatedSummary.confidence >= 50
                  ? 'Medium confidence - pending manual admin review (1-2 business days).'
                  : 'Low confidence - please try another verification method.'
            }`;

    // 8. Return results to frontend
    return NextResponse.json({
      success: true,
      profileUrl: profileUrl || null,
      hasIdentityVerification,
      hasWorkplaceVerification,
      linkedinVerificationStatus,
      linkedinVerificationLevel,
      identityGranted,
      automatedCheck: {
        confidence: automatedSummary.confidence,
        hasVerificationBadge: automatedSummary.hasVerificationBadge,
        signals: automatedSummary.signals,
        recommendation: automatedSummary.recommendation,
        sources: automatedSummary.sources,
      },
      warnings,
      message: bestWarning ? `${message} ${bestWarning}` : message,
    });
  } catch (error) {
    console.error('LinkedIn verification initiation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate verification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
