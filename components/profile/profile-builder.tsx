"use client";

// Multi-step profile builder component
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "basic" | "mission" | "expertise" | "availability" | "preferences";

interface ProfileBuilderProps {
  initialData?: any;
  profileId: string;
}

export function ProfileBuilder({ initialData, profileId }: ProfileBuilderProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || "",
    professional_summary: initialData?.professional_summary || "",
    mission: initialData?.mission || "",
    vision: initialData?.vision || "",
    causes: initialData?.causes || [],
    values: initialData?.values || [],
    region: initialData?.region || "",
    timezone: initialData?.timezone || "",
    languages: initialData?.languages || [],
    availability_status: initialData?.availability_status || "open",
    available_start_date: initialData?.available_start_date || "",
  });

  const steps: { id: Step; title: string; description: string }[] = [
    { id: "basic", title: "Basic Info", description: "Tell us about yourself" },
    { id: "mission", title: "Mission & Values", description: "What drives you?" },
    { id: "expertise", title: "Expertise", description: "Your skills & experience" },
    { id: "availability", title: "Availability", description: "When can you start?" },
    { id: "preferences", title: "Preferences", description: "Matching preferences" },
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
      
      const { error } = await supabase
        .from("profiles")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (error) throw error;

      // Trigger profile completion calculation
      await supabase.rpc("calculate_profile_completion", {
        profile_uuid: profileId,
      });

      router.push("/home");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-3xl">
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {steps[currentStepIndex].title}
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {steps[currentStepIndex].description}
        </p>
      </div>

      {/* Form content */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        {currentStep === "basic" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => updateFormData("full_name", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Professional Summary *
              </label>
              <textarea
                value={formData.professional_summary}
                onChange={(e) => updateFormData("professional_summary", e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="A brief overview of your professional background and what you bring to the table..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region *
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => updateFormData("region", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Europe, North America, Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => updateFormData("timezone", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., UTC+1, EST, PST"
              />
            </div>
          </div>
        )}

        {currentStep === "mission" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Mission *
              </label>
              <textarea
                value={formData.mission}
                onChange={(e) => updateFormData("mission", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="What impact do you want to make? What drives your work?"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This helps us match you with organizations that share your vision
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Vision
              </label>
              <textarea
                value={formData.vision}
                onChange={(e) => updateFormData("vision", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Where do you see yourself making the biggest impact?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Causes You Care About *
              </label>
              <input
                type="text"
                value={Array.isArray(formData.causes) ? formData.causes.join(", ") : ""}
                onChange={(e) => updateFormData("causes", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Climate Change, Education, Healthcare (comma-separated)"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Separate multiple causes with commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Core Values *
              </label>
              <input
                type="text"
                value={Array.isArray(formData.values) ? formData.values.join(", ") : ""}
                onChange={(e) => updateFormData("values", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Integrity, Innovation, Collaboration (comma-separated)"
              />
            </div>
          </div>
        )}

        {currentStep === "expertise" && (
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Tip:</strong> You'll add your detailed skills and expertise in the next step. 
                For now, let's set up the foundation.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Languages You Speak *
              </label>
              <input
                type="text"
                value={Array.isArray(formData.languages) ? formData.languages.join(", ") : ""}
                onChange={(e) => updateFormData("languages", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., English, Spanish, French (comma-separated)"
              />
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Next: Build Your Expertise Atlas
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                After completing this profile, you'll be able to add:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Core skills and proficiency levels</li>
                <li>• Work experience and projects</li>
                <li>• Verifiable proofs of expertise</li>
                <li>• Tools and technologies you use</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep === "availability" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Availability Status *
              </label>
              <select
                value={formData.availability_status}
                onChange={(e) => updateFormData("availability_status", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="open">Open to opportunities</option>
                <option value="selective">Selective - only perfect matches</option>
                <option value="passive">Passive - not actively looking</option>
                <option value="unavailable">Not available</option>
              </select>
            </div>

            {formData.availability_status === "open" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Start Date
                </label>
                <input
                  type="date"
                  value={formData.available_start_date}
                  onChange={(e) => updateFormData("available_start_date", e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✓ Privacy Controls
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                You control what information is shared with organizations. You can adjust visibility 
                settings for each field in your profile settings.
              </p>
            </div>
          </div>
        )}

        {currentStep === "preferences" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                🎯 Almost Done!
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You're about to complete your profile. After this, you'll be able to:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>✓ Receive personalized match suggestions</li>
                <li>✓ See explainability for each match</li>
                <li>✓ Build your expertise atlas</li>
                <li>✓ Add verified proofs</li>
              </ul>
            </div>

            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I want to receive match suggestions based on my profile
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Send me email notifications for high-quality matches (≥80% score)
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include me in cold-start matching (experimental - for profiles still being built)
                </span>
              </label>
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
            ? "Complete Profile"
            : "Next"}
        </Button>
      </div>
    </div>
  );
}

