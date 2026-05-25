import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_WITH_OFFSET_SCHEMA = z.string().datetime({ offset: true });
const ISO_DATE_TIME_SCHEMA = z.string().datetime();

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  const normalized = new Date(Date.UTC(year, month - 1, day));

  return (
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day
  );
}

function normalizeLastUsedAt(value: string): string {
  if (DATE_ONLY_PATTERN.test(value)) {
    return `${value}T00:00:00.000Z`;
  }

  return value;
}

const LastUsedAtSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (isValidDateOnly(value)) {
      return;
    }

    if (
      ISO_DATE_TIME_SCHEMA.safeParse(value).success ||
      ISO_DATE_TIME_WITH_OFFSET_SCHEMA.safeParse(value).success
    ) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'last_used_at must be a valid ISO datetime or YYYY-MM-DD date',
    });
  })
  .transform((value) => normalizeLastUsedAt(value));

const UpdateSkillSchema = z.object({
  level: z.number().int().min(1).max(5).optional(),
  relevance: z.enum(['obsolete', 'current', 'emerging']).optional(),
  last_used_at: LastUsedAtSchema.optional(),
  months_experience: z.number().int().min(0).optional(),
});

/**
 * PATCH /api/expertise/user-skills/[id]
 *
 * Update a specific skill in the user's profile.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate input
    const validated = UpdateSkillSchema.parse(body);

    // Verify skill belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('skills')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Update skill
    const { data: updated, error } = await supabase
      .from('skills')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        taxonomy:skills_taxonomy!skills_skill_code_fkey (
          code,
          slug,
          name_i18n,
          cat_id,
          subcat_id,
          l3_id,
          tags
        )
      `
      )
      .single();

    if (error) {
      log.error('expertise.user_skill.update_failed', { error });
      return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
    }

    // Emit skill updated analytics event (PRD F3)
    try {
      const { emitSkillUpdatedAsync } = await import('@/lib/analytics/events');
      const skillName = (updated?.taxonomy as any)?.name_i18n?.en || 'Unknown Skill';
      const changes = Object.keys(validated).filter(
        (k) => validated[k as keyof typeof validated] !== undefined
      );

      emitSkillUpdatedAsync(user.id, id, {
        skill_name: skillName,
        changes,
      });
    } catch (analyticsError) {
      log.error('expertise.user_skill.update_analytics_failed', { error: analyticsError });
    }

    return NextResponse.json({
      skill: updated,
      message: 'Skill updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    log.error('expertise.user_skill.patch_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/expertise/user-skills/[id]
 *
 * Remove a skill from the user's profile.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const { id } = await params;

    // Fetch skill first to get name for analytics
    const { data: skillToDelete } = await supabase
      .from('skills')
      .select(
        `
        id,
        skill_id,
        taxonomy:skill_code (
          name_i18n
        )
      `
      )
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    // Verify skill belongs to user and delete
    const { error } = await supabase.from('skills').delete().eq('id', id).eq('profile_id', user.id);

    if (error) {
      log.error('expertise.user_skill.delete_failed', { error });
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
    }

    // Emit skill deleted analytics event (PRD F3)
    try {
      const { emitSkillDeletedAsync } = await import('@/lib/analytics/events');

      // Parse skill name
      let skillName = 'Unknown Skill';
      if (skillToDelete) {
        if ((skillToDelete.taxonomy as any)?.name_i18n?.en) {
          skillName = (skillToDelete.taxonomy as any).name_i18n.en;
        } else if (skillToDelete.skill_id?.startsWith('custom-')) {
          const parts = skillToDelete.skill_id.split('-');
          if (parts.length > 4) {
            skillName = parts
              .slice(4)
              .join(' ')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase());
          }
        }
      }

      // Get remaining skill count
      const { data: remainingSkills } = await supabase
        .from('skills')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id);

      emitSkillDeletedAsync(user.id, id, {
        skill_name: skillName,
        remaining_skills: remainingSkills?.length || 0,
      });
    } catch (analyticsError) {
      log.error('expertise.user_skill.delete_analytics_failed', { error: analyticsError });
    }

    return NextResponse.json({
      message: 'Skill deleted successfully',
    });
  } catch (error) {
    log.error('expertise.user_skill.delete_route_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
