#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import yaml from 'js-yaml';

const WORKFLOW_DIR = path.join('.github', 'workflows');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function addError(errors, file, message) {
  errors.push(`${file}: ${message}`);
}

function validateWorkflow(file, errors) {
  const source = readFileSync(file, 'utf8');
  let parsed;

  try {
    parsed = yaml.load(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addError(errors, file, `invalid YAML (${message})`);
    return;
  }

  if (!isObject(parsed)) {
    addError(errors, file, 'workflow must be a YAML mapping.');
    return;
  }

  if (!parsed.name || typeof parsed.name !== 'string') {
    addError(errors, file, 'workflow must define a non-empty string name.');
  }

  if (!Object.prototype.hasOwnProperty.call(parsed, 'on')) {
    addError(errors, file, 'workflow must define top-level "on" triggers.');
  }

  if (!isObject(parsed.jobs)) {
    addError(errors, file, 'workflow must define top-level jobs.');
    return;
  }

  const jobEntries = Object.entries(parsed.jobs);
  if (jobEntries.length === 0) {
    addError(errors, file, 'workflow jobs must not be empty.');
    return;
  }

  for (const [jobId, job] of jobEntries) {
    if (!isObject(job)) {
      addError(errors, file, `job "${jobId}" must be a YAML mapping.`);
      continue;
    }

    if (typeof job.uses === 'string') {
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(job, 'runs-on')) {
      addError(errors, file, `job "${jobId}" must define runs-on or uses.`);
    }

    if (!Array.isArray(job.steps) || job.steps.length === 0) {
      addError(errors, file, `job "${jobId}" must define at least one step.`);
    }
  }

  if (path.basename(file) === 'retry-vercel-deploy.yml') {
    if (source.includes('run-mvp-strict-gates.mjs')) {
      addError(
        errors,
        file,
        'retry deploy workflow must stay deploy-specific; run the strict MVP gate in CI or Strict Quality instead.'
      );
    }

    const retryJob = parsed.jobs['retry-deploy'];
    const timeoutMinutes = Number(retryJob?.['timeout-minutes']);
    if (Number.isFinite(timeoutMinutes) && timeoutMinutes > 60) {
      addError(
        errors,
        file,
        `retry deploy workflow timeout must stay at or below 60 minutes, got ${timeoutMinutes}.`
      );
    }
  }
}

function main() {
  const files = readdirSync(WORKFLOW_DIR)
    .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
    .sort()
    .map((file) => path.join(WORKFLOW_DIR, file));

  const errors = [];
  for (const file of files) {
    validateWorkflow(file, errors);
  }

  if (errors.length > 0) {
    console.error('GitHub workflow validation failed.');
    console.error(
      'These checks prevent workflows from merging in a shape that GitHub can report as "No jobs were run".'
    );
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`GitHub workflow validation passed (${files.length} workflow files).`);
}

main();
