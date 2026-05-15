import { describe, expect, it } from 'vitest';
import {
  buildVerificationPlan,
  collectVerificationEvidence,
  evaluateTicketFinisherState,
  normalizeCommand,
  resolveVerificationStatus,
  scoreIssueCandidates,
  selectActiveIssue,
  stabilizeIssueSelection,
} from '../../scripts/lib/proofound-ticket-finisher.mjs';

describe('proofound ticket finisher', () => {
  it('selects a single clear issue candidate from branch and commits', () => {
    const candidates = scoreIssueCandidates({
      branchName: 'codex/pro-128-ticket-finisher',
      commitSubjects: ['fix(PRO-128): polish cv import closeout', 'docs: update audit notes'],
      scratchpadEntries: [],
      changeEntries: [],
      changedFiles: [],
    });

    const selection = selectActiveIssue(candidates);

    expect(selection.status).toBe('clear');
    expect(selection.selectedKey).toBe('PRO-128');
  });

  it('marks close scores as ambiguous', () => {
    const candidates = scoreIssueCandidates({
      branchName: '',
      commitSubjects: [
        'fix(PRO-125): location autocomplete',
        'fix(PRO-124): modal typing regression',
      ],
      scratchpadEntries: [],
      changeEntries: [],
      changedFiles: [],
    });

    const selection = selectActiveIssue(candidates);

    expect(selection.status).toBe('ambiguous');
  });

  it('drops stale history-only issue guesses on a dirty non-issue branch', () => {
    const selection = stabilizeIssueSelection(
      {
        status: 'clear',
        selectedKey: 'PRO-128',
        candidates: [
          {
            key: 'PRO-128',
            score: 9,
            evidence: [{ source: 'commit', detail: 'fix(PRO-128): polish cv import', points: 5 }],
          },
        ],
        reason: 'Only one PRO issue key was detected.',
      },
      {
        branch: 'master',
        dirty: true,
      }
    );

    expect(selection.status).toBe('none');
  });

  it('adds privacy and landing verification commands for matching file scope', () => {
    const plan = buildVerificationPlan([
      'src/db/schema.ts',
      'src/app/page.tsx',
      'src/components/landing/Hero.tsx',
    ]);

    expect(plan.map((entry) => entry.command)).toContain('npm run test:privacy');
    expect(plan.map((entry) => entry.command)).toContain('npm run test:e2e:landing');
    expect(plan.map((entry) => entry.command)).toContain('npm run lint');
  });

  it('normalizes verification commands with env prefixes', () => {
    expect(normalizeCommand('PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run lint -> PASS')).toBe(
      'npm run lint'
    );
    expect(
      normalizeCommand(
        'NEXT_PUBLIC_USE_MOCK_SUPABASE=false node ./scripts/playwright-node24.mjs test e2e/auth.real.spec.ts --project=chromium --reporter=line --workers=1'
      )
    ).toBe(
      'node ./scripts/playwright-node24.mjs test e2e/auth.real.spec.ts --project=chromium --reporter=line --workers=1'
    );
  });

  it('matches verification evidence from recent log lines', () => {
    const evidence = collectVerificationEvidence([
      {
        file: 'agent/scratchpad/entries/2026-03-06-example.md',
        text: '- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run lint` -> PASS\n- `npm run typecheck` -> FAIL',
      },
    ]);

    const resolved = resolveVerificationStatus(
      [
        { command: 'npm run lint', reason: 'Always', source: 'agent/checklists/verification.md' },
        {
          command: 'npm run typecheck',
          reason: 'Always',
          source: 'agent/checklists/verification.md',
        },
      ],
      evidence
    );

    expect(resolved[0].status).toBe('pass');
    expect(resolved[1].status).toBe('fail');
  });

  it('marks dirty tree and missing verification as blockers', () => {
    const evaluation = evaluateTicketFinisherState({
      issueSelection: {
        status: 'clear',
        selectedKey: 'PRO-128',
        candidates: [],
        reason: 'Only one issue key detected.',
      },
      repoState: {
        branch: 'master',
        upstream: 'origin/master',
        upstreamMissing: false,
        ahead: 1,
        behind: 0,
        dirty: true,
        stagedFiles: ['src/app/page.tsx'],
        unstagedFiles: [],
        untrackedFiles: [],
        headSha: 'abc1234',
      },
      verificationPlan: [
        {
          command: 'npm run lint',
          reason: 'Always',
          source: 'agent/checklists/verification.md',
          status: 'missing',
          evidence: null,
        },
      ],
      recentCommits: ['fix(PRO-128): polish cv import closeout'],
      latestChangeSummary: null,
    });

    expect(evaluation.suggestedLinearStatus).toBe('In Progress');
    expect(evaluation.finalReviewReady).toBe(false);
    expect(evaluation.blockers.join(' ')).toContain('dirty');
    expect(evaluation.blockers.join(' ')).toContain('ahead of upstream');
  });
});
