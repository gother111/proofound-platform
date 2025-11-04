'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface AccessibilityCommitments {
  physicalAccessibility?: string;
  digitalAccessibility?: string;
  accommodationsOffered?: string[];
  inclusionInitiatives?: string;
  wellbeingSupport?: string;
}

interface AccessibilityCommitmentsProps {
  commitments: AccessibilityCommitments;
  onChange: (commitments: AccessibilityCommitments) => void;
  disabled?: boolean;
}

const COMMON_ACCOMMODATIONS = [
  'Wheelchair accessible facilities',
  'Screen reader compatible tools',
  'Flexible work arrangements',
  'Mental health days',
  'Ergonomic equipment',
  'Sign language interpreters',
  'Closed captioning for meetings',
  'Quiet work spaces',
  'Adjustable desk setups',
  'Remote work options',
  'Flexible hours for medical appointments',
  'Neurodiversity support',
];

export function AccessibilityCommitments({
  commitments,
  onChange,
  disabled = false,
}: AccessibilityCommitmentsProps) {
  const handleUpdate = (key: keyof AccessibilityCommitments, value: any) => {
    onChange({ ...commitments, [key]: value });
  };

  const toggleAccommodation = (accommodation: string) => {
    const current = commitments.accommodationsOffered || [];
    const updated = current.includes(accommodation)
      ? current.filter((a) => a !== accommodation)
      : [...current, accommodation];
    handleUpdate('accommodationsOffered', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Accessibility & Inclusion</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Share your commitments to creating an accessible and inclusive workplace.
        </p>
      </div>

      {/* Physical Accessibility */}
      <div className="space-y-2">
        <Label htmlFor="physical-access">Physical Accessibility</Label>
        <Textarea
          id="physical-access"
          placeholder="Describe physical accessibility features of your workspace (e.g., wheelchair ramps, accessible restrooms, elevators, parking)"
          value={commitments.physicalAccessibility || ''}
          onChange={(e) => handleUpdate('physicalAccessibility', e.target.value)}
          rows={3}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Include details about building access, facilities, and any physical accommodations
        </p>
      </div>

      {/* Digital Accessibility */}
      <div className="space-y-2">
        <Label htmlFor="digital-access">Digital Accessibility</Label>
        <Textarea
          id="digital-access"
          placeholder="Describe digital accessibility practices (e.g., WCAG compliance, screen reader support, keyboard navigation, accessible documentation)"
          value={commitments.digitalAccessibility || ''}
          onChange={(e) => handleUpdate('digitalAccessibility', e.target.value)}
          rows={3}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Include information about your digital tools, platforms, and accessibility standards
        </p>
      </div>

      {/* Common Accommodations */}
      <div className="space-y-3">
        <Label>Accommodations Offered</Label>
        <p className="text-xs text-muted-foreground">
          Select all accommodations your organization offers or is willing to provide
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMON_ACCOMMODATIONS.map((accommodation) => (
            <div
              key={accommodation}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                (commitments.accommodationsOffered || []).includes(accommodation)
                  ? 'border-proofound-forest bg-proofound-forest/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <Checkbox
                id={`accommodation-${accommodation}`}
                checked={(commitments.accommodationsOffered || []).includes(accommodation)}
                onCheckedChange={() => toggleAccommodation(accommodation)}
                disabled={disabled}
                className="mt-0.5"
              />
              <label
                htmlFor={`accommodation-${accommodation}`}
                className="text-sm cursor-pointer flex-1"
              >
                {accommodation}
              </label>
            </div>
          ))}
        </div>
        {commitments.accommodationsOffered && commitments.accommodationsOffered.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Selected:</span>
            {commitments.accommodationsOffered.map((acc) => (
              <Badge
                key={acc}
                variant="outline"
                className="bg-proofound-forest/10 border-proofound-forest/30"
              >
                <Check className="h-3 w-3 mr-1" />
                {acc}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Inclusion Initiatives */}
      <div className="space-y-2">
        <Label htmlFor="inclusion">Inclusion Initiatives</Label>
        <Textarea
          id="inclusion"
          placeholder="Describe your diversity and inclusion programs, employee resource groups, training, or other initiatives"
          value={commitments.inclusionInitiatives || ''}
          onChange={(e) => handleUpdate('inclusionInitiatives', e.target.value)}
          rows={3}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Share information about DEI programs, affinity groups, mentorship, or other inclusion efforts
        </p>
      </div>

      {/* Wellbeing Support */}
      <div className="space-y-2">
        <Label htmlFor="wellbeing">Wellbeing Support</Label>
        <Textarea
          id="wellbeing"
          placeholder="Describe support for mental health, work-life balance, burnout prevention, and employee wellbeing"
          value={commitments.wellbeingSupport || ''}
          onChange={(e) => handleUpdate('wellbeingSupport', e.target.value)}
          rows={3}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Include details about mental health resources, wellness programs, PTO policies, etc.
        </p>
      </div>
    </div>
  );
}
