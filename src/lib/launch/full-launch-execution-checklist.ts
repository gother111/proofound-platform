import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  FinalLaunchChecklistItemResult,
  FinalLaunchChecklistReport,
} from '@/lib/launch/final-launch-checklist';

export const FULL_LAUNCH_EXECUTION_CHECKLIST_FILE_NAME = 'full-launch-execution-checklist.md';

type ExecutionOwner =
  | 'Engineering'
  | 'Incident owner'
  | 'Support / verification lead'
  | 'Founder'
  | 'Founder + incident owner';

type ExecutionEntry = {
  owner: ExecutionOwner;
  passCriteria: string;
  evidenceRequired: string[];
  action: string;
};

const EXECUTION_MAP: Record<string, ExecutionEntry> = {
  engineering_build_clean: {
    owner: 'Engineering',
    passCriteria: '`npm run build` passes in the fresh full-launch bundle.',
    evidenceRequired: ['Fresh `24_gate_summary.json` with `prod_build: PASS`.'],
    action: 'Run the full-launch validation bundle and confirm the generated build log is green.',
  },
  engineering_next_start_stable: {
    owner: 'Engineering',
    passCriteria: 'Fresh local production boot succeeds and reaches healthy state.',
    evidenceRequired: ['Fresh `24_gate_summary.json` with `prod_boot: PASS`.'],
    action: 'Use the full-launch validation bundle to rebuild and boot local prod before launch.',
  },
  engineering_route_allowlist_reduced: {
    owner: 'Engineering',
    passCriteria: 'Fresh route/page inventory evidence passes without launch-surface drift.',
    evidenceRequired: [
      'Fresh `24_gate_summary.json` with `route_surface_and_archived_routes: PASS`.',
    ],
    action:
      'Keep route inventory tests green and remove or hard-gate any newly exposed non-MVP routes.',
  },
  engineering_legacy_decision_and_route_drift_removed: {
    owner: 'Engineering',
    passCriteria: 'The same fresh route-surface gate passes with no legacy drift.',
    evidenceRequired: ['Fresh `24_gate_summary.json` route-surface evidence.'],
    action: 'Treat any route drift as a launch blocker until the allowlist is back to green.',
  },
  engineering_launch_status_fresh_evidence: {
    owner: 'Engineering',
    passCriteria:
      'Fresh full smoke and live launch-status both report green in the current validation bundle.',
    evidenceRequired: [
      'Fresh `24_gate_summary.json` with `live_launch_smoke_artifact_refresh: PASS`.',
      'Fresh `24_gate_summary.json` with `live_launch_status: PASS`.',
    ],
    action:
      'Run the full-launch validation bundle against the live base URL and confirm both gates are green.',
  },
  qa_archived_route_and_surface_tests: {
    owner: 'Engineering',
    passCriteria: 'Fresh launch-surface evidence passes and archived-route drift stays closed.',
    evidenceRequired: [
      'Fresh `24_gate_summary.json` with `route_surface_and_archived_routes: PASS`.',
    ],
    action: 'Keep the route/page inventory suite in the full-launch validation pack.',
  },
  product_private_context_scaffolding: {
    owner: 'Engineering',
    passCriteria: 'Fresh full-launch bundle includes passing private context scaffolding evidence.',
    evidenceRequired: ['Fresh `24_gate_summary.json` with `private_context_scaffolding: PASS`.'],
    action: 'Carry the repo-ready private context gate into the full-launch bundle.',
  },
  qa_manual_privacy_sweep: {
    owner: 'Support / verification lead',
    passCriteria:
      'Fresh privacy validation evidence is green and the operator confirms no manual leak cases.',
    evidenceRequired: [
      'Fresh `24_gate_summary.json` with `manual_privacy_sweep: PASS`.',
      'Operator signoff against reveal/privacy SOP.',
    ],
    action:
      'Review reveal and upload privacy SOPs while confirming the fresh privacy test pack stayed green.',
  },
  qa_workflow_email_privacy_sweep: {
    owner: 'Support / verification lead',
    passCriteria:
      'Fresh workflow email privacy evidence is green and comms templates are reviewed.',
    evidenceRequired: [
      'Fresh `24_gate_summary.json` with `workflow_email_privacy: PASS`.',
      'Operator review of workflow-critical email templates.',
    ],
    action: 'Confirm no identity-bearing fields appear in pre-reveal workflow communications.',
  },
  ops_internal_admin_surfaces: {
    owner: 'Incident owner',
    passCriteria:
      'Fresh admin-surface validation is green and the on-call operator confirms usability.',
    evidenceRequired: [
      'Fresh `24_gate_summary.json` with `internal_admin_surfaces: PASS`.',
      'Operator confirmation that internal queues and links are usable.',
    ],
    action:
      'Open internal ops surfaces during launch prep and verify the protection/usability path end to end.',
  },
  ops_incident_roles_assigned: {
    owner: 'Founder + incident owner',
    passCriteria:
      'Named live humans are assigned to incident, technical, product/ops, and support/verification roles.',
    evidenceRequired: ['A dated launch owner roster or signed runbook note.'],
    action: 'Assign named people to each runbook role before launch day.',
  },
  ops_critical_alerts_configured: {
    owner: 'Incident owner',
    passCriteria: 'Critical-path alerts are enabled and have been test-fired or acknowledged.',
    evidenceRequired: [
      'Alert screenshots or alert test logs for auth, email, uploads, workflow failures, and privacy issues.',
    ],
    action: 'Verify live monitoring and delivery for the runbook alert categories.',
  },
  ops_backup_restore_verified: {
    owner: 'Incident owner',
    passCriteria: 'A real restore drill was run successfully against an isolated target.',
    evidenceRequired: ['A dated restore drill log or checklist signed after success.'],
    action: 'Run the restore drill before broad launch and record the outcome.',
  },
  founder_icp_design_partner_locked: {
    owner: 'Founder',
    passCriteria:
      'The launch ICP and design-partner target list are frozen for the current corridor.',
    evidenceRequired: ['A dated target list or launch memo.'],
    action: 'Stop expanding the target market and lock the initial partner list.',
  },
  founder_pilot_package_documented: {
    owner: 'Founder',
    passCriteria:
      'Pilot scope, timeline, pricing/terms, and case-study expectations are documented.',
    evidenceRequired: ['Pilot package doc or launch memo.'],
    action: 'Write the exact pilot offer before outreach continues.',
  },
  founder_outbound_and_homepage_match: {
    owner: 'Founder',
    passCriteria: 'Outbound copy and homepage messaging sell the same wedge.',
    evidenceRequired: ['Homepage snapshot plus outbound template set.'],
    action: 'Review launch copy side by side and remove wedge drift.',
  },
  founder_candidate_supply_plan: {
    owner: 'Founder',
    passCriteria:
      'There is a concrete plan to seed credible candidate supply for the launch corridor.',
    evidenceRequired: ['Supply plan document with source channels and volume assumptions.'],
    action: 'Write the first-wave sourcing plan before launching org outreach.',
  },
  founder_org_onboarding_playbook: {
    owner: 'Founder',
    passCriteria: 'A repeatable org onboarding playbook exists for the pilot motion.',
    evidenceRequired: ['Onboarding checklist or operator playbook.'],
    action: 'Document the exact pilot onboarding steps and owner handoffs.',
  },
  founder_go_no_go_signed_after_green: {
    owner: 'Founder + incident owner',
    passCriteria:
      'A human go/no-go decision is explicitly signed after all blocking evidence is green.',
    evidenceRequired: ['Dated signoff note referencing the fresh full-launch bundle.'],
    action: 'Hold a final launch review and record the decision only after the bundle is green.',
  },
};

function renderSection(title: string, items: FinalLaunchChecklistItemResult[]) {
  if (items.length === 0) {
    return [`## ${title}`, '', '- No open items in this section.', ''];
  }

  return [
    `## ${title}`,
    '',
    ...items.flatMap((item) => {
      const config = EXECUTION_MAP[item.id];
      const evidence = config?.evidenceRequired ?? ['Fresh explicit evidence is still required.'];
      return [
        `- ${item.label}`,
        `  - Status: \`${item.status}\``,
        `  - Owner: ${config?.owner ?? 'Engineering'}`,
        `  - Pass criteria: ${config?.passCriteria ?? item.summary}`,
        `  - Action: ${config?.action ?? 'Resolve the underlying blocker and attach fresh evidence.'}`,
        `  - Evidence required: ${evidence.join(' | ')}`,
      ];
    }),
    '',
  ];
}

export async function writeFullLaunchExecutionChecklist(report: FinalLaunchChecklistReport) {
  if (report.scope !== 'full') {
    return null;
  }

  const openItems = report.items.filter((item) => item.status !== 'PASS');
  const repoOwned = openItems.filter(
    (item) => item.section !== 'Founder / GTM' && item.id !== 'founder_go_no_go_signed_after_green'
  );
  const founderItems = openItems.filter(
    (item) => item.section === 'Founder / GTM' || item.id === 'founder_go_no_go_signed_after_green'
  );

  const lines = [
    '# Full Launch Execution Checklist',
    '',
    `Generated: ${report.generatedAt}`,
    `Verdict: \`${report.verdict}\``,
    `Source bundle: \`${report.outputs.jsonPath}\``,
    '',
    'This checklist converts the current full launch report into execution steps with owners, pass criteria, and evidence requirements.',
    '',
    ...renderSection('Repo + Ops', repoOwned),
    ...renderSection('Founder / GTM + Signoff', founderItems),
  ];

  const outputPath = path.join(
    report.workspaceRoot,
    path.dirname(report.outputs.jsonPath),
    FULL_LAUNCH_EXECUTION_CHECKLIST_FILE_NAME
  );
  await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  return path.relative(report.workspaceRoot, outputPath).replace(/\\/g, '/');
}
