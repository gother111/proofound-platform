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

interface InterviewScheduledProps {
  recipientName: string;
  role: 'candidate' | 'organization';
  roleTitle?: string;
  organizationName?: string;
  candidateName?: string;
  scheduledAt: string;
  duration: number;
  platform: 'manual' | 'google_meet';
  meetingUrl: string;
  timezone?: string;
  viewInterviewUrl: string;
}

export default function InterviewScheduled({
  recipientName,
  role,
  roleTitle,
  organizationName,
  candidateName,
  scheduledAt,
  duration,
  platform,
  meetingUrl,
  timezone = 'UTC',
  viewInterviewUrl,
}: InterviewScheduledProps) {
  const interviewDate = new Date(scheduledAt);
  const formattedDate = interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = interviewDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const platformName = platform === 'google_meet' ? 'Google Meet' : 'Manual link';

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
              <Text style={badge}>Interview Scheduled</Text>
            </Section>

            <Text style={heading}>Your Interview is Confirmed!</Text>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              Your interview has been scheduled. Open Proofound for the current workflow stage,
              approved context, and meeting details.
            </Text>

            <Section style={interviewBox}>
              {role === 'organization' && candidateName && (
                <>
                  <Text style={interviewTitle}>Interview with {candidateName}</Text>
                  <Text style={interviewSubtitle}>{roleTitle || 'Position'}</Text>
                </>
              )}

              {role === 'candidate' && organizationName && (
                <>
                  <Text style={interviewTitle}>Interview at {organizationName}</Text>
                  <Text style={interviewSubtitle}>{roleTitle || 'Position'}</Text>
                </>
              )}

              <Section style={detailsContainer}>
                <Section style={detailRow}>
                  <Text style={detailLabel}>📅 Date:</Text>
                  <Text style={detailValue}>{formattedDate}</Text>
                </Section>

                <Section style={detailRow}>
                  <Text style={detailLabel}>🕐 Time:</Text>
                  <Text style={detailValue}>{formattedTime}</Text>
                </Section>

                <Section style={detailRow}>
                  <Text style={detailLabel}>⏱️ Duration:</Text>
                  <Text style={detailValue}>{duration} minutes</Text>
                </Section>

                <Section style={detailRow}>
                  <Text style={detailLabel}>💻 Platform:</Text>
                  <Text style={detailValue}>{platformName}</Text>
                </Section>
              </Section>

              <Hr style={innerHr} />

              <Section style={buttonContainer}>
                <Button style={joinButton} href={meetingUrl}>
                  Open meeting link
                </Button>
              </Section>

              <Text style={meetingLinkText}>
                Or copy this link: <br />
                <Link href={meetingUrl} style={meetingLink}>
                  {meetingUrl}
                </Link>
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={infoText}>
              <strong>Important reminders:</strong>
            </Text>

            <Text style={infoText}>
              • Join 2-3 minutes early to test your audio and video
              <br />
              • Have relevant Proof Packs and portfolio context ready to discuss
              <br />
              • Prepare questions about the role and organization
              <br />
              • Find a quiet space with good lighting
              <br />• Use Proofound for any workflow updates or rescheduling requests
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              <strong>Privacy and workflow stage</strong>
              <br />
              This email only includes scheduling details. Proof files, private notes, contact
              details, and reveal-stage context stay inside the authenticated workflow unless they
              have been explicitly approved for this stage.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={viewInterviewUrl}>
                View Interview Details
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Proofound. All rights reserved.
            </Text>
            <Text style={footerSmall}>
              <Link href={`${viewInterviewUrl}?action=settings`} style={unsubscribeLink}>
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '0 0 16px 0',
};

const interviewBox = {
  backgroundColor: '#e8f5f0',
  padding: '24px',
  borderRadius: '12px',
  margin: '24px 0',
  border: '2px solid #5c8b89',
};

const interviewTitle = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#1c4d3a',
  margin: '0 0 4px 0',
  textAlign: 'center' as const,
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const interviewSubtitle = {
  fontSize: '16px',
  color: '#4a5568',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const detailsContainer = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  margin: '0 0 16px 0',
};

const detailRow = {
  marginBottom: '12px',
};

const detailLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 4px 0',
  fontWeight: '600',
};

const detailValue = {
  fontSize: '16px',
  color: '#2c3e2c',
  margin: '0',
};

const innerHr = {
  borderColor: '#5c8b89',
  margin: '16px 0',
  opacity: 0.3,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0',
};

const joinButton = {
  backgroundColor: '#1c4d3a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
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

const meetingLinkText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '12px 0 0 0',
  textAlign: 'center' as const,
  lineHeight: '18px',
};

const meetingLink = {
  color: '#5c8b89',
  textDecoration: 'none',
  wordBreak: 'break-all' as const,
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
  margin: '0 0 16px 0',
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
