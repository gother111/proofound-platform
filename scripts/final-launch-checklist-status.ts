#!/usr/bin/env node

import { generateFinalLaunchChecklistReport } from '../src/lib/launch/final-launch-checklist';
import { writeFullLaunchExecutionChecklist } from '../src/lib/launch/full-launch-execution-checklist';
import { runFullLaunchValidationBundle } from '../src/lib/launch/full-launch-validation';
import { runRepoReadyValidationBundle } from '../src/lib/launch/repo-ready-validation';

function readFlag(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const includeStateful = process.argv.includes('--include-stateful');
  const scope =
    (readFlag('--scope') as 'repo' | 'full' | null) ??
    (process.env.LAUNCH_CHECKLIST_SCOPE as 'repo' | 'full' | undefined) ??
    'repo';
  const liveBaseUrl =
    readFlag('--live-base-url') ??
    process.env.LAUNCH_CHECKLIST_LIVE_BASE_URL ??
    process.env.BASE_URL ??
    null;
  const skipRepoValidation = process.argv.includes('--skip-repo-validation');
  const skipFullValidation = process.argv.includes('--skip-full-validation');

  if (scope === 'repo' && !skipRepoValidation) {
    await runRepoReadyValidationBundle();
  }

  if (scope === 'full' && !skipFullValidation) {
    await runFullLaunchValidationBundle({
      liveBaseUrl,
      fetchImpl: fetch,
    });
  }

  const report = await generateFinalLaunchChecklistReport({
    includeStateful,
    liveBaseUrl,
    scope,
    fetchImpl: scope === 'full' ? fetch : undefined,
  });
  const executionChecklistPath =
    scope === 'full' ? await writeFullLaunchExecutionChecklist(report) : null;

  console.log(
    JSON.stringify(
      {
        scope: report.scope,
        verdict: report.verdict,
        generatedAt: report.generatedAt,
        outputs: report.outputs,
        statusCounts: report.statusCounts,
        trueBlockers: report.trueBlockers.map((item) => ({
          id: item.id,
          label: item.label,
          status: item.status,
        })),
        externalPrerequisites: report.externalPrerequisites.map((item) => ({
          id: item.id,
          label: item.label,
          status: item.status,
        })),
        executionChecklistPath,
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
