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

interface ContractSignedProps {
  recipientName: string;
  role: 'candidate' | 'organization';
  roleTitle?: string;
  organizationName?: string;
  candidateName?: string;
  contractType: string;
  startDate?: string;
  compensationAmount?: number;
  compensationCurrency?: string;
  compensationPeriod?: string;
  viewContractUrl: string;
}

export default function ContractSigned({
  recipientName,
  role,
  roleTitle,
  organizationName,
  candidateName,
  contractType,
  startDate,
  compensationAmount,
  compensationCurrency = 'USD',
  compensationPeriod,
  viewContractUrl,
}: ContractSignedProps) {
  const formatCompensation = () => {
    if (!compensationAmount) return null;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: compensationCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(compensationAmount);
    return compensationPeriod ? `${formatted} / ${compensationPeriod}` : formatted;
  };

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
              <Text style={badge}>Contract Signed</Text>
            </Section>

            <Text style={heading}>Contract Successfully Signed!</Text>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              Great news! The contract has been successfully signed by both parties.
            </Text>

            <Section style={contractBox}>
              {role === 'organization' && candidateName && (
                <>
                  <Text style={contractTitle}>{candidateName}</Text>
                  <Text style={contractSubtitle}>{roleTitle || 'Position'}</Text>
                </>
              )}

              {role === 'candidate' && organizationName && (
                <>
                  <Text style={contractTitle}>{organizationName}</Text>
                  <Text style={contractSubtitle}>{roleTitle || 'Position'}</Text>
                </>
              )}

              <Section style={detailsContainer}>
                <Section style={detailRow}>
                  <Text style={detailLabel}>Contract Type:</Text>
                  <Text style={detailValue}>{contractType}</Text>
                </Section>

                {startDate && (
                  <Section style={detailRow}>
                    <Text style={detailLabel}>Start Date:</Text>
                    <Text style={detailValue}>
                      {new Date(startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </Section>
                )}

                {compensationAmount && (
                  <Section style={detailRow}>
                    <Text style={detailLabel}>Compensation:</Text>
                    <Text style={detailValue}>{formatCompensation()}</Text>
                  </Section>
                )}
              </Section>
            </Section>

            <Text style={paragraph}>
              Both you and the {role === 'organization' ? 'candidate' : 'organization'} have
              attested to this agreement. This creates a verified work experience entry on
              Proofound.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={viewContractUrl}>
                View Contract Details
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={infoText}>
              <strong>What happens next?</strong>
            </Text>

            <Text style={infoText}>
              • Your work experience is now verified on your Proofound profile
              <br />
              • This verified experience strengthens your credibility
              <br />
              • You can request skill verifications from your connection
              <br />• Both parties can update the contract status as needed
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              This contract attestation was mutually agreed upon by both parties and is securely
              stored on Proofound.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Proofound. All rights reserved.
            </Text>
            <Text style={footerSmall}>
              <Link href={`${viewContractUrl}?action=settings`} style={unsubscribeLink}>
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

const contractBox = {
  backgroundColor: '#e8f5f0',
  padding: '24px',
  borderRadius: '12px',
  margin: '24px 0',
  border: '2px solid #5c8b89',
};

const contractTitle = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#1c4d3a',
  margin: '0 0 4px 0',
  textAlign: 'center' as const,
  fontFamily: '"Crimson Pro", Georgia, serif',
};

const contractSubtitle = {
  fontSize: '16px',
  color: '#4a5568',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const detailsContainer = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  margin: '16px 0 0 0',
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
