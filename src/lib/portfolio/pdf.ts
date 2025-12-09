import PDFDocument from 'pdfkit';
import type { TrustSignals } from './trust-signals';

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

export async function generateTrustPdf(input: TrustPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(18).fillColor('#111827').text(input.profile.displayName, { underline: false });
    if (input.visibility.header) {
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#4B5563').text(`@${input.profile.handle}`);
      doc.moveDown(0.6);
      doc.fontSize(12).fillColor('#111827').text(input.profile.headline);
    }
    if (input.visibility.bio && input.profile.bio) {
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor('#374151').text(input.profile.bio, { width: 500 });
    }

    doc.moveDown(1);
    if (input.visibility.proofBar) {
      doc.fontSize(12).fillColor('#111827').text('Trust summary', { underline: true });
      doc.moveDown(0.4);

      const rows: Array<[string, string, boolean]> = [
        [
          'Identity',
          input.signals.identity.verified
            ? `Verified (${input.signals.identity.method ?? 'method'})`
            : 'Not verified',
          input.visibility.identity,
        ],
        [
          'Work email',
          input.signals.workEmail.verified ? 'Verified' : 'Not verified',
          input.visibility.workEmail,
        ],
        [
          'LinkedIn',
          input.signals.linkedin.confidence !== undefined
            ? `Confidence ${Math.round(input.signals.linkedin.confidence)}${input.signals.linkedin.hasVerificationBadge ? ' + badge' : ''}`
            : 'Not checked',
          input.visibility.linkedin,
        ],
        ['Proofs added', `${input.signals.proofs.count}`, input.visibility.counts],
        ['Skills verified', `${input.signals.verifications.count}`, input.visibility.counts],
        ['Peer attestations', `${input.signals.attestations.count}`, input.visibility.counts],
      ];

      doc.fontSize(11).fillColor('#111827');
      rows.forEach(([label, value, show]) => {
        if (show) doc.text(`${label}: ${value}`);
      });
    }

    doc.moveDown(1);
    if (input.visibility.skills) {
      doc.fontSize(12).fillColor('#111827').text('Top skills', { underline: true });
      doc.moveDown(0.4);
      if (input.skills.length === 0) {
        doc.fontSize(11).fillColor('#4B5563').text('Add skills and proofs to showcase here.');
      } else {
        input.skills.forEach((skill) => {
          const pct = Math.round((skill.level / 5) * 100);
          doc.fontSize(11).fillColor('#111827').text(`${skill.name}: ${pct}% level`);
        });
      }
    }

    doc.moveDown(1);
    if (input.visibility.contact || input.visibility.header) {
      doc.fontSize(12).fillColor('#111827').text('Share & contact', { underline: true });
      doc.moveDown(0.4);
      doc
        .fontSize(11)
        .fillColor('#1D4ED8')
        .text(input.profile.shareUrl, { link: input.profile.shareUrl });
      if (input.visibility.contact && input.profile.contactEmail) {
        doc.moveDown(0.2);
        doc.fontSize(11).fillColor('#111827').text(`Email: ${input.profile.contactEmail}`);
      }
    }

    doc.end();
  });
}
