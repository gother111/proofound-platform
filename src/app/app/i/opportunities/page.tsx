import { IndividualScopeNotice } from '@/components/app/IndividualScopeNotice';

export const dynamic = 'force-dynamic';

export default function OpportunitiesPage() {
  return (
    <IndividualScopeNotice
      title="Opportunity browsing is gated for launch"
      description="The MVP keeps discovery inside matching so the product story stays proof-first, portfolio-first, and calm by design. Broader opportunity browsing remains outside the launch corridor."
      primaryHref="/app/i/matching"
      primaryLabel="Open matching"
      secondaryHref="/app/i/home"
      secondaryLabel="Back to overview"
    />
  );
}
