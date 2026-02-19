#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const MODES = {
  session: {
    dir: 'agent/scratchpad/entries',
    heading: 'Session Log Entry',
    body: [
      'Task summary:',
      '- ',
      '',
      'What worked:',
      '- ',
      '',
      'What failed / wrong assumptions:',
      '- ',
      '',
      'User corrections:',
      '- None.',
      '',
      'Assumptions taken without asking:',
      '- ',
      '',
      'What the user corrected afterward:',
      '- None.',
      '',
      'Improvements next time:',
      '- ',
      '',
      'Commands run + outcomes:',
      '- ',
      '',
      'Open TODOs / follow-ups:',
      '- ',
    ],
  },
  change: {
    dir: 'project/changes/entries',
    heading: 'Project Change Entry',
    body: [
      'What changed:',
      '- ',
      '',
      'Why:',
      '- ',
      '',
      'How to verify:',
      '- ',
      '',
      'Open risks / TODO:',
      '- ',
    ],
  },
};

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function nowUtcParts() {
  const iso = new Date().toISOString();
  const timestamp = iso.replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
  const human = iso.replace(/\.\d{3}Z$/, 'Z');
  return { timestamp, human };
}

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function main() {
  const modeArg = process.argv[2] || 'session';
  const mode = MODES[modeArg];

  if (!mode) {
    console.error('Usage: node scripts/new-session-log.mjs <session|change>');
    process.exit(1);
  }

  const branch = sanitize(run('git rev-parse --abbrev-ref HEAD') || 'detached');
  const shortSha = sanitize(run('git rev-parse --short HEAD') || 'no-sha');
  const { timestamp, human } = nowUtcParts();
  const filename = `${timestamp}__${branch}__${shortSha}.md`;
  const relativePath = path.join(mode.dir, filename);
  const absolutePath = path.join(process.cwd(), relativePath);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  if (fs.existsSync(absolutePath)) {
    console.error(`Entry already exists: ${relativePath}`);
    process.exit(1);
  }

  const headerLines = [
    `# ${mode.heading}`,
    '',
    `- Date/time (UTC): ${human}`,
    `- Branch: ${branch}`,
    `- Base commit: ${shortSha}`,
    '',
  ];

  const content = `${headerLines.join('\n')}${mode.body.join('\n')}\n`;
  fs.writeFileSync(absolutePath, content, 'utf8');

  console.log(relativePath);
}

main();
