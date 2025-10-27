"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface AssignmentBuilderProps {
  organizationId: string;
  onComplete?: () => void;
}

export function AssignmentBuilder({ organizationId, onComplete }: AssignmentBuilderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState('');
  const [duration, setDuration] = useState('');
  const [locationType, setLocationType] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [compensationType, setCompensationType] = useState<'paid' | 'volunteer' | 'negotiable'>('paid');
  const [compensationRange, setCompensationRange] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [responsibilities, setResponsibilities] = useState('');

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase
        .from('assignments') as any)
        .insert({
          organization_id: organizationId,
          title,
          description,
          team_department: team,
          duration,
          location_type: locationType,
          compensation_type: compensationType,
          compensation_range: compensationRange,
          required_expertise: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
          preferred_skills: preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
          responsibilities: responsibilities.split('\n').filter(Boolean),
          status: 'published'
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to the assignment or call onComplete
      if (onComplete) {
        onComplete();
      } else {
        router.push(`/assignments`);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
              Create Assignment
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B6760' }}>
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <Badge variant="outline">Draft</Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3" style={{ backgroundColor: '#FDFCFA' }}>
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full transition-colors"
              style={{ backgroundColor: i < currentStep ? '#1C4D3A' : '#E8E6DD' }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Overview */}
          {currentStep === 1 && (
            <Card className="p-8">
              <h2 className="text-xl font-display font-semibold mb-6" style={{ color: '#2D3330' }}>
                Assignment Overview
              </h2>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Role Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Senior Frontend Developer"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this role about? What impact will they make?"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team">Team/Department</Label>
                    <Input
                      id="team"
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      placeholder="e.g., Product & Engineering"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 6 months, Ongoing"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Location & Compensation */}
          {currentStep === 2 && (
            <Card className="p-8">
              <h2 className="text-xl font-display font-semibold mb-6" style={{ color: '#2D3330' }}>
                Location & Compensation
              </h2>
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Location Type *</Label>
                  <RadioGroup value={locationType} onValueChange={(value: string) => setLocationType(value as any)}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: locationType === 'remote' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="remote" id="remote" />
                        <Label htmlFor="remote" className="flex-1 cursor-pointer">
                          Remote
                          <p className="text-xs" style={{ color: '#6B6760' }}>Work from anywhere</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: locationType === 'hybrid' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="hybrid" id="hybrid" />
                        <Label htmlFor="hybrid" className="flex-1 cursor-pointer">
                          Hybrid
                          <p className="text-xs" style={{ color: '#6B6760' }}>Mix of remote and on-site</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: locationType === 'onsite' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="onsite" id="onsite" />
                        <Label htmlFor="onsite" className="flex-1 cursor-pointer">
                          On-site
                          <p className="text-xs" style={{ color: '#6B6760' }}>Office-based</p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="mb-3 block">Compensation Type *</Label>
                  <RadioGroup value={compensationType} onValueChange={(value: string) => setCompensationType(value as any)}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: compensationType === 'paid' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="paid" id="paid" />
                        <Label htmlFor="paid" className="flex-1 cursor-pointer">
                          Paid
                          <p className="text-xs" style={{ color: '#6B6760' }}>Compensated position</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: compensationType === 'volunteer' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="volunteer" id="volunteer" />
                        <Label htmlFor="volunteer" className="flex-1 cursor-pointer">
                          Volunteer
                          <p className="text-xs" style={{ color: '#6B6760' }}>Unpaid opportunity</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: compensationType === 'negotiable' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="negotiable" id="negotiable" />
                        <Label htmlFor="negotiable" className="flex-1 cursor-pointer">
                          Negotiable
                          <p className="text-xs" style={{ color: '#6B6760' }}>To be discussed</p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {compensationType === 'paid' && (
                  <div>
                    <Label htmlFor="compensationRange">Compensation Range</Label>
                    <Input
                      id="compensationRange"
                      value={compensationRange}
                      onChange={(e) => setCompensationRange(e.target.value)}
                      placeholder="e.g., $60k-$80k/year, €40-50/hour"
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 3: Required Skills */}
          {currentStep === 3 && (
            <Card className="p-8">
              <h2 className="text-xl font-display font-semibold mb-6" style={{ color: '#2D3330' }}>
                Required Skills
              </h2>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="requiredSkills">Required Skills *</Label>
                  <Textarea
                    id="requiredSkills"
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                    placeholder="Enter required skills separated by commas (e.g., React, TypeScript, Node.js)"
                    rows={4}
                  />
                  <p className="text-xs mt-2" style={{ color: '#6B6760' }}>
                    List the essential technical or soft skills needed for this role
                  </p>
                </div>
                <div>
                  <Label htmlFor="preferredSkills">Preferred Skills (Optional)</Label>
                  <Textarea
                    id="preferredSkills"
                    value={preferredSkills}
                    onChange={(e) => setPreferredSkills(e.target.value)}
                    placeholder="Enter nice-to-have skills separated by commas"
                    rows={4}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Step 4: Responsibilities */}
          {currentStep === 4 && (
            <Card className="p-8">
              <h2 className="text-xl font-display font-semibold mb-6" style={{ color: '#2D3330' }}>
                Responsibilities
              </h2>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="responsibilities">Key Responsibilities</Label>
                  <Textarea
                    id="responsibilities"
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    placeholder="Enter each responsibility on a new line"
                    rows={8}
                  />
                  <p className="text-xs mt-2" style={{ color: '#6B6760' }}>
                    Describe what this person will be doing day-to-day
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <Card className="p-8">
              <h2 className="text-xl font-display font-semibold mb-6" style={{ color: '#2D3330' }}>
                Review & Publish
              </h2>
              <div className="space-y-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
                  <h3 className="font-semibold mb-2" style={{ color: '#2D3330' }}>{title || 'Untitled Role'}</h3>
                  <p className="text-sm mb-3" style={{ color: '#6B6760' }}>{description || 'No description'}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span style={{ color: '#6B6760' }}>Team:</span>
                      <span className="ml-2" style={{ color: '#2D3330' }}>{team || 'Not specified'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6B6760' }}>Duration:</span>
                      <span className="ml-2" style={{ color: '#2D3330' }}>{duration || 'Not specified'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6B6760' }}>Location:</span>
                      <span className="ml-2" style={{ color: '#2D3330' }}>{locationType}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6B6760' }}>Compensation:</span>
                      <span className="ml-2" style={{ color: '#2D3330' }}>{compensationType}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border" style={{ borderColor: '#7A9278', backgroundColor: '#7A927810' }}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#7A9278' }} />
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: '#2D3330' }}>Ready to publish</h4>
                      <p className="text-sm" style={{ color: '#6B6760' }}>
                        Your assignment will be published and our matching algorithm will find qualified candidates
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t p-6" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && (!title || !description)}
              style={{ backgroundColor: '#1C4D3A', color: 'white' }}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !title || !description}
              style={{ backgroundColor: '#1C4D3A', color: 'white' }}
            >
              {isLoading ? 'Publishing...' : 'Publish Assignment'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

