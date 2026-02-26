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
import {
  fetchLinkedInIdentityMe,
  fetchLinkedInVerificationReport,
  LinkedInRestApiError,
} from '@/lib/linkedin-verified';

type VerificationWarning = {
  code: string;
  message: string;
};

const DEFAULT_AUTOMATED_SIGNALS = {
  hasVerificationBadge: false,
  connectionCount: null,
  experienceCount: 0,
  profileCompleteness: 0,
  hasProfilePhoto: false,
  accountAge: 'new' as const,
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

    // 5. Derive profile URL for scraper-based secondary checks.
    let profileUrl = identityMe?.profileUrl ?? null;
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

    // 6. RUN AUTOMATED CHECK (secondary signal, optional when profile URL is unavailable)
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
          checkedAt: new Date().toISOString(),
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
        checkedAt: new Date().toISOString(),
      };
    }

    console.log('Automated check complete:', {
      confidence: automatedCheck.confidence,
      hasVerificationBadge: automatedCheck.signals?.hasVerificationBadge,
      recommendation: automatedCheck.recommendation,
    });

    const automatedConfidence =
      typeof automatedCheck.confidence === 'number' ? automatedCheck.confidence : 0;
    const automatedSignals = automatedCheck.signals ?? DEFAULT_AUTOMATED_SIGNALS;
    const automatedRecommendation = automatedCheck.recommendation ?? 'review_manually';
    const automatedCheckedAt = automatedCheck.checkedAt ?? new Date().toISOString();

    // 7. OPTIONAL: Run third-party enrichment if configured
    let thirdPartyData = null;
    if (profileUrl) {
      try {
        thirdPartyData = await enrichLinkedInProfile(profileUrl);
        console.log('Third-party enrichment:', thirdPartyData?.success ? 'success' : 'skipped');
      } catch (error) {
        // Enrichment is optional, don't fail the whole request
        console.warn('Third-party enrichment failed:', error);
      }
    }

    // 8. Combine data from both secondary sources
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

    // 9. Store all verification data
    const verificationData = {
      hasIdentityVerification,
      hasVerificationBadge: combinedHasVerificationBadge,
      apiReport: {
        hasIdentityVerification,
        verifications: verificationReport?.verifications || [],
        identityMe: identityMe?.raw || null,
        verificationReport: verificationReport?.raw || null,
        warnings,
        checkedAt: new Date().toISOString(),
      },
      automatedCheck: {
        confidence: combinedConfidence,
        originalConfidence: automatedConfidence,
        signals: automatedSignals,
        recommendation: automatedRecommendation,
        checkedAt: automatedCheckedAt,
        sources: combinedSources,
      },
      thirdPartyData: thirdPartyData?.success ? thirdPartyData : null,
      adminReviewed: false,
      adminNotes: null,
    };

    const updatePayload: Record<string, unknown> = {
      linkedin_verification_data: verificationData,
      linkedin_verification_status: 'pending',
    };

    if (profileUrl) {
      updatePayload.linkedin_profile_url = profileUrl;
    }

    // 10. Update individual profile with verification request
    const { data: profile, error: updateError } = await supabase
      .from('individual_profiles')
      .update(updatePayload)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to store verification data' }, { status: 500 });
    }

    console.log('LinkedIn verification initiated successfully');

    const bestWarning = warnings[0]?.message || null;
    const message = hasIdentityVerification
      ? 'LinkedIn identity verification signal detected. Pending admin review.'
      : `Verification check complete. ${
          combinedConfidence >= 80
            ? 'High confidence - pending quick admin review (typically < 1 hour).'
            : combinedConfidence >= 50
              ? 'Medium confidence - pending manual admin review (1-2 business days).'
              : 'Low confidence - please try another verification method.'
        }`;

    // 11. Return results to frontend
    return NextResponse.json({
      success: true,
      profileUrl: profileUrl || null,
      hasIdentityVerification,
      linkedinVerificationStatus: 'pending',
      automatedCheck: {
        confidence: combinedConfidence,
        hasVerificationBadge: combinedHasVerificationBadge,
        signals: automatedSignals,
        recommendation: automatedRecommendation,
        sources: combinedSources,
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
