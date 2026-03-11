#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
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

function buildProjectPayload({
  rootDirectory,
  sourceProject,
  enableAffectedProjectsDeployments,
}) {
  const payload = {
    framework: 'nextjs',
    rootDirectory,
    nodeVersion: sourceProject?.nodeVersion ?? '20.x',
    directoryListing: false,
    sourceFilesOutsideRootDirectory: true,
    enableAffectedProjectsDeployments,
    buildCommand: null,
    installCommand: null,
    outputDirectory: null,
    devCommand: null,
  };

  if (sourceProject?.serverlessFunctionRegion && !sourceProject?.resourceConfig?.functionDefaultRegions) {
    payload.serverlessFunctionRegion = sourceProject.serverlessFunctionRegion;
  }

  if (sourceProject?.resourceConfig) {
    payload.resourceConfig = sourceProject.resourceConfig;
  }

  return payload;
}

function runVercelProjectAdd(projectName, teamId) {
  const result = spawnSync(
    'npx',
    ['-y', 'vercel@latest', 'project', 'add', projectName, '--scope', teamId, '--token', process.env.VERCEL_TOKEN],
    {
      cwd: process.cwd(),
      env: process.env,
      encoding: 'utf8',
    }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    fail(`Failed to create project ${projectName}.`);
  }
}

async function main() {
  const projectName = readArg('--project');
  const rootDirectory = readArg('--root-directory');
  const sourceProjectName = readArg('--source-project') ?? 'proofound-platform';
  const enableAffectedProjectsDeployments = hasFlag('--enable-affected-projects');

  if (!projectName) fail('--project is required.');
  if (!rootDirectory) fail('--root-directory is required.');

  const teamId = await resolveTeamId();
  const sourceProject = await getProjectByName(sourceProjectName, teamId);
  if (!sourceProject) {
    fail(`Source project "${sourceProjectName}" was not found.`);
  }

  let targetProject = await getProjectByName(projectName, teamId);
  if (!targetProject) {
    runVercelProjectAdd(projectName, teamId);
    targetProject = await getProjectByName(projectName, teamId);
  }

  if (!targetProject) {
    fail(`Project "${projectName}" could not be resolved after creation.`);
  }

  const sourceDetail = await api(`/v9/projects/${sourceProject.id}?teamId=${teamId}`);
  const payload = buildProjectPayload({
    rootDirectory,
    sourceProject: sourceDetail,
    enableAffectedProjectsDeployments,
  });

  const updated = await api(`/v9/projects/${targetProject.id}?teamId=${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  console.log(
    JSON.stringify(
      {
        id: updated.id,
        name: updated.name,
        rootDirectory: updated.rootDirectory,
        nodeVersion: updated.nodeVersion,
        framework: updated.framework,
        productionBranch: updated.link?.productionBranch ?? null,
        gitRepo: updated.link?.repo ? `${updated.link.org}/${updated.link.repo}` : null,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[vercel-ensure-project] failed', error.message);
  process.exit(1);
});
