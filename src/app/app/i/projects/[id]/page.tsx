import { IndividualScopeNotice } from '@/components/app/IndividualScopeNotice';

export const dynamic = 'force-dynamic';

export default function ProjectDetailPage() {
  return (
    <IndividualScopeNotice
      title="Project detail editing is gated for launch"
      description="Proofound launch keeps the individual corridor centered on proof-backed profile updates and portfolio publication. Project detail workflows remain outside the launch surface."
      primaryHref="/app/i/profile"
      primaryLabel="Open profile"
      secondaryHref="/app/i/home"
      secondaryLabel="Back to overview"
    />
  );
}
