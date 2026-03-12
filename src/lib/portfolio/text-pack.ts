import type { TrustExportData } from './export-data';

function formatVerificationStatus(status: string): string {
  switch (status) {
    case 'verified':
      return 'Verified evidence';
    case 'partially_verified':
      return 'Partially verified';
    case 'disputed':
      return 'Verification disputed';
    default:
      return 'Not yet verified';
  }
}

function formatFreshnessState(state: string): string {
  switch (state) {
    case 'fresh':
      return 'Fresh';
    case 'review_soon':
      return 'Review soon';
    case 'stale':
      return 'Needs refresh';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
}

function resolveProofPackLine(pack: TrustExportData['proofPacks'][number]): string {
  const parts = [
    pack.outcomesSummary?.trim(),
    pack.summary?.trim(),
    pack.evidenceSummary?.trim(),
  ].filter((value): value is string => Boolean(value));

  return parts[0] ?? 'Proof details are available in the selected pack.';
}

export function buildTextPack(data: TrustExportData): string {
  const { profile, signals, visibility } = data;
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const proofPacks = Array.isArray(data.proofPacks) ? data.proofPacks : [];
  const badges = Array.isArray((signals as { badges?: unknown[] }).badges)
    ? ((signals as { badges?: Array<{ label?: string }> }).badges ?? [])
    : [];
  const lines: string[] = [];

  lines.push(profile.displayName);
  if (visibility.header) {
    lines.push(`@${profile.handle}`);
    lines.push(profile.headline);
  }

  if (proofPacks.length > 0) {
    lines.push('');
    lines.push('Proof-backed summary:');
    proofPacks.slice(0, 3).forEach((pack) => {
      lines.push(`- ${pack.title}: ${resolveProofPackLine(pack)}`);
    });
  } else if (visibility.bio && profile.bio) {
    lines.push('');
    lines.push('Profile context:');
    lines.push(profile.bio);
  }

  if (proofPacks.length > 0) {
    lines.push('');
    lines.push('Selected proof packs:');
    proofPacks.slice(0, 5).forEach((pack) => {
      lines.push(`- ${pack.title}`);
      if (pack.contextLabel) {
        lines.push(`  Context: ${pack.contextLabel}`);
      }
      lines.push(`  Verification: ${formatVerificationStatus(pack.verificationStatus)}`);
      lines.push(`  Freshness: ${formatFreshnessState(pack.freshnessState)}`);
      if (pack.outcomesSummary) {
        lines.push(`  Outcomes: ${pack.outcomesSummary}`);
      }
      if (pack.summary && pack.summary !== pack.outcomesSummary) {
        lines.push(`  Claim: ${pack.summary}`);
      }
      if (pack.evidenceSummary) {
        lines.push(`  Verification summary: ${pack.evidenceSummary}`);
      }
      const selectedEvidence = Array.isArray(pack.selectedEvidence) ? pack.selectedEvidence : [];
      if (selectedEvidence.length > 0) {
        lines.push(
          `  Selected evidence: ${selectedEvidence
            .map((item) => (item.href ? `${item.title} (${item.href})` : item.title))
            .join('; ')}`
        );
      }
    });
  } else {
    lines.push('');
    lines.push('Selected proof packs:');
    lines.push('- No public proof packs are selected yet.');
  }

  if (badges.length > 0) {
    lines.push('');
    lines.push('Scoped verification notes:');
    lines.push(
      `- ${badges
        .map((badge) => badge.label)
        .filter(Boolean)
        .join(', ')}`
    );
  }

  lines.push('');
  lines.push('Verification summary:');
  lines.push(`- Selected Proof Packs: ${proofPacks.length}`);
  lines.push(`- Verified checks: ${signals.verifications.count}`);
  lines.push(`- Public proof signals: ${signals.proofs.count}`);

  if (visibility.skills && proofPacks.length > 0 && skills.length > 0) {
    lines.push('');
    lines.push('Skills evidenced in selected proof:');
    lines.push(
      `- ${skills
        .slice(0, 6)
        .map((skill) => skill.name)
        .join(', ')}`
    );
  }

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
