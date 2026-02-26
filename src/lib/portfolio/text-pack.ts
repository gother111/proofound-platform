import type { TrustExportData } from './export-data';

export function buildTextPack(data: TrustExportData): string {
  const { profile, signals, skills, visibility } = data;
  const lines: string[] = [];

  // Header
  lines.push(profile.displayName);
  if (visibility.header) {
    lines.push(`@${profile.handle}`);
    lines.push(profile.headline);
  }

  // Bio
  if (visibility.bio && profile.bio) {
    lines.push('');
    lines.push('Bio:');
    lines.push(profile.bio);
  }

  // Trust summary
  if (visibility.proofBar) {
    lines.push('');
    lines.push('Trust summary:');
    if (visibility.identity) {
      lines.push(
        `- Identity: ${signals.identity.verified ? `Verified (${signals.identity.method ?? 'method'})` : 'Not verified'}`
      );
    }
    if (visibility.workEmail) {
      lines.push(`- Work email: ${signals.workEmail.verified ? 'Verified' : 'Not verified'}`);
    }
    if (visibility.linkedin) {
      lines.push(
        `- LinkedIn: ${
          signals.linkedin.verificationStatus === 'pending'
            ? 'Pending'
            : signals.linkedin.verificationStatus === 'verified' &&
                signals.linkedin.hasIdentityVerification
              ? 'Verified (Identity badge)'
              : signals.linkedin.verificationStatus === 'verified'
                ? 'Verified (no identity badge)'
                : signals.linkedin.verificationStatus === 'failed'
                  ? 'Failed'
                  : 'Not checked'
        }`
      );
    }
    if (visibility.counts) {
      lines.push(`- Proofs: ${signals.proofs.count}`);
      lines.push(`- Verified skills: ${signals.verifications.count}`);
      lines.push(`- Peer attestations: ${signals.attestations.count}`);
    }
  }

  // Skills
  if (visibility.skills) {
    lines.push('');
    lines.push('Top skills:');
    if (skills.length === 0) {
      lines.push('- (none yet)');
    } else {
      skills.forEach((skill) => {
        const pct = Math.round((skill.level / 5) * 100);
        lines.push(`- ${skill.name}: ${pct}%`);
      });
    }
  }

  // Contact
  lines.push('');
  lines.push('Contact & share:');
  lines.push(`- Portfolio: ${profile.handle}`);
  if (visibility.contact && profile.contactEmail) {
    lines.push(`- Email: ${profile.contactEmail}`);
  } else {
    lines.push('- Email: hidden');
  }

  return lines.join('\n');
}
