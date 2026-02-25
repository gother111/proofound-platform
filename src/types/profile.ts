import { LucideIcon } from 'lucide-react';

export interface BasicInfo {
  name: string;
  tagline: string | null;
  location: string | null;
  joinedDate: string;
  avatar: string | null; // Base64 or URL
  coverImage: string | null; // Base64 or URL
}

export interface Value {
  id: string;
  icon: string; // Icon name from lucide-react
  label: string;
  verified: boolean;
}

export interface Skill {
  id: string;
  name: string;
  verified: boolean;
}

export type ImpactStoryTimelineMode = 'single' | 'range';
export type ImpactStoryTimelinePrecision = 'date' | 'year';
export type ImpactStoryAffiliationType = 'organization' | 'individual';
export type ImpactStoryRoleScope = 'owned' | 'co_led' | 'contributed';
export type ImpactStoryOutcomeValueMode = 'delta' | 'absolute';
export type ImpactStoryOutcomeConfidence = 'exact' | 'estimated' | 'directional';
export type ImpactStoryArtifactKind = 'link' | 'file' | 'video' | 'doc' | 'image' | 'other';

export interface ImpactStoryTimeline {
  mode: ImpactStoryTimelineMode;
  precision: ImpactStoryTimelinePrecision;
  start: string;
  end?: string | null;
  ongoing?: boolean;
}

export interface ImpactStoryOutcome {
  id: string;
  label: string;
  value: number;
  unit: string;
  valueMode: ImpactStoryOutcomeValueMode;
  timeframe: string;
  baseline?: number | null;
  after?: number | null;
  confidence?: ImpactStoryOutcomeConfidence | null;
}

export interface ImpactStoryArtifact {
  id: string;
  kind: ImpactStoryArtifactKind;
  title: string;
  url: string;
  filePath?: string | null;
  mimeType?: string | null;
}

export interface ImpactStoryVerificationRequestInput {
  verifierEmail: string;
  verifierName?: string | null;
  verifierRelationship?: string | null;
  message?: string | null;
}

export interface ImpactStory {
  id: string;
  title: string;
  orgDescription: string;
  impact: string;
  businessValue: string;
  outcomes: string;
  timeline: string;
  verified: boolean | null;
  timelineStructured?: ImpactStoryTimeline | null;
  affiliationType?: ImpactStoryAffiliationType | null;
  affiliationDetails?: string | null;
  roleTitle?: string | null;
  roleScope?: ImpactStoryRoleScope | null;
  primaryCause?: string | null;
  secondaryCauses?: string[];
  measuredOutcomes?: ImpactStoryOutcome[];
  supportingArtifacts?: ImpactStoryArtifact[];
  verificationRequest?: ImpactStoryVerificationRequestInput | null;
  verificationWarning?: string | null;
}

export interface Experience {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  outcomes: string;
  projects: string;
  colleagues: string;
  achievements: string;
  startDate?: string | null;
  endDate?: string | null;
  verified: boolean | null;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  duration: string;
  skills: string;
  projects: string;
  verified: boolean | null;
}

export interface Volunteering {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  cause: string;
  impact: string;
  skillsDeployed: string;
  personalWhy: string;
  verified: boolean | null;
}

export type VisibilityLevel = 'public' | 'network' | 'private';

export interface FieldVisibility {
  mission?: VisibilityLevel;
  vision?: VisibilityLevel;
  values?: VisibilityLevel;
  causes?: VisibilityLevel;
  skills?: VisibilityLevel;
  experiences?: VisibilityLevel;
  education?: VisibilityLevel;
  volunteering?: VisibilityLevel;
  impactStories?: VisibilityLevel;
  [key: string]: VisibilityLevel | undefined;
}

export interface ProfileData {
  basicInfo: BasicInfo;
  mission: string | null;
  vision: string | null;
  values: Value[];
  causes: string[];
  skills: Skill[];
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
  fieldVisibility: FieldVisibility;
  redactMode: boolean;
}
