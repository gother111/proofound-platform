/**
 * Evidence Pack PDF Generator
 *
 * Generates comprehensive PDF evidence packs for organizations
 * PRD Reference: Part 5 O9 - Evidence Pack Export
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { log } from '@/lib/log';

export interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  skills: Array<{
    name: string;
    level: number;
    monthsExperience?: number;
    verifications: Array<{
      verifierName: string;
      verifiedAt: Date;
      relationship: string;
    }>;
  }>;
  experiences: Array<{
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate: Date;
    endDate?: Date;
  }>;
  verifications: {
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    verifiedAt?: Date;
  };
  matchScore?: number;
  rank?: number;
  totalCandidates?: number;
}

export interface AssignmentData {
  role: string;
  organization: string;
  createdAt: Date;
  interviewDate?: Date;
  decision?: {
    type: string;
    madeAt: Date;
    feedback?: string;
  };
}

/**
 * Generate evidence pack PDF
 */
export async function generateEvidencePackPDF(
  profile: ProfileData,
  assignment: AssignmentData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', (error) => reject(error));

      // Generate PDF content
      addHeader(doc, assignment);
      addCandidateProfile(doc, profile);
      addMatchingInformation(doc, profile, assignment);
      addSkillsSection(doc, profile);
      addExperienceSection(doc, profile);
      addEducationSection(doc, profile);
      addVerificationsSection(doc, profile);
      addFooter(doc);

      doc.end();
    } catch (error) {
      log.error('evidence_pack.generate.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      reject(error);
    }
  });
}

/**
 * Add header section
 */
function addHeader(doc: PDFKit.PDFDocument, assignment: AssignmentData) {
  doc.fontSize(24).font('Helvetica-Bold').text('Evidence Pack', { align: 'center' }).moveDown(0.5);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Assignment: ${assignment.role}`, { align: 'center' })
    .text(`Organization: ${assignment.organization}`, { align: 'center' })
    .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
    .moveDown(1);

  // Horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke()
    .moveDown(1);
}

/**
 * Add candidate profile section
 */
function addCandidateProfile(doc: PDFKit.PDFDocument, profile: ProfileData) {
  doc.fontSize(16).font('Helvetica-Bold').text('Candidate Profile').moveDown(0.5);

  doc.fontSize(18).font('Helvetica-Bold').text(profile.name).moveDown(0.3);

  if (profile.headline) {
    doc.fontSize(12).font('Helvetica-Oblique').text(profile.headline).moveDown(0.5);
  }

  doc.fontSize(10).font('Helvetica');

  if (profile.email) {
    doc.text(`Email: ${profile.email}`);
  }
  if (profile.phone) {
    doc.text(`Phone: ${profile.phone}`);
  }
  if (profile.location) {
    doc.text(`Location: ${profile.location}`);
  }

  if (profile.bio) {
    doc.moveDown(0.5);
    doc.text('Biography:', { continued: false });
    doc.fontSize(10).text(profile.bio, {
      align: 'justify',
    });
  }

  doc.moveDown(1);
}

/**
 * Add matching information
 */
function addMatchingInformation(
  doc: PDFKit.PDFDocument,
  profile: ProfileData,
  assignment: AssignmentData
) {
  doc.fontSize(16).font('Helvetica-Bold').text('Matching Information').moveDown(0.5);

  doc.fontSize(10).font('Helvetica');

  if (profile.matchScore !== undefined) {
    doc.text(`Match Score: ${(profile.matchScore * 100).toFixed(1)}%`);
  }

  if (profile.rank && profile.totalCandidates) {
    doc.text(`Rank: #${profile.rank} of ${profile.totalCandidates} candidates`);
    const percentile = Math.round((profile.rank / profile.totalCandidates) * 100);
    doc.text(`Percentile: Top ${percentile}%`);
  }

  if (assignment.interviewDate) {
    doc.text(`Interview Date: ${assignment.interviewDate.toLocaleDateString()}`);
  }

  if (assignment.decision) {
    doc.text(`Decision: ${assignment.decision.type}`);
    doc.text(`Decision Date: ${assignment.decision.madeAt.toLocaleDateString()}`);
  }

  doc.moveDown(1);
}

/**
 * Add skills section
 */
function addSkillsSection(doc: PDFKit.PDFDocument, profile: ProfileData) {
  if (profile.skills.length === 0) return;

  doc.fontSize(16).font('Helvetica-Bold').text('Skills & Expertise').moveDown(0.5);

  profile.skills.forEach((skill, index) => {
    doc.fontSize(11).font('Helvetica-Bold').text(skill.name, { continued: true });
    doc.fontSize(10).font('Helvetica').text(` - Level ${skill.level}/5`);

    if (skill.monthsExperience) {
      const years = Math.floor(skill.monthsExperience / 12);
      const months = skill.monthsExperience % 12;
      doc.text(`  Experience: ${years}y ${months}m`);
    }

    if (skill.verifications.length > 0) {
      doc.text(`  Verified by:`);
      skill.verifications.forEach((v) => {
        doc.text(
          `    • ${v.verifierName} (${v.relationship}) - ${v.verifiedAt.toLocaleDateString()}`
        );
      });
    }

    if (index < profile.skills.length - 1) {
      doc.moveDown(0.3);
    }
  });

  doc.moveDown(1);
}

/**
 * Add experience section
 */
function addExperienceSection(doc: PDFKit.PDFDocument, profile: ProfileData) {
  if (profile.experiences.length === 0) return;

  doc.fontSize(16).font('Helvetica-Bold').text('Work Experience').moveDown(0.5);

  profile.experiences.forEach((exp, index) => {
    doc.fontSize(11).font('Helvetica-Bold').text(exp.title);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `${exp.company} • ${exp.startDate.toLocaleDateString()} - ${exp.endDate ? exp.endDate.toLocaleDateString() : 'Present'}`
      );

    if (exp.description) {
      doc.moveDown(0.2);
      doc.text(exp.description, { align: 'justify' });
    }

    if (index < profile.experiences.length - 1) {
      doc.moveDown(0.5);
    }
  });

  doc.moveDown(1);
}

/**
 * Add education section
 */
function addEducationSection(doc: PDFKit.PDFDocument, profile: ProfileData) {
  if (profile.education.length === 0) return;

  doc.fontSize(16).font('Helvetica-Bold').text('Education').moveDown(0.5);

  profile.education.forEach((edu, index) => {
    doc.fontSize(11).font('Helvetica-Bold').text(edu.degree);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${edu.institution}${edu.field ? ` • ${edu.field}` : ''}`);
    doc.text(
      `${edu.startDate.toLocaleDateString()} - ${edu.endDate ? edu.endDate.toLocaleDateString() : 'Present'}`
    );

    if (index < profile.education.length - 1) {
      doc.moveDown(0.5);
    }
  });

  doc.moveDown(1);
}

/**
 * Add verifications section
 */
function addVerificationsSection(doc: PDFKit.PDFDocument, profile: ProfileData) {
  doc.fontSize(16).font('Helvetica-Bold').text('Verifications').moveDown(0.5);

  doc.fontSize(10).font('Helvetica');

  const checks = [
    {
      label: 'Email Verified',
      status: profile.verifications.emailVerified,
    },
    {
      label: 'Phone Verified',
      status: profile.verifications.phoneVerified,
    },
    {
      label: 'Identity Verified',
      status: profile.verifications.identityVerified,
    },
  ];

  checks.forEach((check) => {
    doc.text(`${check.status ? '✓' : '✗'} ${check.label}`, {
      continued: false,
    });
  });

  if (profile.verifications.verifiedAt) {
    doc.moveDown(0.5);
    doc.text(`Last verified: ${profile.verifications.verifiedAt.toLocaleDateString()}`);
  }

  doc.moveDown(1);
}

/**
 * Add footer
 */
function addFooter(doc: PDFKit.PDFDocument) {
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Proofound Evidence Pack • Generated ${new Date().toLocaleString()} • Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        {
          align: 'center',
          lineBreak: false,
        }
      );
  }
}
