// Zod validation schemas for Proofound MVP
import { z } from "zod";

// Auth Schemas
export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  ageConfirmation: z.boolean().refine((val) => val === true, {
    message: "You must be at least 18 years old to use Proofound",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Profile Schemas
export const profileBasicInfoSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  region: z.string().optional(),
  timezone: z.string().optional(),
  languages: z.array(z.string()).optional(),
});

export const profileMissionSchema = z.object({
  mission: z
    .string()
    .min(50, "Mission should be at least 50 characters")
    .max(500, "Mission should not exceed 500 characters")
    .optional(),
  vision: z
    .string()
    .min(50, "Vision should be at least 50 characters")
    .max(500, "Vision should not exceed 500 characters")
    .optional(),
  values: z.array(z.string()).min(1, "Add at least one value").optional(),
  causes: z.array(z.string()).optional(),
});

export const profileProfessionalSchema = z.object({
  professional_summary: z
    .string()
    .min(100, "Summary should be at least 100 characters")
    .max(1000, "Summary should not exceed 1000 characters")
    .optional(),
  industry: z.array(z.string()).min(1, "Select at least one industry").optional(),
});

export const profileAvailabilitySchema = z.object({
  availability_status: z.enum(["available", "not_available", "open_to_opportunities"]),
  available_for_match: z.boolean().default(false),
  available_start_date: z.string().optional(),
  salary_band_min: z.number().int().positive().optional(),
  salary_band_max: z.number().int().positive().optional(),
}).refine(
  (data) => {
    if (data.salary_band_min && data.salary_band_max) {
      return data.salary_band_max > data.salary_band_min;
    }
    return true;
  },
  {
    message: "Maximum salary must be greater than minimum salary",
    path: ["salary_band_max"],
  }
);

// Expertise Atlas Schema
export const expertiseSchema = z.object({
  skill_name: z.string().min(2, "Skill name must be at least 2 characters"),
  skill_category: z.string().optional(),
  proficiency_level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  is_core_expertise: z.boolean().default(false),
  years_of_experience: z.number().min(0).max(50).optional(),
  last_used_date: z.string().optional(),
});

// Artifact Schema
export const artifactSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().max(500, "Description should not exceed 500 characters").optional(),
  artifact_type: z.enum(["link", "file", "credential", "document"]),
  url: z.string().url("Please enter a valid URL").optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  artifact_date: z.string().optional(),
  visibility: z.enum(["public", "private", "matches_only"]).default("public"),
});

// Proof Schema
export const proofSchema = z.object({
  claim_type: z.enum(["skill", "experience", "education", "achievement", "volunteering"]),
  claim_text: z.string().min(10, "Claim description must be at least 10 characters"),
  proof_type: z.enum(["verified_reference", "link", "file", "credential"]),
  artifact_id: z.string().uuid().optional(),
});

// Organization Schema
export const organizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  website: z.string().url("Please enter a valid website URL").optional(),
  description: z.string().min(50, "Description should be at least 50 characters").optional(),
  org_type: z.enum(["ngo", "startup", "sme", "enterprise", "other"]),
  mission: z.string().min(50, "Mission should be at least 50 characters").optional(),
  values: z.array(z.string()).optional(),
  causes: z.array(z.string()).optional(),
  headquarters_location: z.string().optional(),
  is_remote_friendly: z.boolean().default(false),
  contact_email: z.string().email("Please enter a valid email address").optional(),
  contact_phone: z.string().optional(),
  is_ngo: z.boolean().default(false),
});

// Assignment Schema
export const assignmentSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(100, "Description should be at least 100 characters").optional(),
  assignment_type: z.enum(["employment", "volunteering", "contract", "project"]),
  location: z.string().optional(),
  is_remote: z.boolean().default(false),
  timezone_preference: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration_text: z.string().optional(),
  time_commitment: z.string().optional(),
  budget_min: z.number().int().positive().optional(),
  budget_max: z.number().int().positive().optional(),
  budget_currency: z.string().default("EUR"),
  budget_masked: z.boolean().default(true),
  required_languages: z.array(z.string()).optional(),
  expected_outcomes: z.string().optional(),
  impact_goals: z.string().optional(),
  // Matching weights (must sum to 100)
  mission_alignment_weight: z.number().int().min(15).max(45).default(30),
  core_expertise_weight: z.number().int().min(25).max(55).default(40),
  tools_weight: z.number().int().min(0).max(25).default(10),
  logistics_weight: z.number().int().min(0).max(25).default(10),
  recency_weight: z.number().int().min(0).max(25).default(10),
}).refine(
  (data) => {
    const sum =
      data.mission_alignment_weight +
      data.core_expertise_weight +
      data.tools_weight +
      data.logistics_weight +
      data.recency_weight;
    return sum === 100;
  },
  {
    message: "Matching weights must sum to 100%",
    path: ["mission_alignment_weight"],
  }
).refine(
  (data) => {
    if (data.budget_min && data.budget_max) {
      return data.budget_max > data.budget_min;
    }
    return true;
  },
  {
    message: "Maximum budget must be greater than minimum budget",
    path: ["budget_max"],
  }
);

// Verification Request Schema
export const verificationRequestSchema = z.object({
  verifier_email: z.string().email("Please enter a valid email address"),
  verifier_name: z.string().min(2, "Verifier name must be at least 2 characters").optional(),
  verifier_organization: z.string().optional(),
  verifier_relationship: z.enum(["supervisor", "colleague", "client", "peer", "other"]),
  claim_description: z.string().min(20, "Please provide more context about what needs to be verified"),
  artifact_link: z.string().url("Please enter a valid URL").optional(),
  context_notes: z.string().max(500, "Context notes should not exceed 500 characters").optional(),
});

// Message Schema
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message should not exceed 2000 characters"),
  attachments: z
    .array(
      z.object({
        type: z.enum(["link", "pdf"]),
        url: z.string().url(),
        name: z.string(),
        size: z.number().max(5 * 1024 * 1024, "File size must not exceed 5MB"),
      })
    )
    .max(3, "You can attach up to 3 files")
    .optional(),
});

// Report Schema
export const reportSchema = z.object({
  reported_entity_type: z.enum(["profile", "assignment", "message", "proof", "artifact"]),
  reported_entity_id: z.string().uuid(),
  reason_category: z.enum([
    "spam",
    "harassment",
    "false_information",
    "inappropriate_content",
    "political_content",
    "discrimination",
    "other",
  ]),
  reason_text: z
    .string()
    .min(10, "Please provide a brief reason for the report")
    .max(250, "Reason should not exceed 50 words"),
});

// Match Response Schema
export const matchResponseSchema = z.object({
  match_id: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
  decline_reason: z.string().optional(),
});

// Admin Action Schema
export const moderationActionSchema = z.object({
  report_id: z.string().uuid(),
  action_taken: z.enum(["none", "warning", "content_removed", "account_suspended", "account_banned"]),
  action_details: z.string().optional(),
  moderator_notes: z.string().optional(),
});

// Export types inferred from schemas
export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileBasicInfoInput = z.infer<typeof profileBasicInfoSchema>;
export type ProfileMissionInput = z.infer<typeof profileMissionSchema>;
export type ProfileProfessionalInput = z.infer<typeof profileProfessionalSchema>;
export type ProfileAvailabilityInput = z.infer<typeof profileAvailabilitySchema>;
export type ExpertiseInput = z.infer<typeof expertiseSchema>;
export type ArtifactInput = z.infer<typeof artifactSchema>;
export type ProofInput = z.infer<typeof proofSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type VerificationRequestInput = z.infer<typeof verificationRequestSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type MatchResponseInput = z.infer<typeof matchResponseSchema>;
export type ModerationActionInput = z.infer<typeof moderationActionSchema>;

