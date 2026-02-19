#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SHARED_FILES = ['agent/scratchpad.md', 'project/Documentation.md'];
const APPLY = process.argv.includes('--apply');
const REPO = process.env.GH_REPO || 'gother111/proofound-platform';

function run(command, options = {}) {
  const { allowFailure = false, cwd = process.cwd() } = options;

  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) {
      return '';
    }

    const stderr = error?.stderr?.toString?.() || '';
    const stdout = error?.stdout?.toString?.() || '';
    throw new Error([`Command failed: ${command}`, stdout, stderr].filter(Boolean).join('\n'));
  }
}

function listDirtyPrs() {
  const output = run(
    `gh pr list --repo ${JSON.stringify(REPO)} --base master --state open --json number,headRefName,isDraft,mergeStateStatus --jq '.[] | select((.isDraft | not) and .mergeStateStatus == "DIRTY") | @base64'`
  );

  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(Buffer.from(line, 'base64').toString('utf8')));
}

function cleanupWorktree(worktreePath) {
  run(`git worktree remove --force ${JSON.stringify(worktreePath)}`, { allowFailure: true });
}

function reconcileOne(pr) {
  const branch = pr.headRefName;
  const worktreePath = fs.mkdtempSync(path.join(os.tmpdir(), 'proofound-pr-reconcile-'));
  let status = 'SKIPPED';
  let message = '';

  try {
    run(`git fetch origin ${JSON.stringify(branch)} master`);
    run(`git worktree add ${JSON.stringify(worktreePath)} ${JSON.stringify(`origin/${branch}`)}`);

    run('git merge --no-commit --no-ff origin/master', {
      cwd: worktreePath,
      allowFailure: true,
    });

    const unresolved = run("git diff --name-only --diff-filter=U", { cwd: worktreePath, allowFailure: true })
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);

    if (unresolved.length === 0) {
      run('git merge --abort', { cwd: worktreePath, allowFailure: true });
      status = 'NO_CONFLICT';
      message = 'Branch no longer has unresolved merge conflicts after merge attempt.';
      return { pr: pr.number, branch, status, message };
    }

    const unsupported = unresolved.filter((file) => !SHARED_FILES.includes(file));
    if (unsupported.length > 0) {
      run('git merge --abort', { cwd: worktreePath, allowFailure: true });
      status = 'NEEDS_MANUAL';
      message = `Non-shared conflicts present: ${unsupported.join(', ')}`;
      return { pr: pr.number, branch, status, message };
    }

    if (!APPLY) {
      run('git merge --abort', { cwd: worktreePath, allowFailure: true });
      status = 'DRY_RUN_READY';
      message = `Conflicts limited to shared files: ${unresolved.join(', ')}`;
      return { pr: pr.number, branch, status, message };
    }

    run('git checkout --theirs agent/scratchpad.md project/Documentation.md', { cwd: worktreePath });
    run('git add agent/scratchpad.md project/Documentation.md', { cwd: worktreePath });
    run('git commit -m "chore: resolve shared log conflicts with master"', { cwd: worktreePath });
    run(`git push origin HEAD:${JSON.stringify(branch)}`, { cwd: worktreePath });

    status = 'UPDATED';
    message = 'Resolved shared-file conflicts by taking master versions and pushed branch.';
    return { pr: pr.number, branch, status, message };
  } catch (error) {
    run('git merge --abort', { cwd: worktreePath, allowFailure: true });
    status = 'ERROR';
    message = error.message.split('\n')[0];
    return { pr: pr.number, branch, status, message };
  } finally {
    cleanupWorktree(worktreePath);
  }
}

function main() {
  const prs = listDirtyPrs();

  if (prs.length === 0) {
    console.log('No open non-draft DIRTY PRs found.');
    return;
  }

  console.log(`${APPLY ? 'Apply' : 'Dry-run'} mode for ${prs.length} DIRTY PR(s).`);

  const results = prs.map(reconcileOne);
  for (const result of results) {
    console.log(`#${result.pr}\t${result.branch}\t${result.status}\t${result.message}`);
  }

  const hasBlocking = results.some((r) => r.status === 'NEEDS_MANUAL' || r.status === 'ERROR');
  if (hasBlocking) {
    process.exitCode = 2;
  }
}

main();
