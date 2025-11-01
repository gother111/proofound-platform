/**
 * Projects API Route
 * 
 * GET - List user's projects with optional filters
 * POST - Create new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // TODO: Fetch skills count for each project from project_skills table
    const projectsWithCounts = projects?.map(project => ({
      ...project,
      skillsCount: 0, // Placeholder
      outcomes: [], // Placeholder
    }));

    return NextResponse.json({ projects: projectsWithCounts || [] });
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, status, startDate, endDate, description, organization, role } = body;

    // Validation
    if (!title || !type || !status || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, status, startDate' },
        { status: 400 }
      );
    }

    // Insert project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title,
        type,
        status,
        start_date: startDate,
        end_date: endDate || null,
        description,
        organization,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

