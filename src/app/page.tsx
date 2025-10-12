import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-secondary-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-display font-semibold text-primary-500 mb-6">
          Proofound
        </h1>
        <p className="text-2xl md:text-3xl font-display text-neutral-dark-700 mb-4">
          Focus on what matters
        </p>
        <p className="text-lg text-neutral-dark-500 max-w-2xl mx-auto mb-12">
          A credibility and connection platform built for authenticity, not algorithms.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Join Proofound</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-display font-semibold text-center text-primary-500 mb-8">
          The Problem
        </h2>
        <p className="text-lg text-center text-neutral-dark-600 max-w-3xl mx-auto mb-12">
          Professional profiles have become cluttered, biased, and exhausting.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            'Signal lost in noise',
            'Credential inflation',
            'Wasted time verifying',
            'Mental health toll',
          ].map((item) => (
            <div key={item} className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-neutral-dark-700 font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-display font-semibold text-center text-primary-500 mb-4">
          Proof-first Profiles
        </h2>
        <p className="text-xl text-center text-neutral-dark-600 max-w-2xl mx-auto mb-16">
          Show your work. Build trust. Connect with purpose.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-primary-50 p-8 rounded-xl">
            <h3 className="text-2xl font-display font-medium text-primary-700 mb-4">
              For Individuals
            </h3>
            <p className="text-neutral-dark-600">
              Build a credible profile backed by verifiable achievements.
            </p>
          </div>
          <div className="bg-accent-50 p-8 rounded-xl">
            <h3 className="text-2xl font-display font-medium text-accent-700 mb-4">
              For Organizations
            </h3>
            <p className="text-neutral-dark-600">
              Showcase your team, mission, and impact transparently.
            </p>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-display font-semibold text-center text-primary-500 mb-12">
          Guiding Principles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { title: 'Privacy by design', desc: 'Your data, your control' },
            { title: 'Steward-owned', desc: 'Governed for the long term' },
            { title: 'Anti-bias guardrails', desc: 'Fair and inclusive by default' },
          ].map((principle) => (
            <div key={principle.title} className="text-center">
              <h3 className="text-xl font-semibold text-primary-600 mb-2">{principle.title}</h3>
              <p className="text-neutral-dark-600">{principle.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-light-300 py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-dark-500">
              &copy; 2025 Proofound. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/legal/privacy"
                className="text-sm text-neutral-dark-600 hover:text-primary-500"
              >
                Privacy
              </Link>
              <Link
                href="/legal/terms"
                className="text-sm text-neutral-dark-600 hover:text-primary-500"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
