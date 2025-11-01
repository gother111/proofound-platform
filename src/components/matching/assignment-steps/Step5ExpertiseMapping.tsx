/**
 * Assignment Builder - Step 5: Expertise Mapping
 * 
 * Pick L4 skills, link to BV/TO, education justification
 */

'use client';

import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Step5Props {
  form: UseFormReturn<any>;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function Step5ExpertiseMapping({ form, onSubmit, onBack, isSubmitting = false }: Step5Props) {
  const { watch, setValue } = form;
  
  const mustHaveSkills = watch('mustHaveSkills') || [];
  const niceToHaveSkills = watch('niceToHaveSkills') || [];
  const educationRequired = watch('educationRequired') || false;
  const educationJustification = watch('educationJustification') || '';
  
  const [skillsOptions, setSkillsOptions] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  
  // Fetch skills taxonomy
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch('/api/taxonomy/skills');
        const data = await res.json();
        setSkillsOptions(data.items || []);
      } catch (error) {
        toast.error('Failed to load skills');
      }
    };
    fetchSkills();
  }, []);
  
  const addMustHaveSkill = () => {
    if (!selectedSkill) return;
    const skill = skillsOptions.find(s => s.key === selectedSkill);
    if (!skill) return;
    
    if (mustHaveSkills.some((s: any) => s.id === selectedSkill)) {
      toast.error('Skill already added');
      return;
    }
    
    setValue('mustHaveSkills', [
      ...mustHaveSkills,
      {
        id: selectedSkill,
        label: skill.label,
        level: 3,
        linkedToBV: false,
        linkedToTO: false,
      },
    ]);
    setSelectedSkill('');
  };
  
  const addNiceToHaveSkill = () => {
    if (!selectedSkill) return;
    const skill = skillsOptions.find(s => s.key === selectedSkill);
    if (!skill) return;
    
    if (niceToHaveSkills.some((s: any) => s.id === selectedSkill)) {
      toast.error('Skill already added');
      return;
    }
    
    setValue('niceToHaveSkills', [
      ...niceToHaveSkills,
      {
        id: selectedSkill,
        label: skill.label,
        level: 2,
      },
    ]);
    setSelectedSkill('');
  };
  
  const removeMustHaveSkill = (index: number) => {
    setValue(
      'mustHaveSkills',
      mustHaveSkills.filter((_: any, i: number) => i !== index)
    );
  };
  
  const removeNiceToHaveSkill = (index: number) => {
    setValue(
      'niceToHaveSkills',
      niceToHaveSkills.filter((_: any, i: number) => i !== index)
    );
  };
  
  const updateMustHaveSkill = (index: number, field: string, value: any) => {
    const updated = [...mustHaveSkills];
    updated[index] = { ...updated[index], [field]: value };
    setValue('mustHaveSkills', updated);
  };
  
  const updateNiceToHaveSkill = (index: number, field: string, value: any) => {
    const updated = [...niceToHaveSkills];
    updated[index] = { ...updated[index], [field]: value };
    setValue('niceToHaveSkills', updated);
  };
  
  const isValid = mustHaveSkills.length > 0 && 
    (!educationRequired || (educationJustification && educationJustification.length > 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Step 5: Expertise Mapping</h2>
          <span className="text-sm text-muted-foreground">Step 5 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Pick L4 skills, link to business value/target outcomes, and specify education requirements
        </p>
        <Progress value={100} className="mt-4" />
      </div>

      {/* Skill Picker */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <Label>Add Skills</Label>
        <div className="flex gap-2">
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a skill..." />
            </SelectTrigger>
            <SelectContent>
              {skillsOptions.map((skill) => (
                <SelectItem key={skill.key} value={skill.key}>
                  {skill.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addMustHaveSkill} variant="default" disabled={!selectedSkill}>
            <Plus className="w-4 h-4 mr-2" />
            Must-Have
          </Button>
          <Button onClick={addNiceToHaveSkill} variant="outline" disabled={!selectedSkill}>
            <Plus className="w-4 h-4 mr-2" />
            Nice-to-Have
          </Button>
        </div>
      </div>

      {/* Must-Have Skills */}
      <div className="space-y-4">
        <Label>
          Must-Have Skills <span className="text-destructive">*</span>
        </Label>
        {mustHaveSkills.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              No must-have skills added. Add at least one skill.
            </p>
          </div>
        ) : (
          mustHaveSkills.map((skill: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{skill.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMustHaveSkill(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Proficiency Level</Label>
                  <span className="text-sm font-medium">{skill.level}/5</span>
                </div>
                <Slider
                  value={[skill.level]}
                  onValueChange={(value) => updateMustHaveSkill(index, 'level', value[0])}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`bv-${index}`}
                    checked={skill.linkedToBV}
                    onCheckedChange={(checked) => 
                      updateMustHaveSkill(index, 'linkedToBV', checked)
                    }
                  />
                  <Label htmlFor={`bv-${index}`} className="text-sm font-normal cursor-pointer">
                    Link to Business Value
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`to-${index}`}
                    checked={skill.linkedToTO}
                    onCheckedChange={(checked) => 
                      updateMustHaveSkill(index, 'linkedToTO', checked)
                    }
                  />
                  <Label htmlFor={`to-${index}`} className="text-sm font-normal cursor-pointer">
                    Link to Target Outcomes
                  </Label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nice-to-Have Skills */}
      <div className="space-y-4">
        <Label>Nice-to-Have Skills</Label>
        {niceToHaveSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No nice-to-have skills added.</p>
        ) : (
          niceToHaveSkills.map((skill: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{skill.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNiceToHaveSkill(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Proficiency Level</Label>
                  <span className="text-sm font-medium">{skill.level}/5</span>
                </div>
                <Slider
                  value={[skill.level]}
                  onValueChange={(value) => updateNiceToHaveSkill(index, 'level', value[0])}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Education Requirement */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="educationRequired"
            checked={educationRequired}
            onCheckedChange={(checked) => setValue('educationRequired', checked)}
          />
          <Label htmlFor="educationRequired" className="font-normal cursor-pointer">
            Formal education required for this role
          </Label>
        </div>

        {educationRequired && (
          <div className="space-y-2">
            <Label htmlFor="educationJustification">
              Education Justification <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="educationJustification"
              placeholder="Explain why formal education is required for this role..."
              className="min-h-[100px]"
              maxLength={500}
              value={educationJustification}
              onChange={(e) => setValue('educationJustification', e.target.value)}
            />
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Required by PRD: Explain why formal education is necessary
              </p>
              <span className="text-xs text-muted-foreground">
                {educationJustification?.length || 0}/500
              </span>
            </div>
            {educationRequired && !educationJustification && (
              <p className="text-sm text-destructive">
                Justification is required when education is mandatory
              </p>
            )}
          </div>
        )}
      </div>

      {/* Validation Error */}
      {mustHaveSkills.length === 0 && (
        <p className="text-sm text-destructive">
          At least one must-have skill is required
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Review & Publish'}
        </Button>
      </div>
    </div>
  );
}
