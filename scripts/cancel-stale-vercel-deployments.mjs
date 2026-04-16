#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

async function readLocalProjectLink() {
  try {
    const projectJsonPath = path.join(process.cwd(), '.vercel', 'project.json');
    const raw = await fs.readFile(projectJsonPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function api(pathname, init = {}) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('VERCEL_TOKEN is required.');
  }

  const response = await fetch(`https://api.vercel.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = json?.error?.message ?? json?.error?.code ?? text;
    throw new Error(`${pathname} -> ${response.status}: ${message}`);
  }

  return json;
}

async function getProjectIdentity() {
  const localLink = await readLocalProjectLink();
  const envProjectId = process.env.VERCEL_PROJECT_ID;
  const envOrgId = process.env.VERCEL_ORG_ID;

  if (envProjectId) {
    return {
      projectId: envProjectId,
      orgId: envOrgId ?? localLink?.orgId ?? null,
    };
  }

  if (localLink?.projectId) {
    return {
      projectId: localLink.projectId,
      orgId: envOrgId ?? localLink.orgId ?? null,
    };
  }

  const canonicalProjectName = process.env.VERCEL_CANONICAL_PROJECT ?? 'proofound-platform';
  const projectList = await api('/v9/projects?limit=100');
  const match = (projectList.projects ?? []).find((project) => project.name === canonicalProjectName);

  if (!match?.id) {
    throw new Error(
      `Could not resolve Vercel project id. Set VERCEL_PROJECT_ID or link the repo to ${canonicalProjectName}.`
    );
  }

  return {
    projectId: match.id,
    orgId: envOrgId ?? match.accountId ?? null,
  };
}

function normalizeTarget(value) {
  return value || 'preview';
}

function normalizeBranch(deployment) {
  return (
    deployment?.meta?.githubCommitRef ||
    deployment?.meta?.githubCommitSha ||
    deployment?.meta?.branch ||
    null
  );
}

function isCancelableState(state) {
  return ['BUILDING', 'INITIALIZING', 'QUEUED'].includes(String(state).toUpperCase());
}

function deploymentLabel(deployment) {
  return `${normalizeTarget(deployment.target)}:${normalizeBranch(deployment) ?? 'unknown'}:${deployment.uid}`;
}

async function main() {
  const apply = hasFlag('--apply');
  const limit = Number.parseInt(readArg('--limit') ?? '100', 10);
  const targetFilter = readArg('--target');
  const branchFilter = readArg('--branch');

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error('--limit must be a positive integer.');
  }

  const { projectId, orgId } = await getProjectIdentity();
  const params = new URLSearchParams({
    projectId,
    limit: String(limit),
  });

  const result = await api(`/v6/deployments?${params.toString()}`);
  const deployments = (result.deployments ?? [])
    .filter((deployment) => isCancelableState(deployment.readyState))
    .filter((deployment) => {
      if (!targetFilter) return true;
      return normalizeTarget(deployment.target) === targetFilter;
    })
    .filter((deployment) => {
      if (!branchFilter) return true;
      return normalizeBranch(deployment) === branchFilter;
    })
    .sort((left, right) => Number(right.createdAt) - Number(left.createdAt));

  const staleDeployments = [];
  const newestByGroup = new Map();

  for (const deployment of deployments) {
    const branch = normalizeBranch(deployment);
    if (!branch) {
      continue;
    }

    const groupKey = `${normalizeTarget(deployment.target)}::${branch}`;
    if (!newestByGroup.has(groupKey)) {
      newestByGroup.set(groupKey, deployment);
      continue;
    }

    staleDeployments.push(deployment);
  }

  console.log(
    JSON.stringify(
      {
        apply,
        inspected: deployments.length,
        keep: Array.from(newestByGroup.values()).map((deployment) => ({
          uid: deployment.uid,
          target: normalizeTarget(deployment.target),
          branch: normalizeBranch(deployment),
          state: deployment.readyState,
          url: deployment.url,
        })),
        stale: staleDeployments.map((deployment) => ({
          uid: deployment.uid,
          target: normalizeTarget(deployment.target),
          branch: normalizeBranch(deployment),
          state: deployment.readyState,
          url: deployment.url,
        })),
      },
      null,
      2
    )
  );

  if (!apply || staleDeployments.length === 0) {
    return;
  }

  for (const deployment of staleDeployments) {
    const query = new URLSearchParams();
    if (orgId) {
      query.set('teamId', orgId);
    }

    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    await api(`/v13/deployments/${deployment.uid}${suffix}`, {
      method: 'DELETE',
    });
    console.log(`Deleted stale deployment ${deploymentLabel(deployment)}`);
  }
}

main().catch((error) => {
  console.error('[cancel-stale-vercel-deployments] failed', error);
  process.exit(1);
});
