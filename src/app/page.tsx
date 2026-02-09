import { ProofoundLanding } from '@/components/ProofoundLanding';
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
  // Auth check disabled for debugging/verification of landing page
  return <ProofoundLanding />;
}
