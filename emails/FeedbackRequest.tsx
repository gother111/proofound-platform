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

type Audience = 'candidate_to_org' | 'org_to_candidate';

interface FeedbackRequestProps {
  direction: Audience;
  feedbackUrl: string;
  expiresAt?: string;
  interviewTime?: string;
}

export const FeedbackRequest = ({
  direction,
  feedbackUrl,
  expiresAt,
  interviewTime,
}: FeedbackRequestProps) => {
  const isCandidate = direction === 'candidate_to_org';
  const headline = isCandidate
    ? 'Share your interview experience'
    : 'Share feedback with the candidate';

  const preview = isCandidate
    ? 'Tell us how the interview went—your response is anonymous.'
    : 'Provide structured feedback for the candidate—your name stays hidden.';

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{headline}</Heading>
          {interviewTime ? (
            <Text style={text}>Interview time: {new Date(interviewTime).toLocaleString()}</Text>
          ) : null}
          <Text style={text}>
            Your response will be shared with the other side{' '}
            <strong>without your name attached</strong>. This helps improve the experience for
            everyone.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={feedbackUrl}>
              Open feedback form
            </Button>
          </Section>
          <Text style={text}>
            Or copy and paste this link:
            <br />
            <Link href={feedbackUrl} style={link}>
              {feedbackUrl}
            </Link>
          </Text>
          <Text style={text}>
            What to expect:
            <br />• 4 quick rating questions
            <br />• 2 short text boxes (optional)
            <br />• Takes ~3 minutes
          </Text>
          <Text style={text}>
            {expiresAt
              ? `This link expires on ${new Date(expiresAt).toLocaleString()}.`
              : 'This link expires in 7 days.'}
          </Text>
          <Text style={footer}>
            Thank you for helping us keep interviews fair, clear, and respectful.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default FeedbackRequest;

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
  fontSize: '28px',
  fontWeight: 600,
  lineHeight: '1.25',
  margin: '0 0 16px',
};

const text = {
  color: '#2D3330',
  fontSize: '16px',
  lineHeight: '1.625',
  margin: '0 0 20px',
};

const buttonContainer = {
  margin: '28px 0',
};

const button = {
  backgroundColor: '#1C4D3A',
  borderRadius: '8px',
  color: '#F7F6F1',
  fontSize: '16px',
  fontWeight: 500,
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
  marginTop: '28px',
};
