import { spawn } from 'node:child_process';
import path from 'node:path';

const DEFAULT_TIMEOUT_MS = 120_000;
const timeoutMs = Number.parseInt(
  process.env.PROOFOUND_VITEST_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS),
  10
);

if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  console.error(
    `[test] Invalid PROOFOUND_VITEST_TIMEOUT_MS=${process.env.PROOFOUND_VITEST_TIMEOUT_MS}`
  );
  process.exit(1);
}

const vitestBin = path.join(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs');
const args = [vitestBin, 'run', ...process.argv.slice(2)];
const child = spawn(process.execPath, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});

let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  console.error(
    `[test] Vitest exceeded ${timeoutMs}ms. Failing the launch gate and stopping the run.`
  );
  child.kill('SIGTERM');

  setTimeout(() => {
    if (child.exitCode === null) {
      child.kill('SIGKILL');
    }
  }, 5_000).unref();
}, timeoutMs);

child.on('exit', (code, signal) => {
  clearTimeout(timer);

  if (timedOut) {
    process.exit(124);
  }

  if (signal) {
    console.error(`[test] Vitest exited via ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
