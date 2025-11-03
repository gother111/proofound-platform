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

interface IdentityRevealedProps {
  recipientName: string;
  role: 'candidate' | 'organization';
  revealedName: string;
  roleTitle?: string;
  organizationName?: string;
  viewConversationUrl: string;
  viewProfileUrl: string;
}

export default function IdentityRevealed({
  recipientName,
  role,
  revealedName,
  roleTitle,
  organizationName,
  viewConversationUrl,
  viewProfileUrl,
}: IdentityRevealedProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Proofound</Text>
          </Section>

          <Section style={content}>
            <Section style={badgeContainer}>
              <Text style={badge}>Identity Revealed</Text>
            </Section>

            <Text style={heading}>Identities Have Been Revealed!</Text>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              Great news! Following your interview scheduling, both parties&apos; identities have
              been revealed. You can now communicate directly and view full profiles.
            </Text>

            <Section style={revealBox}>
              <Text style={revealTitle}>Now Connected With:</Text>
              <Text style={revealedNameText}>{revealedName}</Text>

              {role === 'candidate' && organizationName && (
                <Text style={revealSubtitle}>{organizationName}</Text>
              )}

              {roleTitle && <Text style={revealSubtitle}>{roleTitle}</Text>}

              <Hr style={innerHr} />

              <Text style={revealInfo}>
                You can now:
                <br />
                • View their complete profile and verified credentials
                <br />
                • See their contact information
                <br />
                • Communicate directly without anonymity
                <br />• Access all shared documents and references
              </Text>
            </Section>

            <Text style={paragraph}>
              This identity reveal was triggered by scheduling an interview. Both parties now have
              full visibility into each other&apos;s profiles and can engage in transparent
              communication.
            </Text>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={viewConversationUrl}>
                View Conversation
              </Button>
            </Section>

            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={viewProfileUrl}>
                View Their Profile
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={infoText}>
              <strong>What happens next?</strong>
            </Text>

            <Text style={infoText}>
              1. <strong>Continue the conversation:</strong> Discuss interview details, ask
              questions, and share relevant information
              <br />
              <br />
              2. <strong>Prepare for the interview:</strong> Review their profile, work history, and
              verified skills
              <br />
              <br />
              3. <strong>Stay professional:</strong> All communications are part of your Proofound
              history
              <br />
              <br />
              4. <strong>After the interview:</strong> You can provide feedback and potentially sign
              a contract attestation
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              <strong>Privacy Note</strong>
              <br />
              Identities are only revealed after both parties have committed to an interview. This
              ensures serious connections and protects your privacy throughout the matching process.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Proofound. All rights reserved.
            </Text>
            <Text style={footerSmall}>
              <Link href={`${viewConversationUrl}?action=settings`} style={unsubscribeLink}>
                Manage email preferences
              </Link>
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

const badgeContainer = {
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const badge = {
  display: 'inline-block',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  padding: '6px 12px',
  borderRadius: '4px',
  letterSpacing: '0.5px',
  margin: '0',
};

const heading = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#2c3e2c',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '0 0 16px 0',
};

const revealBox = {
  backgroundColor: '#fef3c7',
  padding: '24px',
  borderRadius: '12px',
  margin: '24px 0',
  border: '2px solid #fbbf24',
};

const revealTitle = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  fontWeight: '600',
};

const revealedNameText = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 4px 0',
  textAlign: 'center' as const,
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const revealSubtitle = {
  fontSize: '16px',
  color: '#78350f',
  margin: '0 0 4px 0',
  textAlign: 'center' as const,
};

const innerHr = {
  borderColor: '#fbbf24',
  margin: '16px 0',
  opacity: 0.5,
};

const revealInfo = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#78350f',
  margin: '0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0',
};

const primaryButton = {
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

const secondaryButton = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  color: '#5c8b89',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  border: '2px solid #5c8b89',
};

const infoText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6b7280',
  margin: '0 0 12px 0',
};

const hr = {
  borderColor: '#e8e5dc',
  margin: '24px 0',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  margin: '0',
  textAlign: 'center' as const,
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

const unsubscribeLink = {
  color: '#7a9278',
  textDecoration: 'underline',
};
