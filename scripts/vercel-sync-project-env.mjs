#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

function parseCsv(value) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function fail(message) {
  throw new Error(message);
}

async function readLocalProjectLink() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.vercel', 'project.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function api(pathname, init = {}) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) fail('VERCEL_TOKEN is required.');

  const response = await fetch(`https://api.vercel.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = json?.error?.message ?? json?.error?.code ?? text;
    fail(`${pathname} -> ${response.status}: ${message}`);
  }

  return json;
}

async function resolveTeamId() {
  if (process.env.VERCEL_ORG_ID) return process.env.VERCEL_ORG_ID;
  const localLink = await readLocalProjectLink();
  if (localLink?.orgId) return localLink.orgId;
  fail('Could not resolve VERCEL_ORG_ID from env or .vercel/project.json.');
}

async function getProjectByName(projectName, teamId) {
  const query = new URLSearchParams({
    limit: '100',
    teamId,
  });
  const result = await api(`/v9/projects?${query.toString()}`);
  return (result.projects ?? []).find((project) => project.name === projectName) ?? null;
}

function normalizeTargets(target) {
  return Array.isArray(target) ? target : [target];
}

function shouldSyncEnv(envVar, includeKeys, targetFilter) {
  if (!envVar?.key || envVar.system) return false;
  if (envVar.key === 'NODE_OPTIONS') return false;
  if (envVar.key.startsWith('VERCEL_')) return false;
  if (includeKeys.length > 0 && !includeKeys.includes(envVar.key)) return false;
  if (targetFilter.length === 0) return true;
  const targets = normalizeTargets(envVar.target);
  return targets.some((target) => targetFilter.includes(target));
}

async function upsertEnv(projectId, teamId, envVar) {
  const query = new URLSearchParams({
    teamId,
    upsert: 'true',
  });

  const body = {
    key: envVar.key,
    value: envVar.value,
    type: envVar.type ?? 'encrypted',
    target: normalizeTargets(envVar.target),
  };

  if (envVar.gitBranch) body.gitBranch = envVar.gitBranch;
  if (envVar.comment) body.comment = envVar.comment;
  if (Array.isArray(envVar.customEnvironmentIds) && envVar.customEnvironmentIds.length > 0) {
    body.customEnvironmentIds = envVar.customEnvironmentIds;
  }

  return api(`/v10/projects/${projectId}/env?${query.toString()}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function main() {
  const sourceProjectName = readArg('--source-project');
  const targetProjectName = readArg('--target-project');
  const includeKeys = parseCsv(readArg('--keys'));
  const targetFilter = parseCsv(readArg('--targets'));

  if (!sourceProjectName) fail('--source-project is required.');
  if (!targetProjectName) fail('--target-project is required.');

  const teamId = await resolveTeamId();
  const [sourceProject, targetProject] = await Promise.all([
    getProjectByName(sourceProjectName, teamId),
    getProjectByName(targetProjectName, teamId),
  ]);

  if (!sourceProject) fail(`Source project "${sourceProjectName}" was not found.`);
  if (!targetProject) fail(`Target project "${targetProjectName}" was not found.`);

  const sourceEnvResponse = await api(
    `/v10/projects/${sourceProject.id}/env?teamId=${teamId}&decrypt=true`
  );
  const envs = (sourceEnvResponse.envs ?? []).filter((envVar) =>
    shouldSyncEnv(envVar, includeKeys, targetFilter)
  );

  const synced = [];
  for (const envVar of envs) {
    await upsertEnv(targetProject.id, teamId, envVar);
    synced.push({
      key: envVar.key,
      target: normalizeTargets(envVar.target),
      gitBranch: envVar.gitBranch ?? null,
    });
  }

  console.log(
    JSON.stringify(
      {
        sourceProject: sourceProject.name,
        targetProject: targetProject.name,
        syncedCount: synced.length,
        synced,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[vercel-sync-project-env] failed', error.message);
  process.exit(1);
});
