import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { Dirent } from 'node:fs';

import { normalizeLaunchBaseUrl } from '@/lib/launch/contracts';

export const FINAL_LAUNCH_CHECKLIST_STATUS_VALUES = [
  'PASS',
  'FAIL',
  'BLOCKED',
  'UNVERIFIED',
] as const;

export type FinalLaunchChecklistStatus = (typeof FINAL_LAUNCH_CHECKLIST_STATUS_VALUES)[number];

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

type FinalLaunchChecklistObservation = {
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
  upstreamBlockers?: string[];
  evaluateDirect: (
    context: FinalLaunchChecklistContext
  ) => FinalLaunchChecklistObservation[];
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
};

type ParsedChecklistRow = {
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

type StatefulCheckResult = {
  id: 'public_org_trust_smoke' | 'strict_org_corridor';
  status: FinalLaunchChecklistStatus;
  command: string;
  logPath: string;
  observedAt: string;
};

export type FinalLaunchChecklistContext = {
  workspaceRoot: string;
  generatedAt: string;
  currentDate: string;
  gitHead: string;
  gitBranch: string;
  includeStateful: boolean;
  artifactRoot: string;
  outputDir: string;
  latestLaunchBundle: ParsedLaunchValidationBundle | null;
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
  if (
    FINAL_LAUNCH_CHECKLIST_STATUS_VALUES.includes(
      normalized as FinalLaunchChecklistStatus
    )
  ) {
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

function parseChecklistRowsFromMarkdown(markdown: string, sourcePath: string, observedAt: string | null) {
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

async function findLatestLaunchValidationBundle(artifactRoot: string) {
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
    const gateSummaryName = fileEntries.find((name) => name.endsWith('gate_summary.json'));
    if (!gateSummaryName) {
      continue;
    }

    const gateSummaryResult = await readOptionalJson(path.join(bundleDir, gateSummaryName));
    if (!gateSummaryResult?.payload) {
      continue;
    }

    const liveLaunchStatusName =
      fileEntries.find((name) => name.endsWith('live_launch_status_extract.json')) ??
      fileEntries.find((name) => name.endsWith('live_launch_status.json')) ??
      null;
    const liveLaunchStatusResult =
      liveLaunchStatusName == null
        ? null
        : await readOptionalJson(path.join(bundleDir, liveLaunchStatusName));

    const gates = new Map<string, ParsedGateSummaryGate>();
    const rawGates = Array.isArray(gateSummaryResult.payload.gates)
      ? (gateSummaryResult.payload.gates as Array<Record<string, unknown>>)
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

    return {
      dir: path.relative(artifactRoot, bundleDir),
      generatedAt:
        typeof gateSummaryResult.payload.generatedAt === 'string'
          ? gateSummaryResult.payload.generatedAt
          : gateSummaryResult.observedAt,
      authoritativeBaseUrl:
        typeof gateSummaryResult.payload.authoritativeBaseUrl === 'string'
          ? normalizeLaunchBaseUrl(gateSummaryResult.payload.authoritativeBaseUrl)
          : null,
      verdict:
        typeof gateSummaryResult.payload.verdict === 'string'
          ? gateSummaryResult.payload.verdict
          : null,
      recommendation:
        typeof gateSummaryResult.payload.recommendation === 'string'
          ? gateSummaryResult.payload.recommendation
          : null,
      gates,
      liveLaunchStatusExtractPath:
        liveLaunchStatusName == null
          ? null
          : path.relative(artifactRoot, path.join(bundleDir, liveLaunchStatusName)),
      liveLaunchStatusExtract: liveLaunchStatusResult?.payload ?? null,
    } satisfies ParsedLaunchValidationBundle;
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

  return {
    sourceId: 'latest_launch_bundle',
    sourceLabel,
    status: gate.status,
    summary: note ? `${gate.summary} ${note}` : gate.summary,
    evidence: gate.evidence.map((relativePath) => ({
      label: `${sourceLabel} evidence`,
      path: path.posix.join(bundle.dir, relativePath).replace(/\\/g, '/'),
    })),
    observedAt: bundle.generatedAt,
    priority: SOURCE_PRIORITY.latest_launch_bundle,
    staleClaim: `${sourceLabel} disagrees with an older artifact and is treated as current launch-bundle truth.`,
  } satisfies FinalLaunchChecklistObservation;
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

async function fetchJsonWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number
) {
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

function runCapturedCommand(
  command: string[],
  env: Record<string, string>,
  cwd: string
) {
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
      new RegExp(
        `${INDEX_SECTION_START}[\\s\\S]*?${INDEX_SECTION_END}`,
        'm'
      ),
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
    `Workspace: \`${report.workspaceRoot}\``,
    `Git: \`${report.gitBranch}\` @ \`${report.gitHead}\``,
    `Verdict: \`${report.verdict}\``,
    report.liveBaseUrl ? `Live base URL: \`${report.liveBaseUrl}\`` : 'Live base URL: not configured',
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
      ...sectionItems.flatMap((item) => [
        `- [${item.status}] ${item.label}`,
        `  - Summary: ${item.summary}`,
        `  - Evidence: ${buildEvidenceText(item.evidence)}`,
        item.blockerIds.length > 0 ? `  - Blocked by: ${item.blockerIds.join(', ')}` : '',
        item.retiredStaleClaims.length > 0
          ? `  - Retired stale claims: ${item.retiredStaleClaims.join(' | ')}`
          : '',
      ].filter(Boolean)),
      '',
    ];
  });

  const staleClaimsBlock = [
    `## Retired Stale Claims`,
    '',
    markdownList(
      report.retiredStaleClaims,
      'No explicit stale claims were retired in this run.'
    ),
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

async function buildContext(options: GenerateFinalLaunchChecklistOptions): Promise<FinalLaunchChecklistContext> {
  const workspaceRoot = options.workspaceRoot ?? process.cwd();
  const now = options.now ?? new Date();
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
    latestLaunchBundle,
  ] = await Promise.all([
    resolveGitValue(['rev-parse', 'HEAD'], workspaceRoot),
    resolveGitValue(['rev-parse', '--abbrev-ref', 'HEAD'], workspaceRoot),
    readOptionalFile(path.join(workspaceRoot, '.artifacts/proofound-current-state-reality-check.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/verification-checklist.md')),
    readOptionalFile(path.join(workspaceRoot, '.artifacts/proofound-route-inventory.md')),
    readOptionalFile(path.join(workspaceRoot, '.artifacts/proofound-implementation-status-snapshot.md')),
    readOptionalFile(path.join(workspaceRoot, '.artifacts/launch-readiness-summary.md')),
    readOptionalFile(path.join(workspaceRoot, '.artifacts/proofound-priority-file-map.md')),
    readOptionalFile(path.join(workspaceRoot, 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md')),
    readOptionalFile(path.join(workspaceRoot, 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md')),
    readOptionalFile(path.join(workspaceRoot, 'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md')),
    readOptionalFile(path.join(workspaceRoot, 'Proofound_Project_Specification_2026-03-11.md')),
    readOptionalFile(path.join(workspaceRoot, 'README.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/launch-operations-mvp.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/monitoring-alerting.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/launch-restore-drill.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/index.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/verification-review-sop.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/redaction-risky-upload-sop.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/reveal-privacy-dispute-sop.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/engagement-verification-evidence-checklist.md')),
    readOptionalFile(path.join(workspaceRoot, 'docs/internal-ops/assignment-quality-checklist.md')),
    readOptionalFile(path.join(workspaceRoot, 'tests/api/assignments-publish-route.test.ts')),
    readOptionalFile(path.join(workspaceRoot, 'tests/api/org-match-review-route.test.ts')),
    readOptionalFile(path.join(workspaceRoot, 'tests/lib/uploads-privacy.test.ts')),
    readOptionalFile(path.join(workspaceRoot, 'tests/lib/uploads-lifecycle-queue.test.ts')),
    findLatestLaunchValidationBundle(workspaceRoot),
  ]);

  const liveBaseUrl =
    options.liveBaseUrl != null
      ? normalizeLaunchBaseUrl(options.liveBaseUrl)
      : latestLaunchBundle?.authoritativeBaseUrl ?? null;

  await fs.mkdir(outputDir, { recursive: true });

  let liveApiHealth: LiveEndpointResult | null = null;
  let liveLaunchStatus: LiveEndpointResult | null = null;
  if (liveBaseUrl && options.fetchImpl) {
    const [healthResult, launchStatusResult] = await Promise.all([
      fetchJsonWithTimeout(options.fetchImpl, `${liveBaseUrl}/api/health`, 10_000),
      fetchJsonWithTimeout(options.fetchImpl, `${liveBaseUrl}/api/monitoring/launch-status`, 12_000),
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

    if (launchStatusResult.payload || launchStatusResult.error || launchStatusResult.status != null) {
      const launchStatusPath = path.join(outputDir, 'final-launch-checklist-live-launch-status.json');
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
    workspaceRoot,
    generatedAt,
    currentDate,
    gitHead,
    gitBranch,
    includeStateful: options.includeStateful ?? false,
    artifactRoot: options.artifactRoot ?? '.artifacts',
    outputDir,
    latestLaunchBundle,
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

function realityRow(
  context: FinalLaunchChecklistContext,
  label: string
) {
  return context.currentStateRealityCheck.get(normalizeChecklistLabel(label)) ?? null;
}

function verificationRow(
  context: FinalLaunchChecklistContext,
  label: string
) {
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

export const FINAL_LAUNCH_CHECKLIST_DEFINITIONS: FinalLaunchChecklistItemDefinition[] = [
  {
    id: 'product_proof_pack_canonical',
    section: 'Product',
    label: 'Proof Pack is canonical across launch-visible surfaces',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      '.artifacts/proofound-current-state-reality-check.md',
      'docs/verification-checklist.md',
    ],
    evaluateDirect: (context) =>
      compactObservations([
        checklistRowObservation(realityRow(context, 'Proof Pack canonicality'), 'current_state_reality_check'),
        checklistRowObservation(verificationRow(context, 'Proof Pack canonicality'), 'verification_checklist'),
      ]),
  },
  {
    id: 'product_portfolio_vs_intro_distinct',
    section: 'Product',
    label: 'Portfolio-ready and intro-eligible are clearly distinct',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md', 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
      'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md',
      'Proofound_Project_Specification_2026-03-11.md',
      'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
    ],
    evaluateDirect: (context) => [
      ...passIfDocs(context, {
        markdown: context.lockedMvp,
        observedAt: null,
        sourcePath: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
        sourceLabel: 'Locked MVP source of truth',
        summary: 'Locked MVP authority explicitly separates portfolio-ready from intro-eligible.',
        patterns: [/Portfolio-ready/i, /Intro-eligible/i, /Make portfolio-ready easy\. Make intro-eligible hard\./i],
      }),
      ...passIfDocs(context, {
        markdown: context.launchRunbook,
        observedAt: null,
        sourcePath: 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
        sourceLabel: 'Launch runbook',
        summary: 'Launch runbook keeps portfolio-ready easier than intro-eligible.',
        patterns: [/portfolio-ready can be easy, intro-eligible cannot be cheapened/i],
      }),
    ],
  },
  {
    id: 'product_private_context_scaffolding',
    section: 'Product',
    label: 'Private context scaffolding works for work / volunteering / education',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
      'tests/ui/education-form-skill-picker.test.tsx',
      'tests/ui/profile-dialogs-edit-routing.test.tsx',
    ],
    evaluateDirect: (context) => {
      const evidence = lineMatch(context.lockedMvp, /private work \/ volunteering \/ education scaffolding/i);
      if (evidence) {
        return [
          {
            sourceId: 'docs',
            sourceLabel: 'Locked MVP source of truth',
            status: 'UNVERIFIED',
            summary:
              'Authority docs define private work, volunteering, and education scaffolding, but this checklist line has no fresh runtime evidence in the current bundle.',
            evidence: [
              {
                label: 'Locked MVP source of truth',
                path: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
                note: evidence,
              },
            ],
            observedAt: null,
            priority: SOURCE_PRIORITY.docs,
          },
        ];
      }
      return [];
    },
  },
  {
    id: 'product_public_portfolio_safe_and_separate',
    section: 'Product',
    label: 'Public portfolio is calm, safe, and separate from review reveal',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md', 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/24_gate_summary.json',
      '.artifacts/proofound-current-state-reality-check.md',
      'docs/verification-checklist.md',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const smokeGate = context.latestLaunchBundle?.gates.get('live_launch_smoke_artifact_refresh');
      const revealRow = verificationRow(context, 'candidate-consented reveal');
      const blindRow = verificationRow(context, 'blind-by-default review');

      if (
        smokeGate?.status === 'PASS' &&
        revealRow?.status === 'PASS' &&
        blindRow?.status === 'PASS'
      ) {
        observations.push({
          sourceId: 'latest_launch_bundle',
          sourceLabel: 'Launch bundle plus verification evidence',
          status: 'PASS',
          summary:
            'Fresh smoke, blind-review coverage, and consented reveal evidence all point to a privacy-safe public portfolio that stays separate from reveal.',
          evidence: [
            {
              label: 'Launch smoke gate',
              path: path.posix.join(context.latestLaunchBundle!.dir, '24_gate_summary.json'),
            },
            {
              label: 'Verification checklist: blind review',
              path: 'docs/verification-checklist.md',
            },
            {
              label: 'Verification checklist: consented reveal',
              path: 'docs/verification-checklist.md',
            },
          ],
          observedAt: context.latestLaunchBundle?.generatedAt ?? context.generatedAt,
          priority: SOURCE_PRIORITY.latest_launch_bundle,
        });
      }

      return observations;
    },
  },
  {
    id: 'product_org_trust_page_live',
    section: 'Product',
    label: 'Org trust page is minimal and live',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/24_gate_summary.json',
      '.artifacts/proofound-route-inventory.md',
    ],
    evaluateDirect: (context) =>
      compactObservations([
        gateObservation(
          context.latestLaunchBundle,
          'public_org_trust_smoke',
          'Latest launch bundle org trust smoke'
        ),
      ]),
  },
  {
    id: 'product_assignment_builder_enforces_core_fields',
    section: 'Product',
    label: 'Assignment builder enforces why / work / proof / constraints',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'docs/internal-ops/assignment-quality-checklist.md',
      'tests/api/assignments-publish-route.test.ts',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = passIfDocs(context, {
        markdown: context.assignmentQualityChecklist,
        observedAt: null,
        sourcePath: 'docs/internal-ops/assignment-quality-checklist.md',
        sourceLabel: 'Assignment quality checklist',
        summary:
          'Assignment-quality SOP explicitly checks business value, real work, proof expectation, and practical constraints before publish.',
        patterns: [/business value/i, /real outcomes/i, /proof expectation/i, /practical constraints/i],
      }).map((observation) => ({
        ...observation,
        status: 'UNVERIFIED' as const,
        summary:
          'The operator checklist names the required fields, but docs alone do not prove the builder enforces them.',
      }));

      if (
        textContainsAll(context.assignmentPublishRouteTest, [
          /businessValue/i,
          /work_summary_required/i,
          /proof_expectations_required/i,
          /constraints_required/i,
        ])
      ) {
        observations.push({
          sourceId: 'tests',
          sourceLabel: 'Assignment publish route test',
          status: 'PASS',
          summary:
            'Assignment publish tests assert hard publish blocks for missing work summary, proof expectations, and constraints, with business-value coverage in the route fixture.',
          evidence: [
            {
              label: 'Assignment publish route test',
              path: 'tests/api/assignments-publish-route.test.ts',
              note: 'Assertions include work_summary_required, proof_expectations_required, and constraints_required.',
            },
          ],
          observedAt: null,
          priority: SOURCE_PRIORITY.tests,
        });
      }

      return observations;
    },
  },
  {
    id: 'product_review_queue_blind_and_reason_coded',
    section: 'Product',
    label: 'Review queue is blind-by-default and reason-coded',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'docs/verification-checklist.md',
      'tests/api/org-match-review-route.test.ts',
      'src/app/api/org/[id]/matches/[matchId]/review/route.ts',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const blindReview = checklistRowObservation(
        verificationRow(context, 'blind-by-default review'),
        'verification_checklist'
      );
      if (blindReview) {
        observations.push(blindReview);
      }

      const reasonCodeLine = lineMatch(
        context.assignmentQualityChecklist,
        /queue item.*which checklist point failed or passed/i
      );
      if (reasonCodeLine) {
        observations.push({
          sourceId: 'docs',
          sourceLabel: 'Assignment quality checklist',
          status: 'PASS',
          summary: 'Manual review handling stays reason-coded through checklist-point operator notes.',
          evidence: [
            {
              label: 'Assignment quality checklist',
              path: 'docs/internal-ops/assignment-quality-checklist.md',
              note: reasonCodeLine,
            },
            {
              label: 'Review route test',
              path: 'tests/api/org-match-review-route.test.ts',
            },
          ],
          observedAt: null,
          priority: SOURCE_PRIORITY.tests,
        });
      }

      if (
        textContainsAll(context.reviewRouteTest, [
          /candidateLabel/i,
          /reasonCodes/i,
          /getVisibleIdentityFields\.mockReturnValue\(\[\]\)/i,
        ])
      ) {
        observations.push({
          sourceId: 'tests',
          sourceLabel: 'Org match review route test',
          status: 'PASS',
          summary:
            'Review route tests keep the review card identity-masked while carrying reason-coded fit and visibility-safe explanations through the proof-first flow.',
          evidence: [
            {
              label: 'Org match review route test',
              path: 'tests/api/org-match-review-route.test.ts',
              note: 'Mocks identity visibility to [] and asserts reason-coded review card payloads.',
            },
          ],
          observedAt: null,
          priority: SOURCE_PRIORITY.tests,
        });
      }

      return observations;
    },
  },
  {
    id: 'product_hire_and_engagement_distinct',
    section: 'Product',
    label: 'Hire and engagement verification remain distinct',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      '.artifacts/proofound-current-state-reality-check.md',
      'docs/proofound-hard-verification-rerun-final.md',
    ],
    evaluateDirect: (context) => {
      const corridor = checklistRowObservation(
        realityRow(context, 'review -> intro -> reveal -> interview -> decision -> hire -> engagement verification'),
        'current_state_reality_check'
      );
      if (corridor) {
        return [corridor];
      }
      return [];
    },
  },
  {
    id: 'engineering_build_clean',
    section: 'Engineering',
    label: '`npm run build` passes cleanly under launch Node version',
    authorityRefs: ['agent/checklists/verification.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/24_gate_summary.json',
      '.artifacts/proofound-implementation-status-snapshot.md',
      '.artifacts/launch-readiness-summary.md',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const bundleObs = gateObservation(
        context.latestLaunchBundle,
        'prod_build',
        'Latest launch bundle prod build'
      );
      if (bundleObs) {
        observations.push(bundleObs);
      }

      const snapshotObs = summaryObservation(
        context.implementationStatusSnapshot,
        /npm run build/i,
        '.artifacts/proofound-implementation-status-snapshot.md',
        'Implementation status snapshot',
        context.generatedAt,
        SOURCE_PRIORITY.implementation_snapshot,
        'Implementation status snapshot claimed build passed, but the later launch bundle is treated as current truth.'
      );
      if (snapshotObs) {
        observations.push(snapshotObs);
      }

      return observations;
    },
  },
  {
    id: 'engineering_next_start_stable',
    section: 'Engineering',
    label: '`next start` is stable',
    authorityRefs: ['agent/checklists/verification.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/24_gate_summary.json',
      '.artifacts/proofound-master-audit-2026-03-22.md',
    ],
    evaluateDirect: (context) =>
      compactObservations([
        gateObservation(
          context.latestLaunchBundle,
          'prod_boot',
          'Latest launch bundle prod boot'
        ),
      ]),
  },
  {
    id: 'engineering_route_allowlist_reduced',
    section: 'Engineering',
    label: 'Route surface is reduced to the launch allowlist',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      '.artifacts/proofound-route-inventory.md',
      '.artifacts/launch-validation-*/24_gate_summary.json',
      'tests/api/launch-surface-inventory.test.ts',
      'tests/api/launch-page-inventory.test.ts',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const gateObs = gateObservation(
        context.latestLaunchBundle,
        'route_surface_and_archived_routes',
        'Latest launch bundle route-surface gate'
      );
      if (gateObs) observations.push(gateObs);

      const routeInventoryLine = lineMatch(
        context.routeInventory,
        /remaining blocker is breadth|compiled surface as broader than the locked MVP corridor|remaining blocker is the size of the surviving active launch allowlist/i
      );
      if (routeInventoryLine) {
        observations.push({
          sourceId: 'docs',
          sourceLabel: 'Route inventory',
          status: 'FAIL',
          summary: routeInventoryLine,
          evidence: [
            {
              label: 'Route inventory',
              path: '.artifacts/proofound-route-inventory.md',
              note: routeInventoryLine,
            },
          ],
          observedAt: null,
          priority: SOURCE_PRIORITY.tests,
        });
      }
      return observations;
    },
  },
  {
    id: 'engineering_three_role_model_canonical',
    section: 'Engineering',
    label: 'Canonical 3-role model is true across code, DB, and API',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      '.artifacts/proofound-current-state-reality-check.md',
      'tests/lib/authz-policy.test.ts',
      'src/lib/authz/policy.ts',
    ],
    evaluateDirect: (context) => {
      const row = checklistRowObservation(
        realityRow(context, 'canonical role and RLS truth'),
        'current_state_reality_check'
      );
      if (row) {
        return [row];
      }

      if (
        textContainsAll(context.lockedMvp, [/org_owner/i, /org_manager/i, /org_reviewer/i]) &&
        textContainsAll(context.launchReadinessSummary, [/route breadth/i])
      ) {
        return [
          docObservation({
            status: 'PASS',
            summary: 'Locked MVP and authz policy keep the canonical organization role model explicit.',
            sourceId: 'docs',
            sourceLabel: 'Locked MVP source of truth',
            sourcePath: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
            observedAt: null,
            note: 'Roles include org_owner, org_manager, and org_reviewer.',
          }),
        ];
      }

      return [];
    },
  },
  {
    id: 'engineering_verification_status_canonical',
    section: 'Engineering',
    label: 'Verification status semantics are canonical and freshness-aware',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      '.artifacts/proofound-current-state-reality-check.md',
      'docs/verification-checklist.md',
      'src/app/api/monitoring/launch-status/route.ts',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const verificationObs = checklistRowObservation(
        verificationRow(context, 'bounded verification semantics'),
        'verification_checklist'
      );
      if (verificationObs) observations.push(verificationObs);
      const freshnessObs = checklistRowObservation(
        realityRow(context, 'launch ops / smoke freshness / launch-status truth'),
        'current_state_reality_check'
      );
      if (freshnessObs) observations.push(freshnessObs);
      return observations;
    },
  },
  {
    id: 'engineering_upload_filename_leaks_closed',
    section: 'Engineering',
    label: 'Upload metadata/original filename leaks are closed',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'docs/internal-ops/redaction-risky-upload-sop.md',
      'tests/lib/uploads-privacy.test.ts',
      'tests/lib/uploads-lifecycle-queue.test.ts',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = passIfDocs(context, {
        markdown: context.riskyUploadSop,
        observedAt: null,
        sourcePath: 'docs/internal-ops/redaction-risky-upload-sop.md',
        sourceLabel: 'Redaction / risky upload SOP',
        summary:
          'Risky-upload SOP requires sanitized filenames, stored review reasons, and privacy-safe handling instead of restoring original metadata.',
        patterns: [/sanitized filename/i, /metadata/i, /Do not restore identity-bearing names or metadata/i],
      }).map((observation) => ({
        ...observation,
        status: 'UNVERIFIED' as const,
        summary:
          'The SOP requires privacy-safe filename and metadata handling, but docs alone do not prove the implementation is closing leaks.',
      }));

      if (
        textContainsAll(context.uploadsPrivacyTest, [
          /sanitizeUploadFilename/i,
          /collectUploadMetadataFlags/i,
          /resolveArtifactDisplayNameForSurface/i,
          /Uploaded PDF document/i,
        ]) &&
        textContainsAll(context.uploadsLifecycleQueueTest, [
          /sanitizedFilename/i,
          /reviewReasons/i,
          /correction_revocation/i,
        ])
      ) {
        return [
          {
            sourceId: 'tests',
            sourceLabel: 'Upload privacy tests',
            status: 'PASS',
            summary:
              'Upload privacy tests cover filename sanitization, metadata review flags, generic public/review display labels, and queue handoff with sanitized filenames.',
            evidence: [
              {
                label: 'Upload privacy helpers test',
                path: 'tests/lib/uploads-privacy.test.ts',
                note: 'Covers sanitized filenames, metadata review flags, and generic display names.',
              },
              {
                label: 'Upload lifecycle queue test',
                path: 'tests/lib/uploads-lifecycle-queue.test.ts',
                note: 'Asserts correction_revocation queue metadata includes sanitizedFilename and reviewReasons.',
              },
            ],
            observedAt: null,
            priority: SOURCE_PRIORITY.tests,
          },
        ];
      }

      return observations;
    },
  },
  {
    id: 'engineering_legacy_decision_and_route_drift_removed',
    section: 'Engineering',
    label: 'Legacy decision and non-MVP route drift are removed or hard-gated',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      '.artifacts/proofound-route-inventory.md',
      '.artifacts/launch-validation-*/24_gate_summary.json',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const routeObs = gateObservation(
        context.latestLaunchBundle,
        'route_surface_and_archived_routes',
        'Latest launch bundle route-surface gate'
      );
      if (routeObs) observations.push(routeObs);
      return observations;
    },
  },
  {
    id: 'engineering_launch_status_fresh_evidence',
    section: 'Engineering',
    label: 'Launch-status and smoke-artifact logic run on fresh evidence',
    authorityRefs: ['agent/checklists/verification.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/24_gate_summary.json',
      '.artifacts/launch-readiness-summary.md',
      'src/app/api/monitoring/launch-status/route.ts',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const liveStatusGate = gateObservation(
        context.latestLaunchBundle,
        'live_launch_status',
        'Latest launch bundle live launch-status gate'
      );
      if (liveStatusGate) observations.push(liveStatusGate);

      const smokeRefreshGate = gateObservation(
        context.latestLaunchBundle,
        'live_launch_smoke_artifact_refresh',
        'Latest launch bundle live smoke refresh gate'
      );
      if (smokeRefreshGate) observations.push(smokeRefreshGate);

      const liveEndpointObs = liveEndpointObservation(
        context.liveLaunchStatus,
        'Live launch-status endpoint',
        'Live launch-status endpoint responded successfully during this checklist run.',
        'Live launch-status endpoint did not confirm readiness during this checklist run.'
      );
      if (liveEndpointObs) observations.push(liveEndpointObs);

      return observations;
    },
  },
  {
    id: 'qa_strict_org_corridor_fresh',
    section: 'QA',
    label: 'Fresh strict org corridor passes in prod mode',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      '.artifacts/proofound-current-state-reality-check.md',
      'docs/verification-checklist.md',
      '.artifacts/launch-validation-*/24_gate_summary.json',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const stateful = statefulObservation(
        context.statefulChecks.get('strict_org_corridor'),
        'Stateful strict org corridor rerun',
        'Stateful strict org corridor rerun passed in this checklist run.',
        'Stateful strict org corridor rerun failed in this checklist run.'
      );
      if (stateful) observations.push(stateful);

      const reality = checklistRowObservation(
        realityRow(context, 'review -> intro -> reveal -> interview -> decision -> hire -> engagement verification'),
        'current_state_reality_check'
      );
      if (reality) observations.push(reality);

      return observations;
    },
  },
  {
    id: 'qa_public_org_trust_smoke',
    section: 'QA',
    label: 'Public-org trust smoke passes',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/24_gate_summary.json',
      'e2e/public-org-trust.smoke.spec.ts',
    ],
    evaluateDirect: (context) => {
      const observations: FinalLaunchChecklistObservation[] = [];
      const stateful = statefulObservation(
        context.statefulChecks.get('public_org_trust_smoke'),
        'Stateful public org trust smoke',
        'Stateful public org trust smoke passed in this checklist run.',
        'Stateful public org trust smoke failed in this checklist run.'
      );
      if (stateful) observations.push(stateful);
      const bundleObs = gateObservation(
        context.latestLaunchBundle,
        'public_org_trust_smoke',
        'Latest launch bundle public org trust smoke'
      );
      if (bundleObs) observations.push(bundleObs);
      return observations;
    },
  },
  {
    id: 'qa_privacy_rls_actual_db',
    section: 'QA',
    label: 'RLS/privacy tests pass against actual DB state',
    authorityRefs: ['agent/checklists/verification.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/24_gate_summary.json',
      '.artifacts/proofound-current-state-reality-check.md',
    ],
    evaluateDirect: (context) =>
      compactObservations([
        gateObservation(
          context.latestLaunchBundle,
          'privacy_rls_live_db',
          'Latest launch bundle privacy/RLS gate'
        ),
        checklistRowObservation(
          realityRow(context, 'canonical role and RLS truth'),
          'current_state_reality_check'
        ),
      ]),
  },
  {
    id: 'qa_manual_privacy_sweep',
    section: 'QA',
    label: 'Manual privacy leak sweep passes',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/21_live_launch_smoke_report.json',
      'docs/internal-ops/reveal-privacy-dispute-sop.md',
    ],
    evaluateDirect: () => [],
  },
  {
    id: 'qa_workflow_email_privacy_sweep',
    section: 'QA',
    label: 'Workflow email privacy sweep passes',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'agent/checklists/verification.md',
      'docs/internal-ops/workflow-comms-templates.md',
    ],
    evaluateDirect: () => [],
  },
  {
    id: 'qa_archived_route_and_surface_tests',
    section: 'QA',
    label: 'Archived-route and launch-surface tests pass',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      '.artifacts/launch-validation-*/24_gate_summary.json',
      'tests/api/launch-surface-inventory.test.ts',
      'tests/api/launch-page-inventory.test.ts',
      'tests/ui/archived-mvp-routes.test.ts',
    ],
    evaluateDirect: (context) =>
      compactObservations([
        gateObservation(
          context.latestLaunchBundle,
          'route_surface_and_archived_routes',
          'Latest launch bundle route-surface gate'
        ),
      ]),
  },
  {
    id: 'qa_assignment_publish_smoke',
    section: 'QA',
    label: 'Assignment publish smoke passes',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'docs/verification-checklist.md',
      '.artifacts/proofound-current-state-reality-check.md',
      'tests/api/assignments-publish-route.test.ts',
    ],
    evaluateDirect: (context) =>
      compactObservations([
        checklistRowObservation(
          verificationRow(context, 'assignment create / edit / publish'),
          'verification_checklist'
        ),
        checklistRowObservation(
          realityRow(context, 'assignment create / edit / publish'),
          'current_state_reality_check'
        ),
      ]),
  },
  {
    id: 'qa_final_evidence_packet',
    section: 'QA',
    label: 'Final evidence packet is assembled and dated',
    authorityRefs: ['agent/checklists/verification.md'],
    evidenceSources: [
      '.artifacts/launch-validation-YYYY-MM-DD/final-launch-checklist-status.md',
      '.artifacts/launch-validation-YYYY-MM-DD/final-launch-checklist-status.json',
    ],
    evaluateDirect: (context) => [
      {
        sourceId: 'fallback',
        sourceLabel: 'Final checklist generator',
        status: 'PASS',
        summary: 'This checklist run generated a dated Markdown report and JSON bundle.',
        evidence: [
          {
            label: 'Generated Markdown report',
            path: path.relative(
              context.workspaceRoot,
              path.join(context.outputDir, 'final-launch-checklist-status.md')
            ),
          },
          {
            label: 'Generated JSON bundle',
            path: path.relative(
              context.workspaceRoot,
              path.join(context.outputDir, 'final-launch-checklist-status.json')
            ),
          },
        ],
        observedAt: context.generatedAt,
        priority: SOURCE_PRIORITY.fallback,
      },
    ],
  },
  {
    id: 'ops_verification_queue_owner_sop',
    section: 'Ops',
    label: 'Verification queue has owner and SOP',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'docs/internal-ops/index.md',
      'docs/internal-ops/verification-review-sop.md',
    ],
    evaluateDirect: (context) =>
      passIfDocs(context, {
        markdown: context.internalOpsIndex,
        observedAt: null,
        sourcePath: 'docs/internal-ops/index.md',
        sourceLabel: 'Internal ops SOP index',
        summary: 'Internal ops index assigns an owner and queue mapping for verification review.',
        patterns: [/verification-review-sop\.md/i, /Support \/ verification lead/i, /verification/i],
      }),
  },
  {
    id: 'ops_redaction_queue_owner_sop',
    section: 'Ops',
    label: 'Redaction / risky-upload queue has owner and SOP',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'docs/internal-ops/index.md',
      'docs/internal-ops/redaction-risky-upload-sop.md',
    ],
    evaluateDirect: (context) =>
      passIfDocs(context, {
        markdown: context.internalOpsIndex,
        observedAt: null,
        sourcePath: 'docs/internal-ops/index.md',
        sourceLabel: 'Internal ops SOP index',
        summary: 'Internal ops index maps the redaction / risky upload queue to an owner and SOP.',
        patterns: [/redaction-risky-upload-sop\.md/i, /correction_revocation/i, /Support \/ verification lead/i],
      }),
  },
  {
    id: 'ops_reveal_privacy_dispute_path',
    section: 'Ops',
    label: 'Reveal/privacy dispute path exists',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'docs/internal-ops/reveal-privacy-dispute-sop.md',
      'docs/internal-ops/workflow-comms-templates.md',
    ],
    evaluateDirect: (context) =>
      passIfDocs(context, {
        markdown: context.revealPrivacyDisputeSop,
        observedAt: null,
        sourcePath: 'docs/internal-ops/reveal-privacy-dispute-sop.md',
        sourceLabel: 'Reveal / privacy dispute SOP',
        summary: 'A dedicated reveal/privacy dispute SOP exists for live corridor handling.',
        patterns: [/reveal request times out or is disputed/i, /privacy complaint/i, /consent/i],
      }),
  },
  {
    id: 'ops_engagement_verification_checklist',
    section: 'Ops',
    label: 'Engagement verification evidence checklist exists',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'docs/internal-ops/engagement-verification-evidence-checklist.md',
    ],
    evaluateDirect: (context) =>
      passIfDocs(context, {
        markdown: context.engagementVerificationChecklist,
        observedAt: null,
        sourcePath: 'docs/internal-ops/engagement-verification-evidence-checklist.md',
        sourceLabel: 'Engagement verification evidence checklist',
        summary: 'A dedicated engagement-verification evidence checklist exists for pilot ops.',
        patterns: [/Owner: `Support \/ verification lead`/i, /engagement verification/i, /queue note/i],
      }),
  },
  {
    id: 'ops_incident_roles_assigned',
    section: 'Ops',
    label: 'Incident owner / support lead roles are assigned',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
      'docs/internal-ops/index.md',
    ],
    evaluateDirect: (context) =>
      passIfDocs(context, {
        markdown: context.internalOpsIndex,
        observedAt: null,
        sourcePath: 'docs/internal-ops/index.md',
        sourceLabel: 'Internal ops SOP index',
        summary: 'Internal ops docs name live owners for pilot operations, but they do not identify specific humans.',
        patterns: [/Live owners/i, /Support \/ verification lead/i, /Engineering on-call/i, /Product \/ ops lead/i],
      }).map((observation) => ({
        ...observation,
        status: 'UNVERIFIED',
        summary:
          'Operational roles are named in docs, but this repo does not identify the currently assigned people for launch.',
      })),
  },
  {
    id: 'ops_critical_alerts_configured',
    section: 'Ops',
    label: 'Critical alerts are configured',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      'docs/monitoring-alerting.md',
      'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
    ],
    evaluateDirect: (context) =>
      passIfDocs(context, {
        markdown: context.monitoringAlerting,
        observedAt: null,
        sourcePath: 'docs/monitoring-alerting.md',
        sourceLabel: 'Monitoring and alerting guide',
        summary:
          'Monitoring docs describe critical alerts, but this checklist has no fresh environment-backed proof that they are configured in the live stack.',
        patterns: [/Configure critical alerts/i, /critical alerts/i],
      }).map((observation) => ({
        ...observation,
        status: 'UNVERIFIED',
      })),
  },
  {
    id: 'ops_backup_restore_verified',
    section: 'Ops',
    label: 'Backups and restore discipline are verified',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md', 'agent/checklists/verification.md'],
    evidenceSources: [
      'docs/launch-restore-drill.md',
      'agent/checklists/verification.md',
      'README.md',
    ],
    evaluateDirect: (context) =>
      passIfDocs(context, {
        markdown: context.launchRestoreDrill,
        observedAt: null,
        sourcePath: 'docs/launch-restore-drill.md',
        sourceLabel: 'Launch restore drill',
        summary:
          'Backup and restore discipline is documented with a checkpoint and restore-verify workflow, but this checklist does not rerun the drill itself.',
        patterns: [/db:backup:checkpoint/i, /db:restore:verify/i, /restore/i],
      }).map((observation) => ({
        ...observation,
        status: 'UNVERIFIED',
      })),
  },
  {
    id: 'ops_internal_admin_surfaces',
    section: 'Ops',
    label: 'Internal ops/admin surfaces are protected and usable',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'docs/internal-ops/index.md',
      'src/lib/launch/surface-policy.ts',
      'tests/api/launch-page-inventory.test.ts',
    ],
    evaluateDirect: (context) =>
      passIfDocs(context, {
        markdown: context.internalOpsIndex,
        observedAt: null,
        sourcePath: 'docs/internal-ops/index.md',
        sourceLabel: 'Internal ops SOP index',
        summary: 'Internal ops docs and route surfaces exist, but this checklist lacks fresh usability evidence for the admin surfaces themselves.',
        patterns: [/Internal queue view: `\/admin\/verification`/i, /Queue API/i, /Audit trail view/i],
      }).map((observation) => ({
        ...observation,
        status: 'UNVERIFIED',
      })),
  },
  {
    id: 'founder_first_corridor_chosen',
    section: 'Founder / GTM',
    label: 'First corridor is explicitly chosen',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
      'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md',
    ],
    evaluateDirect: (context) => [
      ...passIfDocs(context, {
        markdown: context.lockedMvp,
        observedAt: null,
        sourcePath: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
        sourceLabel: 'Locked MVP source of truth',
        summary: 'The locked MVP explicitly chooses a proof-first hiring corridor centered on Proof Packs.',
        patterns: [/proof-first/i, /hiring corridor/i, /Proof Packs/i],
      }),
    ],
  },
  {
    id: 'founder_icp_design_partner_locked',
    section: 'Founder / GTM',
    label: 'ICP and design-partner target list are locked',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
      'Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md',
    ],
    evaluateDirect: () => [],
  },
  {
    id: 'founder_pilot_package_documented',
    section: 'Founder / GTM',
    label: 'Pilot package, scope, and case-study terms are documented',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: ['Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md'],
    evaluateDirect: () => [],
  },
  {
    id: 'founder_outbound_and_homepage_match',
    section: 'Founder / GTM',
    label: 'Founder outbound and homepage messaging match the wedge',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: ['README.md', 'src/app/page.tsx'],
    evaluateDirect: () => [],
  },
  {
    id: 'founder_public_story_signal_over_cvs',
    section: 'Founder / GTM',
    label: 'Public story sells stronger signal than CVs, not broad platform vision',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'README.md',
      'docs/scope-compliance-report-2026-03-24.md',
      'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
    ],
    evaluateDirect: (context) => {
      if (
        textContainsAll(context.lockedMvp, [/proof instead of profile theater/i]) &&
        textContainsAll(
          context.launchReadinessSummary,
          [/public and corridor flows/i]
        )
      ) {
        return [
          docObservation({
            status: 'PASS',
            summary:
              'Current authority docs frame Proofound as stronger signal than CV theater, but founder-outbound proof remains outside repo scope.',
            sourceId: 'docs',
            sourceLabel: 'Locked MVP source of truth',
            sourcePath: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
            observedAt: null,
            note: 'Product promise: proof instead of profile theater.',
          }),
        ];
      }
      return [];
    },
  },
  {
    id: 'founder_candidate_supply_plan',
    section: 'Founder / GTM',
    label: 'Candidate supply-seeding plan exists for the chosen corridor',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: ['Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md'],
    evaluateDirect: () => [],
  },
  {
    id: 'founder_org_onboarding_playbook',
    section: 'Founder / GTM',
    label: 'Org onboarding playbook exists',
    authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
    evidenceSources: [
      'docs/internal-ops/index.md',
      'docs/internal-ops/assignment-quality-checklist.md',
    ],
    evaluateDirect: () => [],
  },
  {
    id: 'founder_go_no_go_signed_after_green',
    section: 'Founder / GTM',
    label: 'Go/no-go is signed only after fresh evidence is green',
    authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
    evidenceSources: [
      '.artifacts/launch-readiness-summary.md',
      '.artifacts/launch-validation-*/24_gate_summary.json',
    ],
    upstreamBlockers: [
      'engineering_build_clean',
      'engineering_next_start_stable',
      'engineering_route_allowlist_reduced',
      'engineering_launch_status_fresh_evidence',
      'qa_archived_route_and_surface_tests',
    ],
    evaluateDirect: (context) => {
      if (context.latestLaunchBundle?.verdict === 'NO_GO') {
        return [
          {
            sourceId: 'latest_launch_bundle',
            sourceLabel: 'Latest launch bundle verdict',
            status: 'UNVERIFIED',
            summary: 'Latest launch bundle still recommends NO_GO, so launch signoff should remain blocked until fresh evidence turns green.',
            evidence: [
              {
                label: 'Latest launch bundle',
                path: path.posix.join(context.latestLaunchBundle.dir, '24_gate_summary.json'),
              },
              {
                label: 'Launch verdict memo',
                path: '.artifacts/launch-readiness-summary.md',
              },
            ],
            observedAt: context.latestLaunchBundle.generatedAt,
            priority: SOURCE_PRIORITY.latest_launch_bundle,
          },
        ];
      }
      return [];
    },
  },
];

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
  >((accumulator, status) => {
    accumulator[status] = items.filter((item) => item.status === status).length;
    return accumulator;
  }, {
    PASS: 0,
    FAIL: 0,
    BLOCKED: 0,
    UNVERIFIED: 0,
  });

  const trueBlockers = items.filter(
    (item) => item.status === 'FAIL' || (item.status === 'BLOCKED' && item.blockerIds.length === 0)
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
    generatedAt: context.generatedAt,
    currentDate: context.currentDate,
    workspaceRoot: context.workspaceRoot,
    gitHead: context.gitHead,
    gitBranch: context.gitBranch,
    verdict: trueBlockers.length === 0 && statusCounts.BLOCKED === 0 ? 'READY' : 'NOT_READY',
    includeStateful: context.includeStateful,
    liveBaseUrl:
      options.liveBaseUrl != null
        ? normalizeLaunchBaseUrl(options.liveBaseUrl)
        : context.latestLaunchBundle?.authoritativeBaseUrl ?? null,
    latestLaunchBundleDir: context.latestLaunchBundle?.dir ?? null,
    statusCounts,
    items,
    trueBlockers,
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
  await fs.writeFile(path.join(context.outputDir, 'final-launch-checklist-status.md'), markdownReport, 'utf8');
  await fs.writeFile(path.join(context.outputDir, 'final-launch-checklist-status.json'), jsonReport, 'utf8');
  await writeIndexSurfaces(report);

  return report;
}
