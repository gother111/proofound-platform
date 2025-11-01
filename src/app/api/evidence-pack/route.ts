import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import {
  generateEvidencePackHTML,
  generateEvidencePackMetadata,
  type EvidencePackData,
  type ImpactEntry,
  type Artifact,
} from '@/lib/pdf/evidence-pack';

/**
 * POST /api/evidence-pack
 *
 * PRD Part 3 (O4 - Impact Block)
 * Generates donor/investor-ready Evidence Pack PDF
 *
 * Body:
 * - organizationId: string
 * - periodStart?: ISO date string
 * - periodEnd?: ISO date string
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { organizationId, periodStart, periodEnd } = await request.json();

    if (!organizationId) {
      return NextResponse.json({
        error: 'Missing organizationId',
        message: 'organizationId is required',
      }, { status: 400 });
    }

    // Parse dates
    const startDate = periodStart ? new Date(periodStart) : undefined;
    const endDate = periodEnd ? new Date(periodEnd) : undefined;

    // Fetch organization data
    // Note: This is a placeholder - adjust based on actual org schema
    const organization = await fetchOrganization(organizationId);

    if (!organization) {
      return NextResponse.json({
        error: 'Organization not found',
        message: `No organization found with ID: ${organizationId}`,
      }, { status: 404 });
    }

    // Fetch impact entries
    const impactEntries = await fetchImpactEntries(organizationId, startDate, endDate);

    // Fetch artifacts
    const artifacts = await fetchArtifacts(organizationId);

    // Build Evidence Pack data
    const evidencePackData: EvidencePackData = {
      organization,
      impactEntries,
      artifacts,
      generatedAt: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
    };

    // Generate HTML
    const html = generateEvidencePackHTML(evidencePackData);

    // Generate metadata
    const metadata = generateEvidencePackMetadata(evidencePackData);

    // Log export event
    await db.insert(analyticsEvents).values({
      userId: user.id,
      eventType: 'evidence_pack_exported',
      properties: {
        ...metadata,
        organizationId, // Override empty organizationId from metadata
      },
    });

    // Return HTML (client can convert to PDF or we can use Puppeteer server-side)
    // For MVP, returning HTML that can be printed to PDF via browser
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="evidence-pack-${organizationId}.html"`,
      },
    });

  } catch (error) {
    console.error('Evidence Pack generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate Evidence Pack',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Fetch organization profile
 * Placeholder - adjust based on actual schema
 */
async function fetchOrganization(orgId: string) {
  // In production, query from organizations table
  return {
    name: 'Sample Organization',
    description: 'A mission-driven organization',
    website: 'https://example.com',
    sector: 'Social Impact',
    size: '10-50 employees',
  };
}

/**
 * Fetch impact entries for organization
 * Placeholder - adjust based on actual schema
 */
async function fetchImpactEntries(
  orgId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ImpactEntry[]> {
  // In production, query from impact_entries table
  // For now, return placeholder data

  return [
    {
      id: '1',
      title: 'Volunteers Onboarded',
      description: 'Successfully recruited and onboarded skilled volunteers through Proofound platform',
      metric: 'Total Volunteers',
      value: 42,
      unit: 'volunteers',
      timeframe: 'Q1 2025',
      beneficiaries: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Hours Contributed',
      description: 'Cumulative volunteer hours contributed to organization projects',
      metric: 'Volunteer Hours',
      value: 1680,
      unit: 'hours',
      timeframe: 'Q1 2025',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Fetch artifacts for organization
 * Placeholder - adjust based on actual schema
 */
async function fetchArtifacts(orgId: string): Promise<Artifact[]> {
  // In production, query from artifacts table
  return [
    {
      id: '1',
      name: 'Volunteer Impact Report Q1 2025',
      type: 'PDF',
      description: 'Detailed quarterly report on volunteer contributions and outcomes',
    },
    {
      id: '2',
      name: 'Testimonials Collection',
      type: 'Document',
      description: 'Feedback and testimonials from volunteers and beneficiaries',
    },
  ];
}
