import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credibility engineering for impactful connections',
  description:
    'Build a profile backed by evidence, not vanity metrics. Match with individuals and organizations that share your mission.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Proofound',
    description:
      'Build a profile backed by evidence, not vanity metrics. Match with individuals and organizations that share your mission.',
    url: '/',
    siteName: 'Proofound',
    type: 'website',
    images: [
      {
        url: '/hero-visual.jpg',
        width: 1200,
        height: 630,
        alt: 'Proofound landing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proofound',
    description:
      'Build a profile backed by evidence, not vanity metrics. Match with individuals and organizations that share your mission.',
    images: ['/hero-visual.jpg'],
  },
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-20 md:px-12">
      <section className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm md:p-14">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Proofound
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-6xl">
          Credibility engineering for impactful connections
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Build a profile backed by evidence, not vanity metrics. Match with individuals and
          organizations that share your mission.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/signup?type=individual"
            className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Join as an Individual
          </Link>
          <Link
            href="/signup?type=organization"
            className="rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground hover:bg-muted/60"
          >
            Join as an Organization
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground hover:bg-muted/60"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <h2 className="text-base font-semibold text-foreground">Profile and Proof</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Capture skills, experience, and verification evidence in a shareable profile.
          </p>
        </article>
        <article className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <h2 className="text-base font-semibold text-foreground">Matching and Interest</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Find aligned people and organizations with transparent matching and gated visibility.
          </p>
        </article>
        <article className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <h2 className="text-base font-semibold text-foreground">Public Sharing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Publish portfolio links at <code>/portfolio/{'{handle}'}</code> and token shares at{' '}
            <code>/p/{'{token}'}</code>.
          </p>
        </article>
      </section>
    </main>
  );
}
