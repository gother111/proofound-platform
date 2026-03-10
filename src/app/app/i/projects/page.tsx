import { IndividualScopeNotice } from '@/components/app/IndividualScopeNotice';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  return (
    <IndividualScopeNotice
      title="Project libraries are not part of the launch MVP"
      description="The launch corridor keeps your individual surface focused on proof, portfolio publication, and qualified introductions. Broader project-library management remains isolated."
      primaryHref="/app/i/profile"
      primaryLabel="Open profile"
      secondaryHref="/app/i/home"
      secondaryLabel="Back to overview"
    />
  );
}
