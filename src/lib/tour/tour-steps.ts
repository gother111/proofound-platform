import { Step } from 'react-joyride';

export const individualTourSteps: Step[] = [
  {
    target: 'body',
    content:
      "Welcome to Proofound! Let's take a quick tour to help you create your first proof record.",
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-link"]',
    content:
      'This is your profile hub. Start with one artifact-backed proof record before extra profile edits.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="profile-link"]',
    content:
      'Add proof-linked skills here. Start with skills you can anchor to real work, education, volunteering, or a proof artifact.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="profile-link"]',
    content:
      'Quick start: use your CV only as private context for suggested proof work. Review everything before it becomes part of your profile.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="profile-link"]',
    content:
      'Use readiness gaps to decide which proof record or proof item to strengthen next for your target work.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="matching-link"]',
    content:
      'Set assignment-review preferences: work type, availability, location, and compensation expectations.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="matching-link"]',
    content:
      'Once proof and privacy are ready, assignment reviews can appear here. Proofound keeps review context reason-coded and privacy staged.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="communications-link"]',
    content:
      'Use secure workflow messages for staged introduction and interview context. Initial messages stay identity-masked to reduce bias.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="home-link"]',
    content:
      'Track your proof readiness here. Start with one proof record, then strengthen trust when it matters.',
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
    target: '[data-tour="org-profile"]',
    content:
      'Complete your organization trust page with mission, why the work matters, operating context, and domain evidence for one assignment path.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="assignments-link"]',
    content:
      'Create assignments with outcomes, practical constraints, proof requirements, and a clear review path.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="assignments-link"]',
    content:
      'Review reason-coded proof context here. Review support stays internal to assignment review and staged introductions.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="portfolio-link"]',
    content:
      'Preview the public trust page only after mission, work context, and domain evidence are ready for launch-safe sharing.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="org-profile"]',
    content:
      'Keep the organization trust page focused on the context participants need before one assignment path.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="communications-link"]',
    content:
      'Schedule or reschedule interviews with clear state, consent, and manual meeting-link control.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="communications-link"]',
    content:
      'Use secure workflow messages for staged introductions and interview context. Initial messages stay identity-masked to reduce review bias.',
    placement: 'bottom',
  },
];

export const tourStyles = {
  options: {
    primaryColor: '#1C4D3A',
    textColor: '#2D3330',
    backgroundColor: '#FCFBF8',
    overlayColor: 'rgba(45, 51, 48, 0.4)',
    arrowColor: '#FCFBF8',
    zIndex: 10000,
  },
  tooltip: {
    fontSize: 16,
    padding: 20,
    borderRadius: 8,
  },
  buttonNext: {
    backgroundColor: '#1C4D3A',
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
