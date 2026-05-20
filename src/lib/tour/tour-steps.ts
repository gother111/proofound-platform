import { Step } from 'react-joyride';
import { UI_VOCABULARY } from '@/lib/copy/vocabulary';

export const individualTourSteps: Step[] = [
  {
    target: 'body',
    content:
      "Welcome to Proofound! Let's take a quick tour to help you create your first Proof Pack.",
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-section"]',
    content:
      'This is your profile hub. Start with one artifact-backed Proof Pack before expanding public details.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="expertise-section"]',
    content:
      'Add proof-linked skills here. Start with skills you can anchor to real work, education, volunteering, or a proof artifact.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="import-cv-tab"]',
    content:
      'Quick start: use your CV only as private context for suggested proof work. Review everything before it becomes part of your profile.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="gap-analysis-tab"]',
    content:
      'Use readiness gaps to decide which proof-backed signal to strengthen next for your target work.',
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
    content: `Once proof and privacy are ready, matched opportunities will appear here. We use ${UI_VOCABULARY.pacLabel} scoring to compare skills, evidence, freshness, verification, and practical constraints.`,
    placement: 'bottom',
  },
  {
    target: '[data-tour="messages-section"]',
    content:
      'Communicate with potential employers through our secure messaging system. Initial messages are identity-masked to reduce bias.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="proof-readiness"]',
    content:
      'Track your proof readiness here. Start with one Proof Pack, then strengthen trust when it matters.',
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
      'Create assignments with outcomes, practical constraints, proof requirements, and a clear review path.',
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
      "Keep assignment and engagement evidence tied to concrete outcomes so your organization's public trust page stays credible.",
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
      'Schedule or reschedule interviews with clear state, consent, and manual meeting-link control.',
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
