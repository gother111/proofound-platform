/**
 * Guided Tour Steps Configuration
 *
 * Implements PRD Part 4, Flow I-03: "Reveal UI" tour
 * 8-step tour for first-time individual users
 *
 * PRD References:
 * - Part 4: User Flows - First Login (I-03)
 * - Part 5: F1 - Profile Builder
 * - Part 5: F3 - Expertise Hub
 * - Part 5: F4 - Matching Profile
 * - Part 5: F5 - Zen Hub
 */

import type { Step } from 'react-joyride';

/**
 * Tour steps for individual users
 *
 * PRD Flow I-03: 8-step progressive disclosure
 * 1. Blank canvas → Welcome
 * 2. Reveal Navigation
 * 3. Reveal Dashboard
 * 4. Jump to Profile (empty state)
 * 5. Show Expertise Hub
 * 6. Show Matching Profile
 * 7. Show Zen Hub
 * 8. Show Settings
 * 9. Suggest "Start with your Profile"
 */
export const individualTourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2D3330]">Welcome to Proofound! 👋</h2>
        <p className="text-sm text-[#6B6760]">
          Let's take a quick tour to help you get started. This will only take about 2 minutes.
        </p>
        <p className="text-xs text-[#9B9891]">
          You can skip this tour anytime by pressing ESC, or replay it later from Settings.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="navigation"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[#2D3330]">Your Navigation</h3>
        <p className="text-sm text-[#6B6760]">
          This sidebar is your home base. It helps you move between different sections of Proofound.
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
        <h3 className="text-base font-semibold text-[#2D3330]">Your Dashboard</h3>
        <p className="text-sm text-[#6B6760]">
          Your dashboard shows key stats and actions. You can customize what appears here later.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[#2D3330]">Your Profile</h3>
        <p className="text-sm text-[#6B6760]">
          This is where you'll build your professional identity. Add your mission, vision, and
          values to stand out to organizations that share your purpose.
        </p>
        <p className="text-xs text-[#9B9891] pt-2 border-t border-[#E8E6DD]">
          <strong>Tip:</strong> Start here first! A complete profile helps you get better matches.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="expertise"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[#2D3330]">Expertise Hub</h3>
        <p className="text-sm text-[#6B6760]">
          Add your skills using our L1-L4 taxonomy. The more specific you are (L4 skills), the
          better your matches will be.
        </p>
        <p className="text-xs text-[#9B9891] pt-2 border-t border-[#E8E6DD]">
          <strong>About L4:</strong> These are the most granular, specific skills (e.g., "React
          Hooks" instead of just "JavaScript").
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="matching"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[#2D3330]">Matching Profile</h3>
        <p className="text-sm text-[#6B6760]">
          Set your preferences for work: availability, compensation, location, and more. This helps
          us find assignments that fit your life.
        </p>
        <p className="text-xs text-[#9B9891] pt-2 border-t border-[#E8E6DD]">
          <strong>Privacy first:</strong> Organizations only see what you choose to share.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="zen"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[#2D3330]">Zen Hub (Well-Being)</h3>
        <p className="text-sm text-[#6B6760]">
          Job searching can be stressful. Zen Hub offers optional well-being check-ins and resources
          to support you.
        </p>
        <p className="text-xs text-[#9B9891] pt-2 border-t border-[#E8E6DD]">
          <strong>100% optional:</strong> All check-ins are private and never shared with
          organizations.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="settings"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[#2D3330]">Settings</h3>
        <p className="text-sm text-[#6B6760]">
          Control your privacy, notifications, and account settings. You can also replay this tour
          anytime from here.
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
        <h2 className="text-lg font-semibold text-[#2D3330]">You're all set! 🎉</h2>
        <p className="text-sm text-[#6B6760]">
          Ready to get started? We recommend beginning with your <strong>Profile</strong> to
          introduce yourself, then adding your skills in the <strong>Expertise Hub</strong>.
        </p>
        <div className="pt-3 border-t border-[#E8E6DD]">
          <p className="text-xs text-[#9B9891]">
            <strong>Next steps:</strong>
          </p>
          <ul className="text-xs text-[#9B9891] list-disc list-inside space-y-1 mt-1">
            <li>Complete your Profile (mission, vision, values)</li>
            <li>Add at least 10 L4 skills to activate matching</li>
            <li>Set your Matching preferences</li>
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
        <h2 className="text-lg font-semibold text-[#2D3330]">Welcome to Proofound! 👋</h2>
        <p className="text-sm text-[#6B6760]">
          Let's show you around your organization workspace. This will take about 2 minutes.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="navigation"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[#2D3330]">Organization Navigation</h3>
        <p className="text-sm text-[#6B6760]">
          Your sidebar helps you manage assignments, review candidates, and track team activity.
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
        <h3 className="text-base font-semibold text-[#2D3330]">Assignments</h3>
        <p className="text-sm text-[#6B6760]">
          Create and manage role assignments. Define requirements, and our matching system will find
          qualified candidates who align with your organization's mission.
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
        <h3 className="text-base font-semibold text-[#2D3330]">Candidates</h3>
        <p className="text-sm text-[#6B6760]">
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
        <h3 className="text-base font-semibold text-[#2D3330]">Organization Profile</h3>
        <p className="text-sm text-[#6B6760]">
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
        <h2 className="text-lg font-semibold text-[#2D3330]">Ready to find great talent! 🎉</h2>
        <p className="text-sm text-[#6B6760]">
          Start by creating your first <strong>Assignment</strong> to define what you're looking
          for.
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
