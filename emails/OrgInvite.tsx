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

interface OrgInviteProps {
  orgName: string;
  role: string;
  inviteUrl: string;
}

export const OrgInvite = ({ orgName, role, inviteUrl }: OrgInviteProps) => (
  <Html>
    <Head />
    <Preview>You&apos;ve been invited to join {orgName} on Proofound</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You&apos;ve been invited!</Heading>
        <Text style={text}>
          You&apos;ve been invited to join <strong>{orgName}</strong> on Proofound as a{' '}
          <strong>{role}</strong>.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={inviteUrl}>
            Accept Invitation
          </Button>
        </Section>
        <Text style={text}>
          Or copy and paste this link in your browser:{' '}
          <Link href={inviteUrl} style={link}>
            {inviteUrl}
          </Link>
        </Text>
        <Text style={text}>
          <strong>This invitation will expire in 7 days.</strong>
        </Text>
        <Text style={footer}>
          If you weren&apos;t expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OrgInvite;

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

const footer = {
  color: '#6B706B',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '32px',
};
