import { ReferralDashboard } from '@/components/referrals/ReferralDashboard';

/**
 * Individual referrals page.
 * Shows sent/received referrals, shareable links, and acceptance flow.
 */
export default function ReferralsPage() {
  return (
    <div className="p-6 space-y-6">
      <ReferralDashboard />
    </div>
  );
}
