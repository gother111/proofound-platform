/**
 * Proofound Profile Type Definitions
 *
 * Complete TypeScript interfaces for both Individual and Organization profiles.
 * Based on the Proofound design specification.
 */

// ============================================================================
// INDIVIDUAL PROFILE TYPES
// ============================================================================

/**
 * Basic profile information displayed in the header
 */
export interface BasicInfo {
  name: string;
  tagline: string | null;
  location: string | null;
  joinedDate: string;              // e.g., "January 2024"
  avatar: string | null;           // Base64 or URL
  coverImage: string | null;       // Base64 or URL
}

/**
 * Core value with icon and verification status
 */
export interface Value {
  id: string;
  icon: ValueIconType;             // Icon name
  label: string;                   // e.g., "Compassion", "Innovation"
  verified: boolean;
}

/**
 * Available icons for values
 */
export type ValueIconType =
  | 'Heart'
  | 'Sparkles'
  | 'Users'
  | 'Eye'
  | 'Target'
  | 'Shield'
  | 'Leaf'
  | 'Lightbulb'
  | 'HandHeart';

/**
 * Skill with verification status
 */
export interface Skill {
  id: string;
  name: string;
  verified: boolean;
}

/**
 * Impact story - detailed account of work and outcomes
 */
export interface ImpactStory {
  id: string;
  title: string;
  orgDescription: string;          // Organization context
  impact: string;                  // What changed
  businessValue: string;           // Value delivered
  outcomes: string;                // Measurable results
  timeline: string;                // e.g., "Jan 2023 - Dec 2023"
  verified: boolean | null;
}

/**
 * Professional experience entry
 */
export interface Experience {
  id: string;
  title: string;                   // Job title
  orgDescription: string;          // Company/organization
  duration: string;                // e.g., "2 years"
  learning: string;                // What I learned
  growth: string;                  // How I grew
  verified: boolean | null;
}

/**
 * Education entry
 */
export interface Education {
  id: string;
  institution: string;             // School name
  degree: string;                  // Degree or course
  duration: string;                // e.g., "2015-2019"
  skills: string;                  // Skills gained
  projects: string;                // Meaningful projects
  verified: boolean | null;
}

/**
 * Volunteering experience
 */
export interface Volunteering {
  id: string;
  title: string;                   // Role
  orgDescription: string;          // Organization
  duration: string;                // Time period
  cause: string;                   // Cause name
  impact: string;                  // Impact made
  skillsDeployed: string;          // Skills used
  personalWhy: string;             // Personal motivation
  verified: boolean | null;
}

/**
 * Network statistics
 */
export interface NetworkStats {
  people: number;
  organizations: number;
  institutions: number;
}

/**
 * Complete individual profile data
 */
export interface ProfileData {
  basicInfo: BasicInfo;
  mission: string | null;
  values: Value[];
  causes: string[];                // Array of cause names
  skills: Skill[];
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
  networkStats?: NetworkStats;
  profileCompletion: number;       // 0-100 percentage
}

// ============================================================================
// ORGANIZATION PROFILE TYPES
// ============================================================================

/**
 * Organization type
 */
export type OrganizationType = 'nonprofit' | 'for-profit' | 'government' | 'other';

/**
 * Organization data
 */
export interface Organization {
  id: string;
  slug: string;                    // URL slug
  displayName: string;             // Organization name
  legalName: string | null;        // Optional legal name
  mission: string | null;          // Mission statement (max 2000 chars)
  website: string | null;          // Website URL
  type: OrganizationType;
}

/**
 * User's membership role in organization
 */
export type MembershipRole = 'owner' | 'admin' | 'member';

/**
 * User's membership in organization
 */
export interface Membership {
  role: MembershipRole;
}

/**
 * Organization profile with membership info
 */
export interface OrganizationProfile extends Organization {
  membership?: Membership;
  canEdit: boolean;                // Whether current user can edit
}

// ============================================================================
// TAB TYPES
// ============================================================================

/**
 * Available profile tabs
 */
export type ProfileTab = 'impact' | 'journey' | 'learning' | 'service' | 'network';

/**
 * Tab configuration
 */
export interface TabConfig {
  id: ProfileTab;
  label: string;
  icon: string;                    // Lucide icon name
  color: string;                   // Theme color
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data for creating/editing impact story
 */
export interface ImpactStoryFormData {
  title: string;
  orgDescription: string;
  impact: string;
  businessValue: string;
  outcomes: string;
  timeline: string;
}

/**
 * Form data for creating/editing experience
 */
export interface ExperienceFormData {
  title: string;
  orgDescription: string;
  duration: string;
  learning: string;
  growth: string;
}

/**
 * Form data for creating/editing education
 */
export interface EducationFormData {
  institution: string;
  degree: string;
  duration: string;
  skills: string;
  projects: string;
}

/**
 * Form data for creating/editing volunteering
 */
export interface VolunteeringFormData {
  title: string;
  orgDescription: string;
  duration: string;
  cause: string;
  impact: string;
  skillsDeployed: string;
  personalWhy: string;
}

/**
 * Form data for updating basic info
 */
export interface BasicInfoFormData {
  name: string;
  tagline: string;
  location: string;
  avatar?: File | string;
  coverImage?: File | string;
}

/**
 * Form data for updating mission
 */
export interface MissionFormData {
  mission: string;
}

/**
 * Form data for organization
 */
export interface OrganizationFormData {
  displayName: string;
  legalName: string;
  mission: string;
  website: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  icon: React.ReactNode;           // SVG or icon component
  title: string;
  description: string;
  buttonText: string;
  tip?: string;
  onButtonClick: () => void;
}

/**
 * Content card action button
 */
export interface CardAction {
  icon: string;                    // Lucide icon name
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'ghost';
}

/**
 * Props for edit mode
 */
export interface EditModeProps {
  isEditing: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Tab configurations
 */
export const TAB_CONFIGS: TabConfig[] = [
  { id: 'impact', label: 'Impact', icon: 'Target', color: 'sage' },
  { id: 'journey', label: 'Journey', icon: 'Briefcase', color: 'terracotta' },
  { id: 'learning', label: 'Learning', icon: 'GraduationCap', color: 'teal' },
  { id: 'service', label: 'Service', icon: 'HandHeart', color: 'terracotta' },
  { id: 'network', label: 'Network', icon: 'Network', color: 'sage' },
];

/**
 * Value icon mapping
 */
export const VALUE_ICONS: Record<ValueIconType, string> = {
  Heart: 'Heart',
  Sparkles: 'Sparkles',
  Users: 'Users',
  Eye: 'Eye',
  Target: 'Target',
  Shield: 'Shield',
  Leaf: 'Leaf',
  Lightbulb: 'Lightbulb',
  HandHeart: 'HandHeart',
};

/**
 * Organization type labels
 */
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  'nonprofit': 'Non-Profit',
  'for-profit': 'For-Profit',
  'government': 'Government',
  'other': 'Other',
};

/**
 * Maximum character lengths
 */
export const MAX_LENGTHS = {
  tagline: 200,
  mission: 2000,
  impactStory: {
    title: 100,
    orgDescription: 200,
    impact: 1000,
    businessValue: 1000,
    outcomes: 1000,
    timeline: 50,
  },
  experience: {
    title: 100,
    orgDescription: 200,
    duration: 50,
    learning: 1000,
    growth: 1000,
  },
  education: {
    institution: 200,
    degree: 200,
    duration: 50,
    skills: 1000,
    projects: 1000,
  },
  volunteering: {
    title: 100,
    orgDescription: 200,
    duration: 50,
    cause: 100,
    impact: 1000,
    skillsDeployed: 500,
    personalWhy: 500,
  },
} as const;
