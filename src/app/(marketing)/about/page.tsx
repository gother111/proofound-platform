import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

export const metadata: Metadata = buildPublicMetadata({
  title: 'About Proofound | Trust-first expertise platform',
  description:
    'Learn why Proofound replaces resume noise with verifiable signals, transparent matching, and consent-first collaboration workflows built for long-term trust.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <MarketingPage
      title="About Proofound"
      description="Proofound connects organizations with verified expertise while keeping privacy, consent, and fairness at the center."
    >
      <p className="text-base leading-relaxed text-muted-foreground">
        We replace CV keyword noise with proof-backed expertise: skills, outcomes, methods, and
        values/causes. The goal is faster, values-aligned introductions that reduce bias and shorten
        time-to-first qualified intro and time-to-value.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Privacy and consent are default. There is no social feed or engagement vanity—just
        transparent guardrails, fairness checks, and user-controlled visibility so both individuals
        and organizations can act with confidence.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        We focus on durable credibility. Every profile artifact is designed to be legible,
        auditable, and portable so people can present real work in context, not just self-reported
        claims. Organizations gain decision support with explainable scoring inputs, while
        individuals retain meaningful control over when and how sensitive information becomes
        visible.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Our operating model favors accountability over growth hacks. We continuously review policy,
        accessibility, and security outcomes to keep the platform safe and useful. The result is a
        calmer hiring and collaboration experience where capability, values, and trust are easier to
        assess from the first interaction.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        We also invest in operational clarity for teams adopting Proofound. Public documentation,
        explicit policy versions, and transparent release practices help users understand not only
        what the product does, but why it behaves the way it does. That clarity makes onboarding
        faster, supports better governance conversations, and reduces surprises when organizations
        scale usage across multiple teams.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        We believe trustworthy platforms are built through disciplined iteration. That means
        measuring real-world outcomes, publishing meaningful improvements, and keeping interfaces
        clear for people who need to make high-stakes decisions under time pressure.
      </p>
    </MarketingPage>
  );
}
