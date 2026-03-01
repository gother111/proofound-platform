/**
 * JD Mapper Component
 *
 * Allows pasting job descriptions and mapping them to L4 skills with AI explanations.
 * PRD Reference: Part 5 O6 - JD Mapping Feature
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, CheckCircle2, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface JDSkillSuggestion {
  l4_id: string;
  l4_name: string;
  proficiency_level: number;
  confidence: number;
  why: string;
  source_text: string;
}

interface JDMapperProps {
  onSkillsSelected?: (skills: JDSkillSuggestion[]) => void;
}

export function JDMapper({ onSkillsSelected }: JDMapperProps) {
  const [jdText, setJdText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<JDSkillSuggestion[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

  const handleParse = async () => {
    if (jdText.length < 50) {
      toast.error('Job description is too short', {
        description: 'Please provide more detail about the role',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiFetch('/api/expertise/jd-to-l4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        // Auto-select all suggestions initially
        setSelectedSkills(new Set(data.suggestions.map((s: JDSkillSuggestion) => s.l4_id)));
        toast.success(`Found ${data.suggestions.length} skills`, {
          description: 'Review and select which skills to add',
        });
      } else {
        const error = await response.json();
        toast.error('Failed to parse job description', {
          description: error.error || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Failed to parse JD:', error);
      toast.error('Failed to parse job description', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSkill = (l4_id: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(l4_id)) {
      newSelected.delete(l4_id);
    } else {
      newSelected.add(l4_id);
    }
    setSelectedSkills(newSelected);
  };

  const handleAddSkills = () => {
    const skillsToAdd = suggestions.filter((s) => selectedSkills.has(s.l4_id));
    if (skillsToAdd.length === 0) {
      toast.error('No skills selected');
      return;
    }

    if (onSkillsSelected) {
      onSkillsSelected(skillsToAdd);
    }

    toast.success(`Added ${skillsToAdd.length} skills`, {
      description: 'Skills have been added to your assignment',
    });

    // Reset
    setJdText('');
    setSuggestions([]);
    setSelectedSkills(new Set());
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-proofound-forest bg-proofound-success-tint';
    if (confidence >= 0.75) return 'text-proofound-terracotta bg-[#FFF4E6]';
    return 'text-muted-foreground bg-japandi-bg';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-proofound-forest" />
            <h3 className="text-lg font-semibold text-foreground">Paste Job Description</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Paste a job description and we'll automatically extract and map skills to our skill
            taxonomy
          </p>
        </div>

        <Textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste job description here...

Example:
We're looking for a Senior Python Developer with 5+ years of experience building scalable web applications. Must have:
- Expert Python skills with Django or Flask
- Experience with AWS cloud infrastructure
- Strong SQL and database design skills
- TypeScript and React for frontend work"
          className="min-h-[200px] mb-4 font-mono text-sm"
          disabled={isProcessing}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{jdText.length} / 10,000 characters</span>
          <Button
            onClick={handleParse}
            disabled={isProcessing || jdText.length < 50}
            className="bg-proofound-forest text-white"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Extract Skills
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Suggested Skills ({selectedSkills.size} of {suggestions.length} selected)
            </h3>
            <p className="text-sm text-muted-foreground">
              Click on skills to select/deselect. Review the "why" explanation for each mapping.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {suggestions.map((suggestion) => {
              const isSelected = selectedSkills.has(suggestion.l4_id);

              return (
                <button
                  type="button"
                  key={suggestion.l4_id}
                  onClick={() => toggleSkill(suggestion.l4_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSkill(suggestion.l4_id);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-proofound-forest bg-proofound-success-tint'
                      : 'border-proofound-stone bg-white hover:border-proofound-forest/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-proofound-forest" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-proofound-stone" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{suggestion.l4_name}</h4>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                        >
                          {Math.round(suggestion.confidence * 100)}% confident
                        </Badge>
                      </div>

                      <div className="bg-japandi-bg rounded-lg p-3 mb-2">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground mb-1">
                              Why mapped:
                            </p>
                            <p className="text-sm text-muted-foreground">{suggestion.why}</p>
                          </div>
                        </div>
                      </div>

                      {suggestion.source_text && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">Source:</span> "{suggestion.source_text}"
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-proofound-stone">
            <Button
              variant="ghost"
              onClick={() => {
                setSuggestions([]);
                setSelectedSkills(new Set());
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleAddSkills}
              disabled={selectedSkills.size === 0}
              className="bg-proofound-forest text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Add {selectedSkills.size} {selectedSkills.size === 1 ? 'Skill' : 'Skills'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
