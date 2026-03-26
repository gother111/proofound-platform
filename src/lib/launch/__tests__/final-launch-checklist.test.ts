import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  FINAL_LAUNCH_CHECKLIST_DEFINITIONS,
  generateFinalLaunchChecklistReport,
} from '@/lib/launch/final-launch-checklist';

const createdDirs: string[] = [];

async function writeFile(root: string, relativePath: string, content: string) {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf8');
}

async function createWorkspaceFixture() {
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

Make portfolio-ready easy. Make intro-eligible hard.
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

Keep the product corridor honest: portfolio-ready can be easy, intro-eligible cannot be cheapened.
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

    const signoffItem = report.items.find((item) => item.id === 'founder_go_no_go_signed_after_green');

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
    const json = JSON.parse(await fs.readFile(jsonPath, 'utf8')) as { items: Array<{ id: string }> };

    expect(markdown).toContain('## Product');
    expect(markdown).toContain('## Engineering');
    expect(markdown).toContain('## QA');
    expect(markdown).toContain('## Ops');
    expect(markdown).toContain('## Founder / GTM');
    expect(json.items).toHaveLength(FINAL_LAUNCH_CHECKLIST_DEFINITIONS.length);
  });
});
