#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();

const strictSuiteRoots = [
  'e2e/strict',
];

const strictContractFiles = [
  'e2e/auth.real.spec.ts',
  'e2e/landing-page.spec.ts',
  'tests/a11y/critical-flows.spec.ts',
];

const forbiddenChecks = [
  {
    name: 'Placeholder assertion',
    pattern: /expect\(\s*true\s*\)/g,
  },
  {
    name: 'Skipped test in strict contract',
    pattern: /\.(?:skip|fixme)\s*\(/g,
  },
  {
    name: 'URL-only assertion helper',
    pattern: /toHaveURL\s*\(/g,
  },
  {
    name: 'Auth fallback URL assertion',
    pattern: /\/auth\/login/g,
  },
];

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(resolved));
      continue;
    }
    if (entry.isFile() && resolved.endsWith('.spec.ts')) {
      files.push(resolved);
    }
  }
  return files;
}

function lineNumberForIndex(content, index) {
  return content.slice(0, index).split('\n').length;
}

function collectTargetFiles() {
  const files = new Set();

  for (const relativeFile of strictContractFiles) {
    const absoluteFile = path.join(rootDir, relativeFile);
    if (fs.existsSync(absoluteFile)) {
      files.add(absoluteFile);
    }
  }

  for (const relativeDirectory of strictSuiteRoots) {
    const absoluteDirectory = path.join(rootDir, relativeDirectory);
    if (!fs.existsSync(absoluteDirectory)) {
      continue;
    }
    for (const suiteFile of walk(absoluteDirectory)) {
      files.add(suiteFile);
    }
  }

  return [...files].sort();
}

const files = collectTargetFiles();
if (files.length === 0) {
  console.error('Strict E2E quality check found no target files.');
  process.exit(1);
}

const violations = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const check of forbiddenChecks) {
    for (const match of content.matchAll(check.pattern)) {
      const index = match.index ?? 0;
      violations.push({
        file: path.relative(rootDir, filePath),
        line: lineNumberForIndex(content, index),
        check: check.name,
        snippet: match[0],
      });
    }
  }
}

if (violations.length > 0) {
  console.error('Strict E2E quality guard failed with forbidden patterns:');
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} [${violation.check}] ${violation.snippet}`
    );
  }
  process.exit(1);
}

console.log(`Strict E2E quality guard passed for ${files.length} file(s).`);
