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

interface NewMatchNotificationProps {
  recipientName: string;
  matchType: 'individual' | 'organization';
  matchScore: number;
  roleTitle?: string;
  organizationName?: string;
  topSkillMatches?: string[];
  viewMatchUrl: string;
}

export default function NewMatchNotification({
  recipientName,
  matchType,
  matchScore,
  roleTitle,
  organizationName,
  topSkillMatches = [],
  viewMatchUrl,
}: NewMatchNotificationProps) {
  const scorePercentage = Math.round(matchScore * 100);

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
              <Text style={badge}>New Match</Text>
            </Section>

            <Text style={heading}>You Have a New Match!</Text>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              Great news! We&apos;ve found a{' '}
              {scorePercentage >= 80
                ? 'highly compatible'
                : scorePercentage >= 60
                  ? 'good'
                  : 'potential'}{' '}
              match for you.
            </Text>

            {matchType === 'organization' && roleTitle && organizationName && (
              <>
                <Section style={matchBox}>
                  <Text style={matchTitle}>{roleTitle}</Text>
                  <Text style={matchOrg}>{organizationName}</Text>
                  <Section style={scoreContainer}>
                    <Text style={scoreLabel}>Match Score</Text>
                    <Text style={scoreValue}>{scorePercentage}%</Text>
                  </Section>
                </Section>

                {topSkillMatches.length > 0 && (
                  <>
                    <Text style={subHeading}>Top Skill Matches:</Text>
                    <Section style={skillsContainer}>
                      {topSkillMatches.map((skill, index) => (
                        <Text key={index} style={skillItem}>
                          ✓ {skill}
                        </Text>
                      ))}
                    </Section>
                  </>
                )}
              </>
            )}

            {matchType === 'individual' && (
              <Section style={matchBox}>
                <Text style={matchTitle}>Potential Match</Text>
                <Section style={scoreContainer}>
                  <Text style={scoreLabel}>Match Score</Text>
                  <Text style={scoreValue}>{scorePercentage}%</Text>
                </Section>
              </Section>
            )}

            <Text style={paragraph}>
              This match was calculated based on:
              <br />
              • Skills alignment
              <br />
              • Values compatibility
              <br />
              • Experience level
              <br />• Availability and location
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={viewMatchUrl}>
                View Match Details
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={infoText}>
              <strong>What happens next?</strong>
            </Text>

            <Text style={infoText}>
              1. Review the match details and see why you&apos;re compatible
              <br />
              2. If interested, express your interest to reveal identities
              <br />
              3. Both parties must express interest for a mutual match
              <br />
              4. Once matched, you can start a conversation
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              We only send you high-quality matches that align with your profile and preferences. If
              this isn&apos;t a good fit, you can pass on this match in your dashboard.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Proofound. All rights reserved.
            </Text>
            <Text style={footerSmall}>
              <Link href={`${viewMatchUrl}?action=unsubscribe`} style={unsubscribeLink}>
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
  backgroundColor: '#e8f5f0',
  color: '#1c4d3a',
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

const subHeading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2c3e2c',
  margin: '20px 0 12px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '0 0 16px 0',
};

const matchBox = {
  backgroundColor: '#e8f5f0',
  padding: '24px',
  borderRadius: '12px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #5c8b89',
};

const matchTitle = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#1c4d3a',
  margin: '0 0 8px 0',
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const matchOrg = {
  fontSize: '16px',
  color: '#4a5568',
  margin: '0 0 16px 0',
};

const scoreContainer = {
  marginTop: '16px',
};

const scoreLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const scoreValue = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#1c4d3a',
  margin: '0',
};

const skillsContainer = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '8px',
  margin: '12px 0 24px 0',
};

const skillItem = {
  fontSize: '15px',
  color: '#4a5568',
  margin: '0 0 8px 0',
  lineHeight: '22px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
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
