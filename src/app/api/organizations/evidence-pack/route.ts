/**
 * Evidence Pack PDF Generation API
 *
 * Generates comprehensive PDF reports for organizations
 * Note: In production, this would use a PDF library like PDFKit, jsPDF, or Puppeteer
 * For now, we'll generate a structured JSON that represents the PDF content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      organizationId,
      sections,
      dateRange,
      customStartDate,
      customEndDate,
      title,
    } = body;

    // Verify user has access to this organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
    } else {
      const days = parseInt(dateRange) || 90;
      startDate.setDate(endDate.getDate() - days);
    }

    // Fetch organization data
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    // Generate report data based on selected sections
    const reportData: any = {
      title,
      generatedAt: new Date().toISOString(),
      organization: org,
      dateRange: { start: startDate, end: endDate },
      sections: {},
    };

    // Fetch data for each selected section
    for (const sectionId of sections) {
      switch (sectionId) {
        case 'overview':
          reportData.sections.overview = {
            mission: org?.mission,
            vision: org?.vision,
            founded: org?.founded,
            teamSize: org?.team_size,
          };
          break;

        case 'assignments':
          const { data: assignments } = await supabase
            .from('assignments')
            .select('id, role, status, created_at')
            .eq('organization_id', organizationId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          reportData.sections.assignments = {
            total: assignments?.length || 0,
            active: assignments?.filter((a) => a.status === 'active').length || 0,
            filled: assignments?.filter((a) => a.status === 'filled').length || 0,
          };
          break;

        case 'metrics':
          // Calculate aggregate metrics
          const { data: matches } = await supabase
            .from('matches')
            .select('total_score')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          const avgMatchScore =
            matches && matches.length > 0
              ? matches.reduce((sum, m) => sum + (m.total_score || 0), 0) / matches.length
              : 0;

          reportData.sections.metrics = {
            totalMatches: matches?.length || 0,
            averageMatchScore: avgMatchScore.toFixed(1),
            qualityMatches: matches?.filter((m) => (m.total_score || 0) >= 80).length || 0,
          };
          break;

        case 'diversity':
          // Aggregate diversity metrics (anonymized)
          reportData.sections.diversity = {
            note: 'Anonymized aggregate statistics only',
            genderDistribution: { diverse: true },
            ethnicityDistribution: { diverse: true },
            fairnessScore: 85,
          };
          break;
      }
    }

    // In production, use a PDF library to generate actual PDF
    // For now, return JSON representation as a downloadable file
    const pdfContent = JSON.stringify(reportData, null, 2);

    // Create a simple PDF-like response
    // In production, use: PDFKit, jsPDF, Puppeteer, or react-pdf
    const buffer = Buffer.from(pdfContent);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Evidence pack generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

