import Link from 'next/link';
import { BookOpen, CheckCircle2, Shield, Target } from 'lucide-react';

export const dynamic = 'force-static';

export default function ExpertiseAtlasDocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <header className="mb-8 rounded-xl border border-proofound-stone bg-japandi-bg p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          Expertise Atlas
        </div>
        <h1 className="text-3xl font-semibold text-foreground">Expertise Atlas Guide</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your skills in one place, understand your gaps, and improve matching quality.
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-proofound-stone bg-white p-6">
        <h2 className="mb-3 text-xl font-semibold text-foreground">How it works</h2>
        <ul className="space-y-3 text-sm text-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-proofound-forest" />
            Add and maintain your skills in Atlas. This is your single source of truth.
          </li>
          <li className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 text-proofound-forest" />
            Matching reads your Atlas skills directly. No duplicate skill setup is required.
          </li>
          <li className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-4 w-4 text-proofound-forest" />
            Use the Gap Analysis tab in Expertise Atlas to prioritize what to learn next.
          </li>
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 text-proofound-forest" />
            You control proof and verification visibility from your profile settings.
          </li>
        </ul>
      </section>

      <section className="mb-6 rounded-xl border border-proofound-stone bg-white p-6">
        <h2 className="mb-3 text-xl font-semibold text-foreground">Recommended flow</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
          <li>Add core skills and set realistic proficiency levels.</li>
          <li>Attach proofs and request verification for your strongest skills.</li>
          <li>Open Gap Analysis and focus on the top high-impact gaps first.</li>
          <li>Return to Matching and review updated opportunities.</li>
        </ol>
      </section>

      <section className="rounded-xl border border-proofound-stone bg-white p-6">
        <h2 className="mb-3 text-xl font-semibold text-foreground">Quick links</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/app/i/portfolio"
            className="rounded-lg border border-border px-3 py-2 text-proofound-forest hover:bg-proofound-forest/5"
          >
            Open Public Portfolio
          </Link>
          <Link
            href="/app/i/verifications"
            className="rounded-lg border border-border px-3 py-2 text-proofound-forest hover:bg-proofound-forest/5"
          >
            Open Verifications
          </Link>
          <Link
            href="/app/i/matching"
            className="rounded-lg border border-border px-3 py-2 text-proofound-forest hover:bg-proofound-forest/5"
          >
            Open Matching
          </Link>
        </div>
      </section>
    </main>
  );
}
