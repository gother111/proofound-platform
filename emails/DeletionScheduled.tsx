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
  cancellationUrl: string;
}

export const DeletionScheduled = ({ scheduledDate, cancellationUrl }: DeletionScheduledProps) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(scheduledDate);

  return (
    <Html>
      <Head />
      <Preview>Your Proofound account deletion has been scheduled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Account Deletion Scheduled</Heading>
          <Text style={text}>
            We&apos;ve received your request to delete your Proofound account. Your account is scheduled
            for permanent deletion on <strong>{formattedDate}</strong>.
          </Text>

          <Section style={warningBox}>
            <Text style={warningText}>
              🕒 You have <strong>30 days</strong> to cancel this request
            </Text>
          </Section>

          <Text style={text}>
            <strong>What will be deleted:</strong>
          </Text>
          <Text style={listText}>
            • Your profile information (name, bio, photo)
            <br />
            • Your matches and connections
            <br />
            • Your messages and conversations
            <br />
            • Your preferences and settings
            <br />
            • Your activity history
          </Text>

          <Text style={text}>
            Some data may be retained for 90 days for legal compliance and fraud prevention, after
            which it will be permanently deleted.
          </Text>

          <Hr style={divider} />

          <Text style={text}>
            <strong>Changed your mind?</strong> You can cancel this deletion request at any time
            within the next 30 days.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={cancellationUrl}>
              Cancel Deletion
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this link in your browser:{' '}
            <Link href={cancellationUrl} style={link}>
              {cancellationUrl}
            </Link>
          </Text>

          <Text style={reminderText}>
            📧 We&apos;ll send you a reminder email 7 days before your account is deleted.
          </Text>

          <Text style={footer}>
            If you didn&apos;t request account deletion, please contact our support team immediately
            at privacy@proofound.com
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

