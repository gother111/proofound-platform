import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  // The dedicated onboarding flow has been deprecated in favor of routing
  // members directly to their respective home experiences.
  redirect('/i/home');
}
