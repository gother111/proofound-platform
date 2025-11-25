/**
 * Local AI Skill Extraction
 *
 * Hybrid approach combining NLP pattern extraction with semantic embedding matching.
 * This provides high-quality skill extraction without external API calls.
 *
 * Pipeline:
 * 1. NLP Pre-processing → Extract potential skill phrases
 * 2. Pattern Matching → Match known skill patterns with high confidence
 * 3. Semantic Search → Find similar skills in taxonomy using embeddings
 * 4. Ranking → Score and deduplicate results
 */

import { db } from '@/db';
import { skillsTaxonomy } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { extractSkillPhrases, getSkillVariations, type NLPExtractionResult } from './nlp-extractor';
import {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  isModelLoaded,
  preloadModel,
} from './embedding-service';

export interface LocalExtractedSkill {
  skillName: string;
  taxonomyCode?: string;
  level: number; // 1-5 proficiency
  confidence: number; // 0-1 (combined NLP + semantic score)
  context: string;
  monthsExperience?: number;
  yearsExperience?: number;
  relevance: 'current' | 'past' | 'aspirational';
  matchType: 'pattern' | 'semantic' | 'hybrid';
}

export interface LocalExtractionResult {
  skills: LocalExtractedSkill[];
  summary: string;
  totalExperienceYears?: number;
  industries?: string[];
  roles?: string[];
  method: 'local-ai';
  processingTimeMs: number;
}

// Cache for taxonomy skills (loaded once, reused)
let taxonomyCache: TaxonomySkill[] | null = null;
let taxonomyEmbeddingsCache: Map<string, number[]> | null = null;

interface TaxonomySkill {
  code: string;
  name: string;
  aliases: string[];
  embedding: number[] | null;
}

/**
 * Load taxonomy skills into memory for fast matching
 */
async function loadTaxonomyCache(): Promise<TaxonomySkill[]> {
  if (taxonomyCache) {
    return taxonomyCache;
  }

  log.info('taxonomy.cache.loading');

  try {
    const skills = await db.query.skillsTaxonomy.findMany({
      where: sql`${skillsTaxonomy.status} = 'active'`,
      columns: {
        code: true,
        nameI18n: true,
        aliasesI18n: true,
        embedding: true,
      },
    });

    taxonomyCache = skills.map((skill) => {
      // Parse aliases - can be array of strings or array of objects with 'en' key
      let aliases: string[] = [];
      const rawAliases = skill.aliasesI18n;
      if (Array.isArray(rawAliases)) {
        aliases = rawAliases
          .map((a: any) => {
            if (typeof a === 'string') return a;
            if (a && typeof a === 'object' && a.en) return a.en;
            return null;
          })
          .filter((a): a is string => a !== null);
      }

      return {
        code: skill.code,
        name: (skill.nameI18n as any)?.en || '',
        aliases,
        embedding: skill.embedding as number[] | null,
      };
    });

    // Also cache embeddings for skills that have them
    taxonomyEmbeddingsCache = new Map();
    for (const skill of taxonomyCache) {
      if (skill.embedding && skill.embedding.length > 0) {
        taxonomyEmbeddingsCache.set(skill.code, skill.embedding);
      }
    }

    log.info('taxonomy.cache.loaded', {
      skillCount: taxonomyCache.length,
      withEmbeddings: taxonomyEmbeddingsCache.size,
    });

    return taxonomyCache;
  } catch (error) {
    log.error('taxonomy.cache.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find taxonomy matches using text matching (name + aliases)
 */
function findTextMatches(
  phrase: string,
  taxonomy: TaxonomySkill[]
): Array<{ skill: TaxonomySkill; matchType: 'exact' | 'partial' | 'alias' }> {
  const lowerPhrase = phrase.toLowerCase().trim();
  if (!lowerPhrase || lowerPhrase.length < 2) return [];

  const matches: Array<{
    skill: TaxonomySkill;
    matchType: 'exact' | 'partial' | 'alias';
  }> = [];

  for (const skill of taxonomy) {
    if (!skill.name) continue;
    const lowerName = skill.name.toLowerCase();

    // Exact name match
    if (lowerName === lowerPhrase) {
      matches.push({ skill, matchType: 'exact' });
      continue;
    }

    // Partial name match - balanced approach
    // Match if:
    // 1. Skill name starts with the phrase (e.g., "Python" → "Python programming")
    // 2. Phrase starts with the skill name (e.g., "Python 3" → "Python")
    // 3. Both are at least 4 chars to avoid false positives
    if (lowerPhrase.length >= 4 && lowerName.length >= 4) {
      // Skill name starts with phrase (phrase is base skill)
      if (lowerName.startsWith(lowerPhrase + ' ') || lowerName.startsWith(lowerPhrase + '-')) {
        matches.push({ skill, matchType: 'partial' });
        continue;
      }
      // Phrase starts with skill name (skill name is base)
      if (lowerPhrase.startsWith(lowerName + ' ') || lowerPhrase.startsWith(lowerName + '-')) {
        matches.push({ skill, matchType: 'partial' });
        continue;
      }
      // Phrase equals skill name without version numbers (e.g., "react" matches "react 18")
      const phraseBase = lowerPhrase.replace(/\s*\d+(\.\d+)*\s*$/, '').trim();
      const nameBase = lowerName.replace(/\s*\d+(\.\d+)*\s*$/, '').trim();
      if (phraseBase === nameBase && phraseBase.length >= 4) {
        matches.push({ skill, matchType: 'partial' });
        continue;
      }
    }

    // Alias match - safely handle aliases
    if (skill.aliases && Array.isArray(skill.aliases)) {
      for (const alias of skill.aliases) {
        if (typeof alias !== 'string' || !alias) continue;
        const lowerAlias = alias.toLowerCase();
        if (lowerAlias === lowerPhrase || lowerAlias.includes(lowerPhrase)) {
          matches.push({ skill, matchType: 'alias' });
          break;
        }
      }
    }
  }

  return matches;
}

/**
 * Find taxonomy matches using semantic similarity
 */
async function findSemanticMatches(
  phrases: string[],
  taxonomy: TaxonomySkill[],
  topK: number = 5,
  similarityThreshold: number = 0.5
): Promise<Map<string, Array<{ skill: TaxonomySkill; similarity: number }>>> {
  const results = new Map<string, Array<{ skill: TaxonomySkill; similarity: number }>>();

  // Only proceed if we have embeddings
  const skillsWithEmbeddings = taxonomy.filter((s) => s.embedding && s.embedding.length > 0);

  if (skillsWithEmbeddings.length === 0) {
    log.warn('semantic.search.no_embeddings', {
      message: 'No taxonomy embeddings found. Run generate-taxonomy-embeddings.ts',
    });
    return results;
  }

  // Generate embeddings for all phrases
  const phraseEmbeddings = await generateEmbeddings(phrases);

  // For each phrase, find most similar skills
  for (const phrase of phrases) {
    const phraseEmbedding = phraseEmbeddings.get(phrase);
    if (!phraseEmbedding) continue;

    const similarities: Array<{ skill: TaxonomySkill; similarity: number }> = [];

    for (const skill of skillsWithEmbeddings) {
      const similarity = cosineSimilarity(phraseEmbedding, skill.embedding!);

      if (similarity >= similarityThreshold) {
        similarities.push({ skill, similarity });
      }
    }

    // Sort by similarity and take top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    results.set(phrase, similarities.slice(0, topK));
  }

  return results;
}

/**
 * Main extraction function - hybrid NLP + semantic approach
 */
export async function extractSkillsLocal(
  text: string,
  context: 'cv' | 'jd' | 'general'
): Promise<LocalExtractionResult> {
  const startTime = Date.now();

  try {
    log.info('local.extract.start', { context, textLength: text.length });

    // 1. Load taxonomy cache
    const taxonomy = await loadTaxonomyCache();

    if (taxonomy.length === 0) {
      log.warn('local.extract.no_taxonomy');
      return createEmptyResult(startTime, 'No taxonomy available');
    }

    // 2. NLP extraction
    const nlpResult = extractSkillPhrases(text);

    log.info('local.extract.nlp_done', {
      phrasesFound: nlpResult.phrases.length,
      rolesFound: nlpResult.roles.length,
    });

    // 3. Pattern matching - match NLP phrases to taxonomy
    const patternMatches = new Map<
      string,
      { skill: TaxonomySkill; confidence: number; context: string }
    >();

    for (const phrase of nlpResult.phrases) {
      const textMatches = findTextMatches(phrase.text, taxonomy);

      for (const match of textMatches) {
        // Calculate confidence based on match type and NLP confidence
        let confidence = phrase.confidence;

        if (match.matchType === 'exact') {
          confidence = Math.min(confidence + 0.2, 1.0);
        } else if (match.matchType === 'alias') {
          confidence = Math.min(confidence + 0.1, 0.95);
        }

        // Store if better than existing match
        const existing = patternMatches.get(match.skill.code);
        if (!existing || existing.confidence < confidence) {
          patternMatches.set(match.skill.code, {
            skill: match.skill,
            confidence,
            context: phrase.context,
          });
        }
      }
    }

    log.info('local.extract.pattern_done', {
      matchCount: patternMatches.size,
    });

    // 4. Semantic matching - find similar skills for unmatched phrases
    const unmatchedPhrases = nlpResult.phrases
      .filter((p) => {
        // Check if this phrase already has a pattern match
        const textMatches = findTextMatches(p.text, taxonomy);
        return textMatches.length === 0;
      })
      .map((p) => p.text);

    let semanticMatches = new Map<string, Array<{ skill: TaxonomySkill; similarity: number }>>();

    // Only run semantic search if model is loaded or we have few pattern matches
    if (unmatchedPhrases.length > 0 && (isModelLoaded() || patternMatches.size < 10)) {
      try {
        semanticMatches = await findSemanticMatches(
          unmatchedPhrases,
          taxonomy,
          3, // top 3 per phrase
          0.55 // similarity threshold
        );

        log.info('local.extract.semantic_done', {
          phrasesSearched: unmatchedPhrases.length,
          matchesFound: Array.from(semanticMatches.values()).flat().length,
        });
      } catch (error) {
        log.warn('local.extract.semantic_failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue without semantic matches
      }
    }

    // 5. Combine and deduplicate results
    const allSkills = new Map<string, LocalExtractedSkill>();

    // Add pattern matches
    for (const [code, match] of patternMatches) {
      const nlpPhrase = nlpResult.phrases.find((p) => {
        const pLower = p.text.toLowerCase();
        const nameLower = match.skill.name?.toLowerCase() || '';

        if (pLower === nameLower) return true;

        // Check aliases safely
        if (match.skill.aliases && Array.isArray(match.skill.aliases)) {
          return match.skill.aliases.some(
            (a) => typeof a === 'string' && a.toLowerCase() === pLower
          );
        }
        return false;
      });

      allSkills.set(code, {
        skillName: match.skill.name,
        taxonomyCode: code,
        level: estimateProficiencyLevel(nlpPhrase?.yearsExperience),
        confidence: match.confidence,
        context: match.context,
        monthsExperience: nlpPhrase?.monthsExperience,
        yearsExperience: nlpPhrase?.yearsExperience,
        relevance: context === 'jd' ? 'aspirational' : 'current',
        matchType: 'pattern',
      });
    }

    // Add semantic matches (only if not already in pattern matches)
    for (const [phrase, matches] of semanticMatches) {
      for (const match of matches) {
        if (!allSkills.has(match.skill.code)) {
          // Find the original NLP phrase for context
          const nlpPhrase = nlpResult.phrases.find(
            (p) => p.text.toLowerCase() === phrase.toLowerCase()
          );

          allSkills.set(match.skill.code, {
            skillName: match.skill.name,
            taxonomyCode: match.skill.code,
            level: estimateProficiencyLevel(nlpPhrase?.yearsExperience),
            confidence: match.similarity * 0.85, // Scale down semantic confidence slightly
            context: nlpPhrase?.context || phrase,
            monthsExperience: nlpPhrase?.monthsExperience,
            yearsExperience: nlpPhrase?.yearsExperience,
            relevance: context === 'jd' ? 'aspirational' : 'current',
            matchType: 'semantic',
          });
        } else {
          // Update to hybrid if we have both pattern and semantic match
          const existing = allSkills.get(match.skill.code)!;
          if (existing.matchType === 'pattern') {
            existing.matchType = 'hybrid';
            existing.confidence = Math.min(existing.confidence + match.similarity * 0.1, 1.0);
          }
        }
      }
    }

    // 6. Sort by confidence, deduplicate similar skills, and prepare result
    // First sort by confidence and prefer shorter names
    const rankedSkills = Array.from(allSkills.values()).sort((a, b) => {
      // Primary sort: confidence (descending)
      if (Math.abs(b.confidence - a.confidence) > 0.05) {
        return b.confidence - a.confidence;
      }
      // Secondary sort: prefer shorter skill names (likely more fundamental)
      return a.skillName.length - b.skillName.length;
    });

    // Deduplicate: if we have "Python" don't also include "Python programming basics"
    // Keep track of base skill roots we've included
    const includedRoots = new Set<string>();
    const sortedSkills: LocalExtractedSkill[] = [];

    for (const skill of rankedSkills) {
      if (sortedSkills.length >= 30) break;

      // Extract the "root" of the skill name (first 2-3 significant words)
      const nameLower = skill.skillName.toLowerCase();
      const words = nameLower.split(/[\s\-\/&]+/).filter((w) => w.length > 2);
      const root = words.slice(0, 2).join(' ');

      // Check if we already have a skill with this root
      // But allow up to 2 variations per root for common skills
      const rootCount = Array.from(includedRoots).filter(
        (r) => r.startsWith(root) || root.startsWith(r)
      ).length;

      if (rootCount < 2) {
        includedRoots.add(root);
        sortedSkills.push(skill);
      }
    }

    const processingTime = Date.now() - startTime;

    log.info('local.extract.complete', {
      skillCount: sortedSkills.length,
      processingTimeMs: processingTime,
      patternMatches: patternMatches.size,
      semanticMatches: Array.from(semanticMatches.values()).flat().length,
    });

    return {
      skills: sortedSkills,
      summary: `Found ${sortedSkills.length} skills using local AI (${patternMatches.size} pattern + ${sortedSkills.length - patternMatches.size} semantic matches)`,
      totalExperienceYears: nlpResult.totalYearsExperience,
      industries: nlpResult.industries,
      roles: nlpResult.roles,
      method: 'local-ai',
      processingTimeMs: processingTime,
    };
  } catch (error) {
    log.error('local.extract.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return createEmptyResult(
      startTime,
      `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Estimate proficiency level from years of experience
 */
function estimateProficiencyLevel(yearsExperience?: number): number {
  if (!yearsExperience) return 2; // Default to Competent

  if (yearsExperience >= 10) return 5; // Master
  if (yearsExperience >= 5) return 4; // Expert
  if (yearsExperience >= 2) return 3; // Proficient
  if (yearsExperience >= 1) return 2; // Competent
  return 1; // Learning
}

/**
 * Create empty result
 */
function createEmptyResult(startTime: number, message: string): LocalExtractionResult {
  return {
    skills: [],
    summary: message,
    method: 'local-ai',
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Preload resources for faster first extraction
 * Call this during app initialization
 */
export async function preloadLocalExtractor(): Promise<void> {
  log.info('local.extractor.preload.start');

  try {
    // Load taxonomy cache
    await loadTaxonomyCache();

    // Preload embedding model (optional, will load on first use if not)
    await preloadModel();

    log.info('local.extractor.preload.complete');
  } catch (error) {
    log.warn('local.extractor.preload.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Clear taxonomy cache (useful after taxonomy updates)
 */
export function clearTaxonomyCache(): void {
  taxonomyCache = null;
  taxonomyEmbeddingsCache = null;
  log.info('taxonomy.cache.cleared');
}
