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
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import {
  generateShareToken,
  buildPublicProfileURL,
  validateSnippetConfig,
} from '@/lib/profile/snippet-generator';

export const dynamic = 'force-dynamic';

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

    // Validate configuration
    const validation = validateSnippetConfig(fields);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: validation.errors },
        { status: 400 }
      );
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
        expires_at,
        created_at
      ) VALUES (
        ${user.id},
        ${shareToken},
        ${JSON.stringify(fields)}::jsonb,
        ${theme || 'auto'},
        ${format || 'card'},
        ${expiresAt?.toISOString() || null},
        NOW()
      )
      RETURNING *
    `);

    // Drizzle's execute returns a RowList (array-like). Normalize to first row.
    const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
    const snippet = (rows as any[])[0] as any;

    log.info('profile.snippet.created', {
      userId: user.id,
      snippetId: snippet.id,
      shareToken,
      format,
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

    const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
    const snippets = rows.map((row: any) => ({
      id: row.id,
      shareToken: row.share_token,
      url: buildPublicProfileURL(row.share_token),
      fields: row.fields,
      theme: row.theme,
      format: row.format,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      viewCount: parseInt(row.view_count || '0'),
      lastViewedAt: row.last_viewed_at,
    }));

    return NextResponse.json({
      success: true,
      snippets,
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
