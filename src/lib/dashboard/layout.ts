/**
 * Dashboard Layout Utilities
 *
 * Default layouts, widget definitions, and helper functions
 */

export type WidgetSize = 'small' | 'default' | 'large' | 'full';

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'matching' | 'growth' | 'insights';
  defaultSize: WidgetSize;
  availableSizes: WidgetSize[];
  minWidth?: number; // grid columns
  minHeight?: number; // grid rows
}

export interface DashboardWidget {
  widgetId: string;
  position: number;
  visible: boolean;
  size: WidgetSize;
  settings: Record<string, any>;
}

/**
 * All available widgets
 */
export const AVAILABLE_WIDGETS: Record<string, WidgetConfig> = {
  'while-away': {
    id: 'while-away',
    name: 'While You Were Away',
    description: 'Recent activity and updates',
    category: 'productivity',
    defaultSize: 'default',
    availableSizes: ['default'],
  },
  goals: {
    id: 'goals',
    name: 'Goals',
    description: 'Track your career goals',
    category: 'productivity',
    defaultSize: 'default',
    availableSizes: ['small', 'default'],
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    description: 'Upcoming tasks and to-dos',
    category: 'productivity',
    defaultSize: 'default',
    availableSizes: ['small', 'default'],
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    description: 'Active projects and collaborations',
    category: 'productivity',
    defaultSize: 'large',
    availableSizes: ['default', 'large'],
  },
  'matching-results': {
    id: 'matching-results',
    name: 'Matching Results',
    description: 'Latest job matches',
    category: 'matching',
    defaultSize: 'default',
    availableSizes: ['default', 'large'],
  },
  'impact-snapshot': {
    id: 'impact-snapshot',
    name: 'Impact Snapshot',
    description: 'Your contribution metrics',
    category: 'insights',
    defaultSize: 'large',
    availableSizes: ['default', 'large'],
  },
  'gap-map': {
    id: 'gap-map',
    name: 'Skill Gaps',
    description: 'Top skill gaps to work on',
    category: 'growth',
    defaultSize: 'default',
    availableSizes: ['default'],
  },
  'next-best-actions': {
    id: 'next-best-actions',
    name: 'Next Best Actions',
    description: 'Recommended actions to improve your profile',
    category: 'growth',
    defaultSize: 'full',
    availableSizes: ['large', 'full'],
  },
  explore: {
    id: 'explore',
    name: 'Explore',
    description: 'Discover new opportunities',
    category: 'matching',
    defaultSize: 'default',
    availableSizes: ['default'],
  },
  'miracle-mind-app': {
    id: 'miracle-mind-app',
    name: 'Miracle of Mind App',
    description: 'Download the 7-minute wellbeing app (iOS & Android)',
    category: 'growth',
    defaultSize: 'default',
    availableSizes: ['default'],
  },
};

/**
 * Default dashboard layout for new users
 */
export const DEFAULT_LAYOUT: DashboardWidget[] = [
  { widgetId: 'while-away', position: 0, visible: true, size: 'default', settings: {} },
  { widgetId: 'next-best-actions', position: 1, visible: true, size: 'default', settings: {} },
  { widgetId: 'matching-results', position: 2, visible: true, size: 'default', settings: {} },
  { widgetId: 'gap-map', position: 3, visible: true, size: 'default', settings: {} },
  { widgetId: 'goals', position: 4, visible: true, size: 'default', settings: {} },
  { widgetId: 'impact-snapshot', position: 5, visible: true, size: 'default', settings: {} },
];

/**
 * Preset layouts for different personas
 * PRD Reference: F2 - Customizable Dashboard with persona presets
 */
export const PRESET_LAYOUTS: Record<
  string,
  { label: string; description: string; widgets: DashboardWidget[] }
> = {
  // Job seekers looking for new opportunities
  'job-seeker': {
    label: 'Job Seeker',
    description: 'Focus on matches and skill gaps',
    widgets: [
      { widgetId: 'matching-results', position: 0, visible: true, size: 'large', settings: {} },
      { widgetId: 'next-best-actions', position: 1, visible: true, size: 'default', settings: {} },
      { widgetId: 'gap-map', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'goals', position: 3, visible: true, size: 'default', settings: {} },
      { widgetId: 'impact-snapshot', position: 4, visible: true, size: 'default', settings: {} },
    ],
  },
  // Career builders focusing on growth
  'career-builder': {
    label: 'Career Builder',
    description: 'Focus on skills and growth',
    widgets: [
      { widgetId: 'gap-map', position: 0, visible: true, size: 'default', settings: {} },
      { widgetId: 'goals', position: 1, visible: true, size: 'default', settings: {} },
      { widgetId: 'next-best-actions', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'projects', position: 3, visible: true, size: 'default', settings: {} },
      { widgetId: 'matching-results', position: 4, visible: true, size: 'default', settings: {} },
    ],
  },
  // Students and early career professionals
  student: {
    label: 'Student',
    description: 'Focus on learning and opportunities',
    widgets: [
      { widgetId: 'next-best-actions', position: 0, visible: true, size: 'default', settings: {} },
      { widgetId: 'gap-map', position: 1, visible: true, size: 'default', settings: {} },
      { widgetId: 'goals', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'matching-results', position: 3, visible: true, size: 'default', settings: {} },
      { widgetId: 'projects', position: 4, visible: true, size: 'default', settings: {} },
    ],
  },
  // Career switchers making big transitions
  switcher: {
    label: 'Career Switcher',
    description: 'Focus on transitions and new paths',
    widgets: [
      { widgetId: 'gap-map', position: 0, visible: true, size: 'large', settings: {} },
      { widgetId: 'matching-results', position: 1, visible: true, size: 'large', settings: {} },
      { widgetId: 'next-best-actions', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'while-away', position: 3, visible: true, size: 'default', settings: {} },
    ],
  },
  // Mentors and advisors
  mentor: {
    label: 'Mentor',
    description: 'Focus on impact and helping others',
    widgets: [
      { widgetId: 'impact-snapshot', position: 0, visible: true, size: 'default', settings: {} },
      { widgetId: 'projects', position: 1, visible: true, size: 'large', settings: {} },
      { widgetId: 'goals', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'while-away', position: 3, visible: true, size: 'default', settings: {} },
    ],
  },
  // Experienced professionals
  professional: {
    label: 'Professional',
    description: 'Balanced overview of all areas',
    widgets: [
      { widgetId: 'while-away', position: 0, visible: true, size: 'default', settings: {} },
      { widgetId: 'matching-results', position: 1, visible: true, size: 'default', settings: {} },
      { widgetId: 'goals', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'impact-snapshot', position: 3, visible: true, size: 'default', settings: {} },
      { widgetId: 'projects', position: 4, visible: true, size: 'default', settings: {} },
    ],
  },
};

/**
 * Validate a dashboard layout
 */
export function validateLayout(layout: DashboardWidget[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for duplicate widgets
  const widgetIds = layout.map((w) => w.widgetId);
  const uniqueIds = new Set(widgetIds);
  if (widgetIds.length !== uniqueIds.size) {
    errors.push('Duplicate widgets detected');
  }

  // Check for invalid widgets
  layout.forEach((widget) => {
    if (!AVAILABLE_WIDGETS[widget.widgetId]) {
      errors.push(`Invalid widget: ${widget.widgetId}`);
    }

    // Check if size is valid for this widget
    const config = AVAILABLE_WIDGETS[widget.widgetId];
    if (config && !config.availableSizes.includes(widget.size)) {
      errors.push(`Invalid size "${widget.size}" for widget "${widget.widgetId}"`);
    }
  });

  // Check positions are sequential
  const positions = layout.map((w) => w.position).sort((a, b) => a - b);
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== i) {
      errors.push('Positions must be sequential starting from 0');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reorder widgets after drag-and-drop
 */
export function reorderWidgets(
  widgets: DashboardWidget[],
  fromIndex: number,
  toIndex: number
): DashboardWidget[] {
  const result = Array.from(widgets);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // Update positions
  return result.map((widget, index) => ({
    ...widget,
    position: index,
  }));
}

/**
 * Calculate profile completeness for Next Best Actions
 */
export function calculateProfileCompleteness(profile: any): {
  percentage: number;
  missingFields: string[];
  suggestions: string[];
} {
  const missingFields: string[] = [];
  const suggestions: string[] = [];
  let completedFields = 0;
  const totalFields = 10; // Critical fields for matching

  // Check profile basics
  if (!profile.displayName) {
    missingFields.push('displayName');
    suggestions.push('Add your display name');
  } else {
    completedFields++;
  }

  if (!profile.avatarUrl) {
    missingFields.push('avatarUrl');
    suggestions.push('Upload a profile photo');
  } else {
    completedFields++;
  }

  if (!profile.headline) {
    missingFields.push('headline');
    suggestions.push('Write a professional headline');
  } else {
    completedFields++;
  }

  if (!profile.bio) {
    missingFields.push('bio');
    suggestions.push('Add your bio');
  } else {
    completedFields++;
  }

  // Check mission/values
  if (!profile.mission) {
    missingFields.push('mission');
    suggestions.push('Define your personal mission');
  } else {
    completedFields++;
  }

  // Check location (from matching profile)
  if (!profile.location) {
    missingFields.push('location');
    suggestions.push('Add your location');
  } else {
    completedFields++;
  }

  // Assume skills, proofs, and other fields are checked separately
  // For now, placeholder checks
  const hasSkills = profile.skillCount > 0;
  const hasProofs = profile.proofCount > 0;
  const hasVerifications = profile.verificationCount > 0;
  const hasExperiences = profile.experienceCount > 0;

  if (hasSkills) completedFields++;
  else suggestions.push('Add at least 5 skills to your Expertise Atlas');

  if (hasProofs) completedFields++;
  else suggestions.push('Upload proof of your skills');

  if (hasVerifications) completedFields++;
  else suggestions.push('Request skill verifications from peers');

  if (hasExperiences) completedFields++;
  else suggestions.push('Add your work experience');

  const percentage = Math.round((completedFields / totalFields) * 100);

  return {
    percentage,
    missingFields,
    suggestions,
  };
}
