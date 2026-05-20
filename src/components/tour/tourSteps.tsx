/**
 * Guided Tour Steps Configuration
 *
 * Implements PRD Part 4, Flow I-03: "Reveal UI" tour
 * 10-step tour for first-time individual users
 *
 * PRD References:
 * - Part 4: User Flows - First Login (I-03)
 * - Part 5: F1 - Profile Builder
 * - Part 5: F3 - Expertise Hub
 * - Part 5: F4 - Matching Profile
 */

import type { Step } from 'react-joyride';
import { UI_VOCABULARY } from '@/lib/copy/vocabulary';

/**
 * Tour steps for individual users
 *
 * PRD Flow I-03: progressive disclosure
 * 1. Blank canvas → Welcome
 * 2. Reveal Navigation
 * 3. Reveal Overview
 * 4. Jump to Profile (empty state)
 * 5. Show profile-owned portfolio visibility
 * 6. Show Matching Profile
 * 7. Show Settings
 * 8. Suggest next actions
 */
export const individualTourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Welcome to Proofound! 👋</h2>
        <p className="text-sm text-muted-foreground">
          Your day-1 goal is to create one artifact-backed Proof Pack. This quick tour takes about 2
          minutes.
        </p>
        <p className="text-xs text-muted-foreground">
          You can skip this tour anytime by pressing ESC, or replay it later from Settings.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="left-nav"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Your Navigation</h3>
        <p className="text-sm text-muted-foreground">
          This sidebar is your home base. It helps you move between the narrow launch sections of
          Proofound.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Your Overview</h3>
        <p className="text-sm text-muted-foreground">
          Your overview shows portfolio readiness, proof signals, and the next launch-safe actions.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-link"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Your Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is where your Proof Packs, real contexts, and visibility choices live. Start with one
          proof-backed signal before expanding public details.
        </p>
        <p className="text-xs text-muted-foreground pt-2 border-t border-proofound-stone">
          <strong>Tip:</strong> Start with one context-backed Proof Pack.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-link"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Portfolio Visibility</h3>
        <p className="text-sm text-muted-foreground">
          Profile owns Proof Packs and the visibility controls for your clean, proof-based link.
          Matching remains secondary until proof and privacy are ready.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="matching-link"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Matching Profile</h3>
        <p className="text-sm text-muted-foreground">
          Set your preferences for work: availability, compensation, location, and more. This helps
          us review assignments that fit your life.
        </p>
        <p className="text-xs text-muted-foreground pt-2 border-t border-proofound-stone">
          <strong>Privacy first:</strong> Organizations only see what you choose to share.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="settings-link"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Control your privacy, account access, and launch preferences. You can also replay this
          tour anytime from here.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">You're all set! 🎉</h2>
        <p className="text-sm text-muted-foreground">
          Start with your <strong>Proof Packs</strong> in Profile, then publish only the public-safe
          signals you choose. Matching comes after proof and privacy are ready.
        </p>
        <div className="pt-3 border-t border-proofound-stone">
          <p className="text-xs text-muted-foreground">
            <strong>Next steps:</strong>
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 mt-1">
            <li>Publish one public-safe proof signal</li>
            <li>Add one proof-backed signal you want to show publicly</li>
            <li>Add one proof-linked skill and one matching preference</li>
            <li>Complete stronger proof and constraints for qualified introductions</li>
          </ul>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

/**
 * Tour steps for organization users (different flow)
 */
export const organizationTourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Welcome to Proofound! 👋</h2>
        <p className="text-sm text-muted-foreground">
          Your first win is to publish a clean organization portfolio link that your team can share
          today. This tour takes about 2 minutes.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="left-nav"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Organization Navigation</h3>
        <p className="text-sm text-muted-foreground">
          Your sidebar helps you manage assignments, review candidates, and track the narrow launch
          hiring corridor.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="portfolio-link"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Public Portfolio</h3>
        <p className="text-sm text-muted-foreground">
          Publish your organization proof portfolio and share it externally right away. Matching and
          hiring workflows stay available after this first step.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="assignments"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Assignments</h3>
        <p className="text-sm text-muted-foreground">
          Create and manage role assignments. Define requirements, and our matching system will find
          qualified candidates who align with your organization's mission and{' '}
          {UI_VOCABULARY.pacLabel.toLowerCase()}.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="candidates"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Candidates</h3>
        <p className="text-sm text-muted-foreground">
          Review matched candidates, see their qualifications, and track the hiring process.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="org-profile"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Organization Profile</h3>
        <p className="text-sm text-muted-foreground">
          Share your mission, values, and causes. This helps attract candidates who are aligned with
          your organization's purpose.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Ready to find great talent! 🎉</h2>
        <p className="text-sm text-muted-foreground">
          Start by sharing your Public Page link, then create your first <strong>Assignment</strong>{' '}
          to define what you're looking for.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

/**
 * Custom tour styles matching Proofound design system
 */
export const tourStyles = {
  options: {
    arrowColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    overlayColor: 'rgba(45, 51, 48, 0.4)', // Semi-transparent dark overlay
    primaryColor: '#1C4D3A', // Proofound green
    textColor: '#2D3330',
    width: 400,
    zIndex: 10000,
  },
  buttonNext: {
    backgroundColor: '#1C4D3A',
    borderRadius: '6px',
    color: '#FFFFFF',
    fontSize: '14px',
    padding: '8px 16px',
  },
  buttonBack: {
    color: '#6B6760',
    fontSize: '14px',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#9B9891',
    fontSize: '14px',
  },
  tooltip: {
    borderRadius: '8px',
    padding: '20px',
  },
  tooltipContent: {
    padding: '0',
  },
};
