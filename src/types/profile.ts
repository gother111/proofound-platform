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

export interface ImpactStory {
  id: string;
  title: string;
  orgDescription: string;
  impact: string;
  businessValue: string;
  outcomes: string;
  timeline: string;
  verified: boolean | null;
}

export interface Experience {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  learning: string;
  growth: string;
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

export interface ProfileData {
  basicInfo: BasicInfo;
  mission: string | null;
  values: Value[];
  causes: string[];
  skills: Skill[];
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
}
