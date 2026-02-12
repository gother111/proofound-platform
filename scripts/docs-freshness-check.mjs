import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const STRICT = process.env.STRICT_DOCS_FRESHNESS === 'true';
const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, 'docs', 'DOCS_REGISTRY.md');

const GOVERNANCE_PAIRS = [
  ['Prompt.md', 'project/Prompt.md'],
  ['Plans.md', 'project/Plans.md'],
  ['Architecture.md', 'project/Architecture.md'],
  ['Implement.md', 'project/Implement.md'],
  ['setup.md', 'agent/runbooks/setup.md'],
  ['preflight.md', 'agent/checklists/preflight.md'],
  ['verification.md', 'agent/checklists/verification.md'],
  ['Documentation.md', 'project/Documentation.md'],
  ['metrics.md', 'project/Documentation.md'],
];

const ACTIVE_METADATA_REQUIRED = new Set([
  'README.md',
  'docs/API_REFERENCE.md',
  'docs/DOCS_REGISTRY.md',
]);

const ACTIVE_METADATA_EXEMPT = new Set([
  'agent/scratchpad.md',
]);

const ACTIVE_PATTERN_EXEMPT = new Set([
  'agent/scratchpad.md',
]);

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function listMarkdownFiles() {
  const output = execSync("git ls-files '*.md'", { encoding: 'utf8' });
  return output.split('\n').filter(Boolean).sort();
}

function parseRegistry(markdown) {
  const rows = markdown
    .split('\n')
    .filter((line) => line.startsWith('| `') && line.includes(' | `'));

  const map = new Map();

  for (const line of rows) {
    const cols = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim().replace(/^`|`$/g, ''));

    if (cols.length < 7) {
      continue;
    }

    const [docPath, cls, ownerSurface, verificationSource, lastVerified, archiveTarget, protectedFlag] = cols;

    map.set(docPath, {
      path: docPath,
      class: cls,
      ownerSurface,
      verificationSource,
      lastVerified,
      archiveTarget,
      protected: protectedFlag === 'true',
    });
  }

  return map;
}

function collectLinks(markdown) {
  const links = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;

  while ((m = re.exec(markdown)) !== null) {
    links.push(m[1].trim());
  }

  return links;
}

function isExternalLink(target) {
  return (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('mailto:') ||
    target.startsWith('#')
  );
}

function extractLastVerified(markdown) {
  const match = markdown.match(/Last Verified:\s*`([^`]+)`/);
  return match ? match[1].trim() : null;
}

function resolveLocalTarget(sourcePath, target) {
  const clean = target.split('#')[0].split('?')[0];
  return path.resolve(path.dirname(path.join(ROOT, sourcePath)), clean);
}

function main() {
  const files = listMarkdownFiles();
  const registryText = readFile(REGISTRY_PATH);
  const registry = parseRegistry(registryText);

  const warnings = [];

  if (!registry.size) {
    warnings.push(`Registry parsing returned no rows from ${REGISTRY_PATH}.`);
  }

  const nonArchiveFiles = files.filter((f) => !f.startsWith('docs/archive/'));

  for (const file of nonArchiveFiles) {
    if (!registry.has(file)) {
      warnings.push(`Orphan file missing from registry: ${file}`);
    }
  }

  const activeFiles = nonArchiveFiles.filter((f) => registry.get(f)?.class === 'active');

  for (const file of activeFiles) {
    const text = readFile(path.join(ROOT, file));

    if (!ACTIVE_PATTERN_EXEMPT.has(file) && /\/Users\//.test(text)) {
      warnings.push(`Banned absolute path found in active doc: ${file}`);
    }

    if (!ACTIVE_PATTERN_EXEMPT.has(file) && /proofound\.com/i.test(text)) {
      warnings.push(`Legacy domain proofound.com found in active doc: ${file}`);
    }

    if (!ACTIVE_PATTERN_EXEMPT.has(file) && /proofound\.app/i.test(text)) {
      warnings.push(`Legacy domain proofound.app found in active doc: ${file}`);
    }

    const top = text.split('\n').slice(0, 24).join('\n');
    const metadataRequired =
      (registry.get(file)?.protected && !ACTIVE_METADATA_EXEMPT.has(file)) || ACTIVE_METADATA_REQUIRED.has(file);
    if (metadataRequired && (!/Doc Class:/.test(top) || !/Last Verified:/.test(top))) {
      warnings.push(`Missing freshness metadata near top of active doc: ${file}`);
    }

    for (const link of collectLinks(text)) {
      if (isExternalLink(link)) {
        continue;
      }

      const targetPath = resolveLocalTarget(file, link);
      if (!fs.existsSync(targetPath)) {
        warnings.push(`Broken local link: ${file} -> ${link}`);
      }
    }
  }

  for (const [left, right] of GOVERNANCE_PAIRS) {
    if (!fs.existsSync(path.join(ROOT, left)) || !fs.existsSync(path.join(ROOT, right))) {
      warnings.push(`Governance pair missing file(s): ${left} <-> ${right}`);
      continue;
    }

    const leftDate = extractLastVerified(readFile(path.join(ROOT, left)));
    const rightDate = extractLastVerified(readFile(path.join(ROOT, right)));

    if (!leftDate || !rightDate) {
      warnings.push(`Governance pair missing Last Verified metadata: ${left} <-> ${right}`);
      continue;
    }

    if (leftDate !== rightDate) {
      warnings.push(`Governance pair Last Verified mismatch: ${left} (${leftDate}) vs ${right} (${rightDate})`);
    }
  }

  if (warnings.length === 0) {
    console.log('✅ docs:freshness passed with no findings.');
    process.exit(0);
  }

  console.log(`⚠️ docs:freshness reported ${warnings.length} warning(s):`);
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }

  if (STRICT) {
    process.exit(1);
  }

  console.log('ℹ️ Warning mode: not failing build. Set STRICT_DOCS_FRESHNESS=true to enforce.');
  process.exit(0);
}

main();
