#!/usr/bin/env node
import { withManagedServer } from './lib/strict-gates-runner.mjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  console.log(`Starting strict runtime gates against ${BASE_URL}`);

  await withManagedServer({
    startCommand: 'npm',
    startArgs: ['run', 'start', '--', '-p', '3000'],
    healthUrl: `${BASE_URL}/api/health`,
    healthTimeoutMs: 45000,
    commands: [
      {
        command: 'npm',
        args: ['run', 'perf:budgets'],
        env: { BASE_URL },
      },
      {
        command: 'npm',
        args: ['run', 'go:no-go'],
        env: { BASE_URL, SUS_STUDY_COMPLETE: 'true' },
      },
    ],
  });

  console.log('Strict runtime gates passed.');
}

main().catch((error) => {
  console.error(`Strict runtime gates failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
