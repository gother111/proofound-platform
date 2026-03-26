import { IndividualScopeNotice } from '@/components/app/IndividualScopeNotice';

export const dynamic = 'force-dynamic';

export default function OpportunitiesPage() {
  return (
    <IndividualScopeNotice
      title="Opportunity browsing is gated for launch"
      description="The MVP keeps discovery inside matching so the product stays centered on Proof Packs, privacy-safe review, and one calm hiring corridor. Broader opportunity browsing remains outside the launch corridor."
      primaryHref="/app/i/matching"
      primaryLabel="Open matching"
      secondaryHref="/app/i/home"
      secondaryLabel="Back to overview"
    />
  );
}
