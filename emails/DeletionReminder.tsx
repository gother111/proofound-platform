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
  cancellationUrl: string;
}

export const DeletionReminder = ({
  scheduledDate,
  daysRemaining,
  cancellationUrl,
}: DeletionReminderProps) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(scheduledDate);

  return (
    <Html>
      <Head />
      <Preview>{daysRemaining} days until your Proofound account is deleted</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={urgentBox}>
            <Heading style={urgentHeading}>⏰ {daysRemaining} Days Remaining</Heading>
            <Text style={urgentText}>
              Your Proofound account will be permanently deleted on{' '}
              <strong>{formattedDate}</strong>
            </Text>
          </Section>

          <Heading style={h1}>Final Reminder: Account Deletion</Heading>

          <Text style={text}>
            This is a friendly reminder that you requested to delete your Proofound account. In{' '}
            <strong>{daysRemaining} days</strong>, your account and all associated data will be
            permanently anonymized.
          </Text>

          <Text style={text}>
            <strong>What happens next:</strong>
          </Text>
          <Text style={listText}>
            • All your profile information will be removed
            <br />
            • Your matches and connections will be deleted
            <br />
            • Your messages will be anonymized
            <br />• This action cannot be undone after the deletion date
          </Text>

          <Section style={actionBox}>
            <Text style={actionText}>
              <strong>Want to keep your account?</strong>
            </Text>
            <Text style={actionSubtext}>
              You can still cancel this deletion request. Just click the button below.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={cancellationUrl}>
                Cancel Deletion & Keep My Account
              </Button>
            </Section>
          </Section>

          <Text style={text}>
            Or copy and paste this link in your browser:{' '}
            <Link href={cancellationUrl} style={link}>
              {cancellationUrl}
            </Link>
          </Text>

          <Text style={supportText}>
            <strong>Need help?</strong> Contact our support team at{' '}
            <Link href="mailto:privacy@proofound.com" style={link}>
              privacy@proofound.com
            </Link>
          </Text>

          <Text style={footer}>
            If you intended to delete your account, no action is needed. Your account will be
            automatically deleted on the scheduled date.
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

