/**
 * Evidence Pack PDF Generator
 * PRD Part 3 (O4 - Impact Block)
 *
 * Generates donor/investor-ready PDF export of:
 * - Impact entries (outcomes, metrics, timeframes, beneficiaries)
 * - Artifacts and documentation
 * - Organization profile
 *
 * Requirements:
 * - Server-side PDF generation
 * - Professional formatting
 * - Privacy-compliant (only include public/approved data)
 */

/**
 * Note: This is a placeholder implementation using a simple HTML-to-PDF approach.
 * For production, consider using:
 * - @react-pdf/renderer (React-based PDF generation)
 * - puppeteer (headless Chrome for HTML to PDF)
 * - pdfkit (low-level PDF generation)
 */

export interface ImpactEntry {
  id: string;
  title: string;
  description: string;
  metric: string;
  value: number;
  unit: string;
  timeframe: string;
  beneficiaries?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Artifact {
  id: string;
  name: string;
  type: string;
  url?: string;
  description?: string;
}

export interface OrganizationProfile {
  name: string;
  description?: string;
  website?: string;
  sector?: string;
  size?: string;
}

export interface EvidencePackData {
  organization: OrganizationProfile;
  impactEntries: ImpactEntry[];
  artifacts: Artifact[];
  generatedAt: Date;
  periodStart?: Date;
  periodEnd?: Date;
}

/**
 * Generate Evidence Pack HTML
 * This HTML can be converted to PDF using a service like Puppeteer
 */
export function generateEvidencePackHTML(data: EvidencePackData): string {
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatNumber = (num: number) => num.toLocaleString('en-US');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evidence Pack - ${data.organization.name}</title>
  <style>
    @page {
      margin: 1in;
      size: letter;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #2D3330;
    }

    .header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #1C4D3A;
    }

    .header h1 {
      font-size: 24pt;
      color: #1C4D3A;
      margin-bottom: 0.5rem;
    }

    .header .subtitle {
      font-size: 14pt;
      color: #6B6760;
      font-style: italic;
    }

    .metadata {
      margin-bottom: 2rem;
      padding: 1rem;
      background-color: #F5F4F0;
      border-left: 4px solid #1C4D3A;
    }

    .metadata p {
      margin-bottom: 0.5rem;
    }

    .metadata strong {
      color: #1C4D3A;
    }

    .section {
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }

    .section h2 {
      font-size: 16pt;
      color: #1C4D3A;
      margin-bottom: 1rem;
      border-bottom: 1px solid #E8E6DD;
      padding-bottom: 0.5rem;
    }

    .impact-entry {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border: 1px solid #E8E6DD;
      border-radius: 4px;
      page-break-inside: avoid;
    }

    .impact-entry h3 {
      font-size: 13pt;
      color: #2D3330;
      margin-bottom: 0.5rem;
    }

    .impact-entry .metric {
      font-size: 20pt;
      font-weight: bold;
      color: #1C4D3A;
      margin: 0.5rem 0;
    }

    .impact-entry .metric-unit {
      font-size: 11pt;
      color: #6B6760;
      margin-left: 0.5rem;
    }

    .impact-entry .description {
      margin-top: 0.5rem;
      color: #4A4844;
    }

    .impact-entry .details {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px dashed #E8E6DD;
      font-size: 9pt;
      color: #6B6760;
    }

    .artifacts-list {
      list-style: none;
    }

    .artifacts-list li {
      margin-bottom: 0.75rem;
      padding-left: 1.5rem;
      position: relative;
    }

    .artifacts-list li:before {
      content: "=Î";
      position: absolute;
      left: 0;
    }

    .footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #E8E6DD;
      text-align: center;
      font-size: 9pt;
      color: #6B6760;
    }

    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.organization.name}</h1>
    <div class="subtitle">Impact Evidence Pack</div>
  </div>

  <div class="metadata">
    <p><strong>Organization:</strong> ${data.organization.name}</p>
    ${data.organization.sector ? `<p><strong>Sector:</strong> ${data.organization.sector}</p>` : ''}
    ${data.organization.website ? `<p><strong>Website:</strong> ${data.organization.website}</p>` : ''}
    <p><strong>Generated:</strong> ${formatDate(data.generatedAt)}</p>
    ${data.periodStart && data.periodEnd
      ? `<p><strong>Period:</strong> ${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}</p>`
      : ''
    }
  </div>

  <div class="section">
    <h2>Impact Summary</h2>
    ${data.impactEntries.length === 0
      ? '<p>No impact entries recorded for this period.</p>'
      : `
        <p>This report documents <strong>${data.impactEntries.length}</strong> key impact ${data.impactEntries.length === 1 ? 'outcome' : 'outcomes'} achieved by ${data.organization.name}.</p>
      `
    }
  </div>

  ${data.impactEntries.length > 0 ? `
    <div class="section">
      <h2>Documented Outcomes</h2>
      ${data.impactEntries.map((entry, idx) => `
        <div class="impact-entry">
          <h3>${idx + 1}. ${entry.title}</h3>
          <div class="metric">
            ${formatNumber(entry.value)}
            <span class="metric-unit">${entry.unit}</span>
          </div>
          ${entry.description ? `<div class="description">${entry.description}</div>` : ''}
          <div class="details">
            <strong>Metric:</strong> ${entry.metric} |
            <strong>Timeframe:</strong> ${entry.timeframe}
            ${entry.beneficiaries ? ` | <strong>Beneficiaries:</strong> ${formatNumber(entry.beneficiaries)}` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${data.artifacts.length > 0 ? `
    <div class="section">
      <h2>Supporting Documentation</h2>
      <ul class="artifacts-list">
        ${data.artifacts.map(artifact => `
          <li>
            <strong>${artifact.name}</strong>
            ${artifact.description ? `<br><span style="font-size: 9pt; color: #6B6760;">${artifact.description}</span>` : ''}
            ${artifact.url ? `<br><span style="font-size: 9pt; color: #1C4D3A;">${artifact.url}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : ''}

  <div class="footer">
    <p>This Evidence Pack was generated via Proofound on ${formatDate(data.generatedAt)}.</p>
    <p>For questions or verification, please contact ${data.organization.name}.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate Evidence Pack metadata
 * Used for tracking exports
 */
export interface EvidencePackMetadata {
  organizationId: string;
  organizationName: string;
  entryCount: number;
  artifactCount: number;
  periodStart?: Date;
  periodEnd?: Date;
  pageCount: number;
  generatedAt: Date;
}

export function generateEvidencePackMetadata(data: EvidencePackData): EvidencePackMetadata {
  // Estimate page count (rough approximation)
  const basePages = 1; // Cover + metadata
  const entryPages = Math.ceil(data.impactEntries.length / 3); // ~3 entries per page
  const artifactPages = data.artifacts.length > 0 ? 1 : 0;

  return {
    organizationId: '', // Should be passed from caller
    organizationName: data.organization.name,
    entryCount: data.impactEntries.length,
    artifactCount: data.artifacts.length,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    pageCount: basePages + entryPages + artifactPages,
    generatedAt: data.generatedAt,
  };
}
