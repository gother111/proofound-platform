'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, X, Linkedin, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface SkillSuggestion {
  linkedInSkillName: string;
  matchedSkill: {
    code: string;
    nameI18n: { en: string };
    descriptionI18n?: { en: string };
    catId: number;
    subcatId: number;
    l3Id: number;
    l1?: {
      catId: number;
      slug: string;
      nameI18n: { en: string };
    };
    l2?: {
      subcatId: number;
      catId: number;
      slug: string;
      nameI18n: { en: string };
    };
    l3?: {
      l3Id: number;
      subcatId: number;
      catId: number;
      slug: string;
      nameI18n: { en: string };
    };
  } | null;
  confidence: number;
  matchType: 'exact' | 'partial' | 'fuzzy' | 'none';
}

interface LinkedInImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkillsImported?: () => void;
}

export function LinkedInImportModal({
  open,
  onOpenChange,
  onSkillsImported,
}: LinkedInImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [importMode, setImportMode] = useState<'review' | 'auto'>('review');
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'init' | 'suggestions' | 'importing'>('init');

  const handleFetchSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/expertise/linkedin-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch LinkedIn skills');
      }

      const data = await response.json();

      // Show message about LinkedIn API limitations
      if (data.message) {
        toast.info(data.message, { duration: 6000 });
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setStep('suggestions');
      } else {
        toast.info('No skills found from LinkedIn. Please use the manual search feature.', {
          description: 'The LinkedIn API has limited access to skills data.',
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('LinkedIn import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkillSelection = (skillCode: string) => {
    const newSelection = new Set(selectedSkills);
    if (newSelection.has(skillCode)) {
      newSelection.delete(skillCode);
    } else {
      newSelection.add(skillCode);
    }
    setSelectedSkills(newSelection);
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      const skillsToImport =
        importMode === 'auto'
          ? suggestions.filter((s) => s.matchedSkill !== null)
          : suggestions.filter((s) => s.matchedSkill && selectedSkills.has(s.matchedSkill.code));

      // Import skills one by one
      let successCount = 0;
      for (const suggestion of skillsToImport) {
        if (!suggestion.matchedSkill) continue;

        try {
          const response = await fetch('/api/expertise/user-skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              skill_code: suggestion.matchedSkill.code,
              level: 2, // Default to Competent level
              months_experience: 0,
              last_used_at: new Date().toISOString(),
              relevance: 'current',
            }),
          });

          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to import skill: ${suggestion.matchedSkill.nameI18n.en}`, error);
        }
      }

      toast.success(`Successfully imported ${successCount} skill${successCount !== 1 ? 's' : ''}!`);
      onSkillsImported?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import skills');
      setStep('suggestions');
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          High Match
        </Badge>
      );
    } else if (confidence >= 0.5) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
          Medium Match
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
          Low Match
        </Badge>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-6 w-6 text-[#0A66C2]" />
            Import Skills from LinkedIn
          </DialogTitle>
          <DialogDescription>
            Automatically add skills from your LinkedIn profile to your Expertise Atlas
          </DialogDescription>
        </DialogHeader>

        {/* Initial Step */}
        {step === 'init' && (
          <div className="space-y-6">
            {/* Info Card */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">LinkedIn API Limitation</p>
                  <p>
                    LinkedIn's current API has limited access to skills data. We recommend using our
                    quick search feature to manually add your skills, which is fast and provides
                    better matching to our taxonomy.
                  </p>
                </div>
              </div>
            </Card>

            {/* Import Mode Selection */}
            <div>
              <Label className="text-[#2D3330] mb-3 block">Choose import method</Label>
              <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as any)}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 rounded-lg border border-[#E5E3DA] hover:bg-[#F7F6F1]">
                    <RadioGroupItem value="review" id="mode-review" className="mt-1" />
                    <Label htmlFor="mode-review" className="flex-1 cursor-pointer">
                      <div className="font-medium text-[#2D3330]">Review each skill</div>
                      <div className="text-sm text-[#6B6760] mt-1">
                        See matched skills and choose which ones to import
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3 p-4 rounded-lg border border-[#E5E3DA] hover:bg-[#F7F6F1]">
                    <RadioGroupItem value="auto" id="mode-auto" className="mt-1" />
                    <Label htmlFor="mode-auto" className="flex-1 cursor-pointer">
                      <div className="font-medium text-[#2D3330]">Import all automatically</div>
                      <div className="text-sm text-[#6B6760] mt-1">
                        Quickly add all matched skills (you can edit them later)
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleFetchSkills}
                disabled={loading}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                {loading ? 'Connecting...' : 'Fetch from LinkedIn'}
              </Button>
            </div>
          </div>
        )}

        {/* Suggestions Step */}
        {step === 'suggestions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#6B6760]">
                Found {suggestions.length} skill{suggestions.length !== 1 ? 's' : ''} from LinkedIn
              </p>
              {importMode === 'review' && (
                <p className="text-sm text-[#6B6760]">
                  {selectedSkills.size} selected
                </p>
              )}
            </div>

            {/* Skills List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {suggestions.map((suggestion, idx) => {
                const isSelected = suggestion.matchedSkill
                  ? selectedSkills.has(suggestion.matchedSkill.code)
                  : false;
                const hasMatch = suggestion.matchedSkill !== null;

                return (
                  <Card
                    key={idx}
                    className={`p-4 transition-colors ${
                      importMode === 'review' && hasMatch
                        ? 'cursor-pointer hover:bg-[#F7F6F1]'
                        : ''
                    } ${isSelected ? 'border-[#4A5943] bg-[#EEF1EA]' : 'border-[#E5E3DA]'}`}
                    onClick={() => {
                      if (importMode === 'review' && hasMatch && suggestion.matchedSkill) {
                        toggleSkillSelection(suggestion.matchedSkill.code);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {/* LinkedIn Skill Name */}
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-[#2D3330]">
                            {suggestion.linkedInSkillName}
                          </h4>
                          {hasMatch && getConfidenceBadge(suggestion.confidence)}
                        </div>

                        {/* Matched Skill */}
                        {hasMatch && suggestion.matchedSkill ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 text-[#6B6760]" />
                              <span className="text-[#4A5943] font-medium">
                                {suggestion.matchedSkill.nameI18n.en}
                              </span>
                            </div>
                            {suggestion.matchedSkill.descriptionI18n?.en && (
                              <p className="text-xs text-[#6B6760] ml-6 line-clamp-2">
                                {suggestion.matchedSkill.descriptionI18n.en}
                              </p>
                            )}
                            {/* Breadcrumb */}
                            {(suggestion.matchedSkill.l1 ||
                              suggestion.matchedSkill.l2 ||
                              suggestion.matchedSkill.l3) && (
                              <div className="flex items-center gap-1 text-xs text-[#6B6760] ml-6">
                                {suggestion.matchedSkill.l1?.nameI18n?.en}
                                {suggestion.matchedSkill.l2 && (
                                  <>
                                    {' > '}
                                    {suggestion.matchedSkill.l2.nameI18n.en}
                                  </>
                                )}
                                {suggestion.matchedSkill.l3 && (
                                  <>
                                    {' > '}
                                    {suggestion.matchedSkill.l3.nameI18n.en}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-[#6B6760]">No match found in taxonomy</p>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {importMode === 'review' && hasMatch && (
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <div className="p-1 bg-[#4A5943] text-white rounded">
                              <Check className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="p-1 border border-[#E5E3DA] rounded">
                              <div className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-[#E5E3DA]">
              <Button variant="outline" onClick={() => setStep('init')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMode === 'review' && selectedSkills.size === 0}
                className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
              >
                Import {importMode === 'review' ? `${selectedSkills.size} ` : ''}
                Skill{importMode === 'auto' || selectedSkills.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A5943] mx-auto mb-4"></div>
            <p className="text-[#2D3330] font-medium">Importing skills...</p>
            <p className="text-sm text-[#6B6760] mt-1">This may take a moment</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

