#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const packageDir = path.join(root, '.artifacts', 'project-source-refresh-2026-05-14');
const logsDir = path.join(packageDir, 'command-logs');
const node24Bin = '/opt/homebrew/opt/node@24/bin';

const commands = [
  { id: 'node_npm_versions', command: 'node -v && npm -v', timeoutMs: 30_000 },
  { id: 'npm_run_lint', command: 'npm run lint', timeoutMs: 180_000 },
  { id: 'npm_run_typecheck', command: 'npm run typecheck', timeoutMs: 360_000 },
  { id: 'npm_run_build', command: 'npm run build', timeoutMs: 720_000 },
  { id: 'npm_run_docs_freshness', command: 'npm run docs:freshness', timeoutMs: 180_000 },
  { id: 'npm_run_test', command: 'npm run test', timeoutMs: 360_000 },
  { id: 'npm_run_test_privacy', command: 'npm run test:privacy', timeoutMs: 240_000 },
  { id: 'npm_run_test_privacy_extended', command: 'npm run test:privacy:extended', timeoutMs: 300_000 },
  {
    id: 'npm_audit_production',
    command: 'npm audit --omit=dev --json',
    timeoutMs: 180_000,
    jsonOutput: path.join(packageDir, 'npm-audit-production.json'),
  },
  {
    id: 'launch_route_inventory_tests',
    command:
      'npm run test -- tests/api/launch-surface-inventory.test.ts tests/api/launch-page-inventory.test.ts src/lib/launch/__tests__/surface-policy.test.ts tests/ui/command-palette-archived-links.test.tsx',
    timeoutMs: 240_000,
  },
  { id: 'npm_run_test_launch_routes', command: 'npm run test:launch:routes', timeoutMs: 240_000 },
  {
    id: 'npm_run_deploy_readiness_strict',
    command: 'npm run deploy:readiness:strict',
    timeoutMs: 120_000,
  },
  {
    id: 'api_reference_generation_temp',
    command: 'node .artifacts/project-source-refresh-2026-05-14/generate-api-reference-evidence.mjs',
    timeoutMs: 180_000,
  },
  {
    id: 'npm_run_launch_checklist_repo',
    command:
      'LAUNCH_CHECKLIST_SCOPE=repo npm run launch:checklist -- --scope repo --skip-full-validation',
    timeoutMs: 720_000,
  },
  {
    id: 'npm_run_launch_validate_package_dir',
    command:
      'npm run launch:validate -- --output-dir .artifacts/project-source-refresh-2026-05-14/launch-validation-current',
    timeoutMs: 1_800_000,
  },
  {
    id: 'npm_run_test_launch_smoke_local',
    command:
      'npm run test:launch:smoke -- --artifact .artifacts/project-source-refresh-2026-05-14/launch-smoke-report.json --base-url http://localhost:3000',
    timeoutMs: 720_000,
  },
  {
    id: 'npm_run_monitor_launch_local_no_persist',
    command:
      'LAUNCH_MONITOR_PERSIST=0 LAUNCH_SMOKE_ARTIFACT_PATH=.artifacts/project-source-refresh-2026-05-14/launch-smoke-report.json BASE_URL=http://localhost:3000 npm run monitor:launch',
    timeoutMs: 240_000,
  },
  {
    id: 'npm_run_landing_tests',
    command: 'npm run test:e2e:landing',
    timeoutMs: 360_000,
  },
  {
    id: 'npm_run_strict_org_corridor',
    command: 'npm run test:e2e:org:strict',
    timeoutMs: 900_000,
  },
];

const requestedIds = new Set(
  String(process.env.EVIDENCE_COMMAND_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const commandsToRun = requestedIds.size
  ? commands.filter((command) => requestedIds.has(command.id))
  : commands;

function classifyFailure(command, code, timedOut, output) {
  const text = output.toLowerCase();
  if (timedOut) return 'environment issue or long-running check timeout';
  if (code === 0) return null;
  if (text.includes('enotfound') || text.includes('econnrefused') || text.includes('failed to fetch')) {
    return 'environment issue';
  }
  if (text.includes('missing env') || text.includes('is required') || text.includes('strict deploy checks')) {
    return 'environment issue';
  }
  if (text.includes('no tests found') || text.includes('not found')) {
    return 'stale-test drift';
  }
  if (command.includes('audit')) return 'dependency/security issue';
  if (command.includes('launch') || command.includes('monitor') || command.includes('e2e')) {
    return 'environment issue or launch evidence prerequisite';
  }
  return 'real implementation failure or test drift';
}

async function runCommand(spec) {
  const logPath = path.join(logsDir, `${spec.id}${requestedIds.size ? '.rerun' : ''}.log`);
  const startedAt = new Date();
  const started = Date.now();
  let output = '';
  let timedOut = false;

  await fs.writeFile(
    logPath,
    [
      `# ${spec.command}`,
      `startedAt=${startedAt.toISOString()}`,
      `cwd=${root}`,
      '',
    ].join('\n'),
    'utf8'
  );

  const child = spawn(spec.command, {
    cwd: root,
    shell: '/bin/zsh',
    env: {
      ...process.env,
      PATH: `${node24Bin}:${process.env.PATH ?? ''}`,
      npm_config_update_notifier: 'false',
      CI: process.env.CI ?? '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const append = async (chunk) => {
    const text = chunk.toString();
    output += text;
    await fs.appendFile(logPath, text, 'utf8');
  };

  child.stdout.on('data', (chunk) => {
    append(chunk).catch(() => {});
  });
  child.stderr.on('data', (chunk) => {
    append(chunk).catch(() => {});
  });

  const timer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
  }, spec.timeoutMs);

  const code = await new Promise((resolve) => {
    child.on('close', (exitCode) => resolve(exitCode ?? 1));
    child.on('error', () => resolve(1));
  });
  clearTimeout(timer);

  const durationMs = Date.now() - started;
  const completedAt = new Date();
  await fs.appendFile(
    logPath,
    `\n\ncompletedAt=${completedAt.toISOString()}\nexitCode=${code}\ndurationMs=${durationMs}\ntimedOut=${timedOut}\n`,
    'utf8'
  );

  if (spec.jsonOutput) {
    const jsonStart = output.indexOf('{');
    const jsonText = jsonStart >= 0 ? output.slice(jsonStart).trim() : output.trim();
    await fs.writeFile(spec.jsonOutput, `${jsonText}\n`, 'utf8').catch(async () => {
      await fs.writeFile(spec.jsonOutput, '{}\n', 'utf8');
    });
  }

  const result = code === 0 ? 'PASS' : timedOut ? 'BLOCKED' : 'FAIL';
  return {
    id: spec.id,
    command: spec.command,
    result,
    exitCode: code,
    timedOut,
    durationMs,
    durationSeconds: Number((durationMs / 1000).toFixed(1)),
    logPath: path.relative(root, logPath),
    failureClass: classifyFailure(spec.command, code, timedOut, output),
    outputTail: output.trim().split('\n').slice(-30).join('\n'),
  };
}

await fs.mkdir(logsDir, { recursive: true });

let existingResults = [];
const resultsPath = path.join(packageDir, 'command-results.json');
if (requestedIds.size) {
  try {
    const existing = JSON.parse(await fs.readFile(resultsPath, 'utf8'));
    existingResults = Array.isArray(existing.results) ? existing.results : [];
  } catch {
    existingResults = [];
  }
}

const rerunResults = [];
for (const command of commandsToRun) {
  console.log(`Running ${command.id}: ${command.command}`);
  const result = await runCommand(command);
  rerunResults.push(result);
  console.log(`${result.result} ${command.id} (${result.durationSeconds}s)`);
}

const rerunIds = new Set(rerunResults.map((result) => result.id));
const results = requestedIds.size
  ? [
      ...existingResults.filter((result) => !rerunIds.has(result.id)),
      ...rerunResults.map((result) => ({ ...result, rerun: true })),
    ].sort((a, b) => commands.findIndex((command) => command.id === a.id) - commands.findIndex((command) => command.id === b.id))
  : rerunResults;

await fs.writeFile(
  resultsPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
  'utf8'
);

const markdown = [
  '# Command Results',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '| Result | Command | Duration | Log | Failure class |',
  '| --- | --- | ---: | --- | --- |',
  ...results.map((result) =>
    [
      `| ${result.result}`,
      `\`${result.command.replaceAll('|', '\\|')}\``,
      `${result.durationSeconds}s`,
      `\`${result.logPath}\``,
      result.failureClass ?? '-',
    ].join(' | ') + ' |'
  ),
  '',
].join('\n');

await fs.writeFile(path.join(packageDir, 'COMMAND_RESULTS.md'), markdown, 'utf8');
