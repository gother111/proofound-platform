#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

function hasFlag(flag) {
  return args.includes(flag);
}

function runGit(commandArgs) {
  return spawnSync('git', commandArgs, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
  });
}

function resolveCommit(commitish) {
  if (!commitish) return null;
  const result = runGit(['rev-parse', '--verify', `${commitish}^{commit}`]);
  return result.status === 0 ? result.stdout.trim() : null;
}

function getCurrentHead() {
  return resolveCommit('HEAD');
}

function getPreviousHead() {
  return resolveCommit('HEAD^');
}

function parseChangedFilesArg() {
  const raw = readArg('--changed-files');
  if (!raw) return null;
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

const runtimePrefixes = ['src/', 'api/', 'python_cv/', 'public/'];
const runtimeExact = new Set([
  '.nvmrc',
  'next.config.js',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'bun.lock',
  'vercel.json',
  'scripts/postbuild-cleanup.mjs',
  'scripts/check-deploy-readiness.mjs',
  'scripts/vercel-should-build.mjs',
]);
const runtimeRegexes = [
  /^tsconfig.*\.json$/,
  /^tailwind\.config\.[^.]+$/,
  /^postcss\.config\.[^.]+$/,
  /^drizzle\.config\.[^.]+$/,
];
const nonRuntimePrefixes = ['project/', 'agent/', 'docs/', 'audit/', 'tests/', 'e2e/'];
const runtimeGithubWorkflows = new Set([
  '.github/workflows/cancel-stale-vercel-deployments.yml',
  '.github/workflows/retry-vercel-deploy.yml',
  '.github/workflows/release-candidate.yml',
  '.github/workflows/enforce-master-release-branch.yml',
]);

function classifyPath(filePath) {
  if (!filePath) return 'runtime';
  if (runtimeExact.has(filePath)) return 'runtime';
  if (runtimeRegexes.some((pattern) => pattern.test(filePath))) return 'runtime';
  if (runtimePrefixes.some((prefix) => filePath.startsWith(prefix))) return 'runtime';
  if (nonRuntimePrefixes.some((prefix) => filePath.startsWith(prefix))) return 'non-runtime';

  if (filePath.startsWith('.github/workflows/')) {
    return runtimeGithubWorkflows.has(filePath) ? 'runtime' : 'non-runtime';
  }

  if (filePath.startsWith('.github/')) {
    return 'non-runtime';
  }

  return 'runtime';
}

function getChangedFiles(baseSha, headSha) {
  if (!baseSha || !headSha) return null;
  const diff = runGit(['diff', '--name-only', '--no-renames', baseSha, headSha]);
  if (diff.status !== 0) return null;
  return diff.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function shouldBuild(changedFiles) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return { build: true, reason: 'No changed files resolved safely. Defaulting to build.' };
  }

  const runtimeFiles = changedFiles.filter((filePath) => classifyPath(filePath) === 'runtime');
  if (runtimeFiles.length > 0) {
    return {
      build: true,
      reason: `Runtime-impacting files changed: ${runtimeFiles.slice(0, 10).join(', ')}`,
    };
  }

  return {
    build: false,
    reason: `Only non-runtime files changed: ${changedFiles.slice(0, 10).join(', ')}`,
  };
}

function main() {
  const changedFilesArg = parseChangedFilesArg();
  let changedFiles = changedFilesArg;

  if (!changedFiles) {
    const headSha =
      resolveCommit(readArg('--head')) ??
      resolveCommit(process.env.VERCEL_GIT_COMMIT_SHA) ??
      resolveCommit(process.env.GITHUB_SHA) ??
      getCurrentHead();
    const baseSha =
      resolveCommit(readArg('--base')) ??
      resolveCommit(process.env.VERCEL_GIT_PREVIOUS_SHA) ??
      resolveCommit(process.env.GITHUB_EVENT_BEFORE) ??
      getPreviousHead();

    changedFiles = getChangedFiles(baseSha, headSha);

    if (hasFlag('--verbose')) {
      console.log(
        JSON.stringify(
          {
            baseSha,
            headSha,
            changedFiles,
          },
          null,
          2
        )
      );
    }
  }

  const decision = shouldBuild(changedFiles);
  console.log(`[vercel-should-build] ${decision.reason}`);

  if (decision.build) {
    process.exit(1);
  }

  process.exit(0);
}

main();
