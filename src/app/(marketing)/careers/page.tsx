import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

export const metadata: Metadata = buildPublicMetadata({
  title: 'Careers at Proofound | Build trusted infrastructure',
  description:
    'Explore careers at Proofound and help build a privacy-first platform for trustworthy professional evidence, fair matching, and accountable collaboration.',
  path: '/careers',
});

export default function CareersPage() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/careers',
    title: 'Careers at Proofound | Build trusted infrastructure',
    description:
      'Explore careers at Proofound and help build a privacy-first platform for trustworthy professional evidence, fair matching, and accountable collaboration.',
  });

  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="careers-jsonld" />
      <MarketingPage
        title="Careers at Proofound"
        description="We are a distributed team focused on security, fairness, and consent-first experiences."
      >
        <p className="text-base leading-relaxed text-muted-foreground">
          We build trusted expertise infrastructure: proof-backed profiles, values-aware matching,
          and bias-aware guardrails. If you care about privacy-first, ethical matching, and
          measurable outcomes like faster time-to-first qualified intro, we would love to hear from
          you.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          Roles open periodically across engineering, data, product, security, and customer
          experience. Tell us your background and why trustworthy expertise matters to you.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          We work in small cross-functional teams with clear ownership, measurable goals, and direct
          user feedback loops. You can expect practical collaboration across product, policy, and
          engineering, with strong emphasis on reliability, accessibility, and privacy outcomes. We
          value people who ship thoughtfully, communicate clearly, and improve systems over time.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          To express interest, share examples of work that demonstrate depth, integrity, and
          user-centric thinking. Include projects where you reduced risk, improved quality, or made
          complex workflows more understandable for real users. We review every submission and keep
          a talent pipeline for future openings.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          Our hiring process is structured to reduce ambiguity and bias. You can expect clear role
          scopes, practical conversations with future collaborators, and transparent next steps
          after each stage. We prioritize signal over performance theater and value thoughtful
          problem framing as much as implementation speed.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          We support continuous growth with explicit feedback loops, mentoring, and project
          ownership that stretches both technical and product judgment. Career progression is tied
          to impact, collaboration quality, and stewardship of user trust, not to internal
          visibility alone.
        </p>
      </MarketingPage>
    </>
  );
}
