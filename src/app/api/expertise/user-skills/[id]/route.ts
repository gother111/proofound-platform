import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

const UpdateSkillSchema = z.object({
  level: z.number().int().min(1).max(5).optional(),
  relevance: z.enum(['obsolete', 'current', 'emerging']).optional(),
  last_used_at: z.string().datetime().optional(),
  months_experience: z.number().int().min(0).optional(),
});

/**
 * PATCH /api/expertise/user-skills/[id]
 * 
 * Update a specific skill in the user's profile.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    
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
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }
    
    // Update skill
    const { data: updated, error } = await supabase
      .from('skills')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
      console.error('Error updating skill:', error);
      return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
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
    console.error('User skill PATCH error:', error);
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
    const user = await requireAuth();
    const supabase = await createClient();
    const { id } = await params;
    
    // Verify skill belongs to user and delete
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id);
    
    if (error) {
      console.error('Error deleting skill:', error);
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Skill deleted successfully',
    });
    
  } catch (error) {
    console.error('User skill DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

