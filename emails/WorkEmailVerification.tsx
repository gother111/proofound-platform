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

interface WorkEmailVerificationProps {
  verifyUrl: string;
  userName: string;
}

export default function WorkEmailVerification({
  verifyUrl,
  userName = 'there',
}: WorkEmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Proofound</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Verify Your Work Email</Text>
            
            <Text style={paragraph}>
              Hi {userName},
            </Text>

            <Text style={paragraph}>
              You requested to verify your work email address to unlock the verified badge on your Proofound profile.
            </Text>

            <Text style={paragraph}>
              Click the button below to complete your verification:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verifyUrl}>
                Verify Work Email
              </Button>
            </Section>

            <Text style={paragraph}>
              Or copy and paste this link into your browser:
            </Text>

            <Text style={link}>
              <Link href={verifyUrl} style={linkStyle}>
                {verifyUrl}
              </Link>
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              <strong>This link expires in 24 hours.</strong>
            </Text>

            <Text style={footerText}>
              Once verified, your profile will display a verified badge that helps organizations trust your identity and improves your match quality.
            </Text>

            <Text style={footerText}>
              If you didn't request this verification, you can safely ignore this email.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Proofound. All rights reserved.
            </Text>
            <Text style={footerSmall}>
              This is an automated message. Please do not reply to this email.
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

const heading = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#2c3e2c',
  margin: '0 0 24px 0',
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '0 0 16px 0',
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

const link = {
  fontSize: '14px',
  color: '#5c8b89',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const linkStyle = {
  color: '#5c8b89',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e8e5dc',
  margin: '24px 0',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  margin: '0 0 12px 0',
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

