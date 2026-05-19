export const MATCH_EXPLAINER_TITLE = 'Why This Proof Match?';
export const MATCH_EXPLAINER_TRIGGER_LABEL = MATCH_EXPLAINER_TITLE;
export const MATCH_EXPLAINER_TRIGGER_ARIA_LABEL = 'Open the proof-first explanation for this match';
export const MATCH_EXPLAINER_DIALOG_DESCRIPTION =
  'Blind-by-default review keeps identity-bearing details hidden until candidate consent allows reveal. Review the strongest proof, reason-coded fit rationale, privacy-safe constraints, and only then the supporting fit-signal detail.';

export const MATCH_EXPLAINER_TEST_IDS = {
  trigger: 'match-explainer-trigger',
  title: 'match-explainer-title',
  description: 'match-explainer-description',
} as const;

export function buildMatchExplainerContract() {
  return {
    title: MATCH_EXPLAINER_TITLE,
    triggerLabel: MATCH_EXPLAINER_TRIGGER_LABEL,
    triggerAriaLabel: MATCH_EXPLAINER_TRIGGER_ARIA_LABEL,
    dialogDescription: MATCH_EXPLAINER_DIALOG_DESCRIPTION,
    testIds: MATCH_EXPLAINER_TEST_IDS,
  };
}
