/**
 * Evidence Pack PDF Generation Tests
 *
 * PRD: Part 5 O4
 * Tests PDF generation for donor/investor-ready impact documentation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateEvidencePackHTML, type EvidencePackData } from '@/lib/pdf/evidence-pack';

describe('Evidence Pack PDF Generation', () => {
  let sampleData: EvidencePackData;

  beforeAll(() => {
    // Create sample data for testing
    sampleData = {
      organization: {
        name: 'Test Organization',
        description: 'A test organization for impact verification',
        website: 'https://test.org',
        sector: 'Education',
        size: '50-100 employees',
      },
      impactEntries: [
        {
          id: '1',
          title: 'Students Educated',
          description: 'Number of students who completed our education program',
          metric: 'students_educated',
          value: 1250,
          unit: 'students',
          timeframe: '2024 Q1-Q3',
          beneficiaries: 1250,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30'),
        },
        {
          id: '2',
          title: 'Carbon Offset',
          description: 'Total CO2 emissions reduced through our initiatives',
          metric: 'carbon_offset',
          value: 5000,
          unit: 'tons CO2',
          timeframe: '2024 Annual',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-12-31'),
        },
      ],
      artifacts: [
        {
          id: '1',
          name: 'Impact Report 2024',
          type: 'PDF',
          url: 'https://example.com/report.pdf',
          description: 'Annual impact report with detailed metrics',
        },
      ],
      generatedAt: new Date(),
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-12-31'),
    };
  });

  it('should generate HTML from evidence pack data', () => {
    const html = generateEvidencePackHTML(sampleData);

    expect(html).toBeTruthy();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Test Organization');
  });

  it('should include organization information', () => {
    const html = generateEvidencePackHTML(sampleData);

    expect(html).toContain('Test Organization');
    expect(html).toContain('A test organization for impact verification');
    expect(html).toContain('https://test.org');
    expect(html).toContain('Education');
  });

  it('should include all impact entries', () => {
    const html = generateEvidencePackHTML(sampleData);

    expect(html).toContain('Students Educated');
    expect(html).toContain('1,250');
    expect(html).toContain('students');

    expect(html).toContain('Carbon Offset');
    expect(html).toContain('5,000');
    expect(html).toContain('tons CO2');
  });

  it('should include artifacts section', () => {
    const html = generateEvidencePackHTML(sampleData);

    expect(html).toContain('Supporting Documentation');
    expect(html).toContain('Impact Report 2024');
    expect(html).toContain('PDF');
  });

  it('should include generation metadata', () => {
    const html = generateEvidencePackHTML(sampleData);

    expect(html).toContain('Generated on');
    // Should include date in some format
    expect(html).toMatch(/\d{4}/); // Year
  });

  it('should handle empty impact entries gracefully', () => {
    const emptyData: EvidencePackData = {
      ...sampleData,
      impactEntries: [],
    };

    const html = generateEvidencePackHTML(emptyData);

    expect(html).toBeTruthy();
    expect(html).toContain('Test Organization');
    expect(html).toContain('No impact entries');
  });

  it('should handle empty artifacts gracefully', () => {
    const noArtifactsData: EvidencePackData = {
      ...sampleData,
      artifacts: [],
    };

    const html = generateEvidencePackHTML(noArtifactsData);

    expect(html).toBeTruthy();
    expect(html).toContain('Test Organization');
  });

  it('should format numbers with commas', () => {
    const largeNumberData: EvidencePackData = {
      ...sampleData,
      impactEntries: [
        {
          id: '1',
          title: 'Large Impact',
          description: 'Test',
          metric: 'test',
          value: 1000000,
          unit: 'units',
          timeframe: '2024',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const html = generateEvidencePackHTML(largeNumberData);

    expect(html).toContain('1,000,000');
  });

  it('should include professional styling', () => {
    const html = generateEvidencePackHTML(sampleData);

    // Check for CSS styling
    expect(html).toContain('<style>');
    expect(html).toContain('font-family');
    expect(html).toContain('color');
    expect(html).toContain('@page');
  });

  it('should be print-ready with proper page margins', () => {
    const html = generateEvidencePackHTML(sampleData);

    // Check for print styles
    expect(html).toContain('@page');
    expect(html).toContain('margin');
    expect(html).toContain('size');
  });

  it('should handle optional fields gracefully', () => {
    const minimalData: EvidencePackData = {
      organization: {
        name: 'Minimal Org',
      },
      impactEntries: [
        {
          id: '1',
          title: 'Test Entry',
          description: 'Test',
          metric: 'test',
          value: 100,
          unit: 'units',
          timeframe: '2024',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      artifacts: [],
      generatedAt: new Date(),
    };

    const html = generateEvidencePackHTML(minimalData);

    expect(html).toBeTruthy();
    expect(html).toContain('Minimal Org');
  });
});

describe('Evidence Pack API Integration', () => {
  it('should export evidence pack API endpoint', async () => {
    // TODO: Add API endpoint test when server is available
    // This would test the actual PDF generation endpoint
    // const response = await fetch('/api/organizations/[orgId]/evidence-pack');
    // expect(response.ok).toBe(true);
    // expect(response.headers.get('content-type')).toContain('application/pdf');
  });
});
