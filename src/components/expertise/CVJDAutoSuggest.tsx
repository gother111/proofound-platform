'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Briefcase, Sparkles, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  conceptUri: string;
  preferredLabel: string;
  altLabels: string[] | null;
  description: string | null;
  level: number;
  l1Label: string;
  l2Label: string | null;
  l3Label: string | null;
  l4Code: string | null;
  score: number;
  confidence: number;
}

interface CVJDAutoSuggestProps {
  onSkillsAdded?: (skills: Suggestion[]) => void;
}

export function CVJDAutoSuggest({ onSkillsAdded }: CVJDAutoSuggestProps) {
  const [text, setText] = useState('');
  const [context, setContext] = useState<'cv' | 'jd' | 'general'>('cv');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error('Please paste your CV or job description first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/expertise/auto-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze text');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);

      if (data.suggestions.length === 0) {
        toast.info('No skills found. Try pasting more detailed text.');
      } else {
        toast.success(`Found ${data.suggestions.length} potential skills!`);
      }
    } catch (error) {
      console.error('Auto-suggest error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze text');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId);
    } else {
      newSelected.add(skillId);
    }
    setSelectedSkills(newSelected);
  };

  const handleAddSelected = () => {
    const skillsToAdd = suggestions.filter(s => selectedSkills.has(s.id));
    if (skillsToAdd.length === 0) {
      toast.error('No skills selected');
      return;
    }

    onSkillsAdded?.(skillsToAdd);
    toast.success(`Added ${skillsToAdd.length} skills to your profile`);

    // Clear selections
    setSelectedSkills(new Set());
    setSuggestions([]);
    setText('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-100 text-green-800';
    if (confidence >= 0.4) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Auto-Suggest from CV/JD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={context === 'cv' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContext('cv')}
            >
              <FileText className="h-4 w-4 mr-1" />
              CV/Resume
            </Button>
            <Button
              variant={context === 'jd' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContext('jd')}
            >
              <Briefcase className="h-4 w-4 mr-1" />
              Job Description
            </Button>
            <Button
              variant={context === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContext('general')}
            >
              General Text
            </Button>
          </div>

          <Textarea
            placeholder="Paste your CV, resume, or job description here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />

          <Button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Analyze & Suggest Skills'}
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Suggested Skills ({suggestions.length})</CardTitle>
              {selectedSkills.size > 0 && (
                <Button onClick={handleAddSelected} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add {selectedSkills.size} Selected
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((skill) => (
                <div
                  key={skill.id}
                  role="button"
                  tabIndex={0}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSkills.has(skill.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleSkill(skill.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSkill(skill.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{skill.preferredLabel}</h4>
                        <Badge variant="outline" className="text-xs">
                          L{skill.level}
                        </Badge>
                        <Badge className={`text-xs ${getConfidenceColor(skill.confidence)}`}>
                          {Math.round(skill.confidence * 100)}%
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mb-1">
                        {skill.l1Label}
                        {skill.l2Label && ` → ${skill.l2Label}`}
                        {skill.l3Label && ` → ${skill.l3Label}`}
                      </p>

                      {skill.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {skill.description}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {selectedSkills.has(skill.id) ? (
                        <div className="p-1 bg-primary text-primary-foreground rounded">
                          <X className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="p-1 border border-border rounded">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
