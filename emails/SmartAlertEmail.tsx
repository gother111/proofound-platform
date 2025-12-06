import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type SmartAlertEmailProps = {
  recipientName?: string | null;
  title: string;
  summary: string;
  ctaUrl: string;
  ctaLabel?: string;
  contextTag?: string;
};

export default function SmartAlertEmail(props: SmartAlertEmailProps) {
  const { recipientName, title, summary, ctaUrl, ctaLabel = 'View details', contextTag } = props;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>{title}</Heading>
          {contextTag ? <Text style={styles.tag}>{contextTag}</Text> : null}
          <Text style={styles.text}>{greeting}</Text>
          <Text style={styles.text}>{summary}</Text>
          <Section style={styles.buttonWrapper}>
            <Button href={ctaUrl} style={styles.button}>
              {ctaLabel}
            </Button>
          </Section>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            You received this alert because notifications are enabled.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    padding: '24px 0',
    fontFamily: '"Inter", Arial, sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
    border: '1px solid #e5e7eb',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 8px',
    color: '#111827',
  },
  tag: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  text: {
    fontSize: '15px',
    lineHeight: '22px',
    color: '#374151',
    margin: '0 0 12px',
  },
  buttonWrapper: {
    textAlign: 'left' as const,
    margin: '12px 0 20px',
  },
  button: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: 600,
    padding: '12px 18px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  hr: {
    borderColor: '#e5e7eb',
    margin: '12px 0',
  },
  footer: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
};
