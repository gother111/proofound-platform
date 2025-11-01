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

interface SkillVerificationRequestProps {
  requesterName: string;
  requesterHandle: string;
  skillName: string;
  verifyUrl: string;
  declineUrl: string;
  message?: string;
}

export default function SkillVerificationRequest({
  requesterName,
  requesterHandle,
  skillName,
  verifyUrl,
  declineUrl,
  message,
}: SkillVerificationRequestProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Proofound</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Skill Verification Request</Text>

            <Text style={paragraph}>
              <strong>{requesterName}</strong> (@{requesterHandle}) has requested that you verify
              their skill in:
            </Text>

            <Section style={skillBox}>
              <Text style={skillNameStyle}>{skillName}</Text>
            </Section>

            {message && (
              <>
                <Text style={paragraph}>
                  <strong>Message from {requesterName}:</strong>
                </Text>
                <Section style={messageBox}>
                  <Text style={messageText}>&ldquo;{message}&rdquo;</Text>
                </Section>
              </>
            )}

            <Text style={paragraph}>
              Your verification helps build trust in the Proofound community and enables{' '}
              {requesterName} to showcase their verified skills to potential organizations.
            </Text>

            <Hr style={hr} />

            <Text style={sectionHeading}>How to Respond</Text>

            <Text style={paragraph}>
              If you&apos;ve worked with {requesterName} and can confirm their skills in {skillName}
              , click the button below to verify:
            </Text>

            <Section style={buttonContainer}>
              <Button style={verifyButton} href={verifyUrl}>
                Verify Skill
              </Button>
            </Section>

            <Text style={paragraph}>
              Not comfortable verifying this skill? You can politely decline:
            </Text>

            <Section style={buttonContainer}>
              <Link href={declineUrl} style={declineLink}>
                Decline Request
              </Link>
            </Section>

            <Hr style={hr} />

            <Text style={infoHeading}>What Happens Next?</Text>

            <Text style={infoText}>
              <strong>If you verify:</strong>
              <br />• {requesterName}&apos;s skill will show as &ldquo;Verified&rdquo; on their
              profile
              <br />
              • Your name will appear as a verifier (you can choose to be anonymous)
              <br />• Organizations will see this skill has been peer-verified
            </Text>

            <Text style={infoText}>
              <strong>If you decline:</strong>
              <br />• {requesterName} will be notified that you declined (no reason required)
              <br />
              • You won&apos;t be asked to verify this skill again
              <br />• Your decision is private and confidential
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              <strong>This verification link expires in 14 days.</strong>
            </Text>

            <Text style={footerText}>
              If you didn&apos;t expect this request or don&apos;t know {requesterName}, you can
              safely ignore this email or click &ldquo;Decline Request&rdquo; above.
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
            <Text style={footerSmall}>
              <Link href="https://proofound.com/help/verification" style={helpLink}>
                Learn more about skill verification
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

const heading = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#2c3e2c',
  margin: '0 0 24px 0',
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const sectionHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#2c3e2c',
  margin: '24px 0 16px 0',
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const infoHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#2c3e2c',
  margin: '0 0 12px 0',
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '0 0 16px 0',
};

const skillBox = {
  backgroundColor: '#e8f5f0',
  padding: '16px 24px',
  borderRadius: '8px',
  margin: '16px 0 24px 0',
  textAlign: 'center' as const,
};

const skillNameStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1c4d3a',
  margin: '0',
};

const messageBox = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderLeft: '4px solid #7a9278',
  borderRadius: '4px',
  margin: '12px 0 24px 0',
};

const messageText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#4a5568',
  margin: '0',
  fontStyle: 'italic',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const verifyButton = {
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

const declineLink = {
  color: '#6b7280',
  fontSize: '14px',
  textDecoration: 'underline',
};

const infoText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6b7280',
  margin: '0 0 16px 0',
  paddingLeft: '12px',
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

const helpLink = {
  color: '#7a9278',
  textDecoration: 'underline',
};
