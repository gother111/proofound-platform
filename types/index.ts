// Central type definitions for Proofound MVP
import { Database } from './database';

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];

export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];

export type Match = Database['public']['Tables']['matches']['Row'];
export type MatchInsert = Database['public']['Tables']['matches']['Insert'];
export type MatchUpdate = Database['public']['Tables']['matches']['Update'];

export type ExpertiseAtlas = Database['public']['Tables']['expertise_atlas']['Row'];
export type ExpertiseAtlasInsert = Database['public']['Tables']['expertise_atlas']['Insert'];

export type Proof = Database['public']['Tables']['proofs']['Row'];
export type ProofInsert = Database['public']['Tables']['proofs']['Insert'];

export type Artifact = Database['public']['Tables']['artifacts']['Row'];
export type ArtifactInsert = Database['public']['Tables']['artifacts']['Insert'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export type VerificationRequest = Database['public']['Tables']['verification_requests']['Row'];
export type VerificationRequestInsert = Database['public']['Tables']['verification_requests']['Insert'];

export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];

export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row'];
export type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert'];

// Admin Dashboard View Types
export type AdminMatchStats = Database['public']['Views']['admin_match_stats']['Row'];
export type AdminOrgVerificationStats = Database['public']['Views']['admin_org_verification_stats']['Row'];
export type AdminProfileReadinessStats = Database['public']['Views']['admin_profile_readiness_stats']['Row'];
export type AdminSafetyStats = Database['public']['Views']['admin_safety_stats']['Row'];
export type AdminTimeToFirstMatch = Database['public']['Views']['admin_time_to_first_match']['Row'];

// Custom Application Types

export type AccountType = 'individual' | 'organization';

export type AvailabilityStatus = 'available' | 'not_available' | 'open_to_opportunities';

export type AssignmentType = 'employment' | 'volunteering' | 'contract' | 'project';

export type MatchStatus = 'suggested' | 'viewed' | 'accepted' | 'declined' | 'expired';

export type CommunicationStage = 'none' | 'stage1_masked' | 'stage2_revealed';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'declined' | 'expired';

export type ProofType = 'verified_reference' | 'link' | 'file' | 'credential';

export type ClaimType = 'skill' | 'experience' | 'education' | 'achievement' | 'volunteering';

export type ArtifactType = 'link' | 'file' | 'credential' | 'document';

export type Visibility = 'public' | 'private' | 'matches_only';

export type OrgType = 'ngo' | 'startup' | 'sme' | 'enterprise' | 'other';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ModerationStatus = 'pending' | 'under_review' | 'actioned' | 'dismissed';

export type ReportCategory = 
  | 'spam' 
  | 'harassment' 
  | 'false_information' 
  | 'inappropriate_content' 
  | 'political_content' 
  | 'discrimination' 
  | 'other';

// Match Explainability Types
export interface MatchStrength {
  area: string;
  description: string;
  score: number;
}

export interface MatchGap {
  area: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ImprovementSuggestion {
  action: string;
  potential_increase_min: number;
  potential_increase_max: number;
  priority: 'low' | 'medium' | 'high';
}

export interface MatchExplainability {
  overall_score: number;
  breakdown: {
    mission_values: { score: number; weight: number };
    core_expertise: { score: number; weight: number };
    tools: { score: number; weight: number };
    logistics: { score: number; weight: number };
    recency: { score: number; weight: number };
  };
  strengths: MatchStrength[];
  gaps: MatchGap[];
  improvements: ImprovementSuggestion[];
}

// Field Visibility Settings
export interface FieldVisibility {
  full_name: Visibility;
  region: Visibility;
  mission: Visibility;
  vision: Visibility;
  values: Visibility;
  causes: Visibility;
  professional_summary: Visibility;
  industry: Visibility;
  languages: Visibility;
  salary_band: 'masked' | 'private' | 'public';
}

// Analytics Event Properties
export interface SignUpEventProperties {
  method: 'email' | 'google' | 'linkedin';
  referrer?: string;
}

export interface ProfileReadyEventProperties {
  completion_percentage: number;
  time_to_ready_hours: number;
}

export interface MatchAcceptedEventProperties {
  match_id: string;
  assignment_id: string;
  overall_score: number;
  time_to_accept_hours: number;
}

export interface MatchDeclinedEventProperties {
  match_id: string;
  assignment_id: string;
  overall_score: number;
  reason?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

// Form Types
export interface ProfileFormData {
  full_name: string;
  mission?: string;
  vision?: string;
  values?: string[];
  causes?: string[];
  professional_summary?: string;
  industry?: string[];
  languages?: string[];
  region?: string;
  timezone?: string;
  availability_status?: AvailabilityStatus;
  available_start_date?: string;
}

export interface AssignmentFormData {
  title: string;
  description?: string;
  assignment_type: AssignmentType;
  location?: string;
  is_remote: boolean;
  start_date?: string;
  end_date?: string;
  duration_text?: string;
  time_commitment?: string;
  budget_min?: number;
  budget_max?: number;
  budget_masked: boolean;
  required_expertise?: any;
  required_languages?: string[];
  expected_outcomes?: string;
  impact_goals?: string;
}

