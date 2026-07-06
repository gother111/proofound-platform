import { describe, expect, it } from 'vitest';

import {
  getIndividualRecoveryActions,
  getOrganizationRecoveryActions,
} from '@/lib/ui/recovery-actions';

describe('recovery actions', () => {
  it('returns exactly 3 individual recovery actions with unique destinations', () => {
    const actions = getIndividualRecoveryActions('matching-empty');

    expect(actions).toHaveLength(3);
    expect(actions.map((action) => action.title)).toEqual(
      expect.arrayContaining([
        'Add a proof',
        'Strengthen your Public Page proof',
        'Set assignment-review preferences',
      ])
    );
    expect(actions.map((action) => action.description).join(' ')).toContain(
      'assignment reviews stay relevant'
    );
    expect(actions.map((action) => action.description).join(' ')).toContain(
      'assignment reviews can evaluate fit'
    );
    expect(actions.map((action) => action.description).join(' ')).not.toContain(
      'better-fit opportunities'
    );
    expect(actions.map((action) => action.description).join(' ')).not.toMatch(
      /matching preferences|matchable/i
    );
    expect(actions.map((action) => action.description).join(' ')).not.toContain('legacy Atlas');
    expect(new Set(actions.map((action) => action.actionUrl)).size).toBe(3);
  });

  it('maps hint actions without changing the 3-action contract', () => {
    const actions = getIndividualRecoveryActions('matching-blocked', [
      {
        id: 'request-verification',
        title: 'Add proof from verification',
        description: 'Verification hint from readiness service.',
        actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
      },
    ]);

    expect(actions).toHaveLength(3);
    expect(actions[0].title).toContain('proof');
    expect(new Set(actions.map((action) => action.actionUrl)).size).toBe(3);
  });

  it('keeps empty skill recovery copy proof-first', () => {
    const actions = getIndividualRecoveryActions('expertise-empty');

    expect(actions.map((action) => action.description)).toContain(
      'Start with a skill you can connect to real proof.'
    );
    expect(actions.map((action) => action.description).join(' ')).not.toMatch(/Expertise Atlas/i);
    expect(actions.map((action) => action.description).join(' ')).not.toMatch(/legacy Atlas/i);
  });

  it('returns exactly 3 organization actions and keeps review copy submission-led', () => {
    const actions = getOrganizationRecoveryActions('org-matching-empty', 'acme');
    const combinedCopy = actions.map((action) => `${action.title} ${action.description}`).join(' ');

    expect(actions).toHaveLength(3);
    expect(actions.map((action) => action.title)).toContain('Open assignment review');
    expect(actions[2].id).toBe('open-assignment-review');
    expect(actions[2].actionUrl).toBe('/app/o/acme/assignments?focus=assignment-review');
    expect(combinedCopy).toContain('proof-backed submissions');
    expect(combinedCopy).toContain('proof submissions can move back into review');
    expect(combinedCopy).not.toContain('proof matching');
    expect(combinedCopy).not.toContain('candidate matching');
    expect(combinedCopy).not.toContain('proof-backed candidates');
    expect(combinedCopy).not.toContain('candidate pipeline');
    expect(combinedCopy).not.toContain('recovery actions');
    expect(new Set(actions.map((action) => action.actionUrl)).size).toBe(3);
  });

  it('uses assignment review routes for assignment-no-matches context', () => {
    const actions = getOrganizationRecoveryActions('assignment-no-matches', 'acme', 'assignment-1');
    const combinedCopy = actions.map((action) => `${action.title} ${action.description}`).join(' ');

    expect(actions).toHaveLength(3);
    expect(actions[0].actionUrl).toContain('/app/o/acme/assignments/assignment-1/review');
    expect(actions[1].actionUrl).toContain('focus=skills');
    expect(actions[2].id).toBe('open-assignment-review');
    expect(actions[2].actionUrl).toBe('/app/o/acme/assignments?assignment=assignment-1');
    expect(combinedCopy).toContain('proof-submission discovery');
    expect(combinedCopy).not.toContain('candidate discovery');
    expect(combinedCopy).not.toContain('Re-open matching');
    expect(combinedCopy).not.toContain('Turn on candidate matching');
  });
});
