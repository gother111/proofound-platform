import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components';

interface LinkedInVerificationPendingReviewProps {
  candidateName: string;
  candidateEmail: string | null;
  candidateProfileId: string;
  confidence: number;
  hasIdentityVerification: boolean;
  hasWorkplaceVerification: boolean;
  linkedinProfileUrl: string | null;
  adminQueueUrl: string;
}

export default function LinkedInVerificationPendingReview({
  candidateName,
  candidateEmail,
  candidateProfileId,
  confidence,
  hasIdentityVerification,
  hasWorkplaceVerification,
  linkedinProfileUrl,
  adminQueueUrl,
}: LinkedInVerificationPendingReviewProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={heading}>LinkedIn Verification Pending Review</Text>
            <Text style={paragraph}>A LinkedIn verification request needs manual review.</Text>

            <Section style={detailsBox}>
              <Text style={detailLine}>
                <strong>Candidate:</strong> {candidateName}
              </Text>
              <Text style={detailLine}>
                <strong>Email:</strong> {candidateEmail || 'Not available'}
              </Text>
              <Text style={detailLine}>
                <strong>Profile reference:</strong> {candidateProfileId}
              </Text>
              <Text style={detailLine}>
                <strong>Confidence:</strong> {confidence}%
              </Text>
              <Text style={detailLine}>
                <strong>LinkedIn identity signal:</strong>{' '}
                {hasIdentityVerification ? 'Detected' : 'Not detected'}
              </Text>
              <Text style={detailLine}>
                <strong>LinkedIn workplace signal:</strong>{' '}
                {hasWorkplaceVerification ? 'Detected' : 'Not detected'}
              </Text>
              <Text style={detailLine}>
                <strong>LinkedIn profile URL:</strong>{' '}
                {linkedinProfileUrl ? (
                  <Link href={linkedinProfileUrl} style={link}>
                    Open profile
                  </Link>
                ) : (
                  'Not available'
                )}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={adminQueueUrl}>
                Open LinkedIn Verification Queue
              </Button>
            </Section>

            <Hr style={hr} />
            <Text style={footer}>
              Review from the verification queue and approve or decline the request.
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
  padding: '32px 16px',
  maxWidth: '640px',
};

const content = {
  backgroundColor: '#ffffff',
  border: '1px solid #e8e5dc',
  borderRadius: '12px',
  padding: '28px',
};

const heading = {
  margin: '0 0 16px',
  fontSize: '24px',
  lineHeight: '30px',
  color: '#2c3e2c',
  fontWeight: '600',
};

const paragraph = {
  margin: '0 0 20px',
  fontSize: '15px',
  lineHeight: '22px',
  color: '#4a5568',
};

const detailsBox = {
  border: '1px solid #e8e5dc',
  borderRadius: '10px',
  backgroundColor: '#fafaf8',
  padding: '14px 16px',
};

const detailLine = {
  margin: '0 0 8px',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#334155',
};

const buttonContainer = {
  marginTop: '20px',
  textAlign: 'left' as const,
};

const button = {
  backgroundColor: '#1f4d3a',
  color: '#ffffff',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  padding: '10px 16px',
};

const link = {
  color: '#0a66c2',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#ece8dd',
  margin: '20px 0 12px',
};

const footer = {
  margin: 0,
  fontSize: '12px',
  lineHeight: '18px',
  color: '#6b7280',
};
