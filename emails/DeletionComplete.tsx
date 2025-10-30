import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface DeletionCompleteProps {
  userId: string;
}

export const DeletionComplete = ({ userId }: DeletionCompleteProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Proofound account has been deleted</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={successBox}>
            <Text style={successIcon}>✓</Text>
            <Heading style={successHeading}>Account Deletion Complete</Heading>
          </Section>

          <Text style={text}>
            Your Proofound account has been successfully deleted and anonymized as requested.
          </Text>

          <Heading style={h2}>What we deleted</Heading>
          <Text style={listText}>
            • Your profile information (name, email, bio, photo)
            <br />
            • Your matches and connections
            <br />
            • Your messages and conversations
            <br />
            • Your preferences and settings
            <br />• Your activity history
          </Text>

          <Hr style={divider} />

          <Heading style={h2}>Data Retention for Legal Compliance</Heading>
          <Text style={text}>
            For legal compliance and fraud prevention purposes, some anonymized metadata may be
            retained for up to <strong>90 days</strong>, after which it will be permanently deleted.
            This includes:
          </Text>
          <Text style={listText}>
            • Transaction records (anonymized)
            <br />
            • Security logs (anonymized)
            <br />• Compliance audit trails (anonymized)
          </Text>
          <Text style={text}>
            This data cannot be used to identify you and complies with GDPR Article 17 (Right to
            Erasure) requirements.
          </Text>

          <Hr style={divider} />

          <Section style={thanksBox}>
            <Heading style={h2}>Thank You</Heading>
            <Text style={text}>
              Thank you for being part of the Proofound community. We&apos;re sorry to see you go,
              but we respect your decision and privacy.
            </Text>
            <Text style={text}>
              If you&apos;d like to join Proofound again in the future, you&apos;re always welcome
              to create a new account at{' '}
              <Link href="https://proofound.com" style={link}>
                proofound.com
              </Link>
            </Text>
          </Section>

          <Text style={supportText}>
            <strong>Questions or concerns?</strong>
            <br />
            Contact our privacy team at{' '}
            <Link href="mailto:privacy@proofound.com" style={link}>
              privacy@proofound.com
            </Link>
          </Text>

          <Text style={footer}>
            This is a confirmation email only. No further action is required. Your account ID for
            reference: <code style={code}>{userId}</code>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default DeletionComplete;

const main = {
  backgroundColor: '#F7F6F1',
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
};

const successBox = {
  textAlign: 'center' as const,
  margin: '0 0 32px',
};

const successIcon = {
  fontSize: '48px',
  margin: '0 0 16px',
  display: 'block',
};

const successHeading = {
  color: '#1C4D3A',
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: '32px',
  fontWeight: '600',
  margin: '0',
};

const h2 = {
  color: '#1C4D3A',
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '24px 0 16px',
};

const text = {
  color: '#2D3330',
  fontSize: '16px',
  lineHeight: '1.625',
  margin: '0 0 20px',
};

const listText = {
  color: '#2D3330',
  fontSize: '16px',
  lineHeight: '1.75',
  margin: '0 0 20px',
  paddingLeft: '20px',
};

const divider = {
  borderColor: '#D4D4D0',
  margin: '32px 0',
};

const thanksBox = {
  backgroundColor: '#E8F5F0',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const link = {
  color: '#1C4D3A',
  textDecoration: 'underline',
};

const supportText = {
  color: '#2D3330',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#FFF9E6',
  borderRadius: '6px',
};

const code = {
  fontFamily: 'monospace',
  fontSize: '13px',
  backgroundColor: '#E5E5E0',
  padding: '2px 6px',
  borderRadius: '3px',
};

const footer = {
  color: '#6B706B',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '32px',
};

