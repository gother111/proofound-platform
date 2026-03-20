'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  HUMAN_OBSERVED_CONFIDENCE_LEVELS,
  type HumanObservedConfidenceLevel,
  HUMAN_OBSERVED_VERDICTS,
  type HumanObservedVerdict,
} from '@/lib/verification/human-attestations';

export type HumanObservedAttestationFormValue = {
  verdict: HumanObservedVerdict;
  relationshipToSubject: string;
  workedTogetherWhere: string;
  observationDuration: string;
  observationRecency: string;
  observedBehaviorNote: string;
  confidenceLevel: HumanObservedConfidenceLevel;
  conflictBiasDisclosure: string;
};

type HumanObservedAttestationFieldsProps = {
  value: HumanObservedAttestationFormValue;
  onChange: (nextValue: HumanObservedAttestationFormValue) => void;
  skillLabels: string[];
  disabled?: boolean;
};

export function buildHumanObservedAttestationPayload(args: {
  form: HumanObservedAttestationFormValue;
  skillIds: string[];
}) {
  return {
    verdict: args.form.verdict,
    relationshipToSubject: args.form.relationshipToSubject.trim(),
    workedTogetherWhere: args.form.workedTogetherWhere.trim(),
    observationDuration: args.form.observationDuration.trim(),
    observationRecency: args.form.observationRecency.trim(),
    skillIds: args.skillIds,
    observedBehaviorNote: args.form.observedBehaviorNote.trim(),
    confidenceLevel: args.form.confidenceLevel,
    conflictBiasDisclosure: args.form.conflictBiasDisclosure.trim() || null,
  };
}

export function createDefaultHumanObservedAttestationForm(
  relationshipToSubject = ''
): HumanObservedAttestationFormValue {
  return {
    verdict: 'yes',
    relationshipToSubject,
    workedTogetherWhere: '',
    observationDuration: '',
    observationRecency: '',
    observedBehaviorNote: '',
    confidenceLevel: 'medium',
    conflictBiasDisclosure: '',
  };
}

export function HumanObservedAttestationFields({
  value,
  onChange,
  skillLabels,
  disabled = false,
}: HumanObservedAttestationFieldsProps) {
  const update = <Key extends keyof HumanObservedAttestationFormValue>(
    key: Key,
    fieldValue: HumanObservedAttestationFormValue[Key]
  ) => {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-proofound-stone/80 bg-white/70 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Observed in practice</p>
        <p className="text-xs text-muted-foreground">
          Record bounded observations for {skillLabels.join(', ')}. Generic praise is not used.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="attestation-verdict">Your verdict</Label>
          <select
            id="attestation-verdict"
            value={value.verdict}
            onChange={(event) => update('verdict', event.target.value as HumanObservedVerdict)}
            disabled={disabled}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {HUMAN_OBSERVED_VERDICTS.map((verdict) => (
              <option key={verdict} value={verdict}>
                {verdict === 'yes' ? 'Yes' : verdict === 'partly' ? 'Partly' : 'No'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="attestation-relationship">Relationship to the subject</Label>
          <Input
            id="attestation-relationship"
            value={value.relationshipToSubject}
            onChange={(event) => update('relationshipToSubject', event.target.value)}
            placeholder="Manager, colleague, client, mentor"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attestation-context">Where you worked together</Label>
        <Textarea
          id="attestation-context"
          value={value.workedTogetherWhere}
          onChange={(event) => update('workedTogetherWhere', event.target.value)}
          placeholder="Project, team, course, client engagement, or delivery context."
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="attestation-duration">Duration of observation</Label>
          <Input
            id="attestation-duration"
            value={value.observationDuration}
            onChange={(event) => update('observationDuration', event.target.value)}
            placeholder="6 months, one sprint, one semester"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attestation-last-observed">Recency</Label>
          <Input
            id="attestation-last-observed"
            value={value.observationRecency}
            onChange={(event) => update('observationRecency', event.target.value)}
            placeholder="Most recently observed in 2026-02 or February 2026"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attestation-behaviors">Concrete observed behavior or scope note</Label>
        <Textarea
          id="attestation-behaviors"
          value={value.observedBehaviorNote}
          onChange={(event) => update('observedBehaviorNote', event.target.value)}
          placeholder={
            'Describe what you directly observed, what was in scope, and why your verdict is yes, partly, or no.'
          }
          rows={4}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="attestation-confidence">Confidence level</Label>
          <select
            id="attestation-confidence"
            value={value.confidenceLevel}
            onChange={(event) =>
              update('confidenceLevel', event.target.value as HumanObservedConfidenceLevel)
            }
            disabled={disabled}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {HUMAN_OBSERVED_CONFIDENCE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level[0]?.toUpperCase()}
                {level.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attestation-bias">Conflict or bias disclosure</Label>
        <Textarea
          id="attestation-bias"
          value={value.conflictBiasDisclosure}
          onChange={(event) => update('conflictBiasDisclosure', event.target.value)}
          placeholder="State any reporting line, commercial tie, or leave blank if none is relevant."
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
