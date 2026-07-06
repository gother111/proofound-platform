import {
  Body,
  Button,
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

interface DeletionScheduledProps {
  scheduledDate: Date;
  settingsUrl: string;
}

export const DeletionScheduled = ({ scheduledDate, settingsUrl }: DeletionScheduledProps) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(scheduledDate);

  return (
    <Html>
      <Head />
      <Preview>Your Proofound account deletion request is being processed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Account Deletion Request Received</Heading>
          <Text style={text}>
            We&apos;ve received your request to delete your Proofound account. Proofound processes
            account deletion as an immediate, irreversible lifecycle request.
          </Text>

          <Section style={warningBox}>
            <Text style={warningText}>
              Request recorded on <strong>{formattedDate}</strong>
            </Text>
          </Section>

          <Text style={text}>
            <strong>What will be deleted:</strong>
          </Text>
          <Text style={listText}>
            • Profile and account identity fields
            <br />
            • Proof Packs, proof items, and public portfolio projections
            <br />
            • Matching, intro, reveal, interview, and decision records where they identify you
            <br />• Preferences, settings, and account activity that are not legally retained
          </Text>

          <Text style={text}>
            Limited metadata may be retained only when required for legal compliance, fraud
            prevention, security, or audit obligations, and is minimized where possible.
          </Text>

          <Hr style={divider} />

          <Text style={text}>
            <strong>Need to review account privacy settings?</strong> Use the settings link below
            while your authenticated session is still available.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={settingsUrl}>
              Review Privacy Settings
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this link in your browser:{' '}
            <Link href={settingsUrl} style={link}>
              {settingsUrl}
            </Link>
          </Text>

          <Text style={reminderText}>
            We do not support a scheduled cancellation window for account deletion.
          </Text>

          <Text style={footer}>
            If you didn&apos;t request account deletion, please contact our support team immediately
            at privacy@proofound.io
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default DeletionScheduled;

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

const h1 = {
  color: '#1C4D3A',
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: '32px',
  fontWeight: '600',
  lineHeight: '1.25',
  margin: '0 0 20px',
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

const warningBox = {
  backgroundColor: '#FFF9E6',
  border: '2px solid #FDB022',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const warningText = {
  color: '#2D3330',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  margin: '32px 0',
};

const button = {
  backgroundColor: '#1C4D3A',
  borderRadius: '8px',
  color: '#F7F6F1',
  fontSize: '16px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const link = {
  color: '#1C4D3A',
  textDecoration: 'underline',
};

const divider = {
  borderColor: '#D4D4D0',
  margin: '32px 0',
};

const reminderText = {
  color: '#2D3330',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '20px 0',
  padding: '12px',
  backgroundColor: '#E8F5F0',
  borderRadius: '6px',
};

const footer = {
  color: '#6B706B',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '32px',
};
