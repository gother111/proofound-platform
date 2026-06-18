#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const command = args[0];
const extraArgs = args.slice(1);
const DEFAULT_PULL_TIMEOUT_MS = 120_000;
const DEFAULT_BUILD_TIMEOUT_MS = 900_000;
const DEFAULT_DEPLOY_TIMEOUT_MS = 600_000;

function runGit(commandArgs) {
  const result = spawnSync('git', commandArgs, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
}

function readOption(flag) {
  const idx = extraArgs.indexOf(flag);
  if (idx === -1) return null;
  return extraArgs[idx + 1] ?? null;
}

function readOptionValue(flag) {
  const prefixedArg = extraArgs.find((arg) => arg.startsWith(`${flag}=`));
  if (prefixedArg) {
    return prefixedArg.slice(flag.length + 1) || null;
  }

  return readOption(flag);
}

function hasFlag(flag) {
  return extraArgs.includes(flag);
}

function readPositiveIntegerEnv(name, fallback) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  console.warn(
    `[vercel-command] Ignoring invalid ${name}=${JSON.stringify(rawValue)}; using ${fallback}ms.`
  );
  return fallback;
}

function getTimeoutMs() {
  if (command === 'pull') {
    return readPositiveIntegerEnv('VERCEL_PULL_TIMEOUT_MS', DEFAULT_PULL_TIMEOUT_MS);
  }

  if (command === 'deploy-prebuilt') {
    return readPositiveIntegerEnv('VERCEL_DEPLOY_TIMEOUT_MS', DEFAULT_DEPLOY_TIMEOUT_MS);
  }

  if (command === 'build') {
    return readPositiveIntegerEnv('VERCEL_BUILD_TIMEOUT_MS', DEFAULT_BUILD_TIMEOUT_MS);
  }

  return undefined;
}

function exitFromSpawnResult(result, timeoutMs) {
  if (result.error?.code === 'ETIMEDOUT') {
    console.error(
      `[vercel-command] Vercel ${command} timed out after ${timeoutMs}ms. Retry once Vercel is responsive.`
    );
    process.exit(124);
  }

  if (result.error) {
    console.error(`[vercel-command] Failed to run Vercel ${command}: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

function buildGitMeta() {
  const repository = process.env.GITHUB_REPOSITORY;
  const [githubOrg, githubRepo] = repository?.split('/') ?? [];
  const githubCommitRef =
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    runGit(['branch', '--show-current']);
  const githubCommitSha = process.env.GITHUB_SHA || runGit(['rev-parse', 'HEAD']);
  const githubCommitMessage =
    process.env.GITHUB_EVENT_HEAD_COMMIT_MESSAGE || runGit(['log', '-1', '--pretty=%s']);
  const githubCommitAuthorName =
    process.env.GITHUB_ACTOR || runGit(['log', '-1', '--pretty=%an']);
  const metaEntries = [
    ['githubDeployment', '1'],
    ['proofoundDeploymentKind', 'prebuilt'],
    ['githubCommitRef', githubCommitRef],
    ['githubCommitSha', githubCommitSha],
    ['githubOrg', githubOrg],
    ['githubRepo', githubRepo],
    ['githubCommitAuthorLogin', process.env.GITHUB_ACTOR || null],
    ['githubCommitAuthorName', githubCommitAuthorName],
    ['githubCommitMessage', githubCommitMessage],
  ];

  return metaEntries.filter(([, value]) => Boolean(value));
}

function buildCommandArgs() {
  const vercelArgs = [];

  switch (command) {
    case 'pull': {
      const environment = readOptionValue('--environment') ?? 'preview';
      vercelArgs.push('pull', '--yes', `--environment=${environment}`);
      break;
    }
    case 'build': {
      vercelArgs.push('build', '--yes');
      if (hasFlag('--prod')) {
        vercelArgs.push('--prod');
      }
      break;
    }
    case 'deploy-prebuilt': {
      if (!existsSync('.vercel/output/config.json')) {
        console.error(
          '[vercel-command] Missing .vercel/output/config.json. Run vercel build first.'
        );
        process.exit(1);
      }

      vercelArgs.push('deploy', '--prebuilt', '--archive=tgz', '--yes');
      if (hasFlag('--prod')) {
        vercelArgs.push('--prod');
      }

      for (const [key, value] of buildGitMeta()) {
        vercelArgs.push('-m', `${key}=${value}`);
      }
      break;
    }
    default: {
      console.error(
        '[vercel-command] Usage: node scripts/vercel-command.mjs <pull|build|deploy-prebuilt> [--environment=<env>] [--prod]'
      );
      process.exit(1);
    }
  }

  return vercelArgs;
}

function sanitizeOutput(output) {
  const token = process.env.VERCEL_TOKEN;
  if (!output || !token) {
    return output;
  }

  return output.split(token).join('[REDACTED_VERCEL_TOKEN]');
}

function printCapturedOutput(output, stream) {
  if (!output) return;
  const sanitizedOutput = sanitizeOutput(output);
  stream.write(sanitizedOutput);
  if (!sanitizedOutput.endsWith('\n')) {
    stream.write('\n');
  }
}

function findDeploymentUrl(output) {
  const matches = output.match(/https:\/\/[^\s]+/g);
  if (!matches) return null;
  return matches.at(-1) ?? null;
}

const vercelArgs = buildCommandArgs();
const timeoutMs = getTimeoutMs();

if (command !== 'deploy-prebuilt') {
  const result = spawnSync('npx', ['vercel@latest', ...vercelArgs], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    timeout: timeoutMs,
    killSignal: 'SIGTERM',
  });

  exitFromSpawnResult(result, timeoutMs);
}

const deployResult = spawnSync('npx', ['vercel@latest', ...vercelArgs], {
  cwd: process.cwd(),
  env: process.env,
  encoding: 'utf8',
  timeout: timeoutMs,
  killSignal: 'SIGTERM',
});

printCapturedOutput(deployResult.stdout, process.stderr);
printCapturedOutput(deployResult.stderr, process.stderr);

if (deployResult.error) {
  exitFromSpawnResult(deployResult, timeoutMs);
}

if (deployResult.status !== 0) {
  process.exit(deployResult.status ?? 1);
}

const deploymentUrl = findDeploymentUrl(
  sanitizeOutput([deployResult.stdout ?? '', deployResult.stderr ?? ''].join('\n'))
);

if (deploymentUrl) {
  process.stdout.write(`${deploymentUrl}\n`);
}
