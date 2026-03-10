#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  buildVerificationPlan,
  collectVerificationEvidence,
  evaluateTicketFinisherState,
  parseChangeEntrySummary,
  resolveVerificationStatus,
  scoreIssueCandidates,
  selectActiveIssue,
  stabilizeIssueSelection,
} from './lib/proofound-ticket-finisher.mjs';

const JSON_FLAG = process.argv.includes('--json');
const ROOT = process.cwd();

function run(command) {
  return execSync(command, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function runOptional(command) {
  try {
    return run(command);
  } catch {
    return '';
  }
}

function getRepoState() {
  const statusOutput = run('git status --short --branch');
  const lines = statusOutput.split('\n').filter(Boolean);
  const branchLine = lines.shift() ?? '## HEAD';
  const branchMatch = branchLine.match(
    /^## (?<branch>[^\s.]+)(?:\.\.\.(?<upstream>[^\s]+))?(?: \[(?<meta>[^\]]+)\])?/
  );

  const repoState = {
    branch: branchMatch?.groups?.branch ?? 'HEAD',
    upstream: branchMatch?.groups?.upstream ?? null,
    upstreamMissing: !branchMatch?.groups?.upstream,
    ahead: 0,
    behind: 0,
    stagedFiles: [],
    unstagedFiles: [],
    untrackedFiles: [],
    changedFiles: [],
    dirty: false,
    headSha: run('git rev-parse --short HEAD'),
  };

  const meta = branchMatch?.groups?.meta ?? '';
  const aheadMatch = meta.match(/ahead (\d+)/);
  const behindMatch = meta.match(/behind (\d+)/);
  repoState.ahead = aheadMatch ? Number(aheadMatch[1]) : 0;
  repoState.behind = behindMatch ? Number(behindMatch[1]) : 0;

  for (const line of lines) {
    if (line.startsWith('?? ')) {
      const file = line.slice(3).trim();
      repoState.untrackedFiles.push(file);
      repoState.changedFiles.push(file);
      continue;
    }

    const stagedCode = line[0];
    const unstagedCode = line[1];
    const file = extractStatusPath(line.slice(3).trim());

    if (stagedCode && stagedCode !== ' ') {
      repoState.stagedFiles.push(file);
    }

    if (unstagedCode && unstagedCode !== ' ') {
      repoState.unstagedFiles.push(file);
    }

    repoState.changedFiles.push(file);
  }

  repoState.changedFiles = [...new Set(repoState.changedFiles)];
  repoState.dirty =
    repoState.stagedFiles.length > 0 ||
    repoState.unstagedFiles.length > 0 ||
    repoState.untrackedFiles.length > 0;

  return repoState;
}

function extractStatusPath(rawPath) {
  if (!rawPath.includes('->')) return rawPath;
  const [, renamedPath] = rawPath.split('->').map((part) => part.trim());
  return renamedPath;
}

function getRecentCommits(limit = 8) {
  const output = runOptional(`git log --format=%s -n ${limit}`);
  if (!output) return [];
  return output.split('\n').map((line) => line.trim()).filter(Boolean);
}

function loadRecentEntries(relativeDir, limit = 15) {
  const absoluteDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];

  return fs
    .readdirSync(absoluteDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, limit)
    .map((file) => {
      const absolutePath = path.join(absoluteDir, file);
      return {
        file: path.join(relativeDir, file),
        text: fs.readFileSync(absolutePath, 'utf8'),
      };
    });
}

function findLatestMatchingChangeEntry(changeEntries, issueKey) {
  if (!issueKey) return null;
  const entry = changeEntries.find((item) => item.text.includes(issueKey));
  if (!entry) return null;

  return {
    file: entry.file,
    ...parseChangeEntrySummary(entry.text),
  };
}

function buildReport() {
  const repoState = getRepoState();
  const recentCommits = getRecentCommits();
  const scratchpadEntries = loadRecentEntries('agent/scratchpad/entries');
  const changeEntries = loadRecentEntries('project/changes/entries');
  const issueInferenceFiles = repoState.changedFiles.filter(
    (file) =>
      !file.startsWith('agent/scratchpad/entries/') &&
      !file.startsWith('project/changes/entries/')
  );
  const candidates = scoreIssueCandidates({
    branchName: repoState.branch,
    commitSubjects: recentCommits,
    scratchpadEntries,
    changeEntries,
    changedFiles: issueInferenceFiles,
  });
  const issueSelection = stabilizeIssueSelection(selectActiveIssue(candidates), repoState);
  const verificationRequirements = buildVerificationPlan(repoState.changedFiles);

  const relevantEntries =
    issueSelection.status === 'clear'
      ? [...scratchpadEntries, ...changeEntries].filter((entry) =>
          entry.text.includes(issueSelection.selectedKey)
        )
      : [...scratchpadEntries, ...changeEntries];

  const evidenceMap = collectVerificationEvidence(relevantEntries);
  const verificationPlan = resolveVerificationStatus(verificationRequirements, evidenceMap);
  const latestChangeSummary = findLatestMatchingChangeEntry(changeEntries, issueSelection.selectedKey);
  const evaluation = evaluateTicketFinisherState({
    issueSelection,
    repoState,
    verificationPlan,
    recentCommits,
    latestChangeSummary,
  });

  return {
    generatedAt: new Date().toISOString(),
    scope: {
      repo: path.basename(ROOT),
      cwd: ROOT,
    },
    issue: issueSelection,
    repo: repoState,
    recentCommits,
    verification: {
      required: verificationPlan,
    },
    latestChangeSummary,
    blockers: evaluation.blockers,
    finalReviewReady: evaluation.finalReviewReady,
    suggestedLinearStatus: evaluation.suggestedLinearStatus,
    hybridAuthority: evaluation.hybridAuthority,
    draftCompletionComment: evaluation.draftCompletionComment,
  };
}

function formatMarkdown(report) {
  const issueLine =
    report.issue.status === 'clear'
      ? `- Active issue candidate: \`${report.issue.selectedKey}\``
      : report.issue.status === 'ambiguous'
        ? `- Active issue candidate: ambiguous (${report.issue.candidates
            .slice(0, 3)
            .map((candidate) => `${candidate.key}:${candidate.score}`)
            .join(', ')})`
        : '- Active issue candidate: none';

  const repoLines = [
    `- Branch: \`${report.repo.branch}\``,
    `- HEAD: \`${report.repo.headSha}\``,
    `- Upstream: ${report.repo.upstream ? `\`${report.repo.upstream}\`` : 'not configured'}`,
    `- Ahead/behind: ${report.repo.upstreamMissing ? 'unknown' : `${report.repo.ahead}/${report.repo.behind}`}`,
    `- Dirty tree: ${report.repo.dirty ? 'yes' : 'no'}`,
    `- Changed files: ${report.repo.changedFiles.length === 0 ? 'none' : report.repo.changedFiles.join(', ')}`,
  ];

  const verificationLines = report.verification.required.map((entry) => {
    const status = entry.status.toUpperCase();
    const evidence = entry.evidence ? ` via \`${entry.evidence.file}\`` : '';
    return `- [${status}] \`${entry.command}\` ${entry.reason}${evidence}`;
  });

  const blockerLines =
    report.blockers.length > 0 ? report.blockers.map((blocker) => `- ${blocker}`) : ['- None.'];

  const draftComment = report.draftCompletionComment
    ? ['```md', report.draftCompletionComment, '```']
    : ['- Not generated until a single clear issue candidate exists.'];

  return [
    '# Proofound Ticket Finisher',
    '',
    '## Active Issue',
    issueLine,
    `- Reason: ${report.issue.reason}`,
    '',
    '## Repo State',
    ...repoLines,
    '',
    '## Next Verification Commands',
    ...verificationLines,
    '',
    '## Blockers',
    ...blockerLines,
    '',
    '## Linear Suggestion',
    `- Suggested status: ${report.suggestedLinearStatus}`,
    `- May move to In Progress automatically: ${report.hybridAuthority.canMoveToInProgress ? 'yes' : 'no'}`,
    `- May finalize automatically: ${report.hybridAuthority.canFinalizeAutomatically ? 'yes' : 'no'}`,
    '',
    '## Draft Completion Comment',
    ...draftComment,
  ].join('\n');
}

const report = buildReport();

if (JSON_FLAG) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(`${formatMarkdown(report)}\n`);
}
