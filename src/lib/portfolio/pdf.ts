import PDFDocument from 'pdfkit/js/pdfkit.standalone.js';
import type { TrustSignals } from './trust-signals';
import { internalValueLabel } from '../copy/labels';

const COLORS = {
  forest: '#1C4D3A',
  terracotta: '#C76B4A',
  parchment: '#F7F6F1',
  charcoal: '#2D3330',
  stone: '#E8E6DD',
  muted: '#5F6D66',
  narrative: '#485550',
  white: '#FFFFFF',
};

type PdfTextOptions = Record<string, unknown>;

type PdfDoc = {
  on(event: string, listener: (...args: any[]) => void): PdfDoc;
  end(): void;
  page: { width: number; height: number };
  y: number;
  rect(x: number, y: number, width: number, height: number): PdfDoc;
  roundedRect(x: number, y: number, width: number, height: number, radius: number): PdfDoc;
  fill(color?: string): PdfDoc;
  fillAndStroke(fillColor: string, strokeColor: string): PdfDoc;
  fillColor(color: string): PdfDoc;
  fontSize(size: number): PdfDoc;
  font(name: string): PdfDoc;
  text(text: string, options?: PdfTextOptions): PdfDoc;
  text(text: string, x: number, y: number, options?: PdfTextOptions): PdfDoc;
  moveDown(lines?: number): PdfDoc;
  moveTo(x: number, y: number): PdfDoc;
  lineTo(x: number, y: number): PdfDoc;
  stroke(): PdfDoc;
  widthOfString(text: string): number;
};

type PdfDocumentConstructor = new (options?: Record<string, unknown>) => PdfDoc;

const StandalonePDFDocument = PDFDocument as unknown as PdfDocumentConstructor;

type SheetLayout = {
  pageWidth: number;
  pageHeight: number;
  sheetX: number;
  sheetY: number;
  sheetWidth: number;
  sheetHeight: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
};

function createBuffer(render: (doc: PdfDoc) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new StandalonePDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    render(doc);
    doc.end();
  });
}

function drawSheet(doc: PdfDoc): SheetLayout {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const sheetX = 26;
  const sheetY = 24;
  const sheetWidth = pageWidth - sheetX * 2;
  const sheetHeight = pageHeight - 44;
  const contentX = sheetX + 20;
  const contentY = sheetY + 32;
  const contentWidth = sheetWidth - 40;

  doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.parchment);

  doc
    .roundedRect(sheetX, sheetY, sheetWidth, sheetHeight, 12)
    .fillAndStroke(COLORS.white, COLORS.stone);

  doc.rect(sheetX + 1, sheetY + 1, sheetWidth - 2, 10).fill(COLORS.forest);
  doc.rect(sheetX + sheetWidth - 54, sheetY + 1, 53, 10).fill(COLORS.terracotta);

  return {
    pageWidth,
    pageHeight,
    sheetX,
    sheetY,
    sheetWidth,
    sheetHeight,
    contentX,
    contentY,
    contentWidth,
  };
}

function drawHeaderSubtitle(doc: PdfDoc, text: string, x: number, y: number, width: number) {
  doc.fillColor(COLORS.muted).fontSize(10).font('Helvetica').text(text, x, y, { width });
}

function drawTag(
  doc: PdfDoc,
  text: string,
  x: number,
  y: number,
  variant: 'forest' | 'terracotta'
) {
  const textWidth = doc.widthOfString(text);
  const tagWidth = textWidth + 16;
  const background = variant === 'forest' ? '#F4FAF7' : '#FCF6F3';
  const border = variant === 'forest' ? '#CFE5DB' : '#EFD8CF';
  const color = variant === 'forest' ? COLORS.forest : '#995339';

  doc.roundedRect(x, y, tagWidth, 16, 99).fillAndStroke(background, border);
  doc
    .fillColor(color)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text(text, x + 8, y + 4, { lineBreak: false });
}

function drawCard(doc: PdfDoc, x: number, y: number, width: number, height: number, title: string) {
  doc.roundedRect(x, y, width, height, 8).fillAndStroke(COLORS.white, COLORS.stone);
  doc
    .fillColor(COLORS.muted)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), x + 10, y + 10, { width: width - 20 });
}

function drawFooter(doc: PdfDoc, layout: SheetLayout, leftText: string, rightText: string) {
  const footerHeight = 24;
  const footerY = layout.sheetY + layout.sheetHeight - footerHeight;
  const rightTextWidth = doc.widthOfString(rightText);

  doc
    .rect(layout.sheetX + 1, footerY, layout.sheetWidth - 2, footerHeight)
    .fillAndStroke('#FCFBF8', COLORS.stone);

  doc
    .fillColor('#67726D')
    .fontSize(7)
    .font('Helvetica')
    .text(leftText, layout.contentX, footerY + 9, {
      width: layout.contentWidth / 2,
      lineBreak: false,
    });
  doc.text(rightText, layout.contentX + layout.contentWidth - rightTextWidth, footerY + 9, {
    lineBreak: false,
  });
}

function truncate(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

export type TrustPdfInput = {
  profile: {
    displayName: string;
    handle: string;
    headline: string;
    bio?: string;
    contactEmail?: string;
    shareUrl: string;
  };
  signals: TrustSignals;
  skills: Array<{ name: string; level: number }>;
  proofPacks: Array<{
    title: string;
    verificationStatus: string;
    freshnessState: string;
    outcomesSummary: string | null;
  }>;
  visibility: {
    header: boolean;
    proofBar: boolean;
    workEmail: boolean;
    linkedin: boolean;
    identity: boolean;
    counts: boolean;
    skills: boolean;
    bio: boolean;
    contact: boolean;
  };
};

function formatPackStatus(status: string): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'partially_verified':
      return 'Partial';
    case 'disputed':
      return 'Disputed';
    default:
      return 'Pending';
  }
}

export async function generateTrustPdf(input: TrustPdfInput): Promise<Buffer> {
  return createBuffer((doc) => {
    const layout = drawSheet(doc);

    doc
      .fillColor(COLORS.charcoal)
      .font('Times-Bold')
      .fontSize(22)
      .text('Public Page Proof PDF', layout.contentX, layout.contentY, {
        width: layout.contentWidth,
      });

    drawHeaderSubtitle(
      doc,
      'Reusable template for individual and organization profile exports',
      layout.contentX,
      layout.contentY + 30,
      layout.contentWidth
    );

    drawTag(doc, 'Proofound Forest', layout.contentX, layout.contentY + 46, 'forest');
    drawTag(doc, 'Terracotta Accent', layout.contentX + 102, layout.contentY + 46, 'terracotta');
    drawTag(doc, 'Parchment Surface', layout.contentX + 210, layout.contentY + 46, 'forest');

    const sectionTop = layout.contentY + 78;
    const gap = 10;
    const leftWidth = 320;
    const rightWidth = layout.contentWidth - leftWidth - gap;
    const leftX = layout.contentX;
    const rightX = leftX + leftWidth + gap;

    drawCard(doc, leftX, sectionTop, leftWidth, 108, 'Proof summary');
    let rowY = sectionTop + 28;
    const rows: Array<[string, string, boolean]> = [
      ['Proofs Added', `${input.signals.proofs.count}`, input.visibility.counts],
      ['Verified Items', `${input.signals.verifications.count}`, input.visibility.counts],
    ];
    rows.forEach(([label, value, visible]) => {
      if (!visible) return;
      doc
        .fillColor(COLORS.charcoal)
        .fontSize(8)
        .font('Helvetica')
        .text(label, leftX + 10, rowY, { lineBreak: false });
      const valueWidth = doc.widthOfString(value);
      doc
        .fillColor(COLORS.forest)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(value, leftX + leftWidth - 10 - valueWidth, rowY, { lineBreak: false });
      rowY += 14;
    });

    drawCard(
      doc,
      leftX,
      sectionTop + 118,
      leftWidth,
      108,
      input.proofPacks.length > 0 ? 'Selected Proof Packs' : 'Proof-linked skills'
    );
    if (input.proofPacks.length > 0) {
      let packY = sectionTop + 144;
      input.proofPacks.slice(0, 3).forEach((pack) => {
        doc
          .fillColor(COLORS.charcoal)
          .fontSize(8)
          .font('Helvetica-Bold')
          .text(truncate(pack.title, 32), leftX + 10, packY, { width: leftWidth - 20 });
        packY += 12;
        doc
          .fillColor(COLORS.muted)
          .fontSize(7)
          .font('Helvetica')
          .text(
            `${formatPackStatus(pack.verificationStatus)} • ${truncate(
              pack.outcomesSummary || internalValueLabel(pack.freshnessState),
              34
            )}`,
            leftX + 10,
            packY,
            { width: leftWidth - 20 }
          );
        packY += 18;
      });
    } else if (input.visibility.skills) {
      const topSkills = input.skills.slice(0, 3);
      let skillY = sectionTop + 144;
      topSkills.forEach((skill) => {
        const pct = Math.max(0, Math.min(100, Math.round((skill.level / 5) * 100)));
        const skillName = truncate(skill.name, 26);
        const pctLabel = `${pct}%`;
        const pctWidth = doc.widthOfString(pctLabel);

        doc
          .fillColor(COLORS.charcoal)
          .fontSize(8)
          .font('Helvetica')
          .text(skillName, leftX + 10, skillY, { lineBreak: false });
        doc
          .fillColor(COLORS.muted)
          .fontSize(7)
          .font('Helvetica')
          .text(pctLabel, leftX + leftWidth - 10 - pctWidth, skillY, {
            lineBreak: false,
          });

        const barY = skillY + 10;
        const barX = leftX + 10;
        const barWidth = leftWidth - 20;
        doc.roundedRect(barX, barY, barWidth, 4, 99).fill('#EFF3F1');
        doc.roundedRect(barX, barY, barWidth * (pct / 100), 4, 99).fill(COLORS.forest);
        skillY += 24;
      });
    }

    drawCard(doc, leftX, sectionTop + 236, leftWidth, 74, 'Profile narrative');
    const narrative = input.visibility.bio
      ? input.profile.bio || 'Add your profile narrative to strengthen this export.'
      : 'Narrative is hidden by current visibility settings.';
    doc
      .fillColor(COLORS.narrative)
      .fontSize(8)
      .font('Helvetica')
      .text(truncate(narrative, 170), leftX + 10, sectionTop + 262, {
        width: leftWidth - 20,
        lineGap: 2,
        height: 36,
      });

    drawCard(doc, rightX, sectionTop, rightWidth, 58, 'Contact');
    doc
      .fillColor(COLORS.charcoal)
      .fontSize(7)
      .font('Helvetica')
      .text(input.profile.shareUrl, rightX + 10, sectionTop + 28, {
        width: rightWidth - 20,
        lineBreak: false,
      });
    if (input.visibility.contact && input.profile.contactEmail) {
      doc.text(input.profile.contactEmail, rightX + 10, sectionTop + 40, {
        width: rightWidth - 20,
        lineBreak: false,
      });
    }

    drawCard(doc, rightX, sectionTop + 68, rightWidth, 78, 'Visual tokens');
    const tokens: Array<[string, string]> = [
      ['Forest', COLORS.forest],
      ['Terracotta', COLORS.terracotta],
      ['Parchment', COLORS.parchment],
    ];
    let tokenY = sectionTop + 90;
    tokens.forEach(([label, value]) => {
      doc
        .fillColor(COLORS.charcoal)
        .fontSize(8)
        .font('Helvetica')
        .text(label, rightX + 10, tokenY, { lineBreak: false });
      const valueWidth = doc.widthOfString(value);
      doc.text(value, rightX + rightWidth - 10 - valueWidth, tokenY, { lineBreak: false });
      tokenY += 14;
    });

    drawFooter(doc, layout, 'Proofound Public Page PDF Template', 'Designed in Figma via MCP');
  });
}

export type OrganizationProfilePdfInput = {
  organization: {
    displayName: string;
    slug: string;
    verifiedDomainPath?: string;
    mission?: string;
    whyWorkMatters?: string;
    operatingContext?: string;
    website?: string;
    verified: boolean;
    shareUrl: string;
  };
};

export async function generateOrganizationProfilePdf(
  input: OrganizationProfilePdfInput
): Promise<Buffer> {
  return createBuffer((doc) => {
    const layout = drawSheet(doc);

    doc
      .fillColor(COLORS.charcoal)
      .font('Times-Bold')
      .fontSize(20)
      .text('Organization Public Profile PDF', layout.contentX, layout.contentY, {
        width: layout.contentWidth,
      });

    drawHeaderSubtitle(
      doc,
      'Template variant for /portfolio/org/[slug] exports',
      layout.contentX,
      layout.contentY + 26,
      layout.contentWidth
    );
    drawTag(doc, 'Proofound Brand System', layout.contentX, layout.contentY + 42, 'forest');

    const sectionTop = layout.contentY + 74;
    const gap = 10;
    const leftWidth = 285;
    const rightWidth = layout.contentWidth - leftWidth - gap;
    const leftX = layout.contentX;
    const rightX = leftX + leftWidth + gap;

    drawCard(doc, leftX, sectionTop, leftWidth, 112, 'Organization');
    doc
      .fillColor('#25302C')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(input.organization.displayName, leftX + 10, sectionTop + 24, {
        width: leftWidth - 20,
        lineBreak: false,
      });
    const orgNarrative =
      input.organization.whyWorkMatters ||
      'Public organization profile with only the minimum credible launch fields.';
    doc
      .fillColor('#4D5A55')
      .fontSize(8)
      .font('Helvetica')
      .text(truncate(orgNarrative, 120), leftX + 10, sectionTop + 40, {
        width: leftWidth - 20,
        lineGap: 2,
        height: 26,
      });
    const topBadges = [
      input.organization.verified ? 'Verified' : 'Public',
      'Proof-first',
      'Review-centered',
    ];
    topBadges.slice(0, 3).forEach((badge, idx) => {
      drawTag(doc, badge, leftX + 10 + idx * 80, sectionTop + 84, 'forest');
    });

    drawCard(doc, leftX, sectionTop + 122, leftWidth, 84, 'Mission');
    const mission = input.organization.mission || 'Mission statement is not published yet.';
    doc
      .fillColor('#4D5A55')
      .fontSize(8)
      .font('Helvetica')
      .text(truncate(mission, 140), leftX + 10, sectionTop + 146, {
        width: leftWidth - 20,
        lineGap: 2,
        height: 32,
      });

    drawCard(doc, leftX, sectionTop + 216, leftWidth, 64, 'Operating context');
    doc
      .fillColor('#4D5A55')
      .fontSize(8)
      .font('Helvetica')
      .text(
        truncate(
          input.organization.operatingContext || 'Operating context is not published yet.',
          120
        ),
        leftX + 10,
        sectionTop + 240,
        {
          width: leftWidth - 20,
          lineGap: 2,
          height: 24,
        }
      );

    drawCard(doc, rightX, sectionTop, rightWidth, 82, 'Trust basics');
    const orgRows: Array<[string, string]> = [
      ['Verified domain path', input.organization.verifiedDomainPath || 'Not verified yet'],
      ['Website', input.organization.website || 'Not published'],
      ['Trust mode', input.organization.verified ? 'Verified' : 'Public'],
    ];
    let rowY = sectionTop + 24;
    orgRows.forEach(([label, value]) => {
      doc
        .fillColor(COLORS.charcoal)
        .fontSize(8)
        .font('Helvetica')
        .text(label, rightX + 10, rowY, { lineBreak: false });
      const valueWidth = doc.widthOfString(value);
      doc
        .fillColor(COLORS.forest)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(value, rightX + rightWidth - 10 - valueWidth, rowY, {
          lineBreak: false,
        });
      rowY += 16;
    });

    drawCard(doc, rightX, sectionTop + 92, rightWidth, 86, 'Links');
    doc
      .fillColor('#4D5A55')
      .fontSize(8)
      .font('Helvetica')
      .text(input.organization.shareUrl, rightX + 10, sectionTop + 116, {
        width: rightWidth - 20,
        lineGap: 2,
        height: 26,
      });
    if (input.organization.website) {
      doc.text(input.organization.website, rightX + 10, sectionTop + 144, {
        width: rightWidth - 20,
        lineBreak: false,
      });
    }

    drawFooter(doc, layout, 'Proofound Organization PDF Template', 'Figma MCP Capture');
  });
}
