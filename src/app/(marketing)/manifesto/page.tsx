import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

export const metadata: Metadata = buildPublicMetadata({
  title: 'Proofound Manifesto | Principles for trusted matching',
  description:
    'Read the Proofound manifesto on evidence-first credibility, consent-based visibility, transparent decision support, and bias-aware matching practices.',
  path: '/manifesto',
});

export default function ManifestoPage() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/manifesto',
    title: 'Proofound Manifesto | Principles for trusted matching',
    description:
      'Read the Proofound manifesto on evidence-first credibility, consent-based visibility, transparent decision support, and bias-aware matching practices.',
  });

  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="manifesto-jsonld" />
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
          Bias-aware guardrails: fairness checks, transparent scoring, and visibility controls to
          keep decisions accountable. Well-being is opt-in and non-diagnostic. The promise: faster,
          values-aligned matches with trust you can verify.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          We reject systems that reward attention capture over meaningful outcomes. Product choices
          should reduce noise, clarify evidence, and support better decisions. Every new workflow is
          evaluated against practical criteria: does it improve trust, preserve user agency, and
          make collaboration more equitable for both sides of the platform?
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          Our long-term commitment is operational transparency. We document key policies, expose
          governance guardrails, and improve based on measurable results. Trust is not a marketing
          claim. It is a system property that must be implemented, monitored, and continuously
          earned.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          We commit to building in public wherever possible, documenting tradeoffs, and correcting
          mistakes quickly. Product maturity is measured by user outcomes, not feature volume. Every
          release should make the system easier to trust, easier to understand, and easier to
          govern.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          This manifesto is a working commitment, not static copy. We refine standards as we learn,
          publish improvements when assumptions prove wrong, and maintain a bias toward concrete
          safeguards over vague promises. The benchmark is simple: users should be able to verify
          how decisions are made and maintain agency throughout the process.
        </p>
      </MarketingPage>
    </>
  );
}
