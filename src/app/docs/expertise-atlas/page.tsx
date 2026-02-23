import Link from 'next/link';
import { BookOpen, CheckCircle2, Shield, Target } from 'lucide-react';

export const dynamic = 'force-static';

export default function ExpertiseAtlasDocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <header className="mb-8 rounded-xl border border-[#E8E6DD] bg-[#F7F6F1] p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8D2C8] bg-white px-3 py-1 text-xs font-medium text-[#2D3330]">
          <BookOpen className="h-3.5 w-3.5" />
          Expertise Atlas
        </div>
        <h1 className="text-3xl font-semibold text-[#2D3330]">Expertise Atlas Guide</h1>
        <p className="mt-2 text-sm text-[#6B6760]">
          Manage your skills in one place, understand your gaps, and improve matching quality.
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-[#E8E6DD] bg-white p-6">
        <h2 className="mb-3 text-xl font-semibold text-[#2D3330]">How it works</h2>
        <ul className="space-y-3 text-sm text-[#2D3330]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1C4D3A]" />
            Add and maintain your skills in Atlas. This is your single source of truth.
          </li>
          <li className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 text-[#1C4D3A]" />
            Matching reads your Atlas skills directly. No duplicate skill setup is required.
          </li>
          <li className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-4 w-4 text-[#1C4D3A]" />
            Use the Skill Gaps page to prioritize what to learn next.
          </li>
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 text-[#1C4D3A]" />
            You control proof and verification visibility from your profile settings.
          </li>
        </ul>
      </section>

      <section className="mb-6 rounded-xl border border-[#E8E6DD] bg-white p-6">
        <h2 className="mb-3 text-xl font-semibold text-[#2D3330]">Recommended flow</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[#2D3330]">
          <li>Add core skills and set realistic proficiency levels.</li>
          <li>Attach proofs and request verification for your strongest skills.</li>
          <li>Open Skill Gaps and focus on the top high-impact gaps first.</li>
          <li>Return to Matching and review updated opportunities.</li>
        </ol>
      </section>

      <section className="rounded-xl border border-[#E8E6DD] bg-white p-6">
        <h2 className="mb-3 text-xl font-semibold text-[#2D3330]">Quick links</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/app/i/expertise"
            className="rounded-lg border border-[#D8D2C8] px-3 py-2 text-[#1C4D3A] hover:bg-[#EEF1EA]"
          >
            Open Expertise Atlas
          </Link>
          <Link
            href="/app/i/skill-gaps"
            className="rounded-lg border border-[#D8D2C8] px-3 py-2 text-[#1C4D3A] hover:bg-[#EEF1EA]"
          >
            Open Skill Gaps
          </Link>
          <Link
            href="/app/i/matching"
            className="rounded-lg border border-[#D8D2C8] px-3 py-2 text-[#1C4D3A] hover:bg-[#EEF1EA]"
          >
            Open Matching
          </Link>
        </div>
      </section>
    </main>
  );
}
