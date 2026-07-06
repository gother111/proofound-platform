import fs from 'node:fs/promises';
import path from 'node:path';

export type AdminLaunchHealthSummary = {
  status: 'ready' | 'blocked' | 'unavailable';
  verdict: string;
  generatedAt: string | null;
  artifactPath: string | null;
  counts: {
    pass: number;
    fail: number;
    blocked: number;
    unverified: number;
  };
  trueBlockers: string[];
  externalPrerequisites: string[];
};

type LaunchChecklistArtifact = {
  generatedAt?: unknown;
  verdict?: unknown;
  statusCounts?: {
    PASS?: unknown;
    FAIL?: unknown;
    BLOCKED?: unknown;
    UNVERIFIED?: unknown;
  };
  trueBlockers?: Array<{ label?: unknown }>;
  externalPrerequisites?: Array<{ label?: unknown; status?: unknown }>;
};

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asLabelList(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) =>
          item && typeof item === 'object' && 'label' in item
            ? (item as { label?: unknown }).label
            : null
        )
        .filter((label): label is string => typeof label === 'string' && label.trim().length > 0)
    : [];
}

async function findLatestChecklistPath(artifactRoot: string) {
  let entries: Array<{ isDirectory(): boolean; name: string }>;

  try {
    entries = await fs.readdir(artifactRoot, { withFileTypes: true });
  } catch {
    return null;
  }
  const candidates = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('launch-validation-'))
    .map((entry) => path.join(artifactRoot, entry.name, 'final-launch-checklist-status.json'))
    .sort()
    .reverse();

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Keep looking for the latest generated checklist.
    }
  }

  return null;
}

export async function getAdminLaunchHealthSummary(options?: {
  artifactRoot?: string;
}): Promise<AdminLaunchHealthSummary> {
  const artifactRoot = options?.artifactRoot ?? path.join(process.cwd(), '.artifacts');
  const checklistPath = await findLatestChecklistPath(artifactRoot);

  if (!checklistPath) {
    return {
      status: 'unavailable',
      verdict: 'UNAVAILABLE',
      generatedAt: null,
      artifactPath: null,
      counts: {
        pass: 0,
        fail: 0,
        blocked: 0,
        unverified: 0,
      },
      trueBlockers: [],
      externalPrerequisites: [],
    };
  }

  const parsed = JSON.parse(await fs.readFile(checklistPath, 'utf8')) as LaunchChecklistArtifact;
  const counts = {
    pass: asNumber(parsed.statusCounts?.PASS),
    fail: asNumber(parsed.statusCounts?.FAIL),
    blocked: asNumber(parsed.statusCounts?.BLOCKED),
    unverified: asNumber(parsed.statusCounts?.UNVERIFIED),
  };
  const trueBlockers = asLabelList(parsed.trueBlockers);
  const externalPrerequisites = asLabelList(
    parsed.externalPrerequisites?.filter((item) => item.status === 'UNVERIFIED')
  );
  const verdict = typeof parsed.verdict === 'string' ? parsed.verdict : 'UNKNOWN';

  return {
    status: verdict === 'READY' && counts.fail === 0 && counts.blocked === 0 ? 'ready' : 'blocked',
    verdict,
    generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : null,
    artifactPath: path.relative(process.cwd(), checklistPath),
    counts,
    trueBlockers,
    externalPrerequisites,
  };
}
