#!/usr/bin/env node

import { generateFinalLaunchChecklistReport } from '../src/lib/launch/final-launch-checklist';

function readFlag(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const includeStateful = process.argv.includes('--include-stateful');
  const liveBaseUrl =
    readFlag('--live-base-url') ??
    process.env.LAUNCH_CHECKLIST_LIVE_BASE_URL ??
    process.env.BASE_URL ??
    null;

  const report = await generateFinalLaunchChecklistReport({
    includeStateful,
    liveBaseUrl,
  });

  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        generatedAt: report.generatedAt,
        outputs: report.outputs,
        statusCounts: report.statusCounts,
        trueBlockers: report.trueBlockers.map((item) => ({
          id: item.id,
          label: item.label,
          status: item.status,
        })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    'Final launch checklist generation failed:',
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
