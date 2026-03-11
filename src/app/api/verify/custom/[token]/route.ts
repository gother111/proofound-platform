import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  beginCapabilityTokenRedeemSession,
  CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
  CAPABILITY_TOKEN_CLASSES,
  getCapabilityRedeemSessionCookieName,
  redeemCapabilityToken,
} from '@/lib/security/capability-tokens';
import type { CustomVerificationRelationship } from '@/lib/verification/custom-verification';

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  message: z.string().max(2000).optional(),
});

type CustomRequestItemRow = {
  id: string;
  artifact_type: 'skill' | 'experience' | 'education' | 'impact_story' | 'project' | 'volunteering';
  artifact_id: string;
  display_label?: string;
  status: string;
};

type CustomRequestGetRow = {
  id: string;
  verifier_relationship: CustomVerificationRelationship;
  message: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
  response_message: string | null;
  profiles?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  custom_verification_request_items?: CustomRequestItemRow[] | null;
};

type CustomRequestPostRow = {
  id: string;
  requester_profile_id: string;
  status: string;
  expires_at: string;
  custom_verification_request_items?: CustomRequestItemRow[] | null;
};

function toResponseStatus(status: string): 'pending' | 'accepted' | 'declined' | 'expired' {
  if (status === 'accepted' || status === 'declined' || status === 'expired') {
    return status;
  }

  return 'pending';
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() < Date.now();
}

async function markExpired(admin: ReturnType<typeof createAdminClient>, requestId: string) {
  await admin
    .from('custom_verification_requests')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending');

  await admin
    .from('custom_verification_request_items')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .eq('status', 'pending');
}

/**
 * GET /api/verify/custom/[token]
 *
 * Public endpoint to view a bundled custom verification request.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const admin = createAdminClient();
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    const preview = await beginCapabilityTokenRedeemSession(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE,
      actor: {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      },
      metadata: { surface: 'custom_verification.preview' },
      maxAgeSeconds: CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
    });

    if (!preview.ok) {
      const status = preview.reason === 'invalid' ? 404 : 410;
      return NextResponse.json({ error: 'Verification request not found' }, { status });
    }

    const { data: customRequestRaw, error } = await admin
      .from('custom_verification_requests')
      .select(
        `
        id,
        verifier_relationship,
        message,
        status,
        created_at,
        expires_at,
        responded_at,
        response_message,
        profiles:requester_profile_id (
          display_name,
          avatar_url
        ),
        custom_verification_request_items (
          id,
          artifact_type,
          artifact_id,
          display_label,
          status
        )
      `
      )
      .eq('capability_token_id', preview.token.id)
      .single();

    if (error || !customRequestRaw) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    const customRequest = customRequestRaw as CustomRequestGetRow;

    if (customRequest.status === 'pending' && isExpired(customRequest.expires_at)) {
      await markExpired(admin, customRequest.id);
      customRequest.status = 'expired';
      if (Array.isArray(customRequest.custom_verification_request_items)) {
        customRequest.custom_verification_request_items =
          customRequest.custom_verification_request_items.map((item) => ({
            ...item,
            status: item.status === 'pending' ? 'expired' : item.status,
          }));
      }
    }

    const response = NextResponse.json({
      request: {
        id: customRequest.id,
        requester_name: customRequest.profiles?.display_name || 'A Proofound user',
        requester_avatar: customRequest.profiles?.avatar_url || null,
        relationship: customRequest.verifier_relationship,
        message: customRequest.message,
        status: toResponseStatus(customRequest.status),
        created_at: customRequest.created_at,
        expires_at: customRequest.expires_at,
        responded_at: customRequest.responded_at,
        response_message: customRequest.response_message,
        items: (customRequest.custom_verification_request_items || []).map(
          (item: CustomRequestItemRow) => ({
            id: item.id,
            artifact_type: item.artifact_type,
            artifact_id: item.artifact_id,
            display_label: item.display_label,
            status: toResponseStatus(item.status),
          })
        ),
      },
    });

    response.cookies.set(
      getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE),
      preview.redeemSessionNonce,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: preview.maxAgeSeconds,
      }
    );

    return response;
  } catch (error) {
    console.error('Custom verify GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/verify/custom/[token]
 *
 * Public endpoint to accept or decline a bundled custom verification request.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const admin = createAdminClient();
    const { token } = await params;
    const body = await request.json();

    const parsed = RespondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    const redeemSessionNonce =
      request.cookies.get(
        getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE)
      )?.value ?? null;
    const redeemed = await redeemCapabilityToken(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE,
      actor: {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        principalType: 'external_email',
      },
      consume: true,
      requireRedeemSessionNonce: true,
      redeemSessionNonce,
      metadata: { surface: 'custom_verification.respond', action: parsed.data.action },
    });

    if (!redeemed.ok) {
      const status =
        redeemed.reason === 'replayed' ? 409 : redeemed.reason === 'invalid' ? 404 : 410;
      return NextResponse.json({ error: 'Verification request not found' }, { status });
    }

    const { data: customRequestRaw, error: requestError } = await admin
      .from('custom_verification_requests')
      .select(
        `
        id,
        requester_profile_id,
        status,
        expires_at,
        custom_verification_request_items (
          id,
          artifact_type,
          artifact_id
        )
      `
      )
      .eq('capability_token_id', redeemed.token.id)
      .single();

    if (requestError || !customRequestRaw) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    const customRequest = customRequestRaw as CustomRequestPostRow;

    if (customRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${customRequest.status}` },
        { status: 400 }
      );
    }

    if (isExpired(customRequest.expires_at)) {
      await markExpired(admin, customRequest.id);
      return NextResponse.json({ error: 'This verification request has expired' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const nextStatus = parsed.data.action === 'accept' ? 'accepted' : 'declined';

    const { error: updateRequestError } = await admin
      .from('custom_verification_requests')
      .update({
        status: nextStatus,
        responded_at: nowIso,
        response_message: parsed.data.message?.trim() || null,
        updated_at: nowIso,
      })
      .eq('id', customRequest.id);

    if (updateRequestError) {
      console.error('Failed to update custom verification request:', updateRequestError);
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 });
    }

    const { error: updateItemsError } = await admin
      .from('custom_verification_request_items')
      .update({
        status: nextStatus,
        updated_at: nowIso,
      })
      .eq('request_id', customRequest.id)
      .eq('status', 'pending');

    if (updateItemsError) {
      console.error('Failed to update custom verification request items:', updateItemsError);
      return NextResponse.json({ error: 'Failed to update request items' }, { status: 500 });
    }

    const items = customRequest.custom_verification_request_items || [];
    const idsByType = {
      skill: items
        .filter((item: CustomRequestItemRow) => item.artifact_type === 'skill')
        .map((item: CustomRequestItemRow) => item.artifact_id),
      experience: items
        .filter((item: CustomRequestItemRow) => item.artifact_type === 'experience')
        .map((item: CustomRequestItemRow) => item.artifact_id),
      education: items
        .filter((item: CustomRequestItemRow) => item.artifact_type === 'education')
        .map((item: CustomRequestItemRow) => item.artifact_id),
      impact_story: items
        .filter((item: CustomRequestItemRow) => item.artifact_type === 'impact_story')
        .map((item: CustomRequestItemRow) => item.artifact_id),
      project: items
        .filter((item: CustomRequestItemRow) => item.artifact_type === 'project')
        .map((item: CustomRequestItemRow) => item.artifact_id),
      volunteering: items
        .filter((item: CustomRequestItemRow) => item.artifact_type === 'volunteering')
        .map((item: CustomRequestItemRow) => item.artifact_id),
    };

    const skillStatus = parsed.data.action === 'accept' ? 'accepted' : 'declined';

    const { error: updateSkillVerificationError } = await admin
      .from('skill_verification_requests')
      .update({
        status: skillStatus,
        responded_at: nowIso,
        response_message: parsed.data.message?.trim() || null,
      })
      .eq('custom_request_id', customRequest.id)
      .eq('status', 'pending');

    if (updateSkillVerificationError) {
      console.error(
        'Failed to update linked skill verification requests:',
        updateSkillVerificationError
      );
      return NextResponse.json(
        { error: 'Failed to update linked skill verification rows' },
        { status: 500 }
      );
    }

    if (parsed.data.action === 'accept') {
      if (idsByType.experience.length > 0) {
        await admin
          .from('experiences')
          .update({ verified: true, updated_at: nowIso })
          .eq('user_id', customRequest.requester_profile_id)
          .in('id', idsByType.experience);
      }

      if (idsByType.education.length > 0) {
        await admin
          .from('education')
          .update({ verified: true, updated_at: nowIso })
          .eq('user_id', customRequest.requester_profile_id)
          .in('id', idsByType.education);
      }

      if (idsByType.impact_story.length > 0) {
        await admin
          .from('impact_stories')
          .update({ verified: true, updated_at: nowIso })
          .eq('user_id', customRequest.requester_profile_id)
          .in('id', idsByType.impact_story);
      }

      if (idsByType.project.length > 0) {
        await admin
          .from('projects')
          .update({
            verified: true,
            verified_at: nowIso,
            verification_source: 'custom_request',
            updated_at: nowIso,
          })
          .eq('user_id', customRequest.requester_profile_id)
          .in('id', idsByType.project);
      }

      if (idsByType.volunteering.length > 0) {
        await admin
          .from('volunteering')
          .update({ verified: true, updated_at: nowIso })
          .eq('user_id', customRequest.requester_profile_id)
          .in('id', idsByType.volunteering);
      }
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      message:
        parsed.data.action === 'accept'
          ? 'Thank you for verifying these artifacts!'
          : 'Your response has been recorded.',
    });
  } catch (error) {
    console.error('Custom verify POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
