import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { suggestSkillsForDocuments } from '@/lib/expertise/cv-import-suggest';

const LEGACY_MAX_SUGGESTIONS = 20;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text : '';
    const context =
      body?.context === 'cv' || body?.context === 'jd' || body?.context === 'general'
        ? body.context
        : 'general';

    if (!text.trim()) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'text field is required and must be a string',
        },
        { status: 400 }
      );
    }

    const startedAt = Date.now();

    const suggestionResponse = await suggestSkillsForDocuments(
      {
        documents: [
          {
            document_id: 'legacy-auto-suggest',
            file_name: 'legacy-input.txt',
            text,
            context,
          },
        ],
      },
      {
        maxDocuments: 1,
        maxCharsPerDocument: 30000,
        maxTotalChars: 30000,
      },
      {
        suggestionsLimit: 10,
        semanticEnabled: process.env.CV_IMPORT_SEMANTIC_ENABLED !== 'false',
      }
    );

    const documentResult = suggestionResponse.documents[0];

    const suggestionMap = new Map<
      string,
      {
        id: string;
        code: string;
        name: string;
        aliases: string[];
        description: string | null;
        slug: string;
        tags: string[] | null;
        score: number;
        confidence: number;
      }
    >();

    for (const candidate of documentResult.candidates) {
      const mapped = candidate.suggestions[0];
      if (!mapped) {
        continue;
      }

      const existing = suggestionMap.get(mapped.skill_id);
      const confidence = Math.max(candidate.confidence, mapped.score);

      if (!existing || confidence > existing.confidence) {
        suggestionMap.set(mapped.skill_id, {
          id: mapped.skill_id,
          code: mapped.skill_id,
          name: mapped.skill_name,
          aliases: [],
          description: candidate.evidence_snippets[0] || null,
          slug: mapped.skill_name.toLowerCase().replace(/\s+/g, '-'),
          tags: null,
          score: mapped.score,
          confidence,
        });
      }
    }

    const suggestions = Array.from(suggestionMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, LEGACY_MAX_SUGGESTIONS);

    return NextResponse.json({
      success: true,
      suggestions,
      metadata: {
        textLength: text.length,
        uniqueTerms: new Set(text.toLowerCase().split(/\W+/).filter(Boolean)).size,
        totalMatches: suggestions.length,
        context,
        summary: `Found ${documentResult.candidate_count} candidate skills`,
        method: 'deterministic',
        processingTimeMs: Date.now() - startedAt,
        semantic_used: suggestionResponse.metadata.semantic_used,
        semantic_fallback_triggered: suggestionResponse.metadata.semantic_fallback_triggered,
        unmapped_candidates_count: suggestionResponse.metadata.unmapped_candidates_count,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
