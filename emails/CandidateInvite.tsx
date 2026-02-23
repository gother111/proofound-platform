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

interface CandidateInviteProps {
  orgName: string;
  inviteUrl: string;
  expiryDays: number;
}

export const CandidateInvite = ({ orgName, inviteUrl, expiryDays }: CandidateInviteProps) => (
  <Html>
    <Head />
    <Preview>{orgName} invited you to share your Proof Card</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You are invited to share your Proof Card</Heading>
        <Text style={text}>
          <strong>{orgName}</strong> invited you to join their hiring flow on Proofound.
        </Text>
        <Text style={text}>
          Create your Proof Card to share structured evidence of your skills and experience instead
          of sending a traditional CV.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={inviteUrl}>
            Open invite
          </Button>
        </Section>
        <Text style={text}>
          Or copy this link into your browser:{' '}
          <Link href={inviteUrl} style={link}>
            {inviteUrl}
          </Link>
        </Text>
        <Text style={text}>
          <strong>This invite expires in {expiryDays} days.</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CandidateInvite;

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
