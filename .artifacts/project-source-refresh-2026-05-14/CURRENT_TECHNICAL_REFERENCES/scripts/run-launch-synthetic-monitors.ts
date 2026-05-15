#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ quiet: true });

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const { runLaunchSyntheticMonitors } = await import('../src/lib/launch/synthetic-monitors');
  const baseUrl = readArg('--base-url') ?? process.env.BASE_URL ?? 'http://localhost:3000';
  const artifactPath =
    readArg('--artifact') ??
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH ??
    '.artifacts/launch-smoke-report.json';
  const persist = process.env.LAUNCH_MONITOR_PERSIST !== '0';

  const result = await runLaunchSyntheticMonitors({
    baseUrl,
    artifactPath,
    persist,
  });

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    'Launch synthetic monitor run failed:',
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
