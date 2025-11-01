import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

const CreateSkillSchema = z.object({
  // Either provide an existing skill_code from taxonomy OR provide cat_id/subcat_id/l3_id + custom_skill_name
  skill_code: z.string().optional(),
  cat_id: z.number().int().optional(),
  subcat_id: z.number().int().optional(),
  l3_id: z.number().int().optional(),
  custom_skill_name: z.string().optional(),
  skill_id: z.string().optional(), // Legacy field for custom skills
  level: z.number().int().min(1).max(5),
  relevance: z.enum(['obsolete', 'current', 'emerging']).optional(),
  last_used_at: z.string().optional(),
  months_experience: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    // Must provide either skill_code OR (cat_id + subcat_id + l3_id + custom_skill_name)
    const hasSkillCode = !!data.skill_code;
    const hasCustomSkill = !!(data.cat_id && data.subcat_id && data.l3_id && data.custom_skill_name);
    return hasSkillCode || hasCustomSkill;
  },
  { message: 'Must provide either skill_code or custom skill details (cat_id, subcat_id, l3_id, custom_skill_name)' }
);

const UpdateSkillSchema = z.object({
  level: z.number().int().min(1).max(5).optional(),
  relevance: z.enum(['obsolete', 'current', 'emerging']).optional(),
  last_used_at: z.string().datetime().optional(),
  months_experience: z.number().int().min(0).optional(),
});

/**
 * GET /api/expertise/user-skills
 * 
 * Get all skills for the current user with full taxonomy details.
 * 
 * Query params:
 * - l1: Filter by L1 domain (U/F/T/L/M/D)
 * - relevance: Filter by relevance (obsolete/current/emerging)
 * - min_level: Minimum competency level (1-5)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const l1Filter = searchParams.get('l1');
    const relevanceFilter = searchParams.get('relevance');
    const minLevel = searchParams.get('min_level');
    
    // Build query
    let query = supabase
      .from('skills')
      .select(`
        *,
        taxonomy:skill_code (
          code,
          slug,
          name_i18n,
          cat_id,
          subcat_id,
          l3_id,
          tags
        )
      `)
      .eq('profile_id', user.id);
    
    if (relevanceFilter) {
      query = query.eq('relevance', relevanceFilter);
    }
    
    if (minLevel) {
      query = query.gte('level', parseInt(minLevel));
    }
    
    const { data: skills, error } = await query;
    
    if (error) {
      console.error('Error fetching user skills:', error);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }
    
    // Filter by L1 if specified (post-query filter since cat_id is in joined table)
    let filteredSkills = skills;
    if (l1Filter) {
      const catId = l1CodeToCatId(l1Filter);
      filteredSkills = skills?.filter((s: any) => s.taxonomy?.cat_id === catId) || [];
    }
    
    // Group by L1 for easier rendering
    const groupedByL1 = groupSkillsByL1(filteredSkills || []);
    
    return NextResponse.json({
      skills: filteredSkills,
      grouped_by_l1: groupedByL1,
      total_count: filteredSkills?.length || 0,
    });
    
  } catch (error) {
    console.error('User skills API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/expertise/user-skills
 * 
 * Add a new skill to the user's profile.
 * Supports both existing taxonomy skills and user-created custom skills.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();
    
    // Validate input
    const validated = CreateSkillSchema.parse(body);
    
    let skillCodeToUse: string | null = null;
    let skillIdToUse: string;
    let isCustomSkill = false;
    
    // Case 1: Existing skill from taxonomy
    if (validated.skill_code) {
      // Verify skill code exists in taxonomy
      const { data: taxonomySkill, error: taxonomyError } = await supabase
        .from('skills_taxonomy')
        .select('code, name_i18n')
        .eq('code', validated.skill_code)
        .eq('status', 'active')
        .single();
      
      if (taxonomyError || !taxonomySkill) {
        return NextResponse.json(
          { error: 'Invalid skill code' },
          { status: 400 }
        );
      }
      
      skillCodeToUse = validated.skill_code;
      skillIdToUse = validated.skill_code;
    }
    // Case 2: User-created custom skill
    else if (validated.cat_id && validated.subcat_id && validated.l3_id && validated.custom_skill_name) {
      // Generate a unique skill_id for this custom skill
      skillIdToUse = validated.skill_id || `custom-${validated.cat_id}-${validated.subcat_id}-${validated.l3_id}-${validated.custom_skill_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      isCustomSkill = true;
      skillCodeToUse = null; // Custom skills don't have a skill_code in taxonomy yet
    } else {
      return NextResponse.json(
        { error: 'Invalid request: must provide skill_code or custom skill details' },
        { status: 400 }
      );
    }
    
    // Check if user already has this skill (by skill_id to handle both cases)
    const { data: existing } = await supabase
      .from('skills')
      .select('id')
      .eq('profile_id', user.id)
      .eq('skill_id', skillIdToUse)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: 'Skill already exists in your profile' },
        { status: 409 }
      );
    }
    
    // Prepare insert data
    const insertData: any = {
      profile_id: user.id,
      skill_id: skillIdToUse,
      skill_code: skillCodeToUse,
      level: validated.level,
      relevance: validated.relevance || 'current',
      months_experience: validated.months_experience || 0,
      last_used_at: validated.last_used_at || new Date().toISOString(),
    };
    
    // Insert new skill
    const { data: newSkill, error } = await supabase
      .from('skills')
      .insert(insertData)
      .select(`
        *,
        taxonomy:skill_code (
          code,
          slug,
          name_i18n,
          cat_id,
          subcat_id,
          l3_id,
          tags
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating skill:', error);
      return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
    }
    
    // For custom skills, attach the custom name since it won't be in taxonomy
    if (isCustomSkill && newSkill) {
      newSkill.custom_skill_name = validated.custom_skill_name;
      newSkill.taxonomy = {
        cat_id: validated.cat_id,
        subcat_id: validated.subcat_id,
        l3_id: validated.l3_id,
        name_i18n: { en: validated.custom_skill_name },
      };
    }
    
    return NextResponse.json({
      skill: newSkill,
      message: 'Skill added successfully',
      is_custom: isCustomSkill,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('User skills POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper to map L1 letter codes to numeric cat_id
 */
function l1CodeToCatId(code: string): number | null {
  const mapping: Record<string, number> = {
    'U': 1,
    'F': 2,
    'T': 3,
    'L': 4,
    'M': 5,
    'D': 6,
  };
  return mapping[code.toUpperCase()] || null;
}

/**
 * Helper to group skills by L1 domain
 */
function groupSkillsByL1(skills: any[]) {
  const grouped: Record<number, any[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  };
  
  for (const skill of skills) {
    const catId = skill.taxonomy?.cat_id;
    if (catId && grouped[catId]) {
      grouped[catId].push(skill);
    }
  }
  
  return grouped;
}

