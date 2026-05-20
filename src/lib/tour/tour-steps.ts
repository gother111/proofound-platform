import { Step } from 'react-joyride';

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
      'Use readiness gaps to decide which Proof Pack or proof item to strengthen next for your target work.',
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
    content:
      'Once proof and privacy are ready, assignment reviews can appear here. Proofound keeps review context reason-coded and privacy staged.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="messages-section"]',
    content:
      'Use secure workflow messages for staged introduction and interview context. Initial messages stay identity-masked to reduce bias.',
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
      "Welcome to Proofound! Let's take a quick tour to help you start a proof-first assignment review.",
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="org-profile-section"]',
    content:
      'Complete your organization trust page with mission, why the work matters, operating context, and domain evidence for one assignment path.',
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
    content:
      'Review reason-coded proof context here. Matching support stays internal to assignment review and staged introductions.',
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
      'Manage your team members and their roles. Set up stakeholders who will be involved in proof-review workflow decisions.',
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
      'Use secure workflow messages for staged introductions and interview context. Initial messages stay identity-masked to reduce review bias.',
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
