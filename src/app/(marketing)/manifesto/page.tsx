import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';

export const metadata: Metadata = {
  title: 'Proofound Manifesto',
  description: 'Principles: authentic expertise, privacy by default, bias-aware, values-aligned.',
};

export default function ManifestoPage() {
  return (
    <MarketingPage
      title="Proofound Manifesto"
      description="We believe expertise should be discoverable without sacrificing privacy, consent, or fairness."
    >
      <p className="text-base leading-relaxed text-muted-foreground">
        Authentic expertise first: proof-backed skills and outcomes, no engagement feeds. Privacy
        and consent are defaults; users control what is visible. Values and causes are first-class
        signals in matching, not an afterthought.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Bias-aware guardrails: fairness checks, transparent scoring, and visibility controls to keep
        decisions accountable. Well-being is opt-in and non-diagnostic. The promise: faster,
        values-aligned matches with trust you can verify.
      </p>
    </MarketingPage>
  );
}
