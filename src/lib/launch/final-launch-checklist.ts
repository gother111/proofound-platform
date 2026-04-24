import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { Dirent } from 'node:fs';

import { normalizeLaunchBaseUrl } from '@/lib/launch/contracts';
import { REPO_READY_VALIDATION_FILE_NAME } from '@/lib/launch/repo-ready-validation';
import { buildFinalLaunchChecklistDefinitions } from '@/lib/launch/final-launch-checklist-definitions';

export const FINAL_LAUNCH_CHECKLIST_STATUS_VALUES = [
  'PASS',
  'FAIL',
  'BLOCKED',
  'UNVERIFIED',
] as const;

export type FinalLaunchChecklistStatus = (typeof FINAL_LAUNCH_CHECKLIST_STATUS_VALUES)[number];

export const FINAL_LAUNCH_CHECKLIST_SCOPE_VALUES = ['repo', 'full'] as const;
export type FinalLaunchChecklistScope = (typeof FINAL_LAUNCH_CHECKLIST_SCOPE_VALUES)[number];

export const FINAL_LAUNCH_CHECKLIST_SECTIONS = [
  'Product',
  'Engineering',
  'QA',
  'Ops',
  'Founder / GTM',
] as const;

export type FinalLaunchChecklistSection = (typeof FINAL_LAUNCH_CHECKLIST_SECTIONS)[number];

export type FinalLaunchChecklistEvidence = {
  label: string;
  path?: string;
  url?: string;
  command?: string;
  note?: string;
};

export type FinalLaunchChecklistObservation = {
  sourceId: string;
  sourceLabel: string;
  status: FinalLaunchChecklistStatus;
  summary: string;
  evidence: FinalLaunchChecklistEvidence[];
  observedAt: string | null;
  priority: number;
  staleClaim?: string;
};

export type FinalLaunchChecklistItemDefinition = {
  id: string;
  section: FinalLaunchChecklistSection;
  label: string;
  authorityRefs: string[];
  evidenceSources: string[];
  blocksVerdictIn?: 'both' | 'repo' | 'full' | 'never';
  upstreamBlockers?: string[];
  evaluateDirect: (context: FinalLaunchChecklistContext) => FinalLaunchChecklistObservation[];
};

export type FinalLaunchChecklistItemResult = {
  id: string;
  section: FinalLaunchChecklistSection;
  label: string;
  authorityRefs: string[];
  evidenceSources: string[];
  status: FinalLaunchChecklistStatus;
  summary: string;
  evidence: FinalLaunchChecklistEvidence[];
  blockerIds: string[];
  retiredStaleClaims: string[];
  sourceLabel: string;
  blocksVerdict: boolean;
  blockingScope: 'repo' | 'full' | 'both' | 'never';
};

export type ParsedChecklistRow = {
  label: string;
  normalizedLabel: string;
  status: FinalLaunchChecklistStatus;
  details: Record<string, string>;
  sourcePath: string;
  observedAt: string | null;
};

type ParsedGateSummaryGate = {
  id: string;
  status: FinalLaunchChecklistStatus;
  summary: string;
  evidence: string[];
  raw: Record<string, unknown>;
};

type ParsedLaunchValidationBundle = {
  dir: string;
  kind: 'full_launch' | 'repo_ready';
  generatedAt: string | null;
  authoritativeBaseUrl: string | null;
  verdict: string | null;
  recommendation: string | null;
  gates: Map<string, ParsedGateSummaryGate>;
  liveLaunchStatusExtractPath: string | null;
  liveLaunchStatusExtract: Record<string, unknown> | null;
};

type LiveEndpointResult = {
  url: string;
  ok: boolean;
  status: number | null;
  payload: Record<string, unknown> | null;
  error: string | null;
  observedAt: string;
  evidencePath: string | null;
};

export type StatefulCheckResult = {
  id: 'public_org_trust_smoke' | 'strict_org_corridor';
  status: FinalLaunchChecklistStatus;
  command: string;
  logPath: string;
  observedAt: string;
};

export type FinalLaunchChecklistContext = {
  scope: FinalLaunchChecklistScope;
  workspaceRoot: string;
  generatedAt: string;
  currentDate: string;
  gitHead: string;
  gitBranch: string;
  includeStateful: boolean;
  artifactRoot: string;
  outputDir: string;
  latestLaunchBundle: ParsedLaunchValidationBundle | null;
  latestRepoReadyBundle: ParsedLaunchValidationBundle | null;
  latestFullLaunchBundle: ParsedLaunchValidationBundle | null;
  currentStateRealityCheck: Map<string, ParsedChecklistRow>;
  verificationChecklist: Map<string, ParsedChecklistRow>;
  routeInventory: string | null;
  implementationStatusSnapshot: string | null;
  launchReadinessSummary: string | null;
  priorityFileMap: string | null;
  launchRunbook: string | null;
  lockedMvp: string | null;
  proofFirstPrd: string | null;
  projectSpecification: string | null;
  readme: string | null;
  launchOperationsMvp: string | null;
  monitoringAlerting: string | null;
  launchRestoreDrill: string | null;
  internalOpsIndex: string | null;
  verificationReviewSop: string | null;
  riskyUploadSop: string | null;
  revealPrivacyDisputeSop: string | null;
  engagementVerificationChecklist: string | null;
  assignmentQualityChecklist: string | null;
  assignmentPublishRouteTest: string | null;
  reviewRouteTest: string | null;
  uploadsPrivacyTest: string | null;
  uploadsLifecycleQueueTest: string | null;
  liveApiHealth: LiveEndpointResult | null;
  liveLaunchStatus: LiveEndpointResult | null;
  statefulChecks: Map<string, StatefulCheckResult>;
  retiredStaleClaims: string[];
};

export type FinalLaunchChecklistReport = {
  scope: FinalLaunchChecklistScope;
  generatedAt: string;
  currentDate: string;
  workspaceRoot: string;
  gitHead: string;
  gitBranch: string;
  verdict: 'READY' | 'NOT_READY';
  includeStateful: boolean;
  liveBaseUrl: string | null;
  latestLaunchBundleDir: string | null;
  statusCounts: Record<FinalLaunchChecklistStatus, number>;
  items: FinalLaunchChecklistItemResult[];
  trueBlockers: FinalLaunchChecklistItemResult[];
  externalPrerequisites: FinalLaunchChecklistItemResult[];
  missingEvidence: FinalLaunchChecklistItemResult[];
  retiredStaleClaims: string[];
  outputs: {
    markdownPath: string;
    jsonPath: string;
  };
};

export type GenerateFinalLaunchChecklistOptions = {
  workspaceRoot?: string;
  now?: Date;
  liveBaseUrl?: string | null;
  includeStateful?: boolean;
  scope?: FinalLaunchChecklistScope;
  artifactRoot?: string;
  fetchImpl?: typeof fetch;
};

const SOURCE_PRIORITY = {
  stateful: 900,
  live_endpoint: 850,
  latest_launch_bundle: 800,
  current_state_reality_check: 700,
  verification_checklist: 650,
  implementation_snapshot: 600,
  tests: 500,
  docs: 400,
  fallback: 200,
} as const;

const INDEX_SECTION_START = '<!-- final-launch-checklist:start -->';
const INDEX_SECTION_END = '<!-- final-launch-checklist:end -->';

function stripBackticks(value: string) {
  return value.replace(/`/g, '').trim();
}

function normalizeChecklistLabel(value: string) {
  return stripBackticks(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function mapStatus(value: string | null | undefined): FinalLaunchChecklistStatus | null {
  const normalized = stripBackticks(value ?? '').toUpperCase();
  if (FINAL_LAUNCH_CHECKLIST_STATUS_VALUES.includes(normalized as FinalLaunchChecklistStatus)) {
    return normalized as FinalLaunchChecklistStatus;
  }
  return null;
}

function compactObservations<T>(values: Array<T | null | undefined>): T[] {
  return values.filter((value): value is T => value != null);
}

function safeIso(value: number | string | Date | null | undefined) {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function compareObservedAt(a: string | null, b: string | null) {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return bTime - aTime;
}

function choosePreferredObservation(observations: FinalLaunchChecklistObservation[]) {
  const sorted = [...observations].sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }
    const byObservedAt = compareObservedAt(left.observedAt, right.observedAt);
    if (byObservedAt !== 0) {
      return byObservedAt;
    }
    return left.sourceLabel.localeCompare(right.sourceLabel);
  });

  const selected = sorted[0] ?? null;
  const retiredStaleClaims =
    selected == null
      ? []
      : sorted
          .slice(1)
          .filter((candidate) => candidate.status !== selected.status)
          .map(
            (candidate) =>
              candidate.staleClaim ??
              `${candidate.sourceLabel} disagrees with the selected ${selected.status} status for this checklist line.`
          );

  return {
    selected,
    retiredStaleClaims,
  };
}

function tableRowsFromMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const tables: Array<Array<Record<string, string>>> = [];

  let index = 0;
  while (index < lines.length) {
    if (!lines[index]?.trim().startsWith('|')) {
      index += 1;
      continue;
    }

    const headerLine = lines[index]?.trim();
    const separatorLine = lines[index + 1]?.trim() ?? '';
    if (
      !headerLine ||
      !separatorLine.startsWith('|') ||
      !/^\|(?:\s*:?-+:?\s*\|)+$/.test(separatorLine)
    ) {
      index += 1;
      continue;
    }

    const headers = headerLine
      .split('|')
      .slice(1, -1)
      .map((cell) => stripBackticks(cell));
    const rows: Array<Record<string, string>> = [];

    index += 2;
    while (index < lines.length && lines[index]?.trim().startsWith('|')) {
      const cells = lines[index]
        .trim()
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length === headers.length) {
        rows.push(
          headers.reduce<Record<string, string>>((accumulator, header, cellIndex) => {
            accumulator[header] = cells[cellIndex] ?? '';
            return accumulator;
          }, {})
        );
      }
      index += 1;
    }

    if (rows.length > 0) {
      tables.push(rows);
    }
  }

  return tables;
}

function parseChecklistRowsFromMarkdown(
  markdown: string,
  sourcePath: string,
  observedAt: string | null
) {
  const tables = tableRowsFromMarkdown(markdown);
  const parsed = new Map<string, ParsedChecklistRow>();

  for (const table of tables) {
    for (const row of table) {
      const label = row.Requirement ?? row.requirement ?? row.Item ?? row.item;
      const statusValue = row.Status ?? row['Current status'] ?? row.status;
      const status = mapStatus(statusValue);
      if (!label || !status) {
        continue;
      }
      const normalizedLabel = normalizeChecklistLabel(label);
      parsed.set(normalizedLabel, {
        label: stripBackticks(label),
        normalizedLabel,
        status,
        details: row,
        sourcePath,
        observedAt,
      });
    }
  }

  return parsed;
}

function findMarkdownInlineStatus(markdown: string | null, pattern: RegExp) {
  if (!markdown) return null;

  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    if (!pattern.test(line)) {
      continue;
    }
    const match = line.match(/`(PASS|FAIL|BLOCKED|UNVERIFIED)`|\b(PASS|FAIL|BLOCKED|UNVERIFIED)\b/);
    const status = mapStatus(match?.[1] ?? match?.[2] ?? null);
    if (status) {
      return {
        status,
        line: line.trim(),
      };
    }
  }

  return null;
}

function lineMatch(markdown: string | null, pattern: RegExp) {
  if (!markdown) return null;
  const lines = markdown.split(/\r?\n/);
  return lines.find((line) => pattern.test(line))?.trim() ?? null;
}

function textContainsAll(markdown: string | null, patterns: Array<string | RegExp>) {
  if (!markdown) return false;
  return patterns.every((pattern) =>
    typeof pattern === 'string' ? markdown.includes(pattern) : pattern.test(markdown)
  );
}

async function readOptionalFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);
    return {
      content,
      observedAt: safeIso(stats.mtime),
    };
  } catch {
    return null;
  }
}

async function readOptionalJson(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);
    return {
      payload: JSON.parse(raw) as Record<string, unknown>,
      observedAt: safeIso(stats.mtime),
    };
  } catch {
    return null;
  }
}

function parseBundleGates(payload: Record<string, unknown>) {
  const gates = new Map<string, ParsedGateSummaryGate>();
  const rawGates = Array.isArray(payload.gates)
    ? (payload.gates as Array<Record<string, unknown>>)
    : [];

  for (const gate of rawGates) {
    const id = typeof gate.id === 'string' ? gate.id : null;
    const status = mapStatus(typeof gate.status === 'string' ? gate.status : null);
    if (!id || !status) {
      continue;
    }
    gates.set(id, {
      id,
      status,
      summary: typeof gate.summary === 'string' ? gate.summary : id,
      evidence: Array.isArray(gate.evidence)
        ? gate.evidence.filter((value): value is string => typeof value === 'string')
        : [],
      raw: gate,
    });
  }

  return gates;
}

async function parseLaunchBundleFromDir(
  artifactRoot: string,
  bundleDir: string,
  fileName: string,
  kind: ParsedLaunchValidationBundle['kind']
) {
  const bundlePath = path.join(bundleDir, fileName);
  const bundleResult = await readOptionalJson(bundlePath);
  if (!bundleResult?.payload) {
    return null;
  }

  const fileEntries = await fs.readdir(bundleDir, 'utf8').catch((): string[] => []);
  const liveLaunchStatusName =
    fileEntries.find((name) => name.endsWith('live_launch_status_extract.json')) ??
    fileEntries.find((name) => name.endsWith('live_launch_status.json')) ??
    fileEntries.find((name) => name.endsWith('final-launch-checklist-live-launch-status.json')) ??
    null;
  const liveLaunchStatusResult =
    liveLaunchStatusName == null
      ? null
      : await readOptionalJson(path.join(bundleDir, liveLaunchStatusName));

  return {
    dir: path.relative(artifactRoot, bundleDir),
    kind,
    generatedAt:
      typeof bundleResult.payload.generatedAt === 'string'
        ? bundleResult.payload.generatedAt
        : bundleResult.observedAt,
    authoritativeBaseUrl:
      typeof bundleResult.payload.authoritativeBaseUrl === 'string'
        ? normalizeLaunchBaseUrl(bundleResult.payload.authoritativeBaseUrl)
        : null,
    verdict: typeof bundleResult.payload.verdict === 'string' ? bundleResult.payload.verdict : null,
    recommendation:
      typeof bundleResult.payload.recommendation === 'string'
        ? bundleResult.payload.recommendation
        : null,
    gates: parseBundleGates(bundleResult.payload),
    liveLaunchStatusExtractPath:
      liveLaunchStatusName == null
        ? null
        : path.relative(artifactRoot, path.join(bundleDir, liveLaunchStatusName)),
    liveLaunchStatusExtract: liveLaunchStatusResult?.payload ?? null,
  } satisfies ParsedLaunchValidationBundle;
}

async function findLatestLaunchValidationBundle(
  artifactRoot: string,
  scope: FinalLaunchChecklistScope
) {
  const artifactsDir = path.join(artifactRoot, '.artifacts');
  let entries: Dirent[] = [];

  try {
    entries = await fs.readdir(artifactsDir, { withFileTypes: true });
  } catch {
    return null;
  }

  const bundleDirs = entries
    .filter(
      (entry) => entry.isDirectory() && /^launch-validation-\d{4}-\d{2}-\d{2}$/.test(entry.name)
    )
    .map((entry) => path.join(artifactsDir, entry.name))
    .sort((left, right) => right.localeCompare(left));

  for (const bundleDir of bundleDirs) {
    const fileEntries = await fs.readdir(bundleDir, 'utf8').catch((): string[] => []);
    const repoReadyName = fileEntries.includes(REPO_READY_VALIDATION_FILE_NAME)
      ? REPO_READY_VALIDATION_FILE_NAME
      : null;
    const gateSummaryName = fileEntries.find((name) => name.endsWith('gate_summary.json')) ?? null;

    if (scope === 'repo' && repoReadyName) {
      const repoBundle = await parseLaunchBundleFromDir(
        artifactRoot,
        bundleDir,
        repoReadyName,
        'repo_ready'
      );
      if (repoBundle) {
        return repoBundle;
      }
    }

    if (!gateSummaryName) {
      continue;
    }

    const fullBundle = await parseLaunchBundleFromDir(
      artifactRoot,
      bundleDir,
      gateSummaryName,
      'full_launch'
    );
    if (fullBundle) {
      return fullBundle;
    }
  }

  return null;
}

function extractRetiredStaleClaims(markdown: string | null) {
  if (!markdown) return [];

  const collected: string[] = [];
  const lines = markdown.split(/\r?\n/);
  let inExplicitSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+Stale Claims To Retire Now/.test(trimmed)) {
      inExplicitSection = true;
      continue;
    }
    if (inExplicitSection && trimmed.startsWith('## ')) {
      inExplicitSection = false;
    }
    if (inExplicitSection && trimmed.startsWith('- ')) {
      collected.push(trimmed.slice(2).trim());
      continue;
    }
    if (!inExplicitSection && trimmed.startsWith('- ') && /\bstale\b/i.test(trimmed)) {
      collected.push(trimmed.slice(2).trim());
    }
  }

  return [...new Set(collected)];
}

function docObservation(params: {
  status: FinalLaunchChecklistStatus;
  summary: string;
  sourceId: string;
  sourceLabel: string;
  sourcePath: string;
  observedAt: string | null;
  note?: string;
}) {
  return {
    sourceId: params.sourceId,
    sourceLabel: params.sourceLabel,
    status: params.status,
    summary: params.summary,
    evidence: [
      {
        label: params.sourceLabel,
        path: params.sourcePath,
        note: params.note,
      },
    ],
    observedAt: params.observedAt,
    priority: SOURCE_PRIORITY.docs,
  } satisfies FinalLaunchChecklistObservation;
}

function checklistRowObservation(
  row: ParsedChecklistRow | null | undefined,
  sourceId: 'current_state_reality_check' | 'verification_checklist'
) {
  if (!row) return null;

  const sourceLabel =
    sourceId === 'current_state_reality_check'
      ? 'Current-state reality check'
      : 'Verification checklist';
  const detailSummary =
    row.details['Fresh current-block evidence'] ??
    row.details['Latest evidence'] ??
    row.details['Notes'] ??
    row.label;

  return {
    sourceId,
    sourceLabel,
    status: row.status,
    summary: stripBackticks(detailSummary),
    evidence: [
      {
        label: `${sourceLabel}: ${row.label}`,
        path: row.sourcePath,
        note: stripBackticks(detailSummary),
      },
    ],
    observedAt: row.observedAt,
    priority:
      sourceId === 'current_state_reality_check'
        ? SOURCE_PRIORITY.current_state_reality_check
        : SOURCE_PRIORITY.verification_checklist,
  } satisfies FinalLaunchChecklistObservation;
}

function gateObservation(
  bundle: ParsedLaunchValidationBundle | null,
  gateId: string,
  sourceLabel: string,
  note?: string
) {
  const gate = bundle?.gates.get(gateId);
  if (!gate || !bundle) return null;

  const resolveEvidencePath = (relativePath: string) =>
    relativePath.startsWith('.artifacts/') || relativePath.startsWith(bundle.dir)
      ? relativePath.replace(/\\/g, '/')
      : path.posix.join(bundle.dir, relativePath).replace(/\\/g, '/');

  return {
    sourceId: 'latest_launch_bundle',
    sourceLabel,
    status: gate.status,
    summary: note ? `${gate.summary} ${note}` : gate.summary,
    evidence: gate.evidence.map((relativePath) => ({
      label: `${sourceLabel} evidence`,
      path: resolveEvidencePath(relativePath),
    })),
    observedAt: bundle.generatedAt,
    priority: SOURCE_PRIORITY.latest_launch_bundle,
    staleClaim:
      bundle.kind === 'repo_ready'
        ? `${sourceLabel} reflects the freshest repo-ready validation bundle and overrides older launch artifacts for repo scope.`
        : `${sourceLabel} disagrees with an older artifact and is treated as current launch-bundle truth.`,
  } satisfies FinalLaunchChecklistObservation;
}

function blocksVerdictForScope(
  item: Pick<FinalLaunchChecklistItemDefinition, 'blocksVerdictIn'>,
  scope: FinalLaunchChecklistScope
) {
  const blockingScope = item.blocksVerdictIn ?? 'both';
  if (blockingScope === 'never') {
    return false;
  }
  if (blockingScope === 'both') {
    return true;
  }
  return blockingScope === scope;
}

function liveEndpointObservation(
  result: LiveEndpointResult | null,
  sourceLabel: string,
  successSummary: string,
  failureSummary: string
) {
  if (!result) return null;

  return {
    sourceId: 'live_endpoint',
    sourceLabel,
    status: result.ok ? 'PASS' : 'FAIL',
    summary: result.ok
      ? successSummary
      : `${failureSummary}${result.error ? ` ${result.error}` : result.status ? ` HTTP ${result.status}.` : ''}`,
    evidence: [
      {
        label: sourceLabel,
        url: result.url,
        path: result.evidencePath ?? undefined,
      },
    ],
    observedAt: result.observedAt,
    priority: SOURCE_PRIORITY.live_endpoint,
  } satisfies FinalLaunchChecklistObservation;
}

function statefulObservation(
  result: StatefulCheckResult | undefined,
  sourceLabel: string,
  passSummary: string,
  failSummary: string
) {
  if (!result) return null;

  return {
    sourceId: 'stateful',
    sourceLabel,
    status: result.status,
    summary: result.status === 'PASS' ? passSummary : failSummary,
    evidence: [
      {
        label: sourceLabel,
        path: result.logPath,
        command: result.command,
      },
    ],
    observedAt: result.observedAt,
    priority: SOURCE_PRIORITY.stateful,
  } satisfies FinalLaunchChecklistObservation;
}

async function fetchJsonWithTimeout(fetchImpl: typeof fetch, url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: 'application/json',
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: Record<string, unknown> | null = null;
    try {
      payload = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      payload = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      payload,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      payload: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function commandBinary(name: string) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function runCapturedCommand(command: string[], env: Record<string, string>, cwd: string) {
  const [bin, ...args] = command;
  const result = spawnSync(commandBinary(bin), args, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });

  return {
    exitCode: result.status ?? 1,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
  };
}

function markdownList(items: string[], emptyFallback: string) {
  if (items.length === 0) {
    return `- ${emptyFallback}`;
  }

  return items.map((item) => `- ${item}`).join('\n');
}

async function upsertMarkedSection(filePath: string, content: string) {
  const existing = await readOptionalFile(filePath);
  if (!existing?.content) {
    return;
  }

  const managedSection = `${INDEX_SECTION_START}\n${content.trim()}\n${INDEX_SECTION_END}`;
  let nextContent = existing.content;

  if (nextContent.includes(INDEX_SECTION_START) && nextContent.includes(INDEX_SECTION_END)) {
    nextContent = nextContent.replace(
      new RegExp(`${INDEX_SECTION_START}[\\s\\S]*?${INDEX_SECTION_END}`, 'm'),
      managedSection
    );
  } else {
    nextContent = `${nextContent.trimEnd()}\n\n${managedSection}\n`;
  }

  await fs.writeFile(filePath, nextContent, 'utf8');
}

function buildSectionItems(
  items: FinalLaunchChecklistItemResult[],
  section: FinalLaunchChecklistSection
) {
  return items.filter((item) => item.section === section);
}

function buildEvidenceText(evidence: FinalLaunchChecklistEvidence[]) {
  if (evidence.length === 0) {
    return 'No evidence linked.';
  }

  return evidence
    .map((entry) => {
      if (entry.path) {
        return `${entry.label}: \`${entry.path}\`${entry.note ? ` (${entry.note})` : ''}`;
      }
      if (entry.url) {
        return `${entry.label}: \`${entry.url}\`${entry.note ? ` (${entry.note})` : ''}`;
      }
      if (entry.command) {
        return `${entry.label}: \`${entry.command}\`${entry.note ? ` (${entry.note})` : ''}`;
      }
      return entry.label;
    })
    .join('; ');
}

function buildMarkdownReport(report: FinalLaunchChecklistReport) {
  const summaryLines = [
    `# Proofound Final Launch Checklist Status`,
    '',
    `Generated: ${report.generatedAt}`,
    `Scope: \`${report.scope}\``,
    `Workspace: \`${report.workspaceRoot}\``,
    `Git: \`${report.gitBranch}\` @ \`${report.gitHead}\``,
    `Verdict: \`${report.verdict}\``,
    report.liveBaseUrl
      ? `Live base URL: \`${report.liveBaseUrl}\``
      : 'Live base URL: not configured',
    report.latestLaunchBundleDir
      ? `Latest launch-validation bundle: \`${report.latestLaunchBundleDir}\``
      : 'Latest launch-validation bundle: none found',
    '',
    `## Summary`,
    '',
    ...FINAL_LAUNCH_CHECKLIST_STATUS_VALUES.map(
      (status) => `- ${status}: ${report.statusCounts[status]}`
    ),
    '',
    `## True Blockers`,
    '',
    markdownList(
      report.trueBlockers.map((item) => `${item.section} — ${item.label}: ${item.summary}`),
      'No true blockers are currently recorded.'
    ),
    '',
    `## External Prerequisites`,
    '',
    markdownList(
      report.externalPrerequisites.map(
        (item) => `${item.section} — ${item.label}: ${item.summary}`
      ),
      'No external prerequisites are currently outstanding.'
    ),
    '',
    `## Missing Evidence`,
    '',
    markdownList(
      report.missingEvidence.map((item) => `${item.section} — ${item.label}`),
      'No checklist lines are currently missing evidence.'
    ),
    '',
  ];

  const sectionBlocks = FINAL_LAUNCH_CHECKLIST_SECTIONS.flatMap((section) => {
    const sectionItems = buildSectionItems(report.items, section);
    return [
      `## ${section}`,
      '',
      ...sectionItems.flatMap((item) =>
        [
          `- [${item.status}] ${item.label}`,
          `  - Summary: ${item.summary}`,
          `  - Evidence: ${buildEvidenceText(item.evidence)}`,
          item.blockerIds.length > 0 ? `  - Blocked by: ${item.blockerIds.join(', ')}` : '',
          item.retiredStaleClaims.length > 0
            ? `  - Retired stale claims: ${item.retiredStaleClaims.join(' | ')}`
            : '',
        ].filter(Boolean)
      ),
      '',
    ];
  });

  const staleClaimsBlock = [
    `## Retired Stale Claims`,
    '',
    markdownList(report.retiredStaleClaims, 'No explicit stale claims were retired in this run.'),
    '',
  ];

  return [...summaryLines, ...sectionBlocks, ...staleClaimsBlock].join('\n').trimEnd() + '\n';
}

function buildJsonReport(report: FinalLaunchChecklistReport) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function getCurrentDate(now: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: process.env.TZ || 'UTC',
  }).format(now);
}

async function resolveGitValue(args: string[], workspaceRoot: string) {
  const result = runCapturedCommand(['git', ...args], {}, workspaceRoot);
  if (result.exitCode !== 0) {
    return 'unknown';
  }
  return result.output.split(/\r?\n/)[0]?.trim() || 'unknown';
}

async function buildContext(
  options: GenerateFinalLaunchChecklistOptions
): Promise<FinalLaunchChecklistContext> {
  const workspaceRoot = options.workspaceRoot ?? process.cwd();
  const now = options.now ?? new Date();
  const scope = options.scope ?? 'repo';
  const generatedAt = now.toISOString();
  const currentDate = getCurrentDate(now);
  const outputDir = path.join(
    workspaceRoot,
    options.artifactRoot ?? '.artifacts',
    `launch-validation-${currentDate}`
  );

  const [
    gitHead,
    gitBranch,
    currentStateRealityFile,
    verificationChecklistFile,
    routeInventoryFile,
    implementationSnapshotFile,
    launchReadinessSummaryFile,
    priorityFileMapFile,
    launchRunbookFile,
    lockedMvpFile,
    proofFirstPrdFile,
    projectSpecificationFile,
    readmeFile,
    launchOperationsMvpFile,
    monitoringAlertingFile,
    launchRestoreDrillFile,
    internalOpsIndexFile,
    verificationReviewSopFile,
    riskyUploadSopFile,
    revealPrivacyDisputeSopFile,
    engagementChecklistFile,
    assignmentQualityChecklistFile,
    assignmentPublishRouteTestFile,
    reviewRouteTestFile,
    uploadsPrivacyTestFile,
    uploadsLifecycleQueueTestFile,
    latestRepoReadyBundle,
    latestFullLaunchBundle,
  ] = await Promise.all([
    resolveGitValue(['rev-parse', 'HEAD'], workspaceRoot),
    resolveGitValue(['rev-parse', '--abbrev-ref', 'HEAD'], workspaceRoot),
    readOptionalFile(
      path.join(workspaceRoot, '.artifacts/proofound-current-state-reality-check.md')
    ),
    readOptionalFile(path.join(workspaceRoot, 'docs/verification-checklist.md')),
    readOptionalFile(path.join(workspaceRoot, '.artifacts/proofound-route-inventory.md')),
    readOptionalFile(
      path.join(workspaceRoot, '.artifacts/proofound-implementation-status-snapshot.md')
    ),
    readOptionalFile(path.join(workspaceRoot, '.artifacts/launch-readiness-summary.md')),
    readOptionalFile(path.join(workspaceRoot, '.artifacts/proofound-priority-file-map.md')),
    readOptionalFile(path.join(workspaceRoot, 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md')),
    readOptionalFile(
      path.join(workspaceRoot, 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md')
    ),
    readOptionalFile(
      path.join(workspaceRoot, 'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md')
    ),
    readOptionalFile(path.join(workspaceRoot, 'Proofound_Project_Specification_2026-03-11.md')),
    readOptionalFile(path.join(workspaceRoot, 'README.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/launch-operations-mvp.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/monitoring-alerting.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/launch-restore-drill.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/index.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/verification-review-sop.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/redaction-risky-upload-sop.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/reveal-privacy-dispute-sop.md')),
    readOptionalFile(
      path.join(workspaceRoot, 'docs/internal-ops/engagement-verification-evidence-checklist.md')
    ),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/assignment-quality-checklist.md')),
    readOptionalFile(path.join(workspaceRoot, 'tests/api/assignments-publish-route.test.ts')),
    readOptionalFile(path.join(workspaceRoot, 'tests/api/org-match-review-route.test.ts')),
    readOptionalFile(path.join(workspaceRoot, 'tests/lib/uploads-privacy.test.ts')),
    readOptionalFile(path.join(workspaceRoot, 'tests/lib/uploads-lifecycle-queue.test.ts')),
    findLatestLaunchValidationBundle(workspaceRoot, 'repo'),
    findLatestLaunchValidationBundle(workspaceRoot, 'full'),
  ]);

  const latestLaunchBundle =
    scope === 'repo' ? (latestRepoReadyBundle ?? latestFullLaunchBundle) : latestFullLaunchBundle;

  const liveBaseUrl =
    scope === 'full' && options.liveBaseUrl != null
      ? normalizeLaunchBaseUrl(options.liveBaseUrl)
      : scope === 'full'
        ? (latestFullLaunchBundle?.authoritativeBaseUrl ?? null)
        : null;

  await fs.mkdir(outputDir, { recursive: true });

  let liveApiHealth: LiveEndpointResult | null = null;
  let liveLaunchStatus: LiveEndpointResult | null = null;
  if (scope === 'full' && liveBaseUrl && options.fetchImpl) {
    const [healthResult, launchStatusResult] = await Promise.all([
      fetchJsonWithTimeout(options.fetchImpl, `${liveBaseUrl}/api/health`, 10_000),
      fetchJsonWithTimeout(
        options.fetchImpl,
        `${liveBaseUrl}/api/monitoring/launch-status`,
        12_000
      ),
    ]);

    if (healthResult.payload || healthResult.error || healthResult.status != null) {
      const healthPath = path.join(outputDir, 'final-launch-checklist-live-health.json');
      await fs.writeFile(
        healthPath,
        `${JSON.stringify(
          {
            url: `${liveBaseUrl}/api/health`,
            ...healthResult,
            observedAt: generatedAt,
          },
          null,
          2
        )}\n`,
        'utf8'
      );
      liveApiHealth = {
        url: `${liveBaseUrl}/api/health`,
        ok: healthResult.ok,
        status: healthResult.status,
        payload: healthResult.payload,
        error: healthResult.error,
        observedAt: generatedAt,
        evidencePath: path.relative(workspaceRoot, healthPath),
      };
    }

    if (
      launchStatusResult.payload ||
      launchStatusResult.error ||
      launchStatusResult.status != null
    ) {
      const launchStatusPath = path.join(
        outputDir,
        'final-launch-checklist-live-launch-status.json'
      );
      await fs.writeFile(
        launchStatusPath,
        `${JSON.stringify(
          {
            url: `${liveBaseUrl}/api/monitoring/launch-status`,
            ...launchStatusResult,
            observedAt: generatedAt,
          },
          null,
          2
        )}\n`,
        'utf8'
      );
      liveLaunchStatus = {
        url: `${liveBaseUrl}/api/monitoring/launch-status`,
        ok: launchStatusResult.ok,
        status: launchStatusResult.status,
        payload: launchStatusResult.payload,
        error: launchStatusResult.error,
        observedAt: generatedAt,
        evidencePath: path.relative(workspaceRoot, launchStatusPath),
      };
    }
  }

  const statefulChecks = new Map<string, StatefulCheckResult>();
  if (options.includeStateful) {
    const statefulRuns: Array<{
      id: StatefulCheckResult['id'];
      command: string[];
      env: Record<string, string>;
      logFileName: string;
    }> = [
      {
        id: 'public_org_trust_smoke',
        command: ['npm', 'run', 'test:e2e:org-trust:smoke'],
        env: liveBaseUrl ? { BASE_URL: liveBaseUrl } : {},
        logFileName: 'final-launch-checklist-public-org-trust-smoke.log',
      },
      {
        id: 'strict_org_corridor',
        command: ['npm', 'run', 'test:e2e:org:strict'],
        env: {
          NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
          ...(liveBaseUrl ? { BASE_URL: liveBaseUrl } : {}),
        },
        logFileName: 'final-launch-checklist-strict-org-corridor.log',
      },
    ];

    for (const run of statefulRuns) {
      const result = runCapturedCommand(run.command, run.env, workspaceRoot);
      const logPath = path.join(outputDir, run.logFileName);
      await fs.writeFile(logPath, `${result.output}\n`, 'utf8');
      statefulChecks.set(run.id, {
        id: run.id,
        status: result.exitCode === 0 ? 'PASS' : 'FAIL',
        command: run.command.join(' '),
        logPath: path.relative(workspaceRoot, logPath),
        observedAt: generatedAt,
      });
    }
  }

  const retiredStaleClaims = [
    ...extractRetiredStaleClaims(currentStateRealityFile?.content ?? null),
    ...extractRetiredStaleClaims(launchReadinessSummaryFile?.content ?? null),
  ];

  return {
    scope,
    workspaceRoot,
    generatedAt,
    currentDate,
    gitHead,
    gitBranch,
    includeStateful: options.includeStateful ?? false,
    artifactRoot: options.artifactRoot ?? '.artifacts',
    outputDir,
    latestLaunchBundle,
    latestRepoReadyBundle,
    latestFullLaunchBundle,
    currentStateRealityCheck: parseChecklistRowsFromMarkdown(
      currentStateRealityFile?.content ?? '',
      '.artifacts/proofound-current-state-reality-check.md',
      currentStateRealityFile?.observedAt ?? null
    ),
    verificationChecklist: parseChecklistRowsFromMarkdown(
      verificationChecklistFile?.content ?? '',
      'docs/verification-checklist.md',
      verificationChecklistFile?.observedAt ?? null
    ),
    routeInventory: routeInventoryFile?.content ?? null,
    implementationStatusSnapshot: implementationSnapshotFile?.content ?? null,
    launchReadinessSummary: launchReadinessSummaryFile?.content ?? null,
    priorityFileMap: priorityFileMapFile?.content ?? null,
    launchRunbook: launchRunbookFile?.content ?? null,
    lockedMvp: lockedMvpFile?.content ?? null,
    proofFirstPrd: proofFirstPrdFile?.content ?? null,
    projectSpecification: projectSpecificationFile?.content ?? null,
    readme: readmeFile?.content ?? null,
    launchOperationsMvp: launchOperationsMvpFile?.content ?? null,
    monitoringAlerting: monitoringAlertingFile?.content ?? null,
    launchRestoreDrill: launchRestoreDrillFile?.content ?? null,
    internalOpsIndex: internalOpsIndexFile?.content ?? null,
    verificationReviewSop: verificationReviewSopFile?.content ?? null,
    riskyUploadSop: riskyUploadSopFile?.content ?? null,
    revealPrivacyDisputeSop: revealPrivacyDisputeSopFile?.content ?? null,
    engagementVerificationChecklist: engagementChecklistFile?.content ?? null,
    assignmentQualityChecklist: assignmentQualityChecklistFile?.content ?? null,
    assignmentPublishRouteTest: assignmentPublishRouteTestFile?.content ?? null,
    reviewRouteTest: reviewRouteTestFile?.content ?? null,
    uploadsPrivacyTest: uploadsPrivacyTestFile?.content ?? null,
    uploadsLifecycleQueueTest: uploadsLifecycleQueueTestFile?.content ?? null,
    liveApiHealth,
    liveLaunchStatus,
    statefulChecks,
    retiredStaleClaims: [...new Set(retiredStaleClaims)],
  };
}

function realityRow(context: FinalLaunchChecklistContext, label: string) {
  return context.currentStateRealityCheck.get(normalizeChecklistLabel(label)) ?? null;
}

function verificationRow(context: FinalLaunchChecklistContext, label: string) {
  return context.verificationChecklist.get(normalizeChecklistLabel(label)) ?? null;
}

function summaryObservation(
  markdown: string | null,
  pattern: RegExp,
  sourcePath: string,
  sourceLabel: string,
  observedAt: string,
  priority: number,
  staleClaim?: string
) {
  const inline = findMarkdownInlineStatus(markdown, pattern);
  if (!inline) {
    return null;
  }

  return {
    sourceId: sourceLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    sourceLabel,
    status: inline.status,
    summary: inline.line,
    evidence: [
      {
        label: sourceLabel,
        path: sourcePath,
        note: inline.line,
      },
    ],
    observedAt,
    priority,
    staleClaim,
  } satisfies FinalLaunchChecklistObservation;
}

function passIfDocs(
  context: FinalLaunchChecklistContext,
  options: {
    markdown: string | null;
    observedAt: string | null;
    sourcePath: string;
    sourceLabel: string;
    summary: string;
    patterns: Array<string | RegExp>;
  }
) {
  if (!textContainsAll(options.markdown, options.patterns)) {
    return [];
  }

  return [
    docObservation({
      status: 'PASS',
      summary: options.summary,
      sourceId: 'docs',
      sourceLabel: options.sourceLabel,
      sourcePath: options.sourcePath,
      observedAt: options.observedAt,
    }),
  ];
}

export const FINAL_LAUNCH_CHECKLIST_DEFINITIONS: FinalLaunchChecklistItemDefinition[] =
  buildFinalLaunchChecklistDefinitions({
    SOURCE_PRIORITY,
    compactObservations,
    checklistRowObservation,
    gateObservation,
    realityRow,
    verificationRow,
    passIfDocs,
    lineMatch,
    textContainsAll,
    docObservation,
    liveEndpointObservation,
    statefulObservation,
    summaryObservation,
  });

function evaluateItemDirect(
  definition: FinalLaunchChecklistItemDefinition,
  context: FinalLaunchChecklistContext
) {
  const observations = definition.evaluateDirect(context);
  const { selected, retiredStaleClaims } = choosePreferredObservation(observations);

  if (selected) {
    return {
      id: definition.id,
      section: definition.section,
      label: definition.label,
      authorityRefs: definition.authorityRefs,
      evidenceSources: definition.evidenceSources,
      status: selected.status,
      summary: selected.summary,
      evidence: selected.evidence,
      blockerIds: [],
      retiredStaleClaims,
      sourceLabel: selected.sourceLabel,
      blocksVerdict: blocksVerdictForScope(definition, context.scope),
      blockingScope: definition.blocksVerdictIn ?? 'both',
    } satisfies FinalLaunchChecklistItemResult;
  }

  return {
    id: definition.id,
    section: definition.section,
    label: definition.label,
    authorityRefs: definition.authorityRefs,
    evidenceSources: definition.evidenceSources,
    status: 'UNVERIFIED',
    summary: 'No current evidence source resolved this checklist line.',
    evidence: definition.evidenceSources.map((sourcePath) => ({
      label: 'Configured evidence source',
      path: sourcePath,
    })),
    blockerIds: [],
    retiredStaleClaims: [],
    sourceLabel: 'No evidence selected',
    blocksVerdict: blocksVerdictForScope(definition, context.scope),
    blockingScope: definition.blocksVerdictIn ?? 'both',
  } satisfies FinalLaunchChecklistItemResult;
}

function applyDependencyBlocking(
  definition: FinalLaunchChecklistItemDefinition,
  directResults: Map<string, FinalLaunchChecklistItemResult>
) {
  const direct = directResults.get(definition.id);
  if (!direct) {
    throw new Error(`Missing direct result for ${definition.id}`);
  }

  const dependencyIds = definition.upstreamBlockers ?? [];
  const failedDependencies = dependencyIds.filter((dependencyId) => {
    const dependency = directResults.get(dependencyId);
    return dependency != null && dependency.status !== 'PASS';
  });

  if (failedDependencies.length === 0 || direct.status === 'FAIL') {
    return direct;
  }

  return {
    ...direct,
    status: 'BLOCKED' as const,
    summary: `Blocked by upstream checklist items: ${failedDependencies.join(', ')}. ${direct.summary}`,
    blockerIds: failedDependencies,
  } satisfies FinalLaunchChecklistItemResult;
}

async function writeIndexSurfaces(report: FinalLaunchChecklistReport) {
  const latestReportPath = report.outputs.markdownPath;
  const latestJsonPath = report.outputs.jsonPath;

  await upsertMarkedSection(
    path.join(report.workspaceRoot, '.artifacts/launch-readiness-summary.md'),
    [
      '## Final Launch Checklist Artifact',
      '',
      `- Latest operational checklist: \`${latestReportPath}\``,
      `- Latest machine-readable bundle: \`${latestJsonPath}\``,
      `- Generated at: \`${report.generatedAt}\``,
    ].join('\n')
  );

  await upsertMarkedSection(
    path.join(report.workspaceRoot, '.artifacts/proofound-priority-file-map.md'),
    [
      '- `.artifacts/launch-validation-YYYY-MM-DD/final-launch-checklist-status.md`',
      '  - Operational Section 12 checklist with evidence-backed PASS / FAIL / BLOCKED / UNVERIFIED rows.',
      '- `.artifacts/launch-validation-YYYY-MM-DD/final-launch-checklist-status.json`',
      '  - Machine-readable bundle for the same checklist run.',
      '',
      `Current generated paths: \`${latestReportPath}\`, \`${latestJsonPath}\``,
    ].join('\n')
  );
}

export async function generateFinalLaunchChecklistReport(
  options: GenerateFinalLaunchChecklistOptions = {}
) {
  const context = await buildContext({
    ...options,
    fetchImpl: options.fetchImpl ?? globalThis.fetch,
  });

  const directResults = new Map<string, FinalLaunchChecklistItemResult>();
  for (const definition of FINAL_LAUNCH_CHECKLIST_DEFINITIONS) {
    directResults.set(definition.id, evaluateItemDirect(definition, context));
  }

  const items = FINAL_LAUNCH_CHECKLIST_DEFINITIONS.map((definition) =>
    applyDependencyBlocking(definition, directResults)
  );

  const statusCounts = FINAL_LAUNCH_CHECKLIST_STATUS_VALUES.reduce<
    Record<FinalLaunchChecklistStatus, number>
  >(
    (accumulator, status) => {
      accumulator[status] = items.filter((item) => item.status === status).length;
      return accumulator;
    },
    {
      PASS: 0,
      FAIL: 0,
      BLOCKED: 0,
      UNVERIFIED: 0,
    }
  );

  const trueBlockers = items.filter((item) => item.blocksVerdict && item.status !== 'PASS');
  const externalPrerequisites = items.filter(
    (item) => !item.blocksVerdict && item.status !== 'PASS'
  );
  const missingEvidence = items.filter((item) => item.status === 'UNVERIFIED');
  const retiredStaleClaims = [
    ...new Set([
      ...context.retiredStaleClaims,
      ...items.flatMap((item) => item.retiredStaleClaims),
    ]),
  ];

  const markdownPath = path.relative(
    context.workspaceRoot,
    path.join(context.outputDir, 'final-launch-checklist-status.md')
  );
  const jsonPath = path.relative(
    context.workspaceRoot,
    path.join(context.outputDir, 'final-launch-checklist-status.json')
  );

  const report: FinalLaunchChecklistReport = {
    scope: context.scope,
    generatedAt: context.generatedAt,
    currentDate: context.currentDate,
    workspaceRoot: context.workspaceRoot,
    gitHead: context.gitHead,
    gitBranch: context.gitBranch,
    verdict: trueBlockers.length === 0 ? 'READY' : 'NOT_READY',
    includeStateful: context.includeStateful,
    liveBaseUrl:
      options.liveBaseUrl != null
        ? normalizeLaunchBaseUrl(options.liveBaseUrl)
        : (context.latestLaunchBundle?.authoritativeBaseUrl ?? null),
    latestLaunchBundleDir: context.latestLaunchBundle?.dir ?? null,
    statusCounts,
    items,
    trueBlockers,
    externalPrerequisites,
    missingEvidence,
    retiredStaleClaims,
    outputs: {
      markdownPath,
      jsonPath,
    },
  };

  const markdownReport = buildMarkdownReport(report);
  const jsonReport = buildJsonReport(report);

  await fs.mkdir(context.outputDir, { recursive: true });
  await fs.writeFile(
    path.join(context.outputDir, 'final-launch-checklist-status.md'),
    markdownReport,
    'utf8'
  );
  await fs.writeFile(
    path.join(context.outputDir, 'final-launch-checklist-status.json'),
    jsonReport,
    'utf8'
  );
  await writeIndexSurfaces(report);

  return report;
}
