/**
 * Admin LinkedIn Verification Queue
 *
 * GET /api/admin/verification/linkedin/queue
 *
 * Returns all pending LinkedIn verifications sorted by confidence score
 * High-confidence cases appear first for quick approvals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { individualProfiles, profiles } from '@/db/schema';
import { eq, and, isNotNull, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // 1. Check if user is admin
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role (you may need to adjust this based on your admin check logic)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Get all pending LinkedIn verifications
    const pendingVerifications = await db
      .select({
        userId: profiles.id,
        userName: profiles.displayName,
        userEmail: sql<string>`NULL`, // Email stored in Supabase auth
        userAvatar: profiles.avatarUrl,
        linkedinUrl: individualProfiles.linkedinProfileUrl,
        verificationData: individualProfiles.linkedinVerificationData,
        verificationStatus: individualProfiles.verificationStatus,
        createdAt: profiles.updatedAt,
      })
      .from(individualProfiles)
      .innerJoin(profiles, eq(profiles.id, individualProfiles.userId))
      .where(
        and(
          eq(individualProfiles.verificationStatus, 'pending'),
          isNotNull(individualProfiles.linkedinProfileUrl)
        )
      )
      .orderBy(desc(profiles.updatedAt));

    // 3. Sort by confidence score (high confidence first)
    const sortedVerifications = pendingVerifications
      .map((v) => {
        const data = v.verificationData as any;
        const confidence = data?.automatedCheck?.confidence || 0;
        const hasVerificationBadge = data?.hasVerificationBadge || false;
        const recommendation = data?.automatedCheck?.recommendation || 'review_manually';

        return {
          ...v,
          confidence,
          hasVerificationBadge,
          recommendation,
          signals: data?.automatedCheck?.signals || {},
          sources: data?.automatedCheck?.sources || ['playwright'],
        };
      })
      .sort((a, b) => b.confidence - a.confidence);

    // 4. Group by confidence level for easier admin review
    const highConfidence = sortedVerifications.filter((v) => v.confidence >= 80);
    const mediumConfidence = sortedVerifications.filter(
      (v) => v.confidence >= 50 && v.confidence < 80
    );
    const lowConfidence = sortedVerifications.filter((v) => v.confidence < 50);

    return NextResponse.json({
      success: true,
      queue: {
        all: sortedVerifications,
        highConfidence,
        mediumConfidence,
        lowConfidence,
      },
      stats: {
        total: sortedVerifications.length,
        high: highConfidence.length,
        medium: mediumConfidence.length,
        low: lowConfidence.length,
      },
    });
  } catch (error) {
    console.error('Error fetching LinkedIn verification queue:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch verification queue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
