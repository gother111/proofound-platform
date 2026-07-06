import type {
  IndividualPortfolioExportData,
  OrganizationPortfolioExportData,
} from './export-contract';

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

function resolveProofPackLine(pack: IndividualPortfolioExportData['proofPacks'][number]): string {
  const parts = [
    pack.outcomesSummary?.trim(),
    pack.summary?.trim(),
    typeof pack.ownershipStatement === 'string' ? pack.ownershipStatement.trim() : null,
  ].filter((value): value is string => Boolean(value));

  return parts[0] ?? 'Proof details are available in the selected pack.';
}

export function buildTextPack(data: IndividualPortfolioExportData): string {
  const { profile, signals, visibility, shareUrl } = data;
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
    lines.push('Selected proof records:');
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
      if (typeof pack.ownershipStatement === 'string') {
        lines.push(`  Ownership: ${pack.ownershipStatement}`);
      }
      if (typeof pack.verificationSummary === 'string') {
        lines.push(`  Verification summary: ${pack.verificationSummary}`);
      }
      const selectedEvidence = Array.isArray(pack.selectedEvidence) ? pack.selectedEvidence : [];
      if (selectedEvidence.length > 0) {
        lines.push(
          `  Selected evidence: ${selectedEvidence
            .map((item) => {
              const base = item.href ? `${item.title} (${item.href})` : item.title;
              return typeof item.semanticsNote === 'string'
                ? `${base} [${item.semanticsNote}]`
                : base;
            })
            .join('; ')}`
        );
      }
    });
  } else {
    lines.push('');
    lines.push('Selected proof records:');
    lines.push('- No public proof records are selected yet.');
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
  lines.push(`- Selected proof records: ${proofPacks.length}`);
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
  lines.push(`- Portfolio: ${shareUrl}`);
  if (visibility.contact && profile.contactEmail) {
    lines.push(`- Email: ${profile.contactEmail}`);
  } else {
    lines.push('- Email: hidden');
  }

  return lines.join('\n');
}

export function buildOrganizationTextPack(data: OrganizationPortfolioExportData): string {
  const lines: string[] = [];
  const assignment = data.assignmentSnapshot;

  lines.push(data.organization.displayName);
  lines.push('Organization trust page');

  lines.push('');
  lines.push('Mission / purpose:');
  lines.push(
    data.organization.mission ||
      data.organization.whyWorkMatters ||
      'Mission statement is not published yet.'
  );

  lines.push('');
  lines.push('What work is offered:');
  if (assignment?.role) {
    lines.push(`- Role: ${assignment.role}`);
    if (assignment.engagementType) {
      lines.push(`- Engagement: ${assignment.engagementType}`);
    }
    if (assignment.businessValue) {
      lines.push(`- Why this work exists: ${assignment.businessValue}`);
    }
  } else {
    lines.push(
      `- ${data.organization.whyWorkMatters || 'Work-offered detail is not published yet.'}`
    );
  }

  lines.push('');
  lines.push('Assignment clarity:');
  if (assignment?.description) {
    lines.push(`- Work summary: ${assignment.description}`);
  } else {
    lines.push(
      `- ${data.organization.operatingContext || 'Assignment detail is not published yet.'}`
    );
  }
  if (assignment?.expectedImpact) {
    lines.push(`- Proof expectations: ${assignment.expectedImpact}`);
  }
  if (assignment?.outcomes.length) {
    lines.push(`- Outcomes: ${assignment.outcomes.join('; ')}`);
  }

  lines.push('');
  lines.push('Seriousness of review:');
  lines.push(
    `- Trust posture: ${
      data.organization.verifiedDomainPath
        ? `Domain verified (${data.organization.verifiedDomainPath})`
        : 'Trust page published without domain verification'
    }`
  );
  lines.push(
    `- Review bar: ${
      assignment
        ? 'A review-ready assignment is live for proof-first evaluation.'
        : 'Organizations publish work detail before deeper review starts.'
    }`
  );
  lines.push('- Blind-by-default review remains separate from public publication.');

  lines.push('');
  lines.push('Contact & share:');
  lines.push(`- Trust page: ${data.shareUrl}`);
  if (data.organization.website) {
    lines.push(`- Website: ${data.organization.website}`);
  }

  return lines.join('\n');
}
