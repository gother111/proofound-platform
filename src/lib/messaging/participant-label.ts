export type ConversationStage = 'masked' | 'revealed';

type ParticipantLabelInput = {
  stage: ConversationStage;
  displayName?: string | null;
  handle?: string | null;
  fallbackName?: string | null;
};

const MASKED_PARTICIPANT_LABEL = 'Masked participant';
const PARTICIPANT_DETAILS_PENDING_LABEL = 'Participant details pending';
const MISSING_PARTICIPANT_LABELS = new Set(['anonymous', 'unknown', 'unknown user', '??']);

function cleanParticipantLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return MISSING_PARTICIPANT_LABELS.has(trimmed.toLowerCase()) ? null : trimmed;
}

export function getConversationParticipantLabel({
  stage,
  displayName,
  handle,
  fallbackName,
}: ParticipantLabelInput): string {
  const cleanDisplayName = cleanParticipantLabel(displayName);
  if (cleanDisplayName) return cleanDisplayName;

  const cleanFallbackName = cleanParticipantLabel(fallbackName);

  if (stage === 'revealed') {
    return cleanParticipantLabel(handle) || cleanFallbackName || PARTICIPANT_DETAILS_PENDING_LABEL;
  }

  return cleanFallbackName || MASKED_PARTICIPANT_LABEL;
}

export function getConversationParticipantInitials(
  label: string,
  stage: ConversationStage
): string {
  if (label === 'Submission') return 'S';
  if (label === 'Organization') return 'O';
  if (label === MASKED_PARTICIPANT_LABEL) return 'MP';
  if (label === PARTICIPANT_DETAILS_PENDING_LABEL) return 'PD';

  return (
    label
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || (stage === 'masked' ? 'MP' : 'PD')
  );
}
