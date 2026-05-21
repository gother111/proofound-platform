#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const compareProject = readArg('--compare-project');
const strictCompare = args.includes('--strict-compare');

const token = process.env.VERCEL_TOKEN;
const canonicalProjectName = process.env.VERCEL_CANONICAL_PROJECT ?? 'proofound-platform';
const expectedProductionBranch =
  process.env.VERCEL_EXPECTED_PRODUCTION_BRANCH ?? 'master';

const requiredEnvByTarget = {
  production: [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'CRON_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
  ],
  preview: [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'CRON_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
  ],
  development: [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'CRON_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
  ],
};

const compareKeys = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'CRON_SECRET',
  'GOOGLE_REDIRECT_URI',
  'RESEND_API_KEY',
  'EMAIL_FROM',
];

const forbiddenEnvByTarget = {
  production: [
    'NEXT_PUBLIC_USE_MOCK_SUPABASE',
    'MOCK_ADMIN_MODE',
    'MOCK_PLATFORM_ROLE',
    'MOBILE_MOCK_AUTH',
    'PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY',
    'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK',
    'PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE',
    'DEBUG_INGEST_ENABLED',
    'DEBUG_INGEST_URL',
    'NEXT_PUBLIC_DEBUG_INGEST_URL',
  ],
  preview: [
    'NEXT_PUBLIC_USE_MOCK_SUPABASE',
    'MOCK_ADMIN_MODE',
    'MOCK_PLATFORM_ROLE',
    'MOBILE_MOCK_AUTH',
    'PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY',
    'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK',
    'PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE',
    'DEBUG_INGEST_ENABLED',
    'DEBUG_INGEST_URL',
    'NEXT_PUBLIC_DEBUG_INGEST_URL',
  ],
};

function hashValue(value) {
  if (value == null) return 'MISSING';
  const digest = createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
  return `len:${String(value).length}|sha:${digest}`;
}

async function api(pathname, init = {}) {
  const response = await fetch(`https://api.vercel.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json = await response.json();
  if (!response.ok) {
    const message = json?.error?.message ?? json?.error?.code ?? JSON.stringify(json);
    throw new Error(`${pathname} -> ${response.status}: ${message}`);
  }
  return json;
}

function addTargets(targetMap, key, target) {
  const targets = Array.isArray(target) ? target : [target];
  for (const t of targets) {
    if (!targetMap.has(t)) targetMap.set(t, new Set());
    targetMap.get(t).add(key);
  }
}

function toTargetValueMap(envs) {
  const map = new Map();
  for (const envVar of envs) {
    const targets = Array.isArray(envVar.target) ? envVar.target : [envVar.target];
    for (const target of targets) {
      if (!map.has(target)) map.set(target, new Map());
      map.get(target).set(envVar.key, envVar.value);
    }
  }
  return map;
}

async function getProjectByName(name) {
  const list = await api('/v9/projects?limit=100');
  const project = (list.projects ?? []).find((item) => item.name === name);
  if (!project) {
    throw new Error(`Project \"${name}\" was not found in Vercel account scope.`);
  }
  return project;
}

async function readLocalProjectLink() {
  const projectJsonPath = path.join(process.cwd(), '.vercel', 'project.json');
  try {
    const raw = await fs.readFile(projectJsonPath, 'utf8');
    return {
      ...JSON.parse(raw),
      source: projectJsonPath,
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    const projectId = process.env.VERCEL_PROJECT_ID;
    if (!projectId) {
      throw new Error(
        '.vercel/project.json was not found and VERCEL_PROJECT_ID is not set.'
      );
    }

    return {
      orgId: process.env.VERCEL_ORG_ID ?? '',
      projectId,
      projectName: process.env.VERCEL_PROJECT_NAME ?? canonicalProjectName,
      source: 'VERCEL_PROJECT_ID',
    };
  }
}

async function main() {
  if (!token) {
    throw new Error('VERCEL_TOKEN is required.');
  }

  const failures = [];

  const localLink = await readLocalProjectLink();
  console.log(
    'Vercel project link:',
    localLink.projectName,
    localLink.projectId,
    `(${localLink.source})`
  );

  if (localLink.projectName !== canonicalProjectName) {
    failures.push(
      `Vercel project link points to ${localLink.projectName}, expected ${canonicalProjectName}`
    );
  }

  const canonicalProject = await api(`/v9/projects/${localLink.projectId}`);
  const actualProjectName = canonicalProject?.name ?? '';
  if (actualProjectName && actualProjectName !== canonicalProjectName) {
    failures.push(
      `Vercel project id resolves to ${actualProjectName}, expected ${canonicalProjectName}`
    );
  }

  const actualProductionBranch =
    canonicalProject?.link?.productionBranch ?? canonicalProject?.productionBranch ?? '';

  console.log('Canonical project production branch:', actualProductionBranch);
  if (actualProductionBranch !== expectedProductionBranch) {
    failures.push(
      `Production branch mismatch. Expected ${expectedProductionBranch}, got ${actualProductionBranch || '(empty)'}`
    );
  }

  const canonicalEnvResponse = await api(
    `/v10/projects/${localLink.projectId}/env?decrypt=false`
  );
  const envs = canonicalEnvResponse.envs ?? [];

  const targetKeyMap = new Map();
  for (const envVar of envs) {
    addTargets(targetKeyMap, envVar.key, envVar.target);
  }

  for (const [target, requiredKeys] of Object.entries(requiredEnvByTarget)) {
    const keySet = targetKeyMap.get(target) ?? new Set();
    const missingKeys = requiredKeys.filter((key) => !keySet.has(key));

    if (missingKeys.length > 0) {
      failures.push(`Missing ${target} env keys: ${missingKeys.join(', ')}`);
    } else {
      console.log(`OK ${target} env presence (${requiredKeys.length} keys)`);
    }
  }

  for (const [target, forbiddenKeys] of Object.entries(forbiddenEnvByTarget)) {
    const keySet = targetKeyMap.get(target) ?? new Set();
    const presentForbiddenKeys = forbiddenKeys.filter((key) => keySet.has(key));

    if (presentForbiddenKeys.length > 0) {
      failures.push(`Forbidden ${target} env keys: ${presentForbiddenKeys.join(', ')}`);
    } else {
      console.log(`OK ${target} forbidden env absence (${forbiddenKeys.length} keys)`);
    }
  }

  if (compareProject) {
    console.log(`\nEnv parity snapshot against project: ${compareProject}`);
    const comparisonProject = await getProjectByName(compareProject);

    const [canonicalComparable, comparisonComparable] = await Promise.all([
      api(`/v10/projects/${localLink.projectId}/env?decrypt=true`),
      api(`/v10/projects/${comparisonProject.id}/env?decrypt=true`),
    ]);

    const canonicalMap = toTargetValueMap(canonicalComparable.envs ?? []);
    const comparisonMap = toTargetValueMap(comparisonComparable.envs ?? []);

    const parityDiffs = [];
    for (const target of ['production', 'preview', 'development']) {
      console.log(`\nTarget: ${target}`);
      for (const key of compareKeys) {
        const leftValue = canonicalMap.get(target)?.get(key);
        const rightValue = comparisonMap.get(target)?.get(key);

        const status =
          leftValue == null && rightValue == null
            ? 'BOTH_MISSING'
            : leftValue == null || rightValue == null
              ? 'ONE_MISSING'
              : leftValue === rightValue
                ? 'SAME'
                : 'DIFF';

        console.log(
          `${key} | ${status} | ${canonicalProjectName}:${hashValue(leftValue)} | ${compareProject}:${hashValue(rightValue)}`
        );

        if (status !== 'SAME' && status !== 'BOTH_MISSING') {
          parityDiffs.push(`${target}:${key}:${status}`);
        }
      }
    }

    if (strictCompare && parityDiffs.length > 0) {
      failures.push(`Strict compare mismatch count: ${parityDiffs.length}`);
    }
  }

  if (failures.length > 0) {
    console.error('\nPreflight failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('\nVercel preflight passed.');
}

main().catch((error) => {
  console.error('Preflight error:', error.message);
  process.exit(1);
});
