import { Step } from 'react-joyride';
import { UI_VOCABULARY } from '@/lib/copy/vocabulary';

export const individualTourSteps: Step[] = [
  {
    target: 'body',
    content:
      "Welcome to Proofound! Let's take a quick tour to help you get started. This will only take a minute.",
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-section"]',
    content:
      'This is your profile hub. Complete your mission, vision, values, and causes to help us find purpose-aligned opportunities for you.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="expertise-section"]',
    content:
      'Build your Expertise Atlas here. Add skills from our 20,000+ skill taxonomy, specify your experience level, and upload proof of expertise.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="import-cv-tab"]',
    content:
      'Quick start: Import skills directly from your CV or resume. Our AI will extract and suggest relevant skills from the taxonomy.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="gap-analysis-tab"]',
    content:
      'Use Gap Analysis to identify skill gaps for your target roles. Get personalized recommendations on which skills to develop next.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="matching-section"]',
    content:
      "Set up your matching preferences - what kind of work you're looking for, your availability, location preferences, and compensation expectations.",
    placement: 'bottom',
  },
  {
    target: '[data-tour="opportunities-section"]',
    content: `Once your profile is complete, matched opportunities will appear here. We use ${UI_VOCABULARY.pacLabel} scoring to find work that aligns with your values and causes.`,
    placement: 'bottom',
  },
  {
    target: '[data-tour="messages-section"]',
    content:
      'Communicate with potential employers through our secure messaging system. Initial messages are identity-masked to reduce bias.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="zen-hub-section"]',
    content:
      'Visit the Zen Hub to track your well-being throughout your career journey. Your data is private and helps us measure what truly matters.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="profile-completion"]',
    content:
      'Track your profile completion here. Reach 60% to become "matchable" and start receiving opportunities.',
    placement: 'left',
  },
];

export const organizationTourSteps: Step[] = [
  {
    target: 'body',
    content:
      "Welcome to Proofound! Let's take a quick tour to help you get started finding purpose-driven talent.",
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="org-profile-section"]',
    content:
      'Complete your organization profile with mission, vision, values, and causes. This helps attract candidates who share your purpose.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="assignments-section"]',
    content:
      'Create assignments using our 5-step workflow: Business Value → Target Outcomes → Weight Matrix → Practicals → Expertise Mapping.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="matches-section"]',
    content: `Review matched candidates here. Our algorithm prioritizes ${UI_VOCABULARY.pacLabel.toLowerCase()} to find people who care about your mission.`,
    placement: 'bottom',
  },
  {
    target: '[data-tour="projects-section"]',
    content:
      "Track your projects and their impact. Document outcomes to build your organization's credibility.",
    placement: 'bottom',
  },
  {
    target: '[data-tour="team-section"]',
    content:
      'Manage your team members and their roles. Set up stakeholders who will be involved in hiring decisions.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="interviews-section"]',
    content:
      'Schedule interviews directly through Proofound. We automatically include stakeholders and integrate with Zoom/Google Meet.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="messages-section"]',
    content:
      'Communicate with candidates through our secure messaging system. Messages are initially identity-masked to reduce hiring bias.',
    placement: 'bottom',
  },
];

export const tourStyles = {
  options: {
    primaryColor: '#2563eb', // blue-600
    textColor: '#1f2937', // gray-800
    backgroundColor: '#ffffff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    arrowColor: '#ffffff',
    zIndex: 10000,
  },
  tooltip: {
    fontSize: 16,
    padding: 20,
    borderRadius: 8,
  },
  buttonNext: {
    backgroundColor: '#2563eb',
    fontSize: 14,
    padding: '8px 16px',
    borderRadius: 6,
  },
  buttonBack: {
    color: '#6b7280',
    fontSize: 14,
    marginRight: 10,
  },
  buttonSkip: {
    color: '#6b7280',
    fontSize: 14,
  },
};

export const tourLocale = {
  back: 'Back',
  close: 'Close',
  last: 'Finish',
  next: 'Next',
  skip: 'Skip tour',
};
