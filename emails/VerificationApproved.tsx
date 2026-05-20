import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
} from '@react-email/components';

interface VerificationApprovedProps {
  recipientName: string;
  verificationType: 'linkedin' | 'work-email' | 'veriff';
  viewProfileUrl: string;
}

export default function VerificationApproved({
  recipientName,
  verificationType,
  viewProfileUrl,
}: VerificationApprovedProps) {
  const verificationTypeLabel = {
    linkedin: 'LinkedIn Profile',
    'work-email': 'Work Email',
    veriff: 'Identity (Veriff)',
  }[verificationType];

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Proofound</Text>
          </Section>

          <Section style={content}>
            <Section style={badgeContainer}>
              <Text style={badge}>✓ Verified</Text>
            </Section>

            <Text style={heading}>Verification Approved!</Text>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              Great news! Your <strong>{verificationTypeLabel}</strong> verification has been
              approved.
            </Text>

            <Section style={successBox}>
              <Text style={successIcon}>✓</Text>
              <Text style={successTitle}>Verification Complete</Text>
              <Text style={successText}>
                Your {verificationTypeLabel} has been successfully verified and is now active on
                your Proofound profile.
              </Text>
            </Section>

            <Text style={paragraph}>
              This verification strengthens your profile credibility and helps organizations read
              your proof with more context.
            </Text>

            <Text style={benefitsList}>
              ✓ <strong>Build trust:</strong> Show that this verification signal has been checked
              <br />
              <br />✓ <strong>Support proof review:</strong> Give organizations clearer context
              around the proof and experience you choose to share
              <br />
              <br />✓ <strong>Keep control:</strong> Your profile visibility and proof sharing stay
              privacy staged
              <br />
              <br />✓ <strong>Stay ready:</strong> Keep your profile easier to review when you are
              intro eligible
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={viewProfileUrl}>
                View Your Profile
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={infoText}>
              <strong>What&apos;s next?</strong>
            </Text>

            <Text style={infoText}>
              {verificationType === 'linkedin' && (
                <>
                  Keep your profile and Proof Packs current so this signal supports your review
                  context:
                  <br />
                  • Add recent proof tied to real work
                  <br />• Review your public portfolio visibility
                </>
              )}

              {verificationType === 'work-email' && (
                <>
                  Keep your profile and Proof Packs current so this signal supports your review
                  context:
                  <br />
                  • Add recent proof tied to real work
                  <br />• Review your public portfolio visibility
                </>
              )}

              {verificationType === 'veriff' && (
                <>
                  Keep your profile and Proof Packs current so this signal supports your review
                  context:
                  <br />
                  • Add recent proof tied to real work
                  <br />• Review your public portfolio visibility
                </>
              )}
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              Your verified status is displayed on your profile with a verification badge. It is a
              trust signal, not an automated score, rank, or hiring recommendation.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Proofound. All rights reserved.
            </Text>
            <Text style={footerSmall}>
              <Link href={`${viewProfileUrl}?tab=settings`} style={unsubscribeLink}>
                Manage email preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f5f3ee',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  fontSize: '32px',
  fontWeight: '600',
  color: '#7a9278',
  margin: '0',
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '12px',
  border: '2px solid #e8e5dc',
};

const badgeContainer = {
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const badge = {
  display: 'inline-block',
  backgroundColor: '#d1fae5',
  color: '#065f46',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  padding: '6px 12px',
  borderRadius: '4px',
  letterSpacing: '0.5px',
  margin: '0',
};

const heading = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#2c3e2c',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '0 0 16px 0',
};

const successBox = {
  backgroundColor: '#d1fae5',
  padding: '32px 24px',
  borderRadius: '12px',
  margin: '24px 0',
  border: '2px solid #10b981',
  textAlign: 'center' as const,
};

const successIcon = {
  fontSize: '48px',
  color: '#059669',
  margin: '0 0 16px 0',
};

const successTitle = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#065f46',
  margin: '0 0 8px 0',
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const successText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#047857',
  margin: '0',
};

const benefitsList = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#4a5568',
  margin: '16px 0 24px 0',
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '8px',
  borderLeft: '4px solid #10b981',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#5c8b89',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const infoText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6b7280',
  margin: '0 0 12px 0',
};

const hr = {
  borderColor: '#e8e5dc',
  margin: '24px 0',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  margin: '0',
  textAlign: 'center' as const,
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const footerSmall = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#9ca3af',
  margin: '0 0 8px 0',
};

const unsubscribeLink = {
  color: '#7a9278',
  textDecoration: 'underline',
};
