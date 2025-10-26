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

interface VerifyEmailOrganizationProps {
  verifyUrl: string;
}

export const VerifyEmailOrganization = ({ verifyUrl }: VerifyEmailOrganizationProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Proofound! Verify your email to set up your organization</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Proofound!</Heading>
        <Text style={text}>
          Thanks for signing up as an Organization! Verify your email address to get started
          creating your organization profile on Proofound.
        </Text>
        <Text style={text}>Once verified, you&apos;ll be able to:</Text>
        <ul style={list}>
          <li>Create your organization profile and showcase your mission</li>
          <li>Post opportunities and find the right team members</li>
          <li>Build trust through verifications and impact stories</li>
          <li>Connect with partners and collaborators</li>
        </ul>
        <Section style={buttonContainer}>
          <Button style={button} href={verifyUrl}>
            Verify Email
          </Button>
        </Section>
        <Text style={text}>
          Or copy and paste this link in your browser:{' '}
          <Link href={verifyUrl} style={link}>
            {verifyUrl}
          </Link>
        </Text>
        <Text style={footer}>
          If you didn&apos;t create an account with Proofound, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerifyEmailOrganization;

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

const list = {
  color: '#2D3330',
  fontSize: '16px',
  lineHeight: '1.625',
  margin: '0 0 20px',
  paddingLeft: '20px',
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
