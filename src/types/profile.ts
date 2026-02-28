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
export type ImpactStorySaveMode = 'structured' | 'legacy_fallback';
export type ImpactStoryVerificationRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'failed';

export interface ImpactStoryTimeline {
  mode: ImpactStoryTimelineMode;
  precision: ImpactStoryTimelinePrecision;
  start: string;
  end?: string | null;
  ongoing?: boolean;
}

export interface ImpactStoryOutcome {
  id: string;
  change?: string | null;
  label: string;
  value?: number | null;
  unit?: string | null;
  valueMode?: ImpactStoryOutcomeValueMode | null;
  timeframe?: string | null;
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

export interface ImpactStoryVerificationRequestDispatchParams {
  storyId?: string;
  storyDraft?: Omit<ImpactStory, 'id'>;
  verificationRequest: ImpactStoryVerificationRequestInput;
}

export interface ImpactStoryVerificationRequestDispatchResult {
  story: ImpactStory;
  verification: {
    requestId: string;
    status: ImpactStoryVerificationRequestStatus;
    emailSent: boolean;
    emailError?: string | null;
    warning?: string | null;
    verifierEmail: string;
    createdAt: string;
    emailSentAt?: string | null;
  };
  saveWarning?: string | null;
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
  verificationRequestStatus?: ImpactStoryVerificationRequestStatus | null;
  verificationRequestedAt?: string | null;
  verificationVerifierEmail?: string | null;
  verificationEmailSentAt?: string | null;
  verificationEmailError?: string | null;
  verificationWarning?: string | null;
  saveMode?: ImpactStorySaveMode;
  saveWarning?: string | null;
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
export type PurposeLinks = {
  values: string[];
  causes: string[];
};

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
  missionLinks?: PurposeLinks;
  visionLinks?: PurposeLinks;
  values: Value[];
  causes: string[];
  skills: Skill[];
  proofArtifactCount?: number;
  acceptedVerificationCount?: number;
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
  fieldVisibility: FieldVisibility;
  redactMode: boolean;
}
