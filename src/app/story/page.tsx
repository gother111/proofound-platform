import type { Metadata } from 'next';
import { StoryLanding } from '@/components/landing/StoryLanding';

export const metadata: Metadata = {
  title: 'Proofound Story | Proof Behind the Claim',
  description:
    'The original Proofound scrollytelling page, preserved as an unlinked story route for review.',
  alternates: { canonical: '/story' },
};

export default function StoryPage() {
  return <StoryLanding />;
}
