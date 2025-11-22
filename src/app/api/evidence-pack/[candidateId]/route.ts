/**
 * Evidence Pack Export API
 *
 * GET /api/evidence-pack/[candidateId] - Generate and download evidence pack PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { generateEvidencePackPDF } from '@/lib/reports/evidence-pack-generator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId } = await params;
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    // Verify user is organization owner of the assignment
    const assignment = await db.execute(sql`
      SELECT
        a.*,
        o.name as organization_name
      FROM assignments a
      INNER JOIN organizations o ON a.organization_id = o.id
      WHERE a.id = ${assignmentId}
        AND a.organization_id = ${user.id}
    `);

    if (!assignment.length) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
    }

    const assignmentData = assignment[0] as any;

    // Get candidate profile
    const profile = await db.execute(sql`
      SELECT
        ip.*,
        u.email
      FROM individual_profiles ip
      INNER JOIN auth.users u ON ip.user_id = u.id
      WHERE ip.user_id = ${candidateId}
    `);

    if (!profile.length) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 });
    }

    const profileData = profile[0] as any;

    // Get skills with verifications
    const skills = await db.execute(sql`
      SELECT
        s.*,
        COALESCE(
        json_agg(
          json_build_object(
            'verifierName', v.verifier_name,
            'verifiedAt', v.verified_at,
            'relationship', v.relationship
          )
        ) FILTER (WHERE v.id IS NOT NULL),
        '[]'
        ) as verifications
      FROM user_skills s
      LEFT JOIN skill_verifications v ON s.id = v.skill_id
      WHERE s.user_id = ${candidateId}
      GROUP BY s.id
    `);

    // Get experiences
    const experiences = await db.execute(sql`
      SELECT *
      FROM experiences
      WHERE user_id = ${candidateId}
      ORDER BY start_date DESC
    `);

    // Get education
    const education = await db.execute(sql`
      SELECT *
      FROM education
      WHERE user_id = ${candidateId}
      ORDER BY start_date DESC
    `);

    // Get match information
    const match = await db.execute(sql`
      SELECT *
      FROM matches
      WHERE assignment_id = ${assignmentId}
        AND individual_id = ${candidateId}
    `);

    const matchData = match[0] as any;

    // Get interview and decision information
    const interview = await db.execute(sql`
      SELECT
        i.*,
        d.decision,
        d.feedback,
        d.created_at as decision_made_at
      FROM interviews i
      LEFT JOIN decisions d ON i.id = d.interview_id
      WHERE i.assignment_id = ${assignmentId}
        AND ${candidateId} = ANY(i.participant_user_ids)
      ORDER BY i.scheduled_at DESC
      LIMIT 1
    `);

    const interviewData = interview[0] as any;

    // Build profile data structure
    const evidenceProfile = {
      name: profileData.name || 'Anonymous',
      email: profileData.email,
      phone: profileData.phone,
      location: profileData.location,
      headline: profileData.headline,
      bio: profileData.bio,
      skills: skills.map((s: any) => ({
        name: s.skill_name || s.skill_code,
        level: s.level || 0,
        monthsExperience: s.months_experience,
        verifications: s.verifications || [],
      })),
      experiences: experiences.map((e: any) => ({
        title: e.title,
        company: e.company,
        startDate: new Date(e.start_date),
        endDate: e.end_date ? new Date(e.end_date) : undefined,
        description: e.description,
      })),
      education: education.map((e: any) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        startDate: new Date(e.start_date),
        endDate: e.end_date ? new Date(e.end_date) : undefined,
      })),
      verifications: {
        emailVerified: profileData.email_verified || false,
        phoneVerified: profileData.phone_verified || false,
        identityVerified: profileData.identity_verified || false,
        verifiedAt: profileData.verified_at ? new Date(profileData.verified_at) : undefined,
      },
      matchScore: matchData?.score,
      rank: matchData?.rank,
      totalCandidates: matchData?.total_candidates,
    };

    const evidenceAssignment = {
      role: assignmentData.role,
      organization: assignmentData.organization_name,
      createdAt: new Date(assignmentData.created_at),
      interviewDate: interviewData?.scheduled_at ? new Date(interviewData.scheduled_at) : undefined,
      decision: interviewData?.decision
        ? {
            type: interviewData.decision,
            madeAt: new Date(interviewData.decision_made_at),
            feedback: interviewData.feedback,
          }
        : undefined,
    };

    // Generate PDF
    const pdfBuffer = await generateEvidencePackPDF(evidenceProfile, evidenceAssignment);

    // Log generation
    log.info('evidence_pack.generated', {
      organizationId: user.id,
      candidateId,
      assignmentId,
      pdfSize: pdfBuffer.length,
    });

    // Emit analytics event
    await db.execute(sql`
      INSERT INTO analytics_events (
        event_type,
        user_id,
        organization_id,
        entity_type,
        entity_id,
        properties,
        occurred_at
      ) VALUES (
        'evidence_pack_generated',
        ${user.id},
        ${user.id},
        'candidate',
        ${candidateId},
        ${JSON.stringify({ assignment_id: assignmentId })}::jsonb,
        NOW()
      )
    `);

    // Return PDF as download
    const filename = `evidence-pack-${profileData.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    log.error('evidence_pack.generate.api.failed', {
      candidateId: params.candidateId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to generate evidence pack' }, { status: 500 });
  }
}
