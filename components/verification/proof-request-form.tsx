"use client";

// Proof request form component
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface ProofRequestFormProps {
  userId: string;
}

export function ProofRequestForm({ userId }: ProofRequestFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    claim_type: "work_experience",
    claim_text: "",
    verifier_name: "",
    verifier_email: "",
    verifier_organization: "",
    verifier_relationship: "",
    artifact_link: "",
    context_notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      // Create the proof first
      const { data: proof, error: proofError } = await supabase
        .from("proofs")
        .insert({
          profile_id: userId,
          claim_type: formData.claim_type,
          claim_text: formData.claim_text,
          verification_status: "pending",
        } as any)
        .select()
        .single();

      if (proofError) throw proofError;

      // Create verification request
      const { error: verificationError } = await supabase
        .from("verification_requests")
        .insert({
          proof_id: (proof as any)?.id,
          requester_id: userId,
          verifier_name: formData.verifier_name,
          verifier_email: formData.verifier_email,
          verifier_organization: formData.verifier_organization || null,
          verifier_relationship: formData.verifier_relationship,
          artifact_link: formData.artifact_link || null,
          context_notes: formData.context_notes || null,
          status: "pending",
          verification_token: crypto.randomUUID(),
          token_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        } as any);

      if (verificationError) throw verificationError;

      alert("Verification request sent! The verifier will receive an email shortly.");
      router.push("/profile/proofs");
      router.refresh();
    } catch (error) {
      console.error("Error creating proof:", error);
      alert("Failed to create proof. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Claim
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Claim Type *
            </label>
            <select
              value={formData.claim_type}
              onChange={(e) => setFormData({ ...formData, claim_type: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="work_experience">Work Experience</option>
              <option value="education">Education</option>
              <option value="certification">Certification</option>
              <option value="achievement">Achievement</option>
              <option value="skill">Skill</option>
              <option value="project">Project</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What are you claiming? *
            </label>
            <textarea
              value={formData.claim_text}
              onChange={(e) => setFormData({ ...formData, claim_text: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="E.g., Led product design for climate tech startup from 2020-2023"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supporting Link (optional)
            </label>
            <input
              type="url"
              value={formData.artifact_link}
              onChange={(e) => setFormData({ ...formData, artifact_link: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Link to portfolio, certificate, or evidence"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Verifier Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Who can verify this claim? They'll receive an email with a verification link.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verifier Name *
            </label>
            <input
              type="text"
              value={formData.verifier_name}
              onChange={(e) => setFormData({ ...formData, verifier_name: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="E.g., John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verifier Email *
            </label>
            <input
              type="email"
              value={formData.verifier_email}
              onChange={(e) => setFormData({ ...formData, verifier_email: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="john@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Their Organization (optional)
            </label>
            <input
              type="text"
              value={formData.verifier_organization}
              onChange={(e) => setFormData({ ...formData, verifier_organization: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="E.g., Acme Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Relationship to You *
            </label>
            <select
              value={formData.verifier_relationship}
              onChange={(e) => setFormData({ ...formData, verifier_relationship: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select relationship...</option>
              <option value="manager">Manager</option>
              <option value="colleague">Colleague</option>
              <option value="client">Client</option>
              <option value="professor">Professor/Instructor</option>
              <option value="mentor">Mentor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Context for Verifier (optional)
            </label>
            <textarea
              value={formData.context_notes}
              onChange={(e) => setFormData({ ...formData, context_notes: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Any helpful context for the verifier..."
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🔒 Privacy & Ethics
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• The verifier will see your name and claim</li>
          <li>• They can approve, decline, or request more info</li>
          <li>• The verification link expires in 14 days</li>
          <li>• We'll send reminders if they don't respond</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Sending..." : "Send Verification Request"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

