import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RefereeVerification } from "@/components/RefereeVerification";

export const metadata: Metadata = {
  title: "Verify Claim | Proofound",
  description: "Verify a professional claim",
};

interface VerifyPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch verification request by token
  const { data: verificationRequest, error: requestError } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('verification_token', token)
    .single();

  if (requestError || !verificationRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
        <div className="text-center p-8">
          <h1 className="text-2xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
            Invalid or Expired Link
          </h1>
          <p style={{ color: '#6B6760' }}>
            This verification link is no longer valid or has expired.
          </p>
        </div>
      </div>
    );
  }

  // Check if already verified
  if (verificationRequest.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
        <div className="text-center p-8">
          <h1 className="text-2xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
            Already Verified
          </h1>
          <p style={{ color: '#6B6760' }}>
            This claim has already been verified.
          </p>
        </div>
      </div>
    );
  }

  // Check if token is expired
  const expiresAt = new Date(verificationRequest.token_expires_at);
  if (expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
        <div className="text-center p-8">
          <h1 className="text-2xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
            Link Expired
          </h1>
          <p style={{ color: '#6B6760' }}>
            This verification link has expired. Please contact the requester for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the proof
  const { data: proof, error: proofError } = await supabase
    .from('proofs')
    .select('*')
    .eq('id', verificationRequest.proof_id)
    .single();

  if (proofError || !proof) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
        <div className="text-center p-8">
          <h1 className="text-2xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
            Proof Not Found
          </h1>
          <p style={{ color: '#6B6760' }}>
            The proof associated with this verification request could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the requester profile
  const { data: requester, error: requesterError } = await supabase
    .from('profiles')
    .select('id, full_name, tagline, avatar_url')
    .eq('id', verificationRequest.requester_id)
    .single();

  if (requesterError || !requester) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
        <div className="text-center p-8">
          <h1 className="text-2xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
            Requester Not Found
          </h1>
          <p style={{ color: '#6B6760' }}>
            The person who requested this verification could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RefereeVerification
      verificationRequest={verificationRequest}
      proof={proof}
      requester={requester}
    />
  );
}

