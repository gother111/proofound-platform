import { describe, expect, it } from 'vitest';

import {
  buildCandidateReviewProjection,
  buildFairnessUiContract,
  canRevealExactRank,
  evaluateFairnessCohortAvailability,
  getReviewProjectionPolicy,
  getShortlistProjectionPolicy,
  getVisibleIdentityFields,
  renderExplanationFromReasonCodes,
  shouldSuppressExactRank,
} from '@/lib/matching/review-contract';

describe('matching review contract', () => {
  it('keeps identity hidden in blind review and limited at shortlist', () => {
    const blind = buildCandidateReviewProjection(
      {
        profileId: 'profile-1',
        displayName: 'Casey Candidate',
        handle: 'casey',
        avatarUrl: 'https://example.com/avatar.png',
        headline: 'Backend engineer',
        tagline: 'Proof-first builder',
        workMode: 'remote',
        city: 'Stockholm',
        country: 'Sweden',
        desiredRoles: ['Staff backend engineer'],
        valuesTags: ['privacy'],
        causeTags: ['climate'],
        verified: { work_email: true },
      },
      'blind'
    );

    expect(blind.displayName).toBeNull();
    expect(blind.handle).toBeNull();
    expect(blind.avatarUrl).toBeNull();
    expect(blind.locationSummary).toBe('Location hidden');

    const shortlisted = buildCandidateReviewProjection(
      {
        profileId: 'profile-1',
        displayName: 'Casey Candidate',
        handle: 'casey',
        avatarUrl: 'https://example.com/avatar.png',
        headline: 'Backend engineer',
        tagline: 'Proof-first builder',
        workMode: 'remote',
        city: 'Stockholm',
        country: 'Sweden',
        desiredRoles: ['Staff backend engineer'],
        valuesTags: ['privacy'],
        causeTags: ['climate'],
        verified: { work_email: true },
      },
      'shortlist_identity'
    );

    expect(shortlisted.displayName).toBe('Casey Candidate');
    expect(shortlisted.handle).toBeNull();
    expect(shortlisted.avatarUrl).toBeNull();
    expect(getVisibleIdentityFields('shortlist_identity')).not.toContain('handle');
  });

  it('downgrades viewer shortlist access to blind-only summaries', () => {
    const shortlistPolicy = getShortlistProjectionPolicy('viewer', 'full_identity');
    expect(shortlistPolicy.effectiveScope).toBe('blind');
    expect(shortlistPolicy.verificationSummaryVisibility).toBe('none');

    const projected = buildCandidateReviewProjection(
      {
        profileId: 'profile-1',
        displayName: 'Casey Candidate',
        handle: 'casey',
        avatarUrl: 'https://example.com/avatar.png',
        headline: 'Backend engineer',
        tagline: 'Proof-first builder',
        workMode: 'remote',
        city: 'Stockholm',
        country: 'Sweden',
        desiredRoles: ['Staff backend engineer'],
        valuesTags: ['privacy'],
        causeTags: ['climate'],
        verified: { work_email: true },
      },
      shortlistPolicy.effectiveScope,
      {
        verificationSummaryVisibility: shortlistPolicy.verificationSummaryVisibility,
      }
    );

    expect(projected.displayName).toBeNull();
    expect(projected.verificationSummary).toBeNull();
  });

  it('blocks full review reads for viewers while keeping member scope intact', () => {
    expect(getReviewProjectionPolicy('viewer', 'shortlist_identity')).toEqual({
      allowed: false,
      effectiveScope: 'blind',
      verificationSummaryVisibility: 'none',
    });
    expect(getReviewProjectionPolicy('member', 'shortlist_identity')).toEqual({
      allowed: true,
      effectiveScope: 'shortlist_identity',
      verificationSummaryVisibility: 'redacted',
    });
  });

  it('renders deterministic explanation sections from reason codes and manual overrides', () => {
    const rendered = renderExplanationFromReasonCodes({
      reasonCodes: ['skills_strong', 'verification_ready'],
      ledgerEntries: [
        {
          category: 'manual_override',
          reasonCode: 'override_shortlist_manual',
          source: 'reviewer',
          payloadJson: { annotation: 'Strong proof quality in recent work sample.' },
          createdAt: new Date(),
          noteHash: 'abc',
        },
      ],
      fairnessStatus: 'elevated',
      audience: 'org',
    });

    expect(rendered.summary).toContain(
      'Evidence points to a strong skills fit for this assignment.'
    );
    expect(rendered.sections.manual_override).toContain(
      'A reviewer manually shortlisted this candidate.'
    );
    expect(rendered.sections.manual_override).toContain(
      'Reviewer note: Strong proof quality in recent work sample.'
    );
    expect(rendered.sections.fairness[0]).toContain('Fairness checks are elevated');
  });

  it('suppresses exact rank unless fairness passes and reviewer role allows it', () => {
    expect(canRevealExactRank('viewer', 'pass')).toBe(false);
    expect(canRevealExactRank('member', 'unavailable')).toBe(false);
    expect(canRevealExactRank('member', 'pass')).toBe(true);
    expect(
      shouldSuppressExactRank('pass', 'stale', new Date('2026-03-01T00:00:00Z'), new Date())
    ).toBe(true);

    expect(buildFairnessUiContract('breach')).toEqual(
      expect.objectContaining({
        showWarning: true,
        suppressExactRank: true,
      })
    );
  });

  it('keeps fairness cohort checks separate from Zen opt-in state', () => {
    expect(
      evaluateFairnessCohortAvailability({
        poolCount: 80,
        availableColumns: ['age', 'gender'],
        optedInCount: 10,
      })
    ).toEqual({
      status: 'unavailable',
      insufficientReason: 'demographic_opt_in_cohort_below_threshold',
    });

    expect(
      evaluateFairnessCohortAvailability({
        poolCount: 80,
        availableColumns: ['age', 'gender'],
        optedInCount: 24,
      })
    ).toEqual({
      status: 'pass',
      insufficientReason: null,
    });
  });
});
