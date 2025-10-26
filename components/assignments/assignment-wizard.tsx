"use client";

// Assignment creation wizard
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "basics" | "details" | "requirements" | "weights" | "review";

interface AssignmentWizardProps {
  organizations: any[];
  userId: string;
}

export function AssignmentWizard({ organizations, userId }: AssignmentWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("basics");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    organization_id: organizations[0]?.id || "",
    title: "",
    description: "",
    assignment_type: "paid_role",
    location: "",
    is_remote: true,
    time_commitment: "",
    duration_text: "",
    start_date: "",
    end_date: "",
    budget_min: "",
    budget_max: "",
    budget_currency: "EUR",
    budget_masked: false,
    required_expertise: [] as string[],
    required_languages: [] as string[],
    expected_outcomes: "",
    impact_goals: "",
    mission_alignment_weight: 25,
    core_expertise_weight: 30,
    tools_weight: 20,
    logistics_weight: 15,
    recency_weight: 10,
  });

  const steps: { id: Step; title: string }[] = [
    { id: "basics", title: "Basics" },
    { id: "details", title: "Details" },
    { id: "requirements", title: "Requirements" },
    { id: "weights", title: "Match Weights" },
    { id: "review", title: "Review" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          organization_id: formData.organization_id,
          created_by: userId,
          title: formData.title,
          description: formData.description,
          assignment_type: formData.assignment_type,
          location: formData.location || null,
          is_remote: formData.is_remote,
          time_commitment: formData.time_commitment || null,
          duration_text: formData.duration_text || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
          budget_currency: formData.budget_currency,
          budget_masked: formData.budget_masked,
          required_expertise: formData.required_expertise.length > 0 ? formData.required_expertise : null,
          required_languages: formData.required_languages.length > 0 ? formData.required_languages : null,
          expected_outcomes: formData.expected_outcomes || null,
          impact_goals: formData.impact_goals || null,
          mission_alignment_weight: formData.mission_alignment_weight,
          core_expertise_weight: formData.core_expertise_weight,
          tools_weight: formData.tools_weight,
          logistics_weight: formData.logistics_weight,
          recency_weight: formData.recency_weight,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      router.push("/organization/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900 dark:text-white">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {steps[currentStepIndex].title}
        </h2>
      </div>

      {/* Form content */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        {currentStep === "basics" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization *
              </label>
              <select
                value={formData.organization_id}
                onChange={(e) => updateFormData("organization_id", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {organizations.map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Senior Product Designer for Climate Tech"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignment Type *
              </label>
              <select
                value={formData.assignment_type}
                onChange={(e) => updateFormData("assignment_type", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="paid_role">Paid Role</option>
                <option value="volunteer">Volunteer</option>
                <option value="board_member">Board Member</option>
                <option value="advisor">Advisor</option>
                <option value="freelance_project">Freelance Project</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === "details" && (
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_remote}
                  onChange={(e) => updateFormData("is_remote", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Remote-friendly
                </span>
              </label>
            </div>

            {!formData.is_remote && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData("location", e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Berlin, Germany or New York, USA"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Commitment
              </label>
              <input
                type="text"
                value={formData.time_commitment}
                onChange={(e) => updateFormData("time_commitment", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Full-time, Part-time (20hrs/week), Flexible"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <input
                type="text"
                value={formData.duration_text}
                onChange={(e) => updateFormData("duration_text", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., 6 months, 1 year, Ongoing"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => updateFormData("start_date", e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => updateFormData("end_date", e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {formData.assignment_type === "paid_role" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Range
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => updateFormData("budget_min", e.target.value)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => updateFormData("budget_max", e.target.value)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Max"
                  />
                  <select
                    value={formData.budget_currency}
                    onChange={(e) => updateFormData("budget_currency", e.target.value)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.budget_masked}
                    onChange={(e) => updateFormData("budget_masked", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Show as range only (don't reveal exact numbers to candidates)
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {currentStep === "requirements" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required Skills/Expertise
              </label>
              <input
                type="text"
                value={formData.required_expertise.join(", ")}
                onChange={(e) => updateFormData("required_expertise", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Product Design, User Research, Figma (comma-separated)"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Used for matching - separate multiple skills with commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required Languages
              </label>
              <input
                type="text"
                value={formData.required_languages.join(", ")}
                onChange={(e) => updateFormData("required_languages", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., English, Spanish (comma-separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Outcomes
              </label>
              <textarea
                value={formData.expected_outcomes}
                onChange={(e) => updateFormData("expected_outcomes", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="What should be achieved in this role?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Impact Goals
              </label>
              <textarea
                value={formData.impact_goals}
                onChange={(e) => updateFormData("impact_goals", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="What impact will this role create?"
              />
            </div>
          </div>
        )}

        {currentStep === "weights" && (
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Match Weights:</strong> Adjust how much each factor matters when matching candidates. Total must equal 100%.
              </p>
            </div>

            {[
              { key: "mission_alignment_weight", label: "Mission & Values Alignment" },
              { key: "core_expertise_weight", label: "Core Expertise Match" },
              { key: "tools_weight", label: "Tools & Technology" },
              { key: "logistics_weight", label: "Logistics (Location, Availability)" },
              { key: "recency_weight", label: "Recent Activity" },
            ].map((weight) => (
              <div key={weight.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {weight.label}
                  </label>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formData[weight.key as keyof typeof formData]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData[weight.key as keyof typeof formData] as number}
                  onChange={(e) => updateFormData(weight.key, parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">
                  Total Weight:
                </span>
                <span className={`text-lg font-bold ${
                  formData.mission_alignment_weight + formData.core_expertise_weight + 
                  formData.tools_weight + formData.logistics_weight + formData.recency_weight === 100
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  {formData.mission_alignment_weight + formData.core_expertise_weight + 
                   formData.tools_weight + formData.logistics_weight + formData.recency_weight}%
                </span>
              </div>
            </div>
          </div>
        )}

        {currentStep === "review" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✓ Ready to Publish
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                Review your assignment details below. You can save as draft and publish later, or publish now to start receiving matches.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Title</h4>
                <p className="mt-1 text-gray-900 dark:text-white">{formData.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</h4>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{formData.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Type</h4>
                  <p className="mt-1 text-gray-900 dark:text-white">{formData.assignment_type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</h4>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {formData.is_remote ? "Remote" : formData.location}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || isLoading}
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading
            ? "Saving..."
            : currentStepIndex === steps.length - 1
            ? "Create Assignment"
            : "Next"}
        </Button>
      </div>
    </div>
  );
}

