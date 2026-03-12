'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  HUMAN_OBSERVED_CONFIDENCE_LEVELS,
  type HumanObservedConfidenceLevel,
} from '@/lib/verification/human-attestations';

export type HumanObservedAttestationFormValue = {
  verifierIdentityReference: string;
  relationshipToUser: string;
  observationContext: string;
  observationDuration: string;
  lastObservedAt: string;
  observedBehaviors: string;
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
    verifierIdentityReference: args.form.verifierIdentityReference.trim(),
    relationshipToUser: args.form.relationshipToUser.trim(),
    observationContext: args.form.observationContext.trim(),
    observationDuration: args.form.observationDuration.trim(),
    lastObservedAt: args.form.lastObservedAt.trim(),
    skillIds: args.skillIds,
    observedBehaviors: args.form.observedBehaviors
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    confidenceLevel: args.form.confidenceLevel,
    conflictBiasDisclosure: args.form.conflictBiasDisclosure.trim(),
  };
}

export function createDefaultHumanObservedAttestationForm(
  relationshipToUser = ''
): HumanObservedAttestationFormValue {
  return {
    verifierIdentityReference: '',
    relationshipToUser,
    observationContext: '',
    observationDuration: '',
    lastObservedAt: '',
    observedBehaviors: '',
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
          <Label htmlFor="attestation-verifier-reference">Your identity or reference</Label>
          <Input
            id="attestation-verifier-reference"
            value={value.verifierIdentityReference}
            onChange={(event) => update('verifierIdentityReference', event.target.value)}
            placeholder="Name, role, or reference link"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attestation-relationship">Relationship to the user</Label>
          <Input
            id="attestation-relationship"
            value={value.relationshipToUser}
            onChange={(event) => update('relationshipToUser', event.target.value)}
            placeholder="Manager, colleague, client, mentor"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attestation-context">Work, project, or learning context</Label>
        <Textarea
          id="attestation-context"
          value={value.observationContext}
          onChange={(event) => update('observationContext', event.target.value)}
          placeholder="Describe where you observed this work."
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
          <Label htmlFor="attestation-last-observed">Last observed</Label>
          <Input
            id="attestation-last-observed"
            value={value.lastObservedAt}
            onChange={(event) => update('lastObservedAt', event.target.value)}
            placeholder="2026-02 or February 2026"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attestation-behaviors">Observed behaviors</Label>
        <Textarea
          id="attestation-behaviors"
          value={value.observedBehaviors}
          onChange={(event) => update('observedBehaviors', event.target.value)}
          placeholder={
            'One behavior per line\nExplained tradeoffs clearly\nClosed feedback loops quickly'
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
          placeholder="State any reporting line, commercial tie, or reason your view may be biased."
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
