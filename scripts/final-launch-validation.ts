#!/usr/bin/env node

import { runFinalLaunchValidation } from '../src/lib/launch/final-launch-validation-runner';

function readFlag(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const outputDir = readFlag('--output-dir');
  const baseUrl = readFlag('--base-url');
  const env = {
    ...process.env,
    ...(baseUrl ? { BASE_URL: baseUrl } : {}),
  };

  const result = await runFinalLaunchValidation({
    outputDir: outputDir ?? undefined,
    env,
  });

  console.log(
    JSON.stringify(
      {
        verdict: result.bundle.verdict,
        statusCounts: result.bundle.statusCounts,
        p0BlockingGateIds: result.bundle.p0BlockingGateIds,
        reportPath: result.reportPath,
        commandsPath: result.commandsPath,
      },
      null,
      2
    )
  );

  if (result.bundle.verdict !== 'GO') {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    'Final launch validation failed:',
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
