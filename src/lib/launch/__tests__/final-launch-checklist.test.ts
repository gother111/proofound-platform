import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  FINAL_LAUNCH_CHECKLIST_DEFINITIONS,
  generateFinalLaunchChecklistReport,
} from '@/lib/launch/final-launch-checklist';
import { REPO_READY_VALIDATION_FILE_NAME } from '@/lib/launch/repo-ready-validation';

const createdDirs: string[] = [];

async function writeFile(root: string, relativePath: string, content: string) {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf8');
}

async function createWorkspaceFixture(
  options: { includeRepoReadyBundle?: boolean; includeLaunchEvidence?: boolean } = {}
) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'proofound-launch-checklist-'));
  createdDirs.push(workspace);

  await writeFile(
    workspace,
    '.artifacts/proofound-current-state-reality-check.md',
    `# Proofound Current-State Reality Check

| Requirement | Status | Severity | Fresh current-block evidence | Notes |
| --- | --- | --- | --- | --- |
| Proof Pack canonicality | \`PASS\` | \`P1\` | Canonical proof-pack evidence is fresh. | Launch-visible proof surfaces use canonical Proof Packs. |
| launch ops / smoke freshness / launch-status truth | \`PASS\` | \`P0\` | Smoke freshness logic passed. | Freshness-aware launch truth is green in this artifact. |
| canonical role and RLS truth | \`PASS\` | \`P1\` | Role and RLS checks passed. | Canonical role and RLS truth passed. |
| review -> intro -> reveal -> interview -> decision -> hire -> engagement verification | \`PASS\` | \`P0\` | Full corridor passed. | Full org corridor passed. |
| assignment create / edit / publish | \`PASS\` | \`P1\` | Assignment flow passed. | Assignment flow passed. |

## Stale Claims To Retire Now

- Older route counts are stale.
`
  );

  await writeFile(
    workspace,
    'docs/verification-checklist.md',
    `# Verification Checklist

| Requirement | Authority source | Required evidence | Latest evidence | Current status |
| --- | --- | --- | --- | --- |
| Proof Pack canonicality | Locked MVP | Fresh proof evidence | Canonical proof evidence passed. | \`PASS\` |
| bounded verification semantics | Locked MVP | Fresh verification evidence | Verification status route is canonical. | \`PASS\` |
| blind-by-default review | Locked MVP | Fresh review evidence | Blind review passed. | \`PASS\` |
| candidate-consented reveal | Locked MVP | Fresh reveal evidence | Reveal passed. | \`PASS\` |
| assignment create / edit / publish | Locked MVP | Fresh assignment evidence | Assignment publish passed. | \`PASS\` |
`
  );

  await writeFile(
    workspace,
    '.artifacts/proofound-implementation-status-snapshot.md',
    `# Proofound Implementation Status Snapshot

- \`npm run build\` -> \`PASS\`
- \`npm run typecheck\` -> \`PASS\`
- \`PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:org:strict\` -> \`PASS\`
`
  );

  await writeFile(
    workspace,
    '.artifacts/launch-readiness-summary.md',
    `# Proofound Launch Verdict Memo

- Older build-pass memo is stale.

## Current Conclusion

- The current workspace still has route breadth risk.
`
  );

  await writeFile(
    workspace,
    '.artifacts/proofound-priority-file-map.md',
    `# Proofound Priority File Map

## Tier 1: Start Here

- \`.artifacts/proofound-current-state-reality-check.md\`
`
  );

  await writeFile(
    workspace,
    'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
    `# Locked MVP

Make portfolio-ready narrow and verified. Make intro-eligible hard.
The proof-first hiring corridor is centered on Proof Packs.
It includes org_owner, org_manager, and org_reviewer.
`
  );

  await writeFile(
    workspace,
    'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md',
    `# Proof-First PRD

Intro-eligible users must have anchored Proof Packs.
`
  );

  await writeFile(
    workspace,
    'Proofound_Project_Specification_2026-03-11.md',
    `# Project Spec

portfolio-ready and intro-eligible are clearly distinct
`
  );

  await writeFile(
    workspace,
    'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
    `# Launch Runbook

Keep the product corridor honest: portfolio-ready must be narrow and verified, intro-eligible cannot be cheapened.
backups and restore checks have been run
critical alerts are configured
`
  );

  await writeFile(
    workspace,
    'README.md',
    `# Proofound

\`npm run db:backup:checkpoint\`
`
  );

  await writeFile(
    workspace,
    'docs/launch-operations-mvp.md',
    `# Launch Operations MVP

- Operator: review verification queue, resolve disputes.
`
  );

  await writeFile(
    workspace,
    'docs/monitoring-alerting.md',
    `# Monitoring and Alerting

Configure critical alerts:
`
  );

  await writeFile(
    workspace,
    'docs/launch-restore-drill.md',
    `# Launch Restore Drill

\`npm run db:backup:checkpoint\`
\`npm run db:restore:verify -- --checkpoint <dir>\`
`
  );

  await writeFile(
    workspace,
    'docs/internal-ops/index.md',
    `# Internal Ops SOP Index

## Live owners

- \`Support / verification lead\`
- \`Product / ops lead\`
- \`Engineering on-call\`

| Document | Owner | Escalation owner | Intended use | Queue mapping |
| --- | --- | --- | --- | --- |
| [verification-review-sop.md](./verification-review-sop.md) | \`Support / verification lead\` | \`Product / ops lead\` | Verification review | \`verification\` |
| [redaction-risky-upload-sop.md](./redaction-risky-upload-sop.md) | \`Support / verification lead\` | \`Product / ops lead\` | Risky upload review | \`correction_revocation\` shown as \`redaction / risky upload\` |

## Queue surfaces

- Internal queue view: \`/admin/verification\`
- Audit trail view: \`/admin/audit\`
- Queue API: \`GET /api/admin/internal-ops/queues\`
`
  );

  if (options.includeLaunchEvidence) {
    await writeFile(
      workspace,
      'Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md',
      `# Proofound GTM and Initial Marketing Plan

## ICP and Design-Partner Target List

Status: \`PASS\`

first-wave design partners are locked.

## Pilot Package

Status: \`PASS\`

scope, timeline, and case-study terms are documented.

## Outbound and Homepage Wedge

Status: \`PASS\`

Hire through proof, not profile theater.
See the work behind the claim.

## Candidate Supply-Seeding Plan

Status: \`PASS\`

source channels, volume assumptions, and readiness criteria are documented.

## Org Onboarding Playbook

Status: \`PASS\`

assignment, proof expectations, and verification queue handoffs are documented.
`
    );

    await writeFile(
      workspace,
      'docs/internal-ops/launch-owner-roster-2026-04-27.md',
      `# Launch Owner Roster

Status: \`PASS\`

| Role | Named human |
| --- | --- |
| Founder / launch owner | Yurii Bakurov |
| Incident owner | Yurii Bakurov |
| Technical owner | Yurii Bakurov |
| Product / ops owner | Yurii Bakurov |
| Support / verification owner | Yurii Bakurov |
`
    );

    await writeFile(
      workspace,
      'docs/internal-ops/production-launch-evidence-2026-04-27.md',
      `# Production Launch Evidence

Critical alert drill status: \`PASS\`

Live \`/api/monitoring/launch-status\`: \`PASS\`

auth email upload workflow privacy

Restore drill status: \`UNVERIFIED\`
`
    );
  }

  await writeFile(
    workspace,
    'docs/internal-ops/verification-review-sop.md',
    `# Verification Review SOP

Owner: \`Support / verification lead\`
`
  );

  await writeFile(
    workspace,
    'docs/internal-ops/redaction-risky-upload-sop.md',
    `# Redaction / Risky Upload SOP

Owner: \`Support / verification lead\`
sanitized filename
metadata
Do not restore identity-bearing names or metadata for convenience.
`
  );

  await writeFile(
    workspace,
    'docs/internal-ops/reveal-privacy-dispute-sop.md',
    `# Reveal / Privacy Dispute SOP

a reveal request times out or is disputed
a privacy complaint affects a live intro, interview, or decision path
consent
`
  );

  await writeFile(
    workspace,
    'docs/internal-ops/engagement-verification-evidence-checklist.md',
    `# Engagement Verification Evidence Checklist

Owner: \`Support / verification lead\`
engagement verification
queue note
`
  );

  await writeFile(
    workspace,
    'docs/internal-ops/assignment-quality-checklist.md',
    `# Assignment Quality Checklist

business value
real outcomes
proof expectation
practical constraints
queue item must say which checklist point failed or passed
`
  );

  await writeFile(
    workspace,
    '.artifacts/launch-validation-2026-03-25/24_gate_summary.json',
    JSON.stringify(
      {
        generatedAt: '2026-03-25T20:12:51.222Z',
        branch: 'master',
        head: 'fixture-head',
        verdict: 'NO_GO',
        gates: [
          {
            id: 'prod_build',
            status: 'FAIL',
            summary: 'Build failed with PageNotFoundError for /_document.',
            evidence: ['01_local_build.log'],
          },
          {
            id: 'prod_boot',
            status: 'FAIL',
            summary: 'Prod boot failed.',
            evidence: ['02_local_start.log'],
          },
          {
            id: 'route_surface_and_archived_routes',
            status: 'FAIL',
            summary: '18 compiled API routes remain outside the corridor.',
            evidence: ['03_route_surface.log'],
          },
          {
            id: 'public_org_trust_smoke',
            status: 'PASS',
            summary: 'Public org trust smoke passed.',
            evidence: ['04_public_org_trust_smoke_live.log'],
          },
          {
            id: 'privacy_rls_live_db',
            status: 'PASS',
            summary: 'Privacy/RLS checks passed.',
            evidence: ['11_test_privacy.log'],
          },
          {
            id: 'live_launch_smoke_artifact_refresh',
            status: 'PASS',
            summary: 'Launch smoke artifact refreshed successfully.',
            evidence: ['21_live_launch_smoke.log'],
          },
          {
            id: 'live_launch_status',
            status: 'FAIL',
            summary: 'Live launch-status remained blocked because missing_smoke_artifact.',
            evidence: ['23_live_launch_status.json'],
          },
        ],
      },
      null,
      2
    )
  );

  if (options.includeRepoReadyBundle) {
    await writeFile(
      workspace,
      `.artifacts/launch-validation-2026-04-14/${REPO_READY_VALIDATION_FILE_NAME}`,
      JSON.stringify(
        {
          schemaVersion: 1,
          kind: 'repo_ready_validation',
          scope: 'repo',
          generatedAt: '2026-04-14T21:00:00.000Z',
          authoritativeBaseUrl: 'http://127.0.0.1:33124',
          verdict: 'READY',
          gates: [
            {
              id: 'prod_build',
              status: 'PASS',
              summary: 'Fresh local build passed.',
              evidence: ['repo-ready-build.log'],
            },
            {
              id: 'prod_boot',
              status: 'PASS',
              summary: 'Fresh local prod boot passed.',
              evidence: ['repo-ready-prod-start.log'],
            },
            {
              id: 'route_surface_and_archived_routes',
              status: 'PASS',
              summary: 'Fresh route inventory tests passed.',
              evidence: ['repo-ready-route-surface.log'],
            },
            {
              id: 'launch_status_route_logic',
              status: 'PASS',
              summary: 'Fresh launch-status route tests passed.',
              evidence: ['repo-ready-launch-status-route.log'],
            },
            {
              id: 'live_launch_smoke_artifact_refresh',
              status: 'PASS',
              summary: 'Fresh smoke artifact refresh passed.',
              evidence: ['repo-ready-launch-smoke.log'],
            },
            {
              id: 'public_org_trust_smoke',
              status: 'PASS',
              summary: 'Fresh public org trust smoke passed.',
              evidence: ['repo-ready-launch-smoke.log'],
            },
            {
              id: 'private_context_scaffolding',
              status: 'PASS',
              summary: 'Private context scaffolding tests passed.',
              evidence: ['repo-ready-private-context.log'],
            },
            {
              id: 'workflow_email_privacy',
              status: 'PASS',
              summary: 'Workflow email privacy tests passed.',
              evidence: ['repo-ready-workflow-email-privacy.log'],
            },
            {
              id: 'manual_privacy_sweep',
              status: 'PASS',
              summary: 'Manual privacy validation tests passed.',
              evidence: ['repo-ready-manual-privacy.log'],
            },
            {
              id: 'internal_admin_surfaces',
              status: 'PASS',
              summary: 'Internal admin surface tests passed.',
              evidence: ['repo-ready-internal-admin.log'],
            },
          ],
        },
        null,
        2
      )
    );
  }

  return workspace;
}

afterEach(async () => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (!dir) continue;
    await fs.rm(dir, { recursive: true, force: true });
  }
});

describe('final launch checklist pipeline', () => {
  it('prefers the latest launch bundle over older contradictory artifacts', async () => {
    const workspace = await createWorkspaceFixture();

    const report = await generateFinalLaunchChecklistReport({
      workspaceRoot: workspace,
      now: new Date('2026-03-25T21:00:00.000Z'),
      fetchImpl: globalThis.fetch,
    });

    const buildItem = report.items.find((item) => item.id === 'engineering_build_clean');

    expect(buildItem?.status).toBe('FAIL');
    expect(buildItem?.summary).toContain('PageNotFoundError');
    expect(buildItem?.retiredStaleClaims.length).toBeGreaterThan(0);
  });

  it('propagates blocker dependencies to the go/no-go signoff row', async () => {
    const workspace = await createWorkspaceFixture();

    const report = await generateFinalLaunchChecklistReport({
      workspaceRoot: workspace,
      now: new Date('2026-03-25T21:00:00.000Z'),
      fetchImpl: globalThis.fetch,
    });

    const signoffItem = report.items.find(
      (item) => item.id === 'founder_go_no_go_signed_after_green'
    );

    expect(signoffItem?.status).toBe('BLOCKED');
    expect(signoffItem?.blockerIds).toContain('engineering_build_clean');
    expect(signoffItem?.blockerIds).toContain('engineering_route_allowlist_reduced');
  });

  it('emits every checklist row with linked evidence in both outputs', async () => {
    const workspace = await createWorkspaceFixture();

    const report = await generateFinalLaunchChecklistReport({
      workspaceRoot: workspace,
      now: new Date('2026-03-25T21:00:00.000Z'),
      fetchImpl: globalThis.fetch,
    });

    expect(report.items).toHaveLength(FINAL_LAUNCH_CHECKLIST_DEFINITIONS.length);
    expect(report.items.every((item) => item.evidence.length > 0)).toBe(true);

    const markdownPath = path.join(workspace, report.outputs.markdownPath);
    const jsonPath = path.join(workspace, report.outputs.jsonPath);
    const markdown = await fs.readFile(markdownPath, 'utf8');
    const json = JSON.parse(await fs.readFile(jsonPath, 'utf8')) as {
      items: Array<{ id: string }>;
    };

    expect(markdown).toContain('## Product');
    expect(markdown).toContain('## Engineering');
    expect(markdown).toContain('## QA');
    expect(markdown).toContain('## Ops');
    expect(markdown).toContain('## Founder / GTM');
    expect(json.items).toHaveLength(FINAL_LAUNCH_CHECKLIST_DEFINITIONS.length);
  });

  it('prefers the freshest repo-ready bundle in repo scope over older full-launch bundles', async () => {
    const workspace = await createWorkspaceFixture({ includeRepoReadyBundle: true });

    const report = await generateFinalLaunchChecklistReport({
      workspaceRoot: workspace,
      scope: 'repo',
      now: new Date('2026-04-14T21:10:00.000Z'),
      fetchImpl: globalThis.fetch,
    });

    const buildItem = report.items.find((item) => item.id === 'engineering_build_clean');

    expect(report.scope).toBe('repo');
    expect(report.latestLaunchBundleDir).toBe('.artifacts/launch-validation-2026-04-14');
    expect(buildItem?.status).toBe('PASS');
    expect(buildItem?.summary).toContain('Fresh local build passed');
  });

  it('treats external prerequisites as non-blocking in repo scope but blocking in full scope', async () => {
    const workspace = await createWorkspaceFixture({ includeRepoReadyBundle: true });

    const repoReport = await generateFinalLaunchChecklistReport({
      workspaceRoot: workspace,
      scope: 'repo',
      now: new Date('2026-04-14T21:10:00.000Z'),
      fetchImpl: globalThis.fetch,
    });
    const fullReport = await generateFinalLaunchChecklistReport({
      workspaceRoot: workspace,
      scope: 'full',
      now: new Date('2026-04-14T21:10:00.000Z'),
      fetchImpl: globalThis.fetch,
    });

    expect(
      repoReport.externalPrerequisites.some(
        (item) => item.id === 'founder_icp_design_partner_locked'
      )
    ).toBe(true);
    expect(
      repoReport.trueBlockers.some((item) => item.id === 'founder_icp_design_partner_locked')
    ).toBe(false);
    expect(
      fullReport.trueBlockers.some((item) => item.id === 'founder_icp_design_partner_locked')
    ).toBe(true);
  });

  it('accepts dated launch evidence for owner, alerts, and GTM rows while keeping restore unverified', async () => {
    const workspace = await createWorkspaceFixture({
      includeRepoReadyBundle: true,
      includeLaunchEvidence: true,
    });

    const report = await generateFinalLaunchChecklistReport({
      workspaceRoot: workspace,
      scope: 'full',
      now: new Date('2026-04-14T21:10:00.000Z'),
      fetchImpl: globalThis.fetch,
    });

    const itemStatus = (id: string) => report.items.find((item) => item.id === id)?.status;

    expect(itemStatus('ops_incident_roles_assigned')).toBe('PASS');
    expect(itemStatus('ops_critical_alerts_configured')).toBe('PASS');
    expect(itemStatus('founder_icp_design_partner_locked')).toBe('PASS');
    expect(itemStatus('founder_pilot_package_documented')).toBe('PASS');
    expect(itemStatus('founder_candidate_supply_plan')).toBe('PASS');
    expect(itemStatus('founder_org_onboarding_playbook')).toBe('PASS');
    expect(itemStatus('ops_backup_restore_verified')).toBe('UNVERIFIED');
  });
});
