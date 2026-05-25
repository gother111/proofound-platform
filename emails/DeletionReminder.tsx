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
} from '@react-email/components';
import * as React from 'react';

interface DeletionReminderProps {
  scheduledDate: Date;
  daysRemaining: number;
  settingsUrl: string;
}

export const DeletionReminder = ({
  scheduledDate,
  daysRemaining: _daysRemaining,
  settingsUrl,
}: DeletionReminderProps) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(scheduledDate);

  return (
    <Html>
      <Head />
      <Preview>Your Proofound account deletion request is in progress</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={urgentBox}>
            <Heading style={urgentHeading}>Deletion Request In Progress</Heading>
            <Text style={urgentText}>
              Your Proofound account deletion request was recorded for processing on{' '}
              <strong>{formattedDate}</strong>.
            </Text>
          </Section>

          <Heading style={h1}>Account Deletion Update</Heading>

          <Text style={text}>
            This is an account deletion status email. Proofound processes account deletion as an
            immediate, irreversible lifecycle request, so there is no scheduled cancellation window.
          </Text>

          <Text style={text}>
            <strong>What happens next:</strong>
          </Text>
          <Text style={listText}>
            • Profile and account identity fields are removed or anonymized
            <br />
            • Proof Packs, proof items, and public portfolio projections are removed
            <br />
            • Matching, intro, reveal, interview, and decision records are minimized where they
            identify you
            <br />• This action cannot be undone after the deletion date
          </Text>

          <Section style={actionBox}>
            <Text style={actionText}>
              <strong>Need to check privacy settings?</strong>
            </Text>
            <Text style={actionSubtext}>
              Use the authenticated settings page while your session is still available.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={settingsUrl}>
                Review Privacy Settings
              </Button>
            </Section>
          </Section>

          <Text style={text}>
            Or copy and paste this link in your browser:{' '}
            <Link href={settingsUrl} style={link}>
              {settingsUrl}
            </Link>
          </Text>

          <Text style={supportText}>
            <strong>Need help?</strong> Contact our support team at{' '}
            <Link href="mailto:privacy@proofound.io" style={link}>
              privacy@proofound.io
            </Link>
          </Text>

          <Text style={footer}>
            If you intended to delete your account, no action is needed. For privacy questions,
            contact privacy@proofound.io.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default DeletionReminder;

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

const urgentBox = {
  backgroundColor: '#FFF4F4',
  border: '2px solid #F87171',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 0 32px',
  textAlign: 'center' as const,
};

const urgentHeading = {
  color: '#DC2626',
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: '28px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const urgentText = {
  color: '#2D3330',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
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

const actionBox = {
  backgroundColor: '#E8F5F0',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const actionText = {
  color: '#1C4D3A',
  fontSize: '18px',
  margin: '0 0 8px',
};

const actionSubtext = {
  color: '#2D3330',
  fontSize: '15px',
  margin: '0 0 20px',
};

const buttonContainer = {
  margin: '20px 0 0',
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

const supportText = {
  color: '#2D3330',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '24px 0',
  padding: '12px',
  backgroundColor: '#FFF9E6',
  borderRadius: '6px',
};

const footer = {
  color: '#6B706B',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '32px',
};
