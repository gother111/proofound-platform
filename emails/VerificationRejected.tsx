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

interface VerificationRejectedProps {
  recipientName: string;
  verificationType: 'linkedin' | 'work-email' | 'veriff';
  rejectionReason?: string;
  retryUrl: string;
}

export default function VerificationRejected({
  recipientName,
  verificationType,
  rejectionReason,
  retryUrl,
}: VerificationRejectedProps) {
  const verificationTypeLabel = {
    linkedin: 'LinkedIn Profile',
    'work-email': 'Work Email',
    veriff: 'Identity (Veriff)',
  }[verificationType];

  const getDefaultReason = () => {
    switch (verificationType) {
      case 'linkedin':
        return 'This LinkedIn check could not be completed. LinkedIn checks are not required for the launch corridor and do not create proof trust by themselves.';
      case 'work-email':
        return 'The work email domain could not be confirmed for this account-side trust signal.';
      case 'veriff':
        return 'This identity check could not be completed. Identity checks are not required for the launch corridor and do not create proof trust by themselves.';
      default:
        return 'We were unable to complete your verification at this time.';
    }
  };

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
              <Text style={badge}>Action Required</Text>
            </Section>

            <Text style={heading}>Verification Not Approved</Text>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              We were unable to approve your <strong>{verificationTypeLabel}</strong> verification
              at this time.
            </Text>

            <Section style={warningBox}>
              <Text style={warningIcon}>ℹ️</Text>
              <Text style={warningTitle}>Why this happened:</Text>
              <Text style={warningText}>{rejectionReason || getDefaultReason()}</Text>
            </Section>

            <Text style={paragraph}>
              You can review the account-side verification status in settings. This does not remove
              your Proof Packs or public portfolio.
            </Text>

            <Hr style={hr} />

            <Text style={infoText}>
              <strong>What you can do:</strong>
            </Text>

            {verificationType === 'linkedin' && (
              <Text style={benefitsList}>
                <strong>1. No launch-active action is required:</strong>
                <br />
                • LinkedIn checks are outside the launch corridor
                <br />
                • Any older LinkedIn signal remains account-side history only
                <br />
                • It does not create public proof trust or intro eligibility by itself
                <br />
                <br />
                <strong>2. Keep Proof Packs current:</strong>
                <br />
                Add recent proof tied to real work and review your portfolio visibility
                <br />
                <br />
                <strong>3. Use work email if relevant:</strong>
                <br />
                Work email is the launch-active account-side check
              </Text>
            )}

            {verificationType === 'work-email' && (
              <Text style={benefitsList}>
                <strong>1. Check your work email:</strong>
                <br />
                • Use an email from your company domain (not Gmail, Yahoo, etc.)
                <br />
                • Ensure the domain matches your stated employer
                <br />
                • Check spam folder for verification email
                <br />
                <br />
                <strong>2. Try again:</strong>
                <br />
                Request a new verification email
                <br />
                <br />
                <strong>3. Keep proof context current:</strong>
                <br />
                Work email is a trust signal only; your Proof Packs and portfolio carry the review
                context
              </Text>
            )}

            {verificationType === 'veriff' && (
              <Text style={benefitsList}>
                <strong>1. No launch-active action is required:</strong>
                <br />
                • Identity checks are outside the required launch corridor
                <br />
                • They do not create public proof trust or intro eligibility by themselves
                <br />
                • Your Proof Packs remain the review center
                <br />
                <br />
                <strong>2. Keep Proof Packs current:</strong>
                <br />
                Add recent proof tied to real work and review your portfolio visibility
                <br />
                <br />
                <strong>3. Use work email if relevant:</strong>
                <br />
                Work email is the launch-active account-side check
              </Text>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href={retryUrl}>
                Try Verification Again
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footerText}>
              <strong>Need help?</strong>
              <br />
              If you&apos;re having trouble with work email verification, review settings or contact
              support. Verification is a trust signal, not an automated score, rank, or workflow
              recommendation.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Proofound. All rights reserved.
            </Text>
            <Text style={footerSmall}>
              <Link href={retryUrl} style={unsubscribeLink}>
                Review verification settings
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
  backgroundColor: '#fef3c7',
  color: '#92400e',
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

const warningBox = {
  backgroundColor: '#fef3c7',
  padding: '24px',
  borderRadius: '12px',
  margin: '24px 0',
  border: '2px solid #fbbf24',
  textAlign: 'center' as const,
};

const warningIcon = {
  fontSize: '32px',
  margin: '0 0 12px 0',
};

const warningTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 8px 0',
};

const warningText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#78350f',
  margin: '0',
};

const benefitsList = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '16px 0 24px 0',
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '8px',
  borderLeft: '4px solid #fbbf24',
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
  fontSize: '16px',
  lineHeight: '22px',
  color: '#2c3e2c',
  margin: '0 0 12px 0',
  fontWeight: '600',
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
