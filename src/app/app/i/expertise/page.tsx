import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ExpertiseAtlasClient } from './ExpertiseAtlasClient';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ExpertisePage');

export const dynamic = 'force-dynamic';

type ExpertiseTab = 'atlas' | 'gap-analysis' | 'import-cv';

interface ExpertiseAtlasPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function normalizeInitialTab(rawTab: string | string[] | undefined): ExpertiseTab {
  const value = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  if (value === 'gap-analysis' || value === 'import-cv') {
    return value;
  }
  return 'atlas';
}

/**
 * Expertise Atlas Page - Main entry point
 *
 * Shows user's skills organized in L1→L2→L3→L4 hierarchy
 * Starts with empty state if no skills exist
 */
export default async function ExpertiseAtlasPage({ searchParams }: ExpertiseAtlasPageProps) {
  try {
    const resolvedParams = (await searchParams) ?? {};
    const initialTab = normalizeInitialTab(resolvedParams.tab);

    const user = await requireAuth();
    const supabase = await createClient();

    logger.debug('Fetching expertise data for user', { userId: user.id });

    // Fetch user's skills - fetch taxonomy separately to avoid foreign key relationship issues
    const { data: userSkills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .eq('profile_id', user.id);

    logger.debug('Skills query completed', {
      count: userSkills?.length || 0,
      hasError: !!skillsError,
      errorMessage: skillsError?.message,
    });

    // Fetch taxonomy data separately if skills exist
    let taxonomyMap: Record<string, any> = {};
    if (userSkills && userSkills.length > 0) {
      const skillCodes = userSkills
        .map((s) => s.skill_code)
        .filter((code): code is string => Boolean(code));

      logger.debug('Fetching taxonomy for skill codes', { skillCodesCount: skillCodes.length });

      if (skillCodes.length > 0) {
        const { data: taxonomyData } = await supabase
          .from('skills_taxonomy')
          .select('code, slug, name_i18n, cat_id, subcat_id, l3_id, tags')
          .in('code', skillCodes);

        logger.debug('Taxonomy data fetched', { taxonomyCount: taxonomyData?.length || 0 });

        if (taxonomyData) {
          taxonomyData.forEach((tax) => {
            taxonomyMap[tax.code] = tax;
          });
        }
      }
    }

    if (skillsError) {
      logger.error('Failed to fetch user skills', skillsError);
      // Continue with empty array if skills query fails
    }

    // Fetch proof counts (aggregation) - handle errors gracefully
    const { data: proofs, error: proofsError } = await supabase
      .from('skill_proofs')
      .select('skill_id')
      .eq('profile_id', user.id);

    if (proofsError) {
      logger.error('Failed to fetch skill proofs', proofsError);
    }

    const proofCountMap: Record<string, number> = {};
    proofs?.forEach(({ skill_id }) => {
      proofCountMap[skill_id] = (proofCountMap[skill_id] || 0) + 1;
    });

    // Fetch verification counts (only accepted) - handle errors gracefully
    const { data: verifications, error: verificationsError } = await supabase
      .from('skill_verification_requests')
      .select('skill_id, verifier_source, status')
      .eq('requester_profile_id', user.id)
      .eq('status', 'accepted');

    if (verificationsError) {
      logger.error('Failed to fetch skill verifications', verificationsError);
    }

    const verificationCountMap: Record<string, number> = {};
    const verificationSourcesMap: Record<string, Array<{ source: string }>> = {};

    verifications?.forEach(({ skill_id, verifier_source }) => {
      verificationCountMap[skill_id] = (verificationCountMap[skill_id] || 0) + 1;
      if (!verificationSourcesMap[skill_id]) {
        verificationSourcesMap[skill_id] = [];
      }
      verificationSourcesMap[skill_id].push({ source: verifier_source });
    });

    // Enrich skills with counts and taxonomy
    const enrichedSkills = (userSkills || []).map((skill) => ({
      ...skill,
      taxonomy: skill.skill_code ? taxonomyMap[skill.skill_code] : null,
      proof_count: proofCountMap[skill.id] || 0,
      verification_count: verificationCountMap[skill.id] || 0,
      verification_sources: verificationSourcesMap[skill.id] || [],
      // Map database field names to component expected names
      evidenceStrength: skill.evidence_strength
        ? parseFloat(skill.evidence_strength.toString())
        : 0,
      impactScore: skill.impact_score ? parseFloat(skill.impact_score.toString()) : 0,
      monthsExperience: skill.months_experience || 0,
      skillCode: skill.skill_code || skill.skill_id || '',
      lastUsedAt: skill.last_used_at || null,
    }));

    // Fetch L1 domains - handle errors gracefully
    const { data: l1Domains, error: domainsError } = await supabase
      .from('skills_categories')
      .select('*')
      .order('display_order');

    if (domainsError) {
      logger.error('Failed to fetch L1 domains', domainsError);
      // Continue with empty array if domains query fails
    }

    // Fetch L2 categories for heatmap names
    const { data: l2Categories, error: l2Error } = await supabase
      .from('skills_subcategories')
      .select('subcat_id, cat_id, name_i18n');

    if (l2Error) {
      logger.error('Failed to fetch L2 categories', l2Error);
    }

    // Detect taxonomy availability so the UI can show explicit recovery guidance
    const [{ count: l3Count, error: l3CountError }, { count: l4Count, error: l4CountError }] =
      await Promise.all([
        supabase.from('skills_l3').select('*', { count: 'exact', head: true }),
        supabase.from('skills_taxonomy').select('*', { count: 'exact', head: true }),
      ]);

    if (l3CountError) {
      logger.error('Failed to count L3 taxonomy rows', l3CountError);
    }
    if (l4CountError) {
      logger.error('Failed to count L4 taxonomy rows', l4CountError);
    }

    const taxonomyReady =
      (l2Categories?.length || 0) > 0 && (l3Count || 0) > 0 && (l4Count || 0) > 0;

    // Create L2 name lookup map
    const l2NameMap: Record<number, any> = {};
    l2Categories?.forEach((cat) => {
      l2NameMap[cat.subcat_id] = {
        nameI18n: cat.name_i18n,
        catId: cat.cat_id,
      };
    });

    // Calculate stats per L1 domain
    const domainsWithStats = (l1Domains || []).map((domain) => {
      const domainSkills = enrichedSkills.filter(
        (skill: any) => skill.taxonomy?.cat_id === domain.cat_id
      );

      const skillCount = domainSkills.length;
      const avgLevel =
        skillCount > 0
          ? domainSkills.reduce((sum: number, s: any) => sum + (s.level || 0), 0) / skillCount
          : 0;

      // Calculate recency mix
      const now = new Date();
      let active = 0,
        recent = 0,
        rusty = 0;

      domainSkills.forEach((skill: any) => {
        if (!skill.lastUsedAt) {
          rusty++;
          return;
        }

        const monthsAgo = Math.floor(
          (now.getTime() - new Date(skill.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        if (monthsAgo <= 6) active++;
        else if (monthsAgo <= 24) recent++;
        else rusty++;
      });

      const total = active + recent + rusty || 1;

      return {
        catId: domain.cat_id,
        slug: domain.slug,
        nameI18n: domain.name_i18n,
        descriptionI18n: domain.description_i18n,
        icon: domain.icon,
        displayOrder: domain.display_order,
        version: domain.version,
        status: domain.status,
        skillCount,
        avgLevel,
        recencyMix: {
          active: Math.round((active / total) * 100),
          recent: Math.round((recent / total) * 100),
          rusty: Math.round((rusty / total) * 100),
        },
      };
    });

    const hasSkills = enrichedSkills.length > 0;

    logger.info('Expertise page data loaded successfully', {
      skillsCount: enrichedSkills.length,
      hasSkills,
      domainsCount: domainsWithStats.length,
      skillsWithTaxonomy: enrichedSkills.filter((s: any) => s.taxonomy !== null).length,
    });

    // Calculate widget data (only if user has skills)
    const widgetData = hasSkills ? calculateWidgetData(enrichedSkills, l2NameMap) : null;

    // Check LinkedIn connection status
    const linkedInIntegration = await db
      .select()
      .from(userIntegrations)
      .where(and(eq(userIntegrations.userId, user.id), eq(userIntegrations.provider, 'linkedin')))
      .limit(1);

    const isLinkedInConnected =
      linkedInIntegration.length > 0 &&
      linkedInIntegration[0].accessToken !== null &&
      (!linkedInIntegration[0].tokenExpiry || new Date() < linkedInIntegration[0].tokenExpiry);

    return (
      <ExpertiseAtlasClient
        initialSkills={enrichedSkills}
        domains={domainsWithStats}
        taxonomyReady={taxonomyReady}
        widgetData={widgetData}
        linkedInConnected={isLinkedInConnected}
        initialTab={initialTab}
      />
    );
  } catch (error) {
    logger.error('Critical error loading expertise page', error);
    // Return error state to client
    return (
      <ExpertiseAtlasClient
        initialSkills={[]}
        domains={[]}
        taxonomyReady={false}
        widgetData={null}
        linkedInConnected={false}
        initialTab="atlas"
      />
    );
  }
}

/**
 * Calculate all dashboard widget data from user skills
 */
function calculateWidgetData(skills: any[], l2NameMap: Record<number, any>) {
  const now = new Date();

  // 1. Credibility Status Pie Data
  const credibilityStats = {
    verified: 0,
    proofOnly: 0,
    claimOnly: 0,
  };

  skills.forEach((skill) => {
    const hasProof = (skill.proof_count || 0) > 0;
    const hasVerification = (skill.verification_count || 0) > 0;

    if (hasProof && hasVerification) {
      credibilityStats.verified++;
    } else if (hasProof) {
      credibilityStats.proofOnly++;
    } else {
      credibilityStats.claimOnly++;
    }
  });

  // 2. Coverage Heatmap Data (L1 × L2)
  const coverageData: Record<
    string,
    { count: number; avgLevel: number; l1: number; l2: number; l2Name?: string }
  > = {};

  skills.forEach((skill) => {
    if (!skill.taxonomy?.cat_id || !skill.taxonomy?.subcat_id) return;

    const key = `${skill.taxonomy.cat_id}-${skill.taxonomy.subcat_id}`;
    if (!coverageData[key]) {
      const l2Info = l2NameMap[skill.taxonomy.subcat_id];
      coverageData[key] = {
        count: 0,
        avgLevel: 0,
        l1: skill.taxonomy.cat_id,
        l2: skill.taxonomy.subcat_id,
        l2Name: l2Info?.nameI18n?.en || `L2-${skill.taxonomy.subcat_id}`,
      };
    }
    coverageData[key].count++;
    coverageData[key].avgLevel += skill.level || 0;
  });

  // Calculate averages
  Object.keys(coverageData).forEach((key) => {
    coverageData[key].avgLevel = coverageData[key].avgLevel / coverageData[key].count;
  });

  // 3. Relevance Bars Data
  const relevanceData = {
    obsolete: 0,
    current: 0,
    emerging: 0,
  };

  skills.forEach((skill) => {
    const relevance = skill.relevance || 'current';
    relevanceData[relevance as keyof typeof relevanceData]++;
  });

  // 4. Recency × Competence Scatter Data
  const scatterData = skills.map((skill) => {
    const monthsSinceLastUsed = skill.lastUsedAt
      ? Math.floor(
          (now.getTime() - new Date(skill.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      : 999; // Very old if never used

    return {
      id: skill.id,
      name: skill.taxonomy?.name_i18n?.en || skill.custom_skill_name || 'Unknown',
      level: skill.level || 1,
      monthsSinceLastUsed,
      relevance: skill.relevance,
    };
  });

  // 5. Skill Wheel Data (Weighted counts per L1)
  const skillWheelData: Record<number, { domain: string; count: number; weightedCount: number }> =
    {};

  skills.forEach((skill) => {
    const catId = skill.taxonomy?.cat_id;
    if (!catId) return;

    if (!skillWheelData[catId]) {
      skillWheelData[catId] = {
        domain: getDomainName(catId),
        count: 0,
        weightedCount: 0,
      };
    }

    skillWheelData[catId].count++;

    // Weight calculation
    let weight = 1.0;
    const hasProof = (skill.proof_count || 0) > 0;
    const hasVerification = (skill.verification_count || 0) > 0;
    if (hasProof) weight = 1.2;
    if (hasVerification) weight = 1.5;

    skillWheelData[catId].weightedCount += weight;
  });

  // 6. Verification Sources Donut Data
  const verificationSources = {
    self: 0,
    peer: 0,
    manager: 0,
    external: 0,
  };

  skills.forEach((skill) => {
    if (skill.verification_sources && skill.verification_sources.length > 0) {
      skill.verification_sources.forEach((v: any) => {
        verificationSources[v.source as keyof typeof verificationSources]++;
      });
    }
  });

  // 7. Next-Best-Actions List
  const nextBestActions: Array<{
    skillId: string;
    skillName: string;
    action: string;
    reason: string;
    priority: number;
  }> = [];

  skills.forEach((skill) => {
    const skillName = skill.taxonomy?.name_i18n?.en || skill.custom_skill_name || 'Unknown';
    const hasProof = (skill.proof_count || 0) > 0;
    const hasVerification = (skill.verification_count || 0) > 0;

    // Low credibility (no proof)
    if (!hasProof) {
      nextBestActions.push({
        skillId: skill.id,
        skillName,
        action: 'Add proof',
        reason: 'Low Credibility',
        priority: 2,
      });
    }

    // No verification
    if (hasProof && !hasVerification) {
      nextBestActions.push({
        skillId: skill.id,
        skillName,
        action: 'Request verification',
        reason: 'Unverified',
        priority: 3,
      });
    }

    // Stale skill (>18 months)
    if (skill.lastUsedAt) {
      const monthsAgo = Math.floor(
        (now.getTime() - new Date(skill.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      if (monthsAgo > 18) {
        nextBestActions.push({
          skillId: skill.id,
          skillName,
          action: `Refresh (last used ${monthsAgo} months ago)`,
          reason: 'Stale',
          priority: 1,
        });
      }
    }
  });

  // Sort by priority and limit to top 10
  nextBestActions.sort((a, b) => a.priority - b.priority);
  const topActions = nextBestActions.slice(0, 10);

  return {
    credibility: credibilityStats,
    coverage: Object.values(coverageData),
    relevance: relevanceData,
    scatter: scatterData,
    skillWheel: Object.values(skillWheelData),
    verificationSources,
    nextBestActions: topActions,
  };
}

/**
 * Helper to get domain name from cat_id
 */
function getDomainName(catId: number): string {
  const domainNames: Record<number, string> = {
    1: 'Universal Capabilities',
    2: 'Functional Competencies',
    3: 'Tools & Technologies',
    4: 'Languages & Culture',
    5: 'Methods & Practices',
    6: 'Domain Knowledge',
  };
  return domainNames[catId] || 'Unknown';
}
