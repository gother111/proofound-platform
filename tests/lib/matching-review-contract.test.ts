import { describe, expect, it } from 'vitest';

import {
  buildProofFirstReviewCard,
  buildCandidateReviewProjection,
  buildFairnessUiContract,
  buildVisibilitySafeWhy,
  canRevealExactRank,
  evaluateFairnessCohortAvailability,
  getReviewProjectionPolicy,
  getShortlistProjectionPolicy,
  getVisibleIdentityFields,
  renderExplanationFromReasonCodes,
  resolveCanonicalCorridor,
  resolveProgressiveRevealStage,
  shouldSuppressExactRank,
} from '@/lib/matching/review-contract';

describe('matching review contract', () => {
  it('keeps identity hidden in blind review and contextual reveal', () => {
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

    const contextualReveal = buildCandidateReviewProjection(
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

    expect(contextualReveal.displayName).toBeNull();
    expect(contextualReveal.handle).toBeNull();
    expect(contextualReveal.avatarUrl).toBeNull();
    expect(getVisibleIdentityFields('shortlist_identity')).not.toContain('displayName');
    expect(getVisibleIdentityFields('shortlist_identity')).not.toContain('handle');
  });

  it('keeps reviewer shortlist access below full identity', () => {
    const shortlistPolicy = getShortlistProjectionPolicy('org_reviewer', 'full_identity');
    expect(shortlistPolicy.effectiveScope).toBe('shortlist_identity');
    expect(shortlistPolicy.verificationSummaryVisibility).toBe('redacted');

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
    expect(projected.handle).toBeNull();
    expect(projected.verificationSummary).not.toBeNull();
  });

  it('keeps reviewer full review reads narrow while manager scope stays intact', () => {
    expect(getReviewProjectionPolicy('org_reviewer', 'full_identity')).toEqual({
      allowed: true,
      effectiveScope: 'shortlist_identity',
      verificationSummaryVisibility: 'redacted',
    });
    expect(getReviewProjectionPolicy('org_manager', 'shortlist_identity')).toEqual({
      allowed: true,
      effectiveScope: 'shortlist_identity',
      verificationSummaryVisibility: 'detailed',
    });
  });

  it('renders deterministic explanation sections from reason codes and manual overrides', () => {
    const rendered = renderExplanationFromReasonCodes({
      reasonCodes: ['skills_strong', 'verification_gap', 'verification_ready'],
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
    expect(rendered.summary).toContain('Verification requirements are not fully met yet.');
    expect(rendered.sections.manual_override).toContain(
      'A reviewer manually shortlisted this candidate.'
    );
    expect(rendered.sections.manual_override).toContain(
      'Reviewer note: Strong proof quality in recent work sample.'
    );
    expect(rendered.sections.fairness[0]).toContain('Fairness checks are elevated');
  });

  it('suppresses exact rank unless fairness passes and reviewer role allows it', () => {
    expect(canRevealExactRank('org_reviewer', 'pass')).toBe(false);
    expect(canRevealExactRank('org_manager', 'unavailable')).toBe(false);
    expect(canRevealExactRank('org_manager', 'pass')).toBe(true);
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

  it('maps all five progressive reveal stages and fallback-safe corridor states', () => {
    expect(resolveProgressiveRevealStage({ scope: 'blind', surface: 'assignment_card' })).toBe(
      'stage0_anonymous'
    );
    expect(resolveProgressiveRevealStage({ scope: 'blind', surface: 'review_detail' })).toBe(
      'stage1_capability_and_proof'
    );
    expect(
      resolveProgressiveRevealStage({ scope: 'shortlist_identity', surface: 'shortlist' })
    ).toBe('stage2_contextual_reveal');
    expect(resolveProgressiveRevealStage({ scope: 'full_identity', surface: 'intro' })).toBe(
      'stage3_intro_approved'
    );
    expect(resolveProgressiveRevealStage({ scope: 'full_identity', surface: 'interview' })).toBe(
      'stage4_interview_coordination'
    );

    expect(
      resolveCanonicalCorridor({
        reviewStage: 'shortlisted',
        revealScope: 'shortlist_identity',
        surface: 'review_detail',
        fairnessStatus: 'pass',
        introRequested: true,
      })
    ).toEqual(
      expect.objectContaining({
        progressiveRevealStage: 'stage2_contextual_reveal',
        corridorState: 'request_intro',
        fallbackState: null,
      })
    );

    expect(
      resolveCanonicalCorridor({
        reviewStage: 'shortlisted',
        revealScope: 'shortlist_identity',
        surface: 'review_detail',
        fairnessStatus: 'breach',
      })
    ).toEqual(
      expect.objectContaining({
        corridorState: 'shortlist',
        fallbackState: 'fairness_suppressed_ranking',
      })
    );
  });

  it('builds visibility-safe why payloads with rank bands instead of exact ranking', () => {
    const why = buildVisibilitySafeWhy({
      reasonCodes: ['skills_strong', 'verification_ready'],
      fairnessStatus: 'elevated',
      fallbackState: 'fairness_suppressed_ranking',
      rankBand: 'Top 10',
    });

    expect(why.reasonCodes).toContain('fairness_ranking_suppressed');
    expect(why.summary).toContain('Rank band: Top 10');
  });

  it('redacts upload-derived filenames from early review cards', () => {
    const reviewCard = buildProofFirstReviewCard({
      profileId: 'profile-1',
      reasonCodes: ['skills_strong'],
      fairnessStatus: 'pass',
      proofPack: {
        ownerId: 'profile-1',
        primarySubjectType: 'experience',
        lifecycleState: 'published',
        title: 'safe_name.pdf',
        summary: null,
        contextJson: {},
        ownershipStatement: 'Owned the shared document and shipped it with the team.',
        evidenceSummary: null,
        outcomesSummary: 'Demonstrated outcome in safe_name.pdf.',
        verificationSummary: 'Scoped verification supports this Proof Pack.',
        verificationStatus: 'verified',
        freshnessState: 'fresh',
        proofQualityScore: 0.9,
        updatedAt: new Date('2026-03-18T10:00:00Z'),
        publishedAt: new Date('2026-03-18T10:00:00Z'),
        contract: {
          id: 'pack-1',
          packKind: 'verification_bundle',
          status: 'published',
          title: 'safe_name.pdf',
          primaryClaim: {
            type: 'outcome_statement',
            statement: 'Evidence attached in safe_name.pdf shows the result.',
          },
          primaryAnchor: {
            subjectType: 'experience',
            subjectId: 'experience-1',
            label: 'Prior work',
          },
          roleContext: null,
          ownershipStatement: 'Owned the shared document and delivery.',
          timeframe: {
            start: null,
            end: null,
            label: null,
          },
          outcomeSummary: 'safe_name.pdf captured the shipped outcome.',
          linkedSkills: [],
          linkedEvidenceItems: [],
          verificationSummary: {
            summary: 'Scoped verification supports this Proof Pack.',
            evidenceCount: 1,
            verifiedEvidenceCount: 1,
            verificationTypes: ['platform_manual_review'],
            badges: [],
          },
          proofQualityScore: 0.9,
          visibilityState: 'matched_org',
          freshnessState: 'fresh',
          lastVerifiedAt: null,
          schemaVersion: 'proof_pack/v2',
        },
      },
    });

    expect(reviewCard.strongestProof.summary).toContain('shared document');
    expect(reviewCard.strongestProof.summary).not.toContain('safe_name.pdf');
    expect(reviewCard.strongestProof.outcome).not.toContain('safe_name.pdf');
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
