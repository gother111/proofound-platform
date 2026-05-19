import { Check, ChevronRight, Loader2, Lock, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MAX_PROOFS_PER_SKILL,
  MAX_PROOF_UPLOAD_SIZE_BYTES,
  PROOF_ALLOWED_EXTENSIONS_LABEL,
  PROOF_FILE_ACCEPT_ATTRIBUTE,
} from '@/lib/proofs/constants';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { skillDisplayLabel } from '@/lib/copy/labels';

import { DOMAIN_COLORS, LEVEL_LABELS } from './constants';
import type {
  L1Domain,
  L2Category,
  L3Subcategory,
  L4Skill,
  SkillProofSource,
  SkillVerificationSource,
} from './types';

type BrowseModePanelProps = {
  step: number;
  loadedDomains: L1Domain[];
  domainsLoading: boolean;
  handleL1Select: (domain: L1Domain) => void;
  selectedL1: L1Domain | null;
  l2Categories: L2Category[];
  l2Loading: boolean;
  handleL2Select: (category: L2Category) => void;
  selectedL2: L2Category | null;
  l3Subcategories: L3Subcategory[];
  l3Loading: boolean;
  handleL3Select: (subcategory: L3Subcategory) => void;
  selectedL3: L3Subcategory | null;
  l4Skills: L4Skill[];
  l4Search: string;
  setL4Search: (value: string) => void;
  l4Loading: boolean;
  showL4Dropdown: boolean;
  setShowL4Dropdown: (show: boolean) => void;
  selectedL4: L4Skill | null;
  setSelectedL4: (skill: L4Skill | null) => void;
  setL4Name: (value: string) => void;
  level: number;
  setLevel: (value: number) => void;
  lastUsedDate: string;
  setLastUsedDate: (value: string) => void;
  proofSource: SkillProofSource;
  setProofSource: (value: SkillProofSource) => void;
  proofUrl: string;
  setProofUrl: (value: string) => void;
  proofFilePath: string;
  proofFileName: string;
  proofUploadError: string;
  proofUploading: boolean;
  onProofFileSelected: (file: File | null) => void;
  proofNotes: string;
  setProofNotes: (value: string) => void;
  proofIssuedDate: string;
  setProofIssuedDate: (value: string) => void;
  proofExpiresDate: string;
  setProofExpiresDate: (value: string) => void;
  hasProofContext: boolean;
  requestVerification: boolean;
  setRequestVerification: (value: boolean) => void;
  verificationEmail: string;
  setVerificationEmail: (value: string) => void;
  verificationSource: SkillVerificationSource;
  setVerificationSource: (value: SkillVerificationSource) => void;
  verificationMessage: string;
  setVerificationMessage: (value: string) => void;
  saving: boolean;
  handleSave: (saveAndAddAnother?: boolean) => void;
  onNavigateToStep: (targetStep: 1 | 2 | 3 | 4) => void;
  handleBack: () => void;
};

export function BrowseModePanel({
  step,
  loadedDomains,
  domainsLoading,
  handleL1Select,
  selectedL1,
  l2Categories,
  l2Loading,
  handleL2Select,
  selectedL2,
  l3Subcategories,
  l3Loading,
  handleL3Select,
  selectedL3,
  l4Skills,
  l4Search,
  setL4Search,
  l4Loading,
  showL4Dropdown,
  setShowL4Dropdown,
  selectedL4,
  setSelectedL4,
  setL4Name,
  level,
  setLevel,
  lastUsedDate,
  setLastUsedDate,
  proofSource,
  setProofSource,
  proofUrl,
  setProofUrl,
  proofFilePath,
  proofFileName,
  proofUploadError,
  proofUploading,
  onProofFileSelected,
  proofNotes,
  setProofNotes,
  proofIssuedDate,
  setProofIssuedDate,
  proofExpiresDate,
  setProofExpiresDate,
  hasProofContext,
  requestVerification,
  setRequestVerification,
  verificationEmail,
  setVerificationEmail,
  verificationSource,
  setVerificationSource,
  verificationMessage,
  setVerificationMessage,
  saving,
  handleSave,
  onNavigateToStep,
  handleBack,
}: BrowseModePanelProps) {
  const canNavigateToStep = (targetStep: 1 | 2 | 3 | 4) => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return Boolean(selectedL1);
    if (targetStep === 3) return Boolean(selectedL1 && selectedL2);
    return Boolean(selectedL1 && selectedL2 && selectedL3);
  };

  const stepMeta: Array<{ step: 1 | 2 | 3 | 4; label: string }> = [
    { step: 1, label: 'Domain' },
    { step: 2, label: 'Category' },
    { step: 3, label: 'Subcategory' },
    { step: 4, label: 'Details' },
  ];

  return (
    <>
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          {stepMeta.map(({ step: itemStep, label }) => {
            const isActive = itemStep === step;
            const isCompleted = itemStep < step;
            const isReachable = canNavigateToStep(itemStep);
            return (
              <div key={itemStep} className="flex items-center">
                <button
                  type="button"
                  data-testid={`browse-step-${itemStep}`}
                  aria-label={`Go to ${label} step`}
                  disabled={!isReachable}
                  onClick={() => onNavigateToStep(itemStep)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-proofound-forest text-white'
                      : isCompleted
                        ? 'bg-[#7A9278] text-white'
                        : 'bg-[#E5E3DA] text-muted-foreground'
                  } ${
                    isReachable
                      ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2'
                      : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : itemStep}
                </button>
                {itemStep < 4 && (
                  <div
                    className={`h-0.5 w-16 mx-2 ${isCompleted ? 'bg-[#7A9278]' : 'bg-[#E5E3DA]'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          {stepMeta.map(({ label }) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div
          className="mt-3 flex flex-wrap items-center gap-2 text-xs"
          data-testid="browse-current-location-inline"
        >
          <button
            type="button"
            data-testid="browse-location-domain"
            onClick={() => onNavigateToStep(1)}
            className="inline-flex items-center gap-1 rounded-full border border-[#D8D3C8] bg-white px-2.5 py-1 text-left transition-colors hover:bg-japandi-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2"
          >
            <span className="font-medium text-foreground">Domain</span>
            <span className="text-muted-foreground">
              {selectedL1?.nameI18n?.en || 'Not selected'}
            </span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-[#8B867A]" aria-hidden />
          <button
            type="button"
            data-testid="browse-location-category"
            disabled={!canNavigateToStep(2)}
            onClick={() => onNavigateToStep(2)}
            className={`inline-flex items-center gap-1 rounded-full border border-[#D8D3C8] bg-white px-2.5 py-1 text-left transition-colors ${
              canNavigateToStep(2)
                ? 'hover:bg-japandi-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2'
                : 'cursor-not-allowed opacity-70'
            }`}
          >
            <span className="font-medium text-foreground">Category</span>
            <span className="text-muted-foreground">
              {selectedL2?.nameI18n?.en || 'Not selected'}
            </span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-[#8B867A]" aria-hidden />
          <button
            type="button"
            data-testid="browse-location-subcategory"
            disabled={!canNavigateToStep(3)}
            onClick={() => onNavigateToStep(3)}
            className={`inline-flex items-center gap-1 rounded-full border border-[#D8D3C8] bg-white px-2.5 py-1 text-left transition-colors ${
              canNavigateToStep(3)
                ? 'hover:bg-japandi-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2'
                : 'cursor-not-allowed opacity-70'
            }`}
          >
            <span className="font-medium text-foreground">Subcategory</span>
            <span className="text-muted-foreground">
              {selectedL3?.nameI18n?.en || 'Not selected'}
            </span>
          </button>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">Step 1: Choose Domain</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select the top-level domain that best fits your skill. Pick the closest match; you can
              refine wording later.
            </p>
          </div>

          {domainsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading domains...</span>
            </div>
          ) : loadedDomains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No domains available. Please try again later.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {loadedDomains.map((domain) => {
                const colors = DOMAIN_COLORS[domain.catId] || DOMAIN_COLORS[1];
                return (
                  <Card
                    key={domain.catId}
                    className={`${colors.bg} ${colors.border} border-2 hover:shadow-md transition-all cursor-pointer p-4`}
                    onClick={() => handleL1Select(domain)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{colors.icon}</div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${colors.text}`}>
                          {domain.nameI18n?.en || 'Unknown'}
                        </h4>
                        {domain.descriptionI18n?.en && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {domain.descriptionI18n?.en}
                          </p>
                        )}
                      </div>
                      <ChevronRight className={`h-5 w-5 ${colors.text}`} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-2 text-proofound-forest"
            >
              ← Back to Domains
            </Button>
            <h3 className="text-lg font-medium text-foreground mb-2">Step 2: Choose Category</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a category within <strong>{selectedL1?.nameI18n?.en || 'Unknown'}</strong>. If
              you can&apos;t find the exact wording, choose the nearest synonym.
            </p>
          </div>

          {l2Loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading categories...</span>
            </div>
          ) : l2Categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No categories found.</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {l2Categories.map((category) => (
                <Card
                  key={category.subcatId}
                  className="p-4 hover:bg-japandi-bg transition-colors cursor-pointer border border-proofound-stone"
                  onClick={() => handleL2Select(category)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {category.nameI18n?.en || 'Unknown'}
                      </h4>
                      {category.descriptionI18n?.en && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.descriptionI18n?.en}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-2 text-proofound-forest"
            >
              ← Back to Categories
            </Button>
            <h3 className="text-lg font-medium text-foreground mb-2">Step 3: Choose Subcategory</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a subcategory within{' '}
              <strong>
                {selectedL1?.nameI18n?.en || 'Not selected'} {'->'}{' '}
                {selectedL2?.nameI18n?.en || 'Not selected'}
              </strong>
              .
            </p>
          </div>

          {l3Loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading subcategories...</span>
            </div>
          ) : l3Subcategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No subcategories found.</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {l3Subcategories.map((subcategory) => (
                <Card
                  key={subcategory.l3Id}
                  className="p-4 hover:bg-japandi-bg transition-colors cursor-pointer border border-proofound-stone"
                  onClick={() => handleL3Select(subcategory)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {subcategory.nameI18n?.en || 'Unknown'}
                      </h4>
                      {subcategory.descriptionI18n?.en && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {subcategory.descriptionI18n?.en}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-2 text-proofound-forest"
            >
              ← Back to Subcategories
            </Button>
            <h3 className="text-lg font-medium text-foreground mb-2">Step 4: Skill Details</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fill in the details for your skill. Your current location is shown above.
            </p>
          </div>

          <div className="relative">
            <Label htmlFor="skill-name" className="text-foreground">
              Skill Name *
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="skill-name"
                type="text"
                placeholder="Search for a skill or enter custom name..."
                value={l4Search}
                onChange={(e) => {
                  setL4Search(e.target.value);
                  setShowL4Dropdown(true);
                }}
                onFocus={() => setShowL4Dropdown(true)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tip: try synonyms or common terms. We&apos;ll match close wording to the Atlas skill.
            </p>

            {showL4Dropdown && l4Search && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-proofound-stone rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                {l4Loading ? (
                  <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading skills...</span>
                  </div>
                ) : (
                  (() => {
                    const filtered = l4Skills
                      .filter((skill) =>
                        skill.nameI18n?.en?.toLowerCase().includes(l4Search.toLowerCase())
                      )
                      .slice(0, 50);

                    return filtered.length > 0 ? (
                      <>
                        {filtered.map((skill) => (
                          <button
                            key={skill.code}
                            type="button"
                            className="w-full text-left p-3 hover:bg-japandi-bg cursor-pointer border-b border-proofound-stone last:border-b-0"
                            onClick={() => {
                              setSelectedL4(skill);
                              setL4Name(skill.nameI18n?.en || '');
                              setL4Search(skill.nameI18n?.en || '');
                              setShowL4Dropdown(false);
                            }}
                          >
                            <div className="font-medium text-foreground">
                              {skillDisplayLabel({
                                taxonomyName: skill.nameI18n?.en,
                                code: skill.code,
                              })}
                            </div>
                            {skill.descriptionI18n?.en && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {skill.descriptionI18n?.en}
                              </div>
                            )}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <p className="mb-2">No matching skills found</p>
                        <p className="text-sm">
                          You can continue with &ldquo;{l4Search}&rdquo; as a custom skill
                        </p>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {selectedL4 && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-[#7A9278] text-white">
                  From Atlas
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {skillDisplayLabel({
                    taxonomyName: selectedL4.nameI18n?.en,
                    code: selectedL4.code,
                  })}
                </span>
              </div>
            )}

            {l4Search && !selectedL4 && (
              <div className="mt-2">
                <Badge variant="outline" className="border-[#D4A574] text-[#8B6F47]">
                  Custom Skill
                </Badge>
              </div>
            )}
          </div>

          <div>
            <Label className="text-foreground mb-3 block">Proficiency Level *</Label>
            <RadioGroup
              value={level.toString()}
              onValueChange={(val) => setLevel(parseInt(val, 10))}
            >
              {LEVEL_LABELS.map((entry) => (
                <div
                  key={entry.value}
                  className="flex items-center space-x-3 mb-2 p-3 rounded-lg border border-proofound-stone hover:bg-japandi-bg transition-colors"
                >
                  <RadioGroupItem value={entry.value.toString()} id={`level-${entry.value}`} />
                  <Label htmlFor={`level-${entry.value}`} className="flex-1 cursor-pointer">
                    <div className="font-medium text-foreground">{entry.label}</div>
                    <div className="text-sm text-muted-foreground">{entry.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="last-used" className="text-foreground">
              Last Used (Optional)
            </Label>
            <Input
              id="last-used"
              type="date"
              value={lastUsedDate}
              onChange={(e) => setLastUsedDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">When did you last use this skill?</p>
          </div>

          <div className="border-t border-proofound-stone pt-6">
            <h4 className="font-medium text-foreground mb-3">Add Proof (Optional)</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Lock className="h-3.5 w-3.5" />
              Proofs default to <strong className="ml-1">match-only</strong>; you can change
              visibility later.
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={proofSource === 'url' ? 'default' : 'outline'}
                  onClick={() => setProofSource('url')}
                >
                  Proof URL
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={proofSource === 'document' ? 'default' : 'outline'}
                  onClick={() => setProofSource('document')}
                >
                  Document Upload
                </Button>
              </div>

              <div>
                <Label htmlFor="proof-url" className="text-foreground">
                  Proof URL {proofSource === 'document' ? '(Optional)' : ''}
                </Label>
                <Input
                  id="proof-url"
                  type="url"
                  placeholder="https://..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Up to {MAX_PROOFS_PER_SKILL} proofs can be attached per skill.
                </p>
              </div>

              {proofSource === 'document' && (
                <div>
                  <Label htmlFor="proof-document" className="text-foreground">
                    Upload document
                  </Label>
                  <Input
                    id="proof-document"
                    type="file"
                    accept={PROOF_FILE_ACCEPT_ATTRIBUTE}
                    onChange={(event) => onProofFileSelected(event.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted: {PROOF_ALLOWED_EXTENSIONS_LABEL}. Max size:{' '}
                    {MAX_PROOF_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB.
                  </p>
                  {proofUploading && (
                    <p className="text-xs text-muted-foreground mt-1">Uploading document...</p>
                  )}
                  {proofFilePath && !proofUploading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded: {proofFileName || 'Document'}
                    </p>
                  )}
                  {proofUploadError && (
                    <p className="text-xs text-proofound-terracotta mt-1">{proofUploadError}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="proof-notes" className="text-foreground">
                  Notes
                </Label>
                <Textarea
                  id="proof-notes"
                  placeholder="Describe this proof..."
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="proof-issued-date" className="text-foreground">
                  Issued Date (Optional)
                </Label>
                <Input
                  id="proof-issued-date"
                  type="date"
                  value={proofIssuedDate}
                  onChange={(e) => setProofIssuedDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="proof-expires-date" className="text-foreground">
                  Expiration Date (Optional)
                </Label>
                <Input
                  id="proof-expires-date"
                  type="date"
                  value={proofExpiresDate}
                  min={proofIssuedDate || undefined}
                  onChange={(e) => setProofExpiresDate(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty when the proof does not expire.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-proofound-stone pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id="request-verification-on-add"
                checked={requestVerification}
                disabled={!hasProofContext}
                onCheckedChange={(checked) => setRequestVerification(Boolean(checked))}
              />
              <Label htmlFor="request-verification-on-add" className="text-foreground">
                Ask someone to confirm this proof after save (optional)
              </Label>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              {hasProofContext
                ? 'Optional. Skipping is fine for portfolio-ready, but intro-readiness usually needs a non-self trust anchor tied to proof.'
                : 'Add proof first. Verification requests for skills must stay attached to a proof link or uploaded document.'}
            </p>

            {requestVerification && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="verification-email" className="text-foreground">
                    Verifier Email
                  </Label>
                  <Input
                    id="verification-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={verificationEmail}
                    onChange={(event) => setVerificationEmail(event.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="verification-source" className="text-foreground">
                    Relationship
                  </Label>
                  <select
                    id="verification-source"
                    value={verificationSource}
                    onChange={(event) =>
                      setVerificationSource(event.target.value as SkillVerificationSource)
                    }
                    className="mt-1 w-full px-3 py-2 border border-proofound-stone rounded-md"
                  >
                    <option value="peer">Peer / Colleague</option>
                    <option value="manager">Manager / Supervisor</option>
                    <option value="external">External / Client</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="verification-message" className="text-foreground">
                    Message (Optional)
                  </Label>
                  <Textarea
                    id="verification-message"
                    placeholder="Explain what proof and claim you want them to confirm..."
                    value={verificationMessage}
                    onChange={(event) => setVerificationMessage(event.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-proofound-stone">
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={!l4Search || saving}
              className="flex-1 border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
            >
              Save & Add Another
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={!l4Search || saving}
              className="flex-1 bg-proofound-forest text-white hover:bg-proofound-forest/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
