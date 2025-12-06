import { Body, Button, Container, Head, Html, Section, Text } from '@react-email/components';

type ReferralInviteProps = {
  referrerName: string;
  ctaUrl: string;
  referralType: 'platform' | 'assignment';
  assignmentTitle?: string;
  message?: string;
};

export default function ReferralInviteEmail({
  referrerName,
  ctaUrl,
  referralType,
  assignmentTitle,
  message,
}: ReferralInviteProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Proofound</Text>
          </Section>

          <Section style={content}>
            <Text style={eyebrow}>Referral invite</Text>
            <Text style={heading}>You&apos;re invited by {referrerName}</Text>

            {referralType === 'assignment' && assignmentTitle && (
              <Text style={paragraph}>
                They think you could be a great fit for “{assignmentTitle}”. Take a look and join
                with their referral link.
              </Text>
            )}

            {referralType === 'platform' && (
              <Text style={paragraph}>
                They want you to explore opportunities on Proofound. Join with their link so we can
                attribute the invite.
              </Text>
            )}

            {message && (
              <Text
                style={{
                  ...paragraph,
                  backgroundColor: '#f5f3ee',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                “{message}”
              </Text>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href={ctaUrl}>
                Open referral link
              </Button>
            </Section>

            <Text style={footnote}>
              If the button doesn&apos;t work, copy this link into your browser:
              <br />
              {ctaUrl}
            </Text>
          </Section>

          <Text style={footer}>© {new Date().getFullYear()} Proofound</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f8f7f4',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '24px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  maxWidth: '600px',
  border: '1px solid #e7e2d9',
};

const header = { marginBottom: '12px' };
const logo = { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 };
const content = { marginTop: '8px' };
const eyebrow = {
  fontSize: '12px',
  color: '#6b7280',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};
const heading = { fontSize: '22px', fontWeight: 700, color: '#111827', margin: '6px 0' };
const paragraph = { fontSize: '14px', color: '#374151', lineHeight: '1.5' };
const buttonContainer = { marginTop: '16px', marginBottom: '12px' };
const button = {
  backgroundColor: '#0f766e',
  color: '#ffffff',
  fontSize: '14px',
  padding: '12px 16px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600,
};
const footnote = { fontSize: '12px', color: '#6b7280', lineHeight: 1.4 };
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '16px', textAlign: 'center' };
