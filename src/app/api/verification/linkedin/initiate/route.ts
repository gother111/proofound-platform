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
import { userIntegrations, individualProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { constructLinkedInProfileUrl, fetchLinkedInProfile } from '@/lib/linkedin';
import { checkLinkedInVerification } from '@/lib/linkedin-scraper';
import {
  enrichLinkedInProfile,
  combineVerificationData,
} from '@/lib/linkedin-enrichment';

export async function POST(request: NextRequest) {
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
      .where(
        and(
          eq(userIntegrations.userId, user.id),
          eq(userIntegrations.provider, 'linkedin')
        )
      )
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

    // 4. Get LinkedIn profile data and construct URL
    let profileUrl: string;
    
    if (linkedInIntegration.profileData && (linkedInIntegration.profileData as any).vanityName) {
      // Use stored profile data if available
      profileUrl = constructLinkedInProfileUrl(linkedInIntegration.profileData as any);
    } else {
      // Fetch fresh profile data
      const profileData = await fetchLinkedInProfile(linkedInIntegration.accessToken!);
      profileUrl = constructLinkedInProfileUrl(profileData);
      
      // Update stored profile data
      await db
        .update(userIntegrations)
        .set({ profileData: profileData as any })
        .where(eq(userIntegrations.id, linkedInIntegration.id));
    }

    console.log('Starting LinkedIn verification check for:', profileUrl);

    // 5. RUN AUTOMATED CHECK (FREE, 5-10 seconds)
    const automatedCheck = await checkLinkedInVerification(profileUrl);

    if (!automatedCheck.success) {
      return NextResponse.json(
        {
          error: 'Failed to analyze LinkedIn profile',
          details: automatedCheck.error,
        },
        { status: 500 }
      );
    }

    console.log('Automated check complete:', {
      confidence: automatedCheck.confidence,
      hasVerificationBadge: automatedCheck.signals?.hasVerificationBadge,
      recommendation: automatedCheck.recommendation,
    });

    // 6. OPTIONAL: Run third-party enrichment if configured
    let thirdPartyData = null;
    try {
      thirdPartyData = await enrichLinkedInProfile(profileUrl);
      console.log('Third-party enrichment:', thirdPartyData?.success ? 'success' : 'skipped');
    } catch (error) {
      // Enrichment is optional, don't fail the whole request
      console.warn('Third-party enrichment failed:', error);
    }

    // 7. Combine data from both sources
    const combinedData = thirdPartyData
      ? combineVerificationData(
          {
            confidence: automatedCheck.confidence!,
            signals: automatedCheck.signals!,
          },
          thirdPartyData
        )
      : {
          finalConfidence: automatedCheck.confidence!,
          hasVerificationBadge: automatedCheck.signals!.hasVerificationBadge,
          sources: ['playwright'],
        };

    // 8. Store all verification data
    const verificationData = {
      hasVerificationBadge: combinedData.hasVerificationBadge,
      automatedCheck: {
        confidence: combinedData.finalConfidence,
        originalConfidence: automatedCheck.confidence,
        signals: automatedCheck.signals,
        recommendation: automatedCheck.recommendation,
        checkedAt: automatedCheck.checkedAt,
        sources: combinedData.sources,
      },
      thirdPartyData: thirdPartyData?.success ? thirdPartyData : null,
      adminReviewed: false,
      adminNotes: null,
    };

    // 9. Update individual profile with verification request
    const { data: profile, error: updateError } = await supabase
      .from('individual_profiles')
      .update({
        linkedin_profile_url: profileUrl,
        linkedin_verification_data: verificationData,
        verification_status: 'pending',
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to store verification data' },
        { status: 500 }
      );
    }

    console.log('LinkedIn verification initiated successfully');

    // 10. Return results to frontend
    return NextResponse.json({
      success: true,
      profileUrl,
      automatedCheck: {
        confidence: combinedData.finalConfidence,
        hasVerificationBadge: combinedData.hasVerificationBadge,
        signals: automatedCheck.signals,
        recommendation: automatedCheck.recommendation,
        sources: combinedData.sources,
      },
      message: `Verification check complete. ${
        combinedData.finalConfidence >= 80
          ? 'High confidence - pending quick admin review (typically < 1 hour).'
          : combinedData.finalConfidence >= 50
          ? 'Medium confidence - pending manual admin review (1-2 business days).'
          : 'Low confidence - please try another verification method.'
      }`,
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

