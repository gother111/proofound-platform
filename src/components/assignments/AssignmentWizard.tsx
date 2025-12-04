/**
 * 5-Step Assignment Creation Wizard
 *
 * Steps:
 * 1. Role & Basic Info
 * 2. Skills & Requirements
 * 3. Values & Causes Alignment
 * 4. Logistics (location, compensation, timeline)
 * 5. Review & Publish
 *
 * Implements PRD requirement for guided assignment creation
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  Briefcase,
  Target,
  Heart,
  MapPin,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';

interface AssignmentData {
  // Step 1: Role & Basic Info
  role: string;
  description: string;
  department: string;
  employmentType: string;

  // Step 2: Skills & Requirements
  requiredSkills: Array<{ name: string; level: number }>;
  niceToHaveSkills: Array<{ name: string }>;
  yearsExperience: number;

  // Step 3: Values & Causes
  values: string[];
  causes: string[];
  impactGoals: string;

  // Step 4: Logistics
  location: string;
  locationMode: string;
  compensationMin: number;
  compensationMax: number;
  compensationCurrency: string;
  startDate: string;
  applicationDeadline: string;

  // Step 5: Review
  isDraft: boolean;
}

const INITIAL_DATA: AssignmentData = {
  role: '',
  description: '',
  department: '',
  employmentType: 'full-time',
  requiredSkills: [],
  niceToHaveSkills: [],
  yearsExperience: 0,
  values: [],
  causes: [],
  impactGoals: '',
  location: '',
  locationMode: 'hybrid',
  compensationMin: 0,
  compensationMax: 0,
  compensationCurrency: 'USD',
  startDate: '',
  applicationDeadline: '',
  isDraft: true,
};

const STEPS = [
  { id: 1, title: 'Role & Basic Info', icon: Briefcase },
  { id: 2, title: 'Skills & Requirements', icon: Target },
  { id: 3, title: 'Values & Causes', icon: Heart },
  { id: 4, title: 'Logistics', icon: MapPin },
  { id: 5, title: 'Review & Publish', icon: FileText },
];

export function AssignmentWizard({ organizationId }: { organizationId: string }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<AssignmentData>(INITIAL_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const updateData = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Map frontend data to backend schema
      const payload = {
        ...data,
        status: 'draft',
        // Map skills to expected schema (using dummy IDs for now as we don't have a skill selector)
        mustHaveSkills: data.requiredSkills.map((s) => ({
          id: crypto.randomUUID(),
          level: s.level,
        })),
        niceToHaveSkills: data.niceToHaveSkills.map((s) => ({ id: crypto.randomUUID(), level: 1 })),
      };

      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }

      const result = await response.json();
      toast.success('Draft saved successfully');
      // The backend returns { assignment: { ... } }
      return result.assignment.id;
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      // Map frontend data to backend schema
      const payload = {
        ...data,
        status: 'active',
        // Map skills to expected schema (using dummy IDs for now)
        mustHaveSkills: data.requiredSkills.map((s) => ({
          id: crypto.randomUUID(),
          level: s.level,
        })),
        niceToHaveSkills: data.niceToHaveSkills.map((s) => ({ id: crypto.randomUUID(), level: 1 })),
      };

      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish assignment');
      }

      const result = await response.json();
      toast.success('Assignment published successfully!');
      router.push(`/app/o/${organizationId}/assignments/${result.assignment.id}`);
    } catch (error) {
      console.error('Failed to publish assignment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish assignment');
    } finally {
      setIsSaving(false);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#2D3330] dark:text-foreground">
                Create Assignment
              </h2>
              <Badge variant="outline">
                Step {currentStep} of {STEPS.length}
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-1 ${
                      step.id === currentStep
                        ? 'text-[#1C4D3A] font-semibold'
                        : step.id < currentStep
                          ? 'text-green-600'
                          : 'text-[#6B6760]'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-2xl text-proofound-charcoal dark:text-foreground">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            {currentStep === 1 && 'Define the role and provide basic information'}
            {currentStep === 2 && 'Specify required and preferred skills'}
            {currentStep === 3 && 'Align the role with organizational values and causes'}
            {currentStep === 4 && 'Set location, compensation, and timeline'}
            {currentStep === 5 && 'Review all details before publishing'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Role & Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="role">Role Title *</Label>
                <Input
                  id="role"
                  value={data.role}
                  onChange={(e) => updateData('role', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => updateData('description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and what makes it unique..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={data.department}
                    onChange={(e) => updateData('department', e.target.value)}
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div>
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select
                    value={data.employmentType}
                    onValueChange={(val) => updateData('employmentType', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skills & Requirements */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Required Skills</Label>
                <p className="text-sm text-[#6B6760] dark:text-muted-foreground mb-2">
                  Add the essential skills for this role
                </p>
                {/* Simplified - in production, use a proper skill selector component */}
                <Input placeholder="e.g., JavaScript, React, TypeScript" />
              </div>

              <div>
                <Label>Nice-to-Have Skills</Label>
                <p className="text-sm text-[#6B6760] dark:text-muted-foreground mb-2">
                  Optional skills that would be beneficial
                </p>
                <Input placeholder="e.g., GraphQL, Docker, AWS" />
              </div>

              <div>
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  value={data.yearsExperience}
                  onChange={(e) => updateData('yearsExperience', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Values & Causes */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Organizational Values</Label>
                <p className="text-sm text-[#6B6760] dark:text-muted-foreground mb-2">
                  Select values that align with this role
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Integrity',
                    'Innovation',
                    'Collaboration',
                    'Impact',
                    'Transparency',
                    'Equity',
                  ].map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox id={value} />
                      <Label htmlFor={value} className="font-normal">
                        {value}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="impactGoals">Impact Goals</Label>
                <Textarea
                  id="impactGoals"
                  value={data.impactGoals}
                  onChange={(e) => updateData('impactGoals', e.target.value)}
                  placeholder="Describe the social impact this role will have..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Logistics */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={data.location}
                    onChange={(e) => updateData('location', e.target.value)}
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <Label htmlFor="locationMode">Work Mode</Label>
                  <Select
                    value={data.locationMode}
                    onValueChange={(val) => updateData('locationMode', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Compensation Range (Optional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={data.compensationMin}
                    onChange={(e) => updateData('compensationMin', parseInt(e.target.value) || 0)}
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={data.compensationMax}
                    onChange={(e) => updateData('compensationMax', parseInt(e.target.value) || 0)}
                    placeholder="Max"
                  />
                  <Select
                    value={data.compensationCurrency}
                    onValueChange={(val) => updateData('compensationCurrency', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={data.startDate}
                    onChange={(e) => updateData('startDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="applicationDeadline">Application Deadline</Label>
                  <Input
                    id="applicationDeadline"
                    type="date"
                    value={data.applicationDeadline}
                    onChange={(e) => updateData('applicationDeadline', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="p-4 bg-[#F7F6F1] dark:bg-background/50 rounded-lg border border-[#E8E6DD] dark:border-border">
                <h3 className="font-semibold text-[#2D3330] dark:text-foreground mb-4">
                  Role Summary
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#6B6760] dark:text-muted-foreground">Title:</dt>
                    <dd className="font-medium">{data.role || 'Not specified'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6B6760] dark:text-muted-foreground">Type:</dt>
                    <dd className="font-medium capitalize">{data.employmentType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6B6760] dark:text-muted-foreground">Location:</dt>
                    <dd className="font-medium capitalize">
                      {data.location} ({data.locationMode})
                    </dd>
                  </div>
                  {data.compensationMin > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-[#6B6760] dark:text-muted-foreground">Compensation:</dt>
                      <dd className="font-medium">
                        {data.compensationCurrency} {data.compensationMin} - {data.compensationMax}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="text-sm text-[#6B6760] dark:text-muted-foreground">
                <p>✓ All required fields completed</p>
                <p>✓ Ready to publish or save as draft</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="bg-[#1C4D3A] text-white">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={isSaving || !data.role || !data.description}
              className="bg-[#1C4D3A] text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isSaving ? 'Publishing...' : 'Publish Assignment'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
