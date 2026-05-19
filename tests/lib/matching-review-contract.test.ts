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

type ReviewCardProofPack = NonNullable<
  Parameters<typeof buildProofFirstReviewCard>[0]['proofPack']
>;

function buildReviewProofPack(overrides: Partial<ReviewCardProofPack> = {}): ReviewCardProofPack {
  const contract = {
    id: 'pack-1',
    packKind: 'verification_bundle',
    status: 'published',
    title: 'Proof Pack',
    primaryClaim: {
      type: 'outcome_statement',
      statement: 'Evidence shows the result.',
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
    outcomeSummary: 'Captured the shipped outcome.',
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
  } as ReviewCardProofPack['contract'];

  return {
    ownerId: 'profile-1',
    primarySubjectType: 'experience',
    lifecycleState: 'published',
    title: 'Proof Pack',
    summary: null,
    contextJson: {},
    ownershipStatement: 'Owned the shared document and shipped it with the team.',
    evidenceSummary: null,
    outcomesSummary: 'Captured the shipped outcome.',
    verificationSummary: 'Scoped verification supports this Proof Pack.',
    verificationStatus: 'verified',
    freshnessState: 'fresh',
    proofQualityScore: 0.9,
    updatedAt: new Date('2026-03-18T10:00:00Z'),
    publishedAt: new Date('2026-03-18T10:00:00Z'),
    contract,
    ...overrides,
    contract: {
      ...contract,
      ...(overrides.contract ?? {}),
    },
  };
}

describe('matching review contract', () => {
  it('keeps identity hidden in blind review and contextual reveal', () => {
    const blind = buildCandidateReviewProjection(
      {
        profileId: 'profile-1',
        displayName: 'Casey Candidate',
        handle: 'casey',
        avatarUrl: 'https://example.com/avatar.png',
        email: 'casey@example.com',
        headline: 'Backend engineer',
        tagline: 'Proof-first builder',
        workMode: 'remote',
        city: 'Stockholm',
        country: 'Sweden',
        exactLocation: 'Sankt Eriksgatan 10, Stockholm',
        portfolioUrl: 'https://casey.example',
        employerNames: ['Acme Climate AB'],
        schoolNames: ['Stockholm University'],
        desiredRoles: ['Staff backend engineer'],
        valuesTags: ['privacy'],
        causeTags: ['climate'],
        verified: { work_email: true },
        publicPortfolioPublished: true,
      },
      'blind'
    );

    expect(blind.displayName).toBeNull();
    expect(blind.handle).toBeNull();
    expect(blind.avatarUrl).toBeNull();
    expect(blind.email).toBeNull();
    expect(blind.portfolioUrl).toBeNull();
    expect(blind.employerNames).toBeNull();
    expect(blind.schoolNames).toBeNull();
    expect(blind.exactLocation).toBeNull();
    expect(blind.locationSummary).toBe('Location hidden');

    const contextualReveal = buildCandidateReviewProjection(
      {
        profileId: 'profile-1',
        displayName: 'Casey Candidate',
        handle: 'casey',
        avatarUrl: 'https://example.com/avatar.png',
        email: 'casey@example.com',
        headline: 'Backend engineer',
        tagline: 'Proof-first builder',
        workMode: 'remote',
        city: 'Stockholm',
        country: 'Sweden',
        exactLocation: 'Sankt Eriksgatan 10, Stockholm',
        portfolioUrl: 'https://casey.example',
        employerNames: ['Acme Climate AB'],
        schoolNames: ['Stockholm University'],
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
    expect(contextualReveal.email).toBeNull();
    expect(contextualReveal.portfolioUrl).toBeNull();
    expect(contextualReveal.employerNames).toBeNull();
    expect(contextualReveal.schoolNames).toBeNull();
    expect(getVisibleIdentityFields('shortlist_identity')).not.toContain('displayName');
    expect(getVisibleIdentityFields('shortlist_identity')).not.toContain('handle');
    expect(getVisibleIdentityFields('shortlist_identity')).not.toContain('email');
    expect(getVisibleIdentityFields('shortlist_identity')).not.toContain('portfolioUrl');
  });

  it('allows approved identity fields only after full reveal consent', () => {
    const projected = buildCandidateReviewProjection(
      {
        profileId: 'profile-1',
        displayName: 'Casey Candidate',
        handle: 'casey',
        avatarUrl: 'https://example.com/avatar.png',
        email: 'casey@example.com',
        headline: 'Backend engineer',
        tagline: 'Proof-first builder',
        workMode: 'remote',
        city: 'Stockholm',
        country: 'Sweden',
        exactLocation: 'Sankt Eriksgatan 10, Stockholm',
        portfolioUrl: 'https://casey.example',
        employerNames: ['Acme Climate AB'],
        schoolNames: ['Stockholm University'],
        verified: { work_email: true },
      },
      'full_identity'
    );

    expect(projected.displayName).toBe('Casey Candidate');
    expect(projected.email).toBe('casey@example.com');
    expect(projected.portfolioUrl).toBe('https://casey.example');
    expect(projected.employerNames).toEqual(['Acme Climate AB']);
    expect(projected.schoolNames).toEqual(['Stockholm University']);
    expect(projected.locationSummary).toBe('Sankt Eriksgatan 10, Stockholm');
  });

  it('does not let public portfolio publication override blind review hiding', () => {
    const blind = buildCandidateReviewProjection(
      {
        profileId: 'profile-1',
        displayName: 'Public Portfolio Candidate',
        handle: 'public-candidate',
        email: 'public@example.com',
        portfolioUrl: 'https://proofound.example/portfolio/public-candidate',
        publicPortfolioPublished: true,
        workMode: 'remote',
      },
      'blind'
    );

    expect(blind.displayName).toBeNull();
    expect(blind.handle).toBeNull();
    expect(blind.email).toBeNull();
    expect(blind.portfolioUrl).toBeNull();
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

  it('uses plain proof-review copy for verification fallback labels', () => {
    const reviewCard = buildProofFirstReviewCard({
      profileId: 'profile-1',
      reasonCodes: ['skills_strong'],
      fairnessStatus: 'pass',
      verificationCount: 2,
    });
    const serialized = JSON.stringify(reviewCard);

    expect(reviewCard.verification.summaryLabel).toBe('2 scoped verification records present');
    expect(reviewCard.trustLabels).toContain('Scoped verification records present');
    expect(serialized).not.toMatch(/compatibility signal/i);
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

  it('redacts contact handles and raw links from blind proof text', () => {
    const reviewCard = buildProofFirstReviewCard({
      profileId: 'profile-1',
      reasonCodes: ['skills_strong'],
      fairnessStatus: 'pass',
      proofPack: buildReviewProofPack({
        contract: {
          primaryClaim: {
            type: 'outcome_statement',
            statement:
              'Delivered the proof. Contact candidate@example.com, +46 70 123 45 67, @candidate, https://linkedin.com/in/candidate, https://github.com/candidate/repo, or https://casey.example.',
          },
          outcomeSummary:
            'Evidence included https://github.com/candidate/private and portfolio https://casey.example.',
        } as Partial<ReviewCardProofPack['contract']> as ReviewCardProofPack['contract'],
      }),
    });
    const serialized = JSON.stringify(reviewCard);

    expect(reviewCard.privacy.reviewState).toBe('visible');
    expect(serialized).not.toContain('candidate@example.com');
    expect(serialized).not.toContain('+46 70 123 45 67');
    expect(serialized).not.toContain('@candidate');
    expect(serialized).not.toContain('linkedin.com');
    expect(serialized).not.toContain('github.com');
    expect(serialized).not.toContain('casey.example');
    expect(reviewCard.privacy.reasons).toEqual(
      expect.arrayContaining([
        'redacted_email',
        'redacted_phone',
        'redacted_url',
        'redacted_handle',
      ])
    );
  });

  it('hides exact employer and school names from blind proof text when context is private', () => {
    const reviewCard = buildProofFirstReviewCard({
      profileId: 'profile-1',
      reasonCodes: ['skills_strong'],
      fairnessStatus: 'pass',
      proofPack: buildReviewProofPack({
        contextJson: {
          contextOrganizationName: 'Acme Climate AB',
          contextSchoolName: 'Stockholm University',
          contextLocation: 'Stockholm, Sweden',
          contextOrganizationVisibility: 'owner_only',
          contextSchoolVisibility: 'owner_only',
        },
        contract: {
          primaryClaim: {
            type: 'outcome_statement',
            statement:
              'Shipped privacy work at Acme Climate AB after research with Stockholm University in Stockholm, Sweden.',
          },
          outcomeSummary: 'Acme Climate AB and Stockholm University both validated the result.',
          ownershipStatement: 'Owned implementation for Acme Climate AB.',
        } as Partial<ReviewCardProofPack['contract']> as ReviewCardProofPack['contract'],
      }),
    });
    const serialized = JSON.stringify(reviewCard);

    expect(reviewCard.privacy.reviewState).toBe('visible');
    expect(serialized).not.toContain('Acme Climate AB');
    expect(serialized).not.toContain('Stockholm University');
    expect(serialized).not.toContain('Stockholm, Sweden');
    expect(serialized).toContain('the organization');
    expect(serialized).toContain('the institution');
  });

  it('holds risky proof text for manual review instead of leaking uncertain identity', () => {
    const reviewCard = buildProofFirstReviewCard({
      profileId: 'profile-1',
      reasonCodes: ['skills_strong'],
      fairnessStatus: 'pass',
      proofPack: buildReviewProofPack({
        contract: {
          primaryClaim: {
            type: 'outcome_statement',
            statement: 'Jane Doe delivered the system from 221B Baker Street.',
          },
          outcomeSummary: 'Jane Doe later presented the results.',
          ownershipStatement: 'Jane Doe owned the delivery.',
        } as Partial<ReviewCardProofPack['contract']> as ReviewCardProofPack['contract'],
      }),
    });
    const serialized = JSON.stringify(reviewCard);

    expect(reviewCard.privacy.reviewState).toBe('held_for_manual_review');
    expect(reviewCard.strongestProof.summary).toBe('Proof summary held for manual privacy review.');
    expect(reviewCard.strongestProof.outcome).toBeNull();
    expect(serialized).not.toContain('Jane Doe');
    expect(serialized).not.toContain('221B Baker Street');
    expect(reviewCard.privacy.reasons).toEqual(
      expect.arrayContaining(['manual_review_possible_full_name', 'manual_review_precise_location'])
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
