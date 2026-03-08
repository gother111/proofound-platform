/**
 * Profile Snippet API
 *
 * POST /api/profile/snippet - Create new profile snippet
 * GET /api/profile/snippet - List user's snippets
 * DELETE /api/profile/snippet - Delete snippet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { proofPacks } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { getRows } from '@/lib/db/rows';
import {
  generateShareToken,
  buildPublicProfileURL,
  validateSnippetConfig,
  type SnippetFields,
} from '@/lib/profile/snippet-generator';
import {
  CANONICAL_PROOFS_WRITE_ENABLED,
  deleteCanonicalProofPackForSnippet,
  upsertCanonicalProofPackForSnippet,
} from '@/lib/canonical/repository';
import { inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
type ProfileType = 'individual' | 'organization';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSnippetFields(value: unknown): value is SnippetFields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeProfileType(value: unknown): ProfileType {
  return value === 'organization' ? 'organization' : 'individual';
}

/**
 * POST - Create new snippet
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fields, theme, format, expiresInDays } = body;

    if (!isSnippetFields(fields)) {
      return NextResponse.json({ error: 'Invalid fields payload' }, { status: 400 });
    }

    const profileType = normalizeProfileType(body.profileType);
    const orgId = typeof body.orgId === 'string' ? body.orgId.trim() : null;

    // Validate configuration
    const validation = validateSnippetConfig(fields);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: validation.errors },
        { status: 400 }
      );
    }

    if (profileType === 'organization') {
      if (!orgId || !UUID_REGEX.test(orgId)) {
        return NextResponse.json({ error: 'Valid orgId is required' }, { status: 400 });
      }

      const membershipCheck = await db.execute(sql`
        SELECT 1
        FROM organization_members
        WHERE org_id = ${orgId}
          AND user_id = ${user.id}
          AND status = 'active'
        LIMIT 1
      `);

      if (getRows(membershipCheck as any).length === 0) {
        return NextResponse.json(
          { error: 'You must be an active member to share this organization profile' },
          { status: 403 }
        );
      }
    }

    // Generate share token
    const shareToken = generateShareToken();

    // Calculate expiration
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Store snippet
    const result = await db.execute(sql`
      INSERT INTO profile_snippets (
        user_id,
        share_token,
        fields,
        theme,
        format,
        profile_type,
        org_id,
        expires_at,
        created_at
      ) VALUES (
        ${user.id},
        ${shareToken},
        ${JSON.stringify(fields)}::jsonb,
        ${theme || 'auto'},
        ${format || 'card'},
        ${profileType},
        ${profileType === 'organization' ? orgId : null},
        ${expiresAt?.toISOString() || null},
        NOW()
      )
      RETURNING *
    `);

    const [snippet] = getRows<any>(result as any);

    const canonicalPack =
      CANONICAL_PROOFS_WRITE_ENABLED && snippet
        ? await upsertCanonicalProofPackForSnippet({
            snippetId: snippet.id,
            userId: user.id,
            shareToken,
            profileType,
            orgId,
            fields,
            theme: (theme || 'auto') as 'light' | 'dark' | 'auto',
            format: (format || 'card') as 'card' | 'mini' | 'full',
            expiresAt: snippet.expires_at,
          })
        : null;

    log.info('profile.snippet.created', {
      userId: user.id,
      snippetId: snippet.id,
      shareToken,
      format,
      profileType,
      orgId: profileType === 'organization' ? orgId : null,
    });

    return NextResponse.json({
      success: true,
      snippet: {
        id: snippet.id,
        shareToken: snippet.share_token,
        url: buildPublicProfileURL(snippet.share_token),
        fields: snippet.fields,
        theme: snippet.theme,
        format: snippet.format,
        profileType: snippet.profile_type,
        orgId: snippet.org_id,
        canonicalPackId: canonicalPack?.id ?? null,
        expiresAt: snippet.expires_at,
        createdAt: snippet.created_at,
      },
    });
  } catch (error) {
    log.error('profile.snippet.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 });
  }
}

/**
 * GET - List user's snippets
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all snippets for user
    const result = await db.execute(sql`
      SELECT
        ps.*,
        COUNT(pv.id) as view_count,
        MAX(pv.viewed_at) as last_viewed_at
      FROM profile_snippets ps
      LEFT JOIN profile_snippet_views pv ON ps.id = pv.snippet_id
      WHERE ps.user_id = ${user.id}
        AND (ps.expires_at IS NULL OR ps.expires_at > NOW())
      GROUP BY ps.id
      ORDER BY ps.created_at DESC
    `);

    const snippets = getRows<any>(result as any).map((row: any) => ({
      id: row.id,
      shareToken: row.share_token,
      url: buildPublicProfileURL(row.share_token),
      fields: row.fields,
      theme: row.theme,
      format: row.format,
      profileType: row.profile_type || 'individual',
      orgId: row.org_id || null,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      viewCount: parseInt(row.view_count || '0'),
      lastViewedAt: row.last_viewed_at,
    }));

    const snippetIds = snippets.map((snippet) => snippet.id);
    const canonicalPacks =
      snippetIds.length > 0
        ? await db
            .select({
              id: proofPacks.id,
              legacySourceId: proofPacks.legacySourceId,
            })
            .from(proofPacks)
            .where(inArray(proofPacks.legacySourceId, snippetIds))
        : [];
    const packIdBySnippetId = new Map(canonicalPacks.map((pack) => [pack.legacySourceId, pack.id]));

    return NextResponse.json({
      success: true,
      snippets: snippets.map((snippet) => ({
        ...snippet,
        canonicalPackId: packIdBySnippetId.get(snippet.id) ?? null,
      })),
    });
  } catch (error) {
    log.error('profile.snippet.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to list snippets' }, { status: 500 });
  }
}

/**
 * DELETE - Delete snippet
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const snippetId = searchParams.get('id');

    if (!snippetId) {
      return NextResponse.json({ error: 'Snippet ID is required' }, { status: 400 });
    }

    // Verify ownership and delete
    await db.execute(sql`
      DELETE FROM profile_snippets
      WHERE id = ${snippetId}
        AND user_id = ${user.id}
    `);

    if (CANONICAL_PROOFS_WRITE_ENABLED) {
      await deleteCanonicalProofPackForSnippet(snippetId);
    }

    log.info('profile.snippet.deleted', {
      userId: user.id,
      snippetId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('profile.snippet.delete.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 });
  }
}
