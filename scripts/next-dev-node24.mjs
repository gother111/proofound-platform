#!/usr/bin/env node
/**
 * Start `next dev` using Node 24.
 *
 * Why: local shells may still default to older or newer Node versions, but this repo targets Node 24 LTS.
 * This script re-execs itself with `/opt/homebrew/opt/node@24/bin/node` when needed.
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

// Keep in sync with package.json engines and .nvmrc intent:
// - require Node 24.x
const REQUIRED_MAJOR = 24;

function parseVersion(version) {
  const [major, minor, patch] = String(version).split('.').map((part) => Number.parseInt(part, 10));
  return {
    major: Number.isFinite(major) ? major : 0,
    minor: Number.isFinite(minor) ? minor : 0,
    patch: Number.isFinite(patch) ? patch : 0,
  };
}

function isSupportedNode(version) {
  const { major, minor, patch } = parseVersion(version);
  return major === REQUIRED_MAJOR && Number.isFinite(minor) && Number.isFinite(patch);
}

const argv = process.argv.slice(2);

const scriptPath = fileURLToPath(import.meta.url);

function resolveDevDistDir() {
  if (process.env.NEXT_DIST_DIR) {
    return process.env.NEXT_DIST_DIR;
  }

  const portFlagIndex = argv.findIndex((arg) => arg === '-p' || arg === '--port');
  const portFlagValue = portFlagIndex >= 0 ? argv[portFlagIndex + 1] : null;
  const inlinePortArg = argv.find((arg) => arg.startsWith('--port='));
  const inlineShortPortArg = argv.find((arg) => arg.startsWith('-p='));
  const port =
    portFlagValue ||
    inlinePortArg?.slice('--port='.length) ||
    inlineShortPortArg?.slice('-p='.length) ||
    process.env.PORT ||
    '3000';

  const safePort = String(port).replace(/[^0-9A-Za-z_-]/g, '_');
  return `.next-dev-${safePort}`;
}

function ensureCommonJsDistPackage(distDir) {
  const markerPath = path.join(distDir, 'package.json');
  const markerContents = '{"type":"commonjs"}';

  mkdirSync(distDir, { recursive: true });
  if (existsSync(markerPath)) {
    try {
      if (readFileSync(markerPath, 'utf8') === markerContents) {
        return;
      }
    } catch {
      // Rewrite unreadable markers so Next keeps generated server chunks in CJS mode.
    }
  }

  writeFileSync(markerPath, markerContents);
}

function shouldCleanDevDistDir() {
  const value = process.env.PROOFOUND_NEXT_DEV_CLEAN;
  return value === '1' || value === 'true';
}

function cleanDevDistDir(distDir) {
  if (!shouldCleanDevDistDir() || !existsSync(distDir)) {
    return distDir;
  }

  try {
    rmSync(distDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    return distDir;
  } catch (error) {
    const fallbackDistDir = `${distDir}-${Date.now()}-${process.pid}`;
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `[next-dev-node24] Could not clean ${distDir}; using ${fallbackDistDir}. ${reason}`
    );
    return fallbackDistDir;
  }
}

function run(cmd, args, env) {
  const child = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'], env });
  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };
  process.once('SIGINT', forwardSignal);
  process.once('SIGTERM', forwardSignal);
  child.on('exit', (code, signal) => {
    process.removeListener('SIGINT', forwardSignal);
    process.removeListener('SIGTERM', forwardSignal);
    if (code !== 0 || signal) {
      console.error(
        `[next-dev-node24] Child process exited with code=${code ?? 'null'} signal=${
          signal ?? 'null'
        }`
      );
    }
    if (typeof code === 'number') process.exit(code);
    process.exit(signal ? 1 : 0);
  });
  child.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
}

if (!isSupportedNode(process.versions.node) && process.env.PROOFOUND_NODE24_REEXEC !== '1') {
  const node24Path = process.env.PROOFOUND_NODE24_PATH || '/opt/homebrew/opt/node@24/bin/node';
  const env = { ...process.env, PROOFOUND_NODE24_REEXEC: '1' };
  run(node24Path, [scriptPath, ...argv], env);
} else {
  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const distDir = cleanDevDistDir(resolveDevDistDir());
  ensureCommonJsDistPackage(distDir);
  const markerInterval = setInterval(() => {
    ensureCommonJsDistPackage(distDir);
  }, 500);
  markerInterval.unref();
  run(process.execPath, [nextBin, 'dev', ...argv], {
    ...process.env,
    NEXT_DIST_DIR: distDir,
  });
}
