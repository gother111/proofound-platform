/**
 * Guided Tour Steps Configuration
 *
 * Defines tour steps for different user personas (Individual vs Organization)
 * Based on PRD requirement I-03: First-run guided tour
 */

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting element
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * Individual Persona Tour Steps
 *
 * Focus: Finding opportunities, showcasing skills, building profile
 */
export const individualTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Proofound!',
    description:
      "Let's take a quick tour to help you get started. You'll learn how to build your profile, find opportunities, and connect with organizations.",
    placement: 'center',
  },
  {
    id: 'complete-profile',
    title: 'Complete Your Profile',
    description:
      'Start by adding your skills, experience, and what drives you. A complete profile helps organizations find and understand you better.',
    target: '[data-tour="profile-link"]',
    placement: 'bottom',
    action: {
      label: 'Go to Profile',
      href: '/app/i/profile',
    },
  },
  {
    id: 'add-skills',
    title: 'Showcase Your Expertise',
    description:
      "Add skills from our 20,000+ taxonomy. The more specific you are, the better matches you'll receive. Don't forget to add evidence!",
    target: '[data-tour="skills-section"]',
    placement: 'right',
  },
  {
    id: 'set-vision',
    title: 'Share Your Vision & Values',
    description:
      'Tell us what you care about. Organizations look for individuals whose values align with their mission.',
    target: '[data-tour="vision-section"]',
    placement: 'right',
  },
  {
    id: 'browse-opportunities',
    title: 'Discover Opportunities',
    description:
      'Browse assignments from organizations that match your skills and values. Our algorithm prioritizes Purpose-Alignment-Contribution.',
    target: '[data-tour="opportunities-link"]',
    placement: 'bottom',
    action: {
      label: 'View Opportunities',
      href: '/app/i/opportunities',
    },
  },
  {
    id: 'messaging',
    title: 'Private Messaging',
    description:
      'When you match with an organization, you can message them privately. Your identity is revealed in stages to maintain privacy.',
    target: '[data-tour="messages-link"]',
    placement: 'bottom',
  },
  {
    id: 'zen-hub',
    title: 'Track Your Well-Being',
    description:
      "Zen Hub helps you monitor stress and control levels. It's completely optional and private—your data is never shared.",
    target: '[data-tour="zen-link"]',
    placement: 'bottom',
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description:
      'You can restart this tour anytime from your settings. Now go build an amazing profile and find opportunities that align with your purpose!',
    placement: 'center',
  },
];

/**
 * Organization Persona Tour Steps
 *
 * Focus: Posting assignments, finding talent, reviewing matches
 */
export const organizationTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Proofound!',
    description:
      "Let's show you around. You'll learn how to create assignments, find qualified individuals, and build your organization's impact.",
    placement: 'center',
  },
  {
    id: 'org-profile',
    title: 'Complete Your Organization Profile',
    description:
      'Add your mission, values, and what drives your organization. This helps individuals understand your purpose and impact.',
    target: '[data-tour="org-profile-link"]',
    placement: 'bottom',
    action: {
      label: 'Go to Profile',
      href: '/app/o/[slug]/profile',
    },
  },
  {
    id: 'create-assignment',
    title: 'Post Your First Assignment',
    description:
      "Create an assignment by defining the skills, outcomes, and values you're looking for. Our 5-step wizard makes it easy.",
    target: '[data-tour="new-assignment-btn"]',
    placement: 'bottom',
    action: {
      label: 'Create Assignment',
      href: '/app/o/[slug]/assignments/new',
    },
  },
  {
    id: 'review-matches',
    title: 'Review Matches',
    description:
      'Our algorithm finds individuals who align with your requirements and values. Review matches and shortlist candidates.',
    target: '[data-tour="matches-link"]',
    placement: 'bottom',
  },
  {
    id: 'messaging',
    title: 'Connect with Candidates',
    description:
      'Message shortlisted individuals to learn more. Identity is revealed gradually to maintain privacy and reduce bias.',
    target: '[data-tour="messages-link"]',
    placement: 'bottom',
  },
  {
    id: 'schedule-interviews',
    title: 'Schedule Interviews',
    description:
      "Once you're ready, schedule video interviews directly through the platform. We integrate with Zoom and Google Meet.",
    target: '[data-tour="interviews-link"]',
    placement: 'bottom',
  },
  {
    id: 'track-impact',
    title: 'Measure Your Impact',
    description:
      'Track outcomes and showcase the impact your organization is making. Build evidence packs to share your story.',
    target: '[data-tour="impact-link"]',
    placement: 'bottom',
  },
  {
    id: 'complete',
    title: 'Ready to Make an Impact!',
    description:
      'You can restart this tour anytime from settings. Now create your first assignment and find individuals who share your vision!',
    placement: 'center',
  },
];

/**
 * Get tour steps based on user persona
 */
export function getTourSteps(persona: 'individual' | 'org_member' | 'unknown'): TourStep[] {
  if (persona === 'org_member') {
    return organizationTourSteps;
  }
  return individualTourSteps;
}
