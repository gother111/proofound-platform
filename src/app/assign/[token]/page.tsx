import { StakeholderAssignmentForm } from '@/components/assignments/StakeholderAssignmentForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function StakeholderAssignmentPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-proofound-parchment">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-['Crimson_Pro'] font-semibold text-proofound-forest mb-2">
            Profile Assignment
          </h1>
          <p className="text-proofound-charcoal/70">
            You've been invited to help complete an organization profile
          </p>
        </div>

        <StakeholderAssignmentForm token={token} />
      </div>
    </div>
  );
}
