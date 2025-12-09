import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';

const VisibilitySchema = z.object({
  header: z.boolean().optional(),
  proofBar: z.boolean().optional(),
  workEmail: z.boolean().optional(),
  linkedin: z.boolean().optional(),
  identity: z.boolean().optional(),
  counts: z.boolean().optional(),
  skills: z.boolean().optional(),
  bio: z.boolean().optional(),
  contact: z.boolean().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: individual } = await supabase
      .from('individual_profiles')
      .select('field_visibility')
      .eq('user_id', user.id)
      .maybeSingle();

    const merged = mergeVisibilityFlags((individual as any)?.field_visibility);
    return NextResponse.json({ visibility: merged });
  } catch (error) {
    console.error('visibility get failed', error);
    return NextResponse.json({ error: 'Failed to fetch visibility' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = VisibilitySchema.parse(body);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const current = await supabase
      .from('individual_profiles')
      .select('field_visibility')
      .eq('user_id', user.id)
      .maybeSingle();

    const merged = mergeVisibilityFlags((current.data as any)?.field_visibility);
    const next = { ...merged, ...parsed };

    const { error } = await supabase
      .from('individual_profiles')
      .update({ field_visibility: next })
      .eq('user_id', user.id);

    if (error) {
      console.error('visibility update failed', error);
      return NextResponse.json({ error: 'Failed to save visibility' }, { status: 500 });
    }

    return NextResponse.json({ visibility: next });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.issues },
        { status: 400 }
      );
    }
    console.error('visibility post failed', error);
    return NextResponse.json({ error: 'Failed to save visibility' }, { status: 500 });
  }
}
