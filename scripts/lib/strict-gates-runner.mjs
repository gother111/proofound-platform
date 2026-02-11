import { spawn } from 'node:child_process';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForHealthy(url, timeoutMs = 30000, intervalMs = 1000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await delay(intervalMs);
  }

  throw new Error(`Server at ${url} did not become healthy within ${timeoutMs}ms`);
}

export function runCommand(command, args, { env = process.env, cwd = process.cwd() } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
      }
    });
  });
}

async function terminateProcess(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');
  await delay(1200);
  if (child.exitCode === null) {
    child.kill('SIGKILL');
  }
}

export async function withManagedServer(
  {
    startCommand,
    startArgs,
    healthUrl,
    healthTimeoutMs = 30000,
    commands,
    env = process.env,
    cwd = process.cwd(),
    onServerStarted,
  }
) {
  const child = spawn(startCommand, startArgs, {
    cwd,
    env,
    stdio: 'inherit',
  });

  let childExitCode = null;
  let childExitSignal = null;
  child.on('exit', (code, signal) => {
    childExitCode = code;
    childExitSignal = signal;
  });

  onServerStarted?.(child);

  try {
    await waitForHealthy(healthUrl, healthTimeoutMs);
    // Give the spawned process a brief moment to surface immediate startup failures
    // (for example, EADDRINUSE after health succeeds against a stale server).
    await delay(150);
    if (childExitCode !== null) {
      throw new Error(
        `Managed server exited before gate execution (code=${childExitCode}, signal=${childExitSignal || 'none'}).`
      );
    }
    for (const command of commands) {
      if (childExitCode !== null) {
        throw new Error(
          `Managed server exited while executing gates (code=${childExitCode}, signal=${childExitSignal || 'none'}).`
        );
      }
      await runCommand(command.command, command.args, {
        env: { ...env, ...(command.env || {}) },
        cwd,
      });
    }
  } finally {
    await terminateProcess(child);
  }
}
