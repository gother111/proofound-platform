import path from 'node:path';

import type {
  FinalLaunchChecklistContext,
  FinalLaunchChecklistItemDefinition,
  FinalLaunchChecklistObservation,
  FinalLaunchChecklistStatus,
  ParsedChecklistRow,
  StatefulCheckResult,
} from './final-launch-checklist';

type BuildFinalLaunchChecklistDefinitionsParams = {
  SOURCE_PRIORITY: {
    latest_launch_bundle: number;
    implementation_snapshot: number;
    tests: number;
    fallback: number;
  };
  compactObservations: <T>(values: Array<T | null | undefined>) => T[];
  checklistRowObservation: (
    row: ParsedChecklistRow | null | undefined,
    sourceId: 'current_state_reality_check' | 'verification_checklist'
  ) => FinalLaunchChecklistObservation | null;
  gateObservation: (
    bundle: FinalLaunchChecklistContext['latestLaunchBundle'],
    gateId: string,
    sourceLabel: string,
    note?: string
  ) => FinalLaunchChecklistObservation | null;
  realityRow: (
    context: FinalLaunchChecklistContext,
    label: string
  ) => ParsedChecklistRow | null | undefined;
  verificationRow: (
    context: FinalLaunchChecklistContext,
    label: string
  ) => ParsedChecklistRow | null | undefined;
  passIfDocs: (
    context: FinalLaunchChecklistContext,
    options: {
      markdown: string | null;
      observedAt: string | null;
      sourcePath: string;
      sourceLabel: string;
      summary: string;
      patterns: Array<string | RegExp>;
    }
  ) => FinalLaunchChecklistObservation[];
  lineMatch: (markdown: string | null, pattern: RegExp) => string | null;
  textContainsAll: (markdown: string | null, patterns: Array<string | RegExp>) => boolean;
  docObservation: (params: {
    status: FinalLaunchChecklistStatus;
    summary: string;
    sourceId: string;
    sourceLabel: string;
    sourcePath: string;
    observedAt: string | null;
    note?: string;
  }) => FinalLaunchChecklistObservation;
  liveEndpointObservation: (
    result: FinalLaunchChecklistContext['liveLaunchStatus'],
    sourceLabel: string,
    successSummary: string,
    failureSummary: string
  ) => FinalLaunchChecklistObservation | null;
  statefulObservation: (
    result: StatefulCheckResult | undefined,
    sourceLabel: string,
    passSummary: string,
    failSummary: string
  ) => FinalLaunchChecklistObservation | null;
  summaryObservation: (
    markdown: string | null,
    pattern: RegExp,
    sourcePath: string,
    sourceLabel: string,
    observedAt: string,
    priority: number,
    staleClaim?: string
  ) => FinalLaunchChecklistObservation | null;
};

export function buildFinalLaunchChecklistDefinitions({
  SOURCE_PRIORITY,
  compactObservations,
  checklistRowObservation,
  gateObservation,
  realityRow,
  verificationRow,
  passIfDocs,
  lineMatch,
  textContainsAll,
  docObservation,
  liveEndpointObservation,
  statefulObservation,
  summaryObservation,
}: BuildFinalLaunchChecklistDefinitionsParams): FinalLaunchChecklistItemDefinition[] {
  return [
    {
      id: 'product_proof_pack_canonical',
      section: 'Product',
      label: 'Proof Pack is canonical across launch-visible surfaces',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        '.artifacts/proofound-current-state-reality-check.md',
        'docs/verification-checklist.md',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          checklistRowObservation(
            realityRow(context, 'Proof Pack canonicality'),
            'current_state_reality_check'
          ),
          checklistRowObservation(
            verificationRow(context, 'Proof Pack canonicality'),
            'verification_checklist'
          ),
        ]),
    },
    {
      id: 'product_portfolio_vs_intro_distinct',
      section: 'Product',
      label: 'Portfolio-ready and intro-eligible are clearly distinct',
      authorityRefs: [
        'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
        'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
      ],
      evidenceSources: [
        'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
        'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md',
        'Proofound_Project_Specification_2026-03-11.md',
        'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
      ],
      evaluateDirect: (context) => [
        ...passIfDocs(context, {
          markdown: context.lockedMvp,
          observedAt: null,
          sourcePath: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
          sourceLabel: 'Locked MVP source of truth',
          summary: 'Locked MVP authority explicitly separates portfolio-ready from intro-eligible.',
          patterns: [
            /Portfolio-ready/i,
            /Intro-eligible/i,
            /Make portfolio-ready narrow and verified\. Make intro-eligible hard\./i,
          ],
        }),
        ...passIfDocs(context, {
          markdown: context.launchRunbook,
          observedAt: null,
          sourcePath: 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
          sourceLabel: 'Launch runbook',
          summary: 'Launch runbook keeps portfolio-ready verified and intro-eligible stricter.',
          patterns: [
            /portfolio-ready must be narrow and verified, intro-eligible cannot be cheapened/i,
          ],
        }),
      ],
    },
    {
      id: 'product_private_context_scaffolding',
      section: 'Product',
      label: 'Private context scaffolding works for work / volunteering / education',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
        'tests/ui/education-form-skill-picker.test.tsx',
        'tests/ui/profile-dialogs-edit-routing.test.tsx',
        'tests/actions/onboarding-private-context-scaffolding.test.ts',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          gateObservation(
            context.latestLaunchBundle,
            'private_context_scaffolding',
            context.scope === 'repo'
              ? 'Repo-ready private context validation'
              : 'Latest launch bundle private context validation'
          ),
        ]),
    },
    {
      id: 'product_public_portfolio_safe_and_separate',
      section: 'Product',
      label: 'Public portfolio is calm, safe, and separate from review reveal',
      authorityRefs: [
        'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
        'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
      ],
      evidenceSources: [
        '.artifacts/launch-validation-*/24_gate_summary.json',
        '.artifacts/proofound-current-state-reality-check.md',
        'docs/verification-checklist.md',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = [];
        const smokeGateId =
          context.scope === 'repo'
            ? 'public_org_trust_smoke'
            : 'live_launch_smoke_artifact_refresh';
        const smokeGate = context.latestLaunchBundle?.gates.get(smokeGateId);
        const revealRow = verificationRow(context, 'candidate-consented reveal');
        const blindRow = verificationRow(context, 'blind-by-default review');

        if (
          smokeGate?.status === 'PASS' &&
          (revealRow as { status?: FinalLaunchChecklistStatus } | null)?.status === 'PASS' &&
          (blindRow as { status?: FinalLaunchChecklistStatus } | null)?.status === 'PASS'
        ) {
          observations.push({
            sourceId: 'latest_launch_bundle',
            sourceLabel: 'Launch bundle plus verification evidence',
            status: 'PASS',
            summary:
              'Fresh smoke, blind-review coverage, and consented reveal evidence all point to a privacy-safe public portfolio that stays separate from reveal.',
            evidence: [
              {
                label: 'Launch smoke gate',
                path: path.posix.join(context.latestLaunchBundle!.dir, '24_gate_summary.json'),
              },
              {
                label: 'Verification checklist: blind review',
                path: 'docs/verification-checklist.md',
              },
              {
                label: 'Verification checklist: consented reveal',
                path: 'docs/verification-checklist.md',
              },
            ],
            observedAt: context.latestLaunchBundle?.generatedAt ?? context.generatedAt,
            priority: SOURCE_PRIORITY.latest_launch_bundle,
          });
        }

        return observations;
      },
    },
    {
      id: 'product_org_trust_page_live',
      section: 'Product',
      label: 'Org trust page is minimal and live',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        '.artifacts/launch-validation-*/24_gate_summary.json',
        '.artifacts/proofound-route-inventory.md',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          gateObservation(
            context.latestLaunchBundle,
            'public_org_trust_smoke',
            'Latest launch bundle org trust smoke'
          ),
        ]),
    },
    {
      id: 'product_assignment_builder_enforces_core_fields',
      section: 'Product',
      label: 'Assignment builder enforces why / work / proof / constraints',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        'docs/internal-ops/assignment-quality-checklist.md',
        'tests/api/assignments-publish-route.test.ts',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = passIfDocs(context, {
          markdown: context.assignmentQualityChecklist,
          observedAt: null,
          sourcePath: 'docs/internal-ops/assignment-quality-checklist.md',
          sourceLabel: 'Assignment quality checklist',
          summary:
            'Assignment-quality SOP explicitly checks business value, real work, proof expectation, and practical constraints before publish.',
          patterns: [
            /business value/i,
            /real outcomes/i,
            /proof expectation/i,
            /practical constraints/i,
          ],
        }).map((observation) => ({
          ...observation,
          status: 'UNVERIFIED' as const,
          summary:
            'The operator checklist names the required fields, but docs alone do not prove the builder enforces them.',
        }));

        if (
          textContainsAll(context.assignmentPublishRouteTest, [
            /businessValue/i,
            /work_summary_required/i,
            /proof_expectations_required/i,
            /constraints_required/i,
          ])
        ) {
          observations.push({
            sourceId: 'tests',
            sourceLabel: 'Assignment publish route test',
            status: 'PASS',
            summary:
              'Assignment publish tests assert hard publish blocks for missing work summary, proof expectations, and constraints, with business-value coverage in the route fixture.',
            evidence: [
              {
                label: 'Assignment publish route test',
                path: 'tests/api/assignments-publish-route.test.ts',
                note: 'Assertions include work_summary_required, proof_expectations_required, and constraints_required.',
              },
            ],
            observedAt: null,
            priority: SOURCE_PRIORITY.tests,
          });
        }

        return observations;
      },
    },
    {
      id: 'product_review_queue_blind_and_reason_coded',
      section: 'Product',
      label: 'Review queue is blind-by-default and reason-coded',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        'docs/verification-checklist.md',
        'tests/api/org-match-review-route.test.ts',
        'src/app/api/org/[id]/matches/[matchId]/review/route.ts',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = [];
        const blindReview = checklistRowObservation(
          verificationRow(context, 'blind-by-default review'),
          'verification_checklist'
        );
        if (blindReview) {
          observations.push(blindReview);
        }

        const reasonCodeLine = lineMatch(
          context.assignmentQualityChecklist,
          /queue item.*which checklist point failed or passed/i
        );
        if (reasonCodeLine) {
          observations.push({
            sourceId: 'docs',
            sourceLabel: 'Assignment quality checklist',
            status: 'PASS',
            summary:
              'Manual review handling stays reason-coded through checklist-point operator notes.',
            evidence: [
              {
                label: 'Assignment quality checklist',
                path: 'docs/internal-ops/assignment-quality-checklist.md',
                note: reasonCodeLine,
              },
              {
                label: 'Review route test',
                path: 'tests/api/org-match-review-route.test.ts',
              },
            ],
            observedAt: null,
            priority: SOURCE_PRIORITY.tests,
          });
        }

        if (
          textContainsAll(context.reviewRouteTest, [
            /candidateLabel/i,
            /reasonCodes/i,
            /getVisibleIdentityFields\.mockReturnValue\(\[\]\)/i,
          ])
        ) {
          observations.push({
            sourceId: 'tests',
            sourceLabel: 'Org match review route test',
            status: 'PASS',
            summary:
              'Review route tests keep the review card identity-masked while carrying reason-coded fit and visibility-safe explanations through the proof-first flow.',
            evidence: [
              {
                label: 'Org match review route test',
                path: 'tests/api/org-match-review-route.test.ts',
                note: 'Mocks identity visibility to [] and asserts reason-coded review card payloads.',
              },
            ],
            observedAt: null,
            priority: SOURCE_PRIORITY.tests,
          });
        }

        return observations;
      },
    },
    {
      id: 'product_hire_and_engagement_distinct',
      section: 'Product',
      label: 'Hire and engagement verification remain distinct',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        '.artifacts/proofound-current-state-reality-check.md',
        'docs/proofound-hard-verification-rerun-final.md',
      ],
      evaluateDirect: (context) => {
        const corridor = checklistRowObservation(
          realityRow(
            context,
            'review -> intro -> reveal -> interview -> decision -> hire -> engagement verification'
          ),
          'current_state_reality_check'
        );
        if (corridor) {
          return [corridor];
        }
        return [];
      },
    },
    {
      id: 'engineering_build_clean',
      section: 'Engineering',
      label: '`npm run build` passes cleanly under launch Node version',
      authorityRefs: ['agent/checklists/verification.md'],
      evidenceSources: [
        '.artifacts/launch-validation-*/24_gate_summary.json',
        '.artifacts/proofound-implementation-status-snapshot.md',
        '.artifacts/launch-readiness-summary.md',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = [];
        const bundleObs = gateObservation(
          context.latestLaunchBundle,
          'prod_build',
          'Latest launch bundle prod build'
        );
        if (bundleObs) {
          observations.push(bundleObs);
        }

        const snapshotObs = summaryObservation(
          context.implementationStatusSnapshot,
          /npm run build/i,
          '.artifacts/proofound-implementation-status-snapshot.md',
          'Implementation status snapshot',
          context.generatedAt,
          SOURCE_PRIORITY.implementation_snapshot,
          'Implementation status snapshot claimed build passed, but the later launch bundle is treated as current truth.'
        );
        if (snapshotObs) {
          observations.push(snapshotObs);
        }

        return observations;
      },
    },
    {
      id: 'engineering_next_start_stable',
      section: 'Engineering',
      label: '`next start` is stable',
      authorityRefs: ['agent/checklists/verification.md'],
      evidenceSources: [
        '.artifacts/launch-validation-*/24_gate_summary.json',
        '.artifacts/proofound-master-audit-2026-03-22.md',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          gateObservation(
            context.latestLaunchBundle,
            'prod_boot',
            'Latest launch bundle prod boot'
          ),
        ]),
    },
    {
      id: 'engineering_route_allowlist_reduced',
      section: 'Engineering',
      label: 'Route surface is reduced to the launch allowlist',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        '.artifacts/proofound-route-inventory.md',
        '.artifacts/launch-validation-*/24_gate_summary.json',
        'tests/api/launch-surface-inventory.test.ts',
        'tests/api/launch-page-inventory.test.ts',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = [];
        const gateObs = gateObservation(
          context.latestLaunchBundle,
          'route_surface_and_archived_routes',
          'Latest launch bundle route-surface gate'
        );
        if (gateObs) observations.push(gateObs);

        const routeInventoryLine = lineMatch(
          context.routeInventory,
          /remaining blocker is breadth|compiled surface as broader than the locked MVP corridor|remaining blocker is the size of the surviving active launch allowlist/i
        );
        if (routeInventoryLine) {
          observations.push({
            sourceId: 'docs',
            sourceLabel: 'Route inventory',
            status: 'FAIL',
            summary: routeInventoryLine,
            evidence: [
              {
                label: 'Route inventory',
                path: '.artifacts/proofound-route-inventory.md',
                note: routeInventoryLine,
              },
            ],
            observedAt: null,
            priority: SOURCE_PRIORITY.tests,
          });
        }
        return observations;
      },
    },
    {
      id: 'engineering_three_role_model_canonical',
      section: 'Engineering',
      label: 'Canonical 3-role model is true across code, DB, and API',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        '.artifacts/proofound-current-state-reality-check.md',
        'tests/lib/authz-policy.test.ts',
        'src/lib/authz/policy.ts',
      ],
      evaluateDirect: (context) => {
        const row = checklistRowObservation(
          realityRow(context, 'canonical role and RLS truth'),
          'current_state_reality_check'
        );
        if (row) {
          return [row];
        }

        if (
          textContainsAll(context.lockedMvp, [/org_owner/i, /org_manager/i, /org_reviewer/i]) &&
          textContainsAll(context.launchReadinessSummary, [/route breadth/i])
        ) {
          return [
            docObservation({
              status: 'PASS',
              summary:
                'Locked MVP and authz policy keep the canonical organization role model explicit.',
              sourceId: 'docs',
              sourceLabel: 'Locked MVP source of truth',
              sourcePath: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
              observedAt: null,
              note: 'Roles include org_owner, org_manager, and org_reviewer.',
            }),
          ];
        }

        return [];
      },
    },
    {
      id: 'engineering_verification_status_canonical',
      section: 'Engineering',
      label: 'Verification status semantics are canonical and freshness-aware',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        '.artifacts/proofound-current-state-reality-check.md',
        'docs/verification-checklist.md',
        'src/app/api/monitoring/launch-status/route.ts',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = [];
        const verificationObs = checklistRowObservation(
          verificationRow(context, 'bounded verification semantics'),
          'verification_checklist'
        );
        if (verificationObs) observations.push(verificationObs);
        const freshnessObs = checklistRowObservation(
          realityRow(context, 'launch ops / smoke freshness / launch-status truth'),
          'current_state_reality_check'
        );
        if (freshnessObs) observations.push(freshnessObs);
        return observations;
      },
    },
    {
      id: 'engineering_upload_filename_leaks_closed',
      section: 'Engineering',
      label: 'Upload metadata/original filename leaks are closed',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        'docs/internal-ops/redaction-risky-upload-sop.md',
        'tests/lib/uploads-privacy.test.ts',
        'tests/lib/uploads-lifecycle-queue.test.ts',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = passIfDocs(context, {
          markdown: context.riskyUploadSop,
          observedAt: null,
          sourcePath: 'docs/internal-ops/redaction-risky-upload-sop.md',
          sourceLabel: 'Redaction / risky upload SOP',
          summary:
            'Risky-upload SOP requires sanitized filenames, stored review reasons, and privacy-safe handling instead of restoring original metadata.',
          patterns: [
            /sanitized filename/i,
            /metadata/i,
            /Do not restore identity-bearing names or metadata/i,
          ],
        }).map((observation) => ({
          ...observation,
          status: 'UNVERIFIED' as const,
          summary:
            'The SOP requires privacy-safe filename and metadata handling, but docs alone do not prove the implementation is closing leaks.',
        }));

        if (
          textContainsAll(context.uploadsPrivacyTest, [
            /sanitizeUploadFilename/i,
            /collectUploadMetadataFlags/i,
            /resolveArtifactDisplayNameForSurface/i,
            /Uploaded PDF document/i,
          ]) &&
          textContainsAll(context.uploadsLifecycleQueueTest, [
            /sanitizedFilename/i,
            /reviewReasons/i,
            /correction_revocation/i,
          ])
        ) {
          return [
            {
              sourceId: 'tests',
              sourceLabel: 'Upload privacy tests',
              status: 'PASS',
              summary:
                'Upload privacy tests cover filename sanitization, metadata review flags, generic public/review display labels, and queue handoff with sanitized filenames.',
              evidence: [
                {
                  label: 'Upload privacy helpers test',
                  path: 'tests/lib/uploads-privacy.test.ts',
                  note: 'Covers sanitized filenames, metadata review flags, and generic display names.',
                },
                {
                  label: 'Upload lifecycle queue test',
                  path: 'tests/lib/uploads-lifecycle-queue.test.ts',
                  note: 'Asserts correction_revocation queue metadata includes sanitizedFilename and reviewReasons.',
                },
              ],
              observedAt: null,
              priority: SOURCE_PRIORITY.tests,
            },
          ];
        }

        return observations;
      },
    },
    {
      id: 'engineering_legacy_decision_and_route_drift_removed',
      section: 'Engineering',
      label: 'Legacy decision and non-MVP route drift are removed or hard-gated',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        '.artifacts/proofound-route-inventory.md',
        '.artifacts/launch-validation-*/24_gate_summary.json',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = [];
        const routeObs = gateObservation(
          context.latestLaunchBundle,
          'route_surface_and_archived_routes',
          'Latest launch bundle route-surface gate'
        );
        if (routeObs) observations.push(routeObs);
        return observations;
      },
    },
    {
      id: 'engineering_launch_status_fresh_evidence',
      section: 'Engineering',
      label: 'Launch-status and smoke-artifact logic run on fresh evidence',
      authorityRefs: ['agent/checklists/verification.md'],
      evidenceSources: [
        '.artifacts/launch-validation-*/24_gate_summary.json',
        '.artifacts/launch-readiness-summary.md',
        'src/app/api/monitoring/launch-status/route.ts',
      ],
      evaluateDirect: (context) => {
        if (context.scope === 'repo' && context.latestLaunchBundle) {
          const bundleDir = context.latestLaunchBundle.dir;
          const resolveEvidencePath = (relativePath: string) =>
            relativePath.startsWith('.artifacts/') || relativePath.startsWith(bundleDir)
              ? relativePath.replace(/\\/g, '/')
              : path.posix.join(bundleDir, relativePath).replace(/\\/g, '/');
          const smokeGate = context.latestLaunchBundle.gates.get(
            'live_launch_smoke_artifact_refresh'
          );
          const routeGate = context.latestLaunchBundle.gates.get('launch_status_route_logic');
          if (smokeGate || routeGate) {
            const statuses = [smokeGate?.status, routeGate?.status].filter(
              (status): status is FinalLaunchChecklistStatus => status != null
            );
            const status = statuses.every((value) => value === 'PASS')
              ? 'PASS'
              : statuses.some((value) => value === 'FAIL' || value === 'BLOCKED')
                ? 'FAIL'
                : 'UNVERIFIED';

            return [
              {
                sourceId: 'latest_launch_bundle',
                sourceLabel: 'Repo-ready launch-status evidence',
                status,
                summary:
                  status === 'PASS'
                    ? 'Repo-ready launch-status route tests and smoke refresh both passed on fresh local evidence.'
                    : 'Repo-ready launch-status route logic or smoke refresh did not pass on fresh local evidence.',
                evidence: [
                  ...(routeGate?.evidence ?? []).map((relativePath) => ({
                    label: 'Launch-status route evidence',
                    path: resolveEvidencePath(relativePath),
                  })),
                  ...(smokeGate?.evidence ?? []).map((relativePath) => ({
                    label: 'Launch smoke evidence',
                    path: resolveEvidencePath(relativePath),
                  })),
                ],
                observedAt: context.latestLaunchBundle.generatedAt,
                priority: SOURCE_PRIORITY.latest_launch_bundle,
              } satisfies FinalLaunchChecklistObservation,
            ];
          }
        }

        const observations: FinalLaunchChecklistObservation[] = [];
        const launchStatusGateId =
          context.scope === 'repo' ? 'launch_status_route_logic' : 'live_launch_status';
        const liveStatusGate = gateObservation(
          context.latestLaunchBundle,
          launchStatusGateId,
          context.scope === 'repo'
            ? 'Repo-ready launch-status route logic'
            : 'Latest launch bundle live launch-status gate'
        );
        if (liveStatusGate) observations.push(liveStatusGate);

        const smokeRefreshGate = gateObservation(
          context.latestLaunchBundle,
          'live_launch_smoke_artifact_refresh',
          'Latest launch bundle live smoke refresh gate'
        );
        if (smokeRefreshGate) observations.push(smokeRefreshGate);

        const liveEndpointObs = liveEndpointObservation(
          context.liveLaunchStatus,
          'Live launch-status endpoint',
          'Live launch-status endpoint responded successfully during this checklist run.',
          'Live launch-status endpoint did not confirm readiness during this checklist run.'
        );
        if (liveEndpointObs) observations.push(liveEndpointObs);

        return observations;
      },
    },
    {
      id: 'qa_strict_org_corridor_fresh',
      section: 'QA',
      label: 'Fresh strict org corridor passes in prod mode',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        '.artifacts/proofound-current-state-reality-check.md',
        'docs/verification-checklist.md',
        '.artifacts/launch-validation-*/24_gate_summary.json',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = [];
        const stateful = statefulObservation(
          context.statefulChecks.get('strict_org_corridor'),
          'Stateful strict org corridor rerun',
          'Stateful strict org corridor rerun passed in this checklist run.',
          'Stateful strict org corridor rerun failed in this checklist run.'
        );
        if (stateful) observations.push(stateful);

        const reality = checklistRowObservation(
          realityRow(
            context,
            'review -> intro -> reveal -> interview -> decision -> hire -> engagement verification'
          ),
          'current_state_reality_check'
        );
        if (reality) observations.push(reality);

        return observations;
      },
    },
    {
      id: 'qa_public_org_trust_smoke',
      section: 'QA',
      label: 'Public-org trust smoke passes',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        '.artifacts/launch-validation-*/24_gate_summary.json',
        'e2e/public-org-trust.smoke.spec.ts',
      ],
      evaluateDirect: (context) => {
        const observations: FinalLaunchChecklistObservation[] = [];
        const stateful = statefulObservation(
          context.statefulChecks.get('public_org_trust_smoke'),
          'Stateful public org trust smoke',
          'Stateful public org trust smoke passed in this checklist run.',
          'Stateful public org trust smoke failed in this checklist run.'
        );
        if (stateful) observations.push(stateful);
        const bundleObs = gateObservation(
          context.latestLaunchBundle,
          'public_org_trust_smoke',
          'Latest launch bundle public org trust smoke'
        );
        if (bundleObs) observations.push(bundleObs);
        return observations;
      },
    },
    {
      id: 'qa_privacy_rls_actual_db',
      section: 'QA',
      label: 'RLS/privacy tests pass against actual DB state',
      authorityRefs: ['agent/checklists/verification.md'],
      evidenceSources: [
        '.artifacts/launch-validation-*/24_gate_summary.json',
        '.artifacts/proofound-current-state-reality-check.md',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          gateObservation(
            context.latestLaunchBundle,
            'privacy_rls_live_db',
            'Latest launch bundle privacy/RLS gate'
          ),
          checklistRowObservation(
            realityRow(context, 'canonical role and RLS truth'),
            'current_state_reality_check'
          ),
        ]),
    },
    {
      id: 'qa_manual_privacy_sweep',
      section: 'QA',
      label: 'Manual privacy leak sweep passes',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        '.artifacts/launch-validation-*/21_live_launch_smoke_report.json',
        'docs/internal-ops/reveal-privacy-dispute-sop.md',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          gateObservation(
            context.latestLaunchBundle,
            'manual_privacy_sweep',
            context.scope === 'repo'
              ? 'Repo-ready manual privacy validation'
              : 'Latest launch bundle manual privacy validation'
          ),
        ]),
    },
    {
      id: 'qa_workflow_email_privacy_sweep',
      section: 'QA',
      label: 'Workflow email privacy sweep passes',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        'agent/checklists/verification.md',
        'docs/internal-ops/workflow-comms-templates.md',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          gateObservation(
            context.latestLaunchBundle,
            'workflow_email_privacy',
            context.scope === 'repo'
              ? 'Repo-ready workflow email privacy validation'
              : 'Latest launch bundle workflow email privacy validation'
          ),
        ]),
    },
    {
      id: 'qa_archived_route_and_surface_tests',
      section: 'QA',
      label: 'Archived-route and launch-surface tests pass',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        '.artifacts/launch-validation-*/24_gate_summary.json',
        'tests/api/launch-surface-inventory.test.ts',
        'tests/api/launch-page-inventory.test.ts',
        'tests/ui/archived-mvp-routes.test.ts',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          gateObservation(
            context.latestLaunchBundle,
            'route_surface_and_archived_routes',
            'Latest launch bundle route-surface gate'
          ),
        ]),
    },
    {
      id: 'qa_assignment_publish_smoke',
      section: 'QA',
      label: 'Assignment publish smoke passes',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        'docs/verification-checklist.md',
        '.artifacts/proofound-current-state-reality-check.md',
        'tests/api/assignments-publish-route.test.ts',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          checklistRowObservation(
            verificationRow(context, 'assignment create / edit / publish'),
            'verification_checklist'
          ),
          checklistRowObservation(
            realityRow(context, 'assignment create / edit / publish'),
            'current_state_reality_check'
          ),
        ]),
    },
    {
      id: 'qa_final_evidence_packet',
      section: 'QA',
      label: 'Final evidence packet is assembled and dated',
      authorityRefs: ['agent/checklists/verification.md'],
      evidenceSources: [
        '.artifacts/launch-validation-YYYY-MM-DD/final-launch-checklist-status.md',
        '.artifacts/launch-validation-YYYY-MM-DD/final-launch-checklist-status.json',
      ],
      evaluateDirect: (context) => [
        {
          sourceId: 'fallback',
          sourceLabel: 'Final checklist generator',
          status: 'PASS',
          summary: 'This checklist run generated a dated Markdown report and JSON bundle.',
          evidence: [
            {
              label: 'Generated Markdown report',
              path: path.relative(
                context.workspaceRoot,
                path.join(context.outputDir, 'final-launch-checklist-status.md')
              ),
            },
            {
              label: 'Generated JSON bundle',
              path: path.relative(
                context.workspaceRoot,
                path.join(context.outputDir, 'final-launch-checklist-status.json')
              ),
            },
          ],
          observedAt: context.generatedAt,
          priority: SOURCE_PRIORITY.fallback,
        },
      ],
    },
    {
      id: 'ops_verification_queue_owner_sop',
      section: 'Ops',
      label: 'Verification queue has owner and SOP',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        'docs/internal-ops/index.md',
        'docs/internal-ops/verification-review-sop.md',
      ],
      evaluateDirect: (context) =>
        passIfDocs(context, {
          markdown: context.internalOpsIndex,
          observedAt: null,
          sourcePath: 'docs/internal-ops/index.md',
          sourceLabel: 'Internal ops SOP index',
          summary: 'Internal ops index assigns an owner and queue mapping for verification review.',
          patterns: [
            /verification-review-sop\.md/i,
            /Support \/ verification lead/i,
            /verification/i,
          ],
        }),
    },
    {
      id: 'ops_redaction_queue_owner_sop',
      section: 'Ops',
      label: 'Redaction / risky-upload queue has owner and SOP',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        'docs/internal-ops/index.md',
        'docs/internal-ops/redaction-risky-upload-sop.md',
      ],
      evaluateDirect: (context) =>
        passIfDocs(context, {
          markdown: context.internalOpsIndex,
          observedAt: null,
          sourcePath: 'docs/internal-ops/index.md',
          sourceLabel: 'Internal ops SOP index',
          summary:
            'Internal ops index maps the redaction / risky upload queue to an owner and SOP.',
          patterns: [
            /redaction-risky-upload-sop\.md/i,
            /correction_revocation/i,
            /Support \/ verification lead/i,
          ],
        }),
    },
    {
      id: 'ops_reveal_privacy_dispute_path',
      section: 'Ops',
      label: 'Reveal/privacy dispute path exists',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        'docs/internal-ops/reveal-privacy-dispute-sop.md',
        'docs/internal-ops/workflow-comms-templates.md',
      ],
      evaluateDirect: (context) =>
        passIfDocs(context, {
          markdown: context.revealPrivacyDisputeSop,
          observedAt: null,
          sourcePath: 'docs/internal-ops/reveal-privacy-dispute-sop.md',
          sourceLabel: 'Reveal / privacy dispute SOP',
          summary: 'A dedicated reveal/privacy dispute SOP exists for live corridor handling.',
          patterns: [/reveal request times out or is disputed/i, /privacy complaint/i, /consent/i],
        }),
    },
    {
      id: 'ops_engagement_verification_checklist',
      section: 'Ops',
      label: 'Engagement verification evidence checklist exists',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: ['docs/internal-ops/engagement-verification-evidence-checklist.md'],
      evaluateDirect: (context) =>
        passIfDocs(context, {
          markdown: context.engagementVerificationChecklist,
          observedAt: null,
          sourcePath: 'docs/internal-ops/engagement-verification-evidence-checklist.md',
          sourceLabel: 'Engagement verification evidence checklist',
          summary: 'A dedicated engagement-verification evidence checklist exists for pilot ops.',
          patterns: [
            /Owner: `Support \/ verification lead`/i,
            /engagement verification/i,
            /queue note/i,
          ],
        }),
    },
    {
      id: 'ops_incident_roles_assigned',
      section: 'Ops',
      blocksVerdictIn: 'full',
      label: 'Incident owner / support lead roles are assigned',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
        'docs/internal-ops/index.md',
      ],
      evaluateDirect: (context) =>
        passIfDocs(context, {
          markdown: context.internalOpsIndex,
          observedAt: null,
          sourcePath: 'docs/internal-ops/index.md',
          sourceLabel: 'Internal ops SOP index',
          summary:
            'Internal ops docs name live owners for pilot operations, but they do not identify specific humans.',
          patterns: [
            /Live owners/i,
            /Support \/ verification lead/i,
            /Engineering on-call/i,
            /Product \/ ops lead/i,
          ],
        }).map((observation) => ({
          ...observation,
          status: 'UNVERIFIED',
          summary:
            'Operational roles are named in docs, but this repo does not identify the currently assigned people for launch.',
        })),
    },
    {
      id: 'ops_critical_alerts_configured',
      section: 'Ops',
      blocksVerdictIn: 'full',
      label: 'Critical alerts are configured',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        'docs/monitoring-alerting.md',
        'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
      ],
      evaluateDirect: (context) =>
        passIfDocs(context, {
          markdown: context.monitoringAlerting,
          observedAt: null,
          sourcePath: 'docs/monitoring-alerting.md',
          sourceLabel: 'Monitoring and alerting guide',
          summary:
            'Monitoring docs describe critical alerts, but this checklist has no fresh environment-backed proof that they are configured in the live stack.',
          patterns: [/Configure critical alerts/i, /critical alerts/i],
        }).map((observation) => ({
          ...observation,
          status: 'UNVERIFIED',
        })),
    },
    {
      id: 'ops_backup_restore_verified',
      section: 'Ops',
      blocksVerdictIn: 'full',
      label: 'Backups and restore discipline are verified',
      authorityRefs: [
        'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md',
        'agent/checklists/verification.md',
      ],
      evidenceSources: [
        'docs/launch-restore-drill.md',
        'agent/checklists/verification.md',
        'README.md',
      ],
      evaluateDirect: (context) =>
        passIfDocs(context, {
          markdown: context.launchRestoreDrill,
          observedAt: null,
          sourcePath: 'docs/launch-restore-drill.md',
          sourceLabel: 'Launch restore drill',
          summary:
            'Backup and restore discipline is documented with a checkpoint and restore-verify workflow, but this checklist does not rerun the drill itself.',
          patterns: [/db:backup:checkpoint/i, /db:restore:verify/i, /restore/i],
        }).map((observation) => ({
          ...observation,
          status: 'UNVERIFIED',
        })),
    },
    {
      id: 'ops_internal_admin_surfaces',
      section: 'Ops',
      label: 'Internal ops/admin surfaces are protected and usable',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        'docs/internal-ops/index.md',
        'src/lib/launch/surface-policy.ts',
        'tests/api/launch-page-inventory.test.ts',
      ],
      evaluateDirect: (context) =>
        compactObservations([
          gateObservation(
            context.latestLaunchBundle,
            'internal_admin_surfaces',
            context.scope === 'repo'
              ? 'Repo-ready internal admin surface validation'
              : 'Latest launch bundle internal admin surface validation'
          ),
        ]),
    },
    {
      id: 'founder_first_corridor_chosen',
      section: 'Founder / GTM',
      label: 'First corridor is explicitly chosen',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
        'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md',
      ],
      evaluateDirect: (context) => [
        ...passIfDocs(context, {
          markdown: context.lockedMvp,
          observedAt: null,
          sourcePath: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
          sourceLabel: 'Locked MVP source of truth',
          summary:
            'The locked MVP explicitly chooses a proof-first hiring corridor centered on Proof Packs.',
          patterns: [/proof-first/i, /hiring corridor/i, /Proof Packs/i],
        }),
      ],
    },
    {
      id: 'founder_icp_design_partner_locked',
      section: 'Founder / GTM',
      blocksVerdictIn: 'full',
      label: 'ICP and design-partner target list are locked',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
        'Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md',
      ],
      evaluateDirect: () => [],
    },
    {
      id: 'founder_pilot_package_documented',
      section: 'Founder / GTM',
      blocksVerdictIn: 'full',
      label: 'Pilot package, scope, and case-study terms are documented',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: ['Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md'],
      evaluateDirect: () => [],
    },
    {
      id: 'founder_outbound_and_homepage_match',
      section: 'Founder / GTM',
      blocksVerdictIn: 'full',
      label: 'Founder outbound and homepage messaging match the wedge',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: ['README.md', 'src/app/page.tsx'],
      evaluateDirect: () => [],
    },
    {
      id: 'founder_public_story_signal_over_cvs',
      section: 'Founder / GTM',
      blocksVerdictIn: 'full',
      label: 'Public story sells stronger signal than CVs, not broad platform vision',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        'README.md',
        'docs/scope-compliance-report-2026-03-24.md',
        'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
      ],
      evaluateDirect: (context) => {
        if (
          textContainsAll(context.lockedMvp, [/proof instead of profile theater/i]) &&
          textContainsAll(context.launchReadinessSummary, [/public and corridor flows/i])
        ) {
          return [
            docObservation({
              status: 'PASS',
              summary:
                'Current authority docs frame Proofound as stronger signal than CV theater, but founder-outbound proof remains outside repo scope.',
              sourceId: 'docs',
              sourceLabel: 'Locked MVP source of truth',
              sourcePath: 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md',
              observedAt: null,
              note: 'Product promise: proof instead of profile theater.',
            }),
          ];
        }
        return [];
      },
    },
    {
      id: 'founder_candidate_supply_plan',
      section: 'Founder / GTM',
      blocksVerdictIn: 'full',
      label: 'Candidate supply-seeding plan exists for the chosen corridor',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: ['Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md'],
      evaluateDirect: () => [],
    },
    {
      id: 'founder_org_onboarding_playbook',
      section: 'Founder / GTM',
      blocksVerdictIn: 'full',
      label: 'Org onboarding playbook exists',
      authorityRefs: ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'],
      evidenceSources: [
        'docs/internal-ops/index.md',
        'docs/internal-ops/assignment-quality-checklist.md',
      ],
      evaluateDirect: () => [],
    },
    {
      id: 'founder_go_no_go_signed_after_green',
      section: 'Founder / GTM',
      blocksVerdictIn: 'full',
      label: 'Go/no-go is signed only after fresh evidence is green',
      authorityRefs: ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'],
      evidenceSources: [
        '.artifacts/launch-readiness-summary.md',
        '.artifacts/launch-validation-*/24_gate_summary.json',
      ],
      upstreamBlockers: [
        'engineering_build_clean',
        'engineering_next_start_stable',
        'engineering_route_allowlist_reduced',
        'engineering_launch_status_fresh_evidence',
        'qa_archived_route_and_surface_tests',
      ],
      evaluateDirect: (context) => {
        if (context.latestLaunchBundle?.verdict === 'NO_GO') {
          return [
            {
              sourceId: 'latest_launch_bundle',
              sourceLabel: 'Latest launch bundle verdict',
              status: 'UNVERIFIED',
              summary:
                'Latest launch bundle still recommends NO_GO, so launch signoff should remain blocked until fresh evidence turns green.',
              evidence: [
                {
                  label: 'Latest launch bundle',
                  path: path.posix.join(context.latestLaunchBundle.dir, '24_gate_summary.json'),
                },
                {
                  label: 'Launch verdict memo',
                  path: '.artifacts/launch-readiness-summary.md',
                },
              ],
              observedAt: context.latestLaunchBundle.generatedAt,
              priority: SOURCE_PRIORITY.latest_launch_bundle,
            },
          ];
        }
        return [];
      },
    },
  ];
}
