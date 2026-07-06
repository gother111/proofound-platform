/**
 * PII Detection Utility for Messaging System
 *
 * Detects Personally Identifiable Information (PII) in message content
 * to warn users before sharing sensitive information in Stage 1 (masked) conversations.
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10.6
 */

// Detection result interface
export interface PIIDetectionResult {
  containsEmail: boolean;
  containsPhone: boolean;
  containsUrl: boolean;
  foundPatterns: string[];
  hasPII: boolean;
}

/**
 * Detect PII patterns in text
 *
 * Scans for:
 * - Email addresses (name@domain.com)
 * - Phone numbers (US/international formats)
 * - URLs (http:// or www.)
 *
 * @param text - Message content to scan
 * @returns Detection results with found patterns
 */
export function detectPII(text: string): PIIDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      containsEmail: false,
      containsPhone: false,
      containsUrl: false,
      foundPatterns: [],
      hasPII: false,
    };
  }

  // Email pattern: name@domain.tld
  // Matches: user@example.com, first.last+tag@subdomain.example.co.uk
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // Phone pattern: Various formats
  // Matches: (123) 456-7890, 123-456-7890, +1 123 456 7890, 1234567890
  const phoneRegex =
    /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g;

  // URL pattern: http:// or www. prefixed URLs
  // Matches: https://example.com, www.example.com, http://sub.domain.com/path
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

  // Find all matches
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  const urls = text.match(urlRegex) || [];

  // Filter out false positives
  const validEmails = emails.filter(isValidEmail);
  const validPhones = phones.filter(isValidPhone);
  const validUrls = urls.filter(isValidUrl);

  const hasPII = validEmails.length > 0 || validPhones.length > 0 || validUrls.length > 0;

  return {
    containsEmail: validEmails.length > 0,
    containsPhone: validPhones.length > 0,
    containsUrl: validUrls.length > 0,
    foundPatterns: [...validEmails, ...validPhones, ...validUrls],
    hasPII,
  };
}

/**
 * Validate email address (reduce false positives)
 */
function isValidEmail(email: string): boolean {
  // Check minimum length
  if (email.length < 5) return false;

  // Check for valid TLD (at least 2 chars)
  const parts = email.split('.');
  if (parts.length < 2) return false;

  const tld = parts[parts.length - 1];
  if (tld.length < 2) return false;

  // Check for common false positives (version numbers, file extensions)
  const falsePositives = ['v1.0', 'v2.0', 'file.txt', 'image.jpg', 'doc.pdf'];
  if (falsePositives.some((fp) => email.includes(fp))) return false;

  return true;
}

/**
 * Validate phone number (reduce false positives)
 */
function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Phone must have 7-15 digits (international range)
  if (digits.length < 7 || digits.length > 15) return false;

  // Check for common false positives (dates, version numbers)
  // e.g., 2024-11-06, 1.2.3, 123-456 (too short)
  if (digits.length === 8 && /^\d{4}\d{2}\d{2}$/.test(digits)) {
    // Could be a date YYYYMMDD
    return false;
  }

  return true;
}

/**
 * Validate URL (reduce false positives)
 */
function isValidUrl(url: string): boolean {
  // Minimum length check
  if (url.length < 10) return false;

  // Must contain a dot (domain.tld)
  if (!url.includes('.')) return false;

  // Check for valid domain after www. or protocol
  const domainPart = url.replace(/^(https?:\/\/)?(www\.)?/, '');
  if (domainPart.length < 5) return false;

  return true;
}

/**
 * Generate user-friendly warning message
 *
 * @param detection - PII detection results
 * @returns Warning message for UI
 */
export function generateWarningMessage(detection: PIIDetectionResult): string {
  if (!detection.hasPII) {
    return '';
  }

  const items: string[] = [];
  if (detection.containsEmail) items.push('email address');
  if (detection.containsPhone) items.push('phone number');
  if (detection.containsUrl) items.push('link');

  const itemsList = items.join(', ').replace(/, ([^,]*)$/, ' and $1');

  return `This message contains a ${itemsList}. Consider waiting until identities are revealed before sharing personal contact information.`;
}

/**
 * Get short warning label for UI badge
 *
 * @param detection - PII detection results
 * @returns Short label like "Email detected" or "PII detected"
 */
export function getWarningLabel(detection: PIIDetectionResult): string {
  if (!detection.hasPII) return '';

  if (detection.containsEmail) return 'Email detected';
  if (detection.containsPhone) return 'Phone detected';
  if (detection.containsUrl) return 'Link detected';

  return 'PII detected';
}

/**
 * Check if message should block sending (Stage 1 only)
 *
 * @param text - Message content
 * @param conversationStage - Current conversation stage ('masked' or 'revealed')
 * @param forceAllow - User explicitly confirmed to send despite warning
 * @returns Object with `shouldBlock` and `reason`
 */
export function shouldBlockMessage(
  text: string,
  conversationStage: 'masked' | 'revealed',
  forceAllow: boolean = false
): { shouldBlock: boolean; reason?: string; detection?: PIIDetectionResult } {
  // Stage 2 (revealed): Allow all messages
  if (conversationStage === 'revealed') {
    return { shouldBlock: false };
  }

  // User explicitly confirmed: Allow
  if (forceAllow) {
    return { shouldBlock: false };
  }

  // Stage 1 (masked): Check for PII
  const detection = detectPII(text);

  if (detection.hasPII) {
    return {
      shouldBlock: true,
      reason: generateWarningMessage(detection),
      detection,
    };
  }

  return { shouldBlock: false };
}

/**
 * Redact PII from text (for logging/analytics)
 *
 * Replaces detected PII with [REDACTED] for safe logging
 *
 * @param text - Text to redact
 * @returns Redacted text
 */
export function redactPII(text: string): string {
  let redacted = text;

  // Redact emails
  redacted = redacted.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REDACTED]'
  );

  // Redact phone numbers
  redacted = redacted.replace(
    /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
    '[PHONE_REDACTED]'
  );

  // Redact URLs
  redacted = redacted.replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)/g, '[URL_REDACTED]');

  return redacted;
}

// Example usage:
// import { detectPII, shouldBlockMessage, generateWarningMessage } from '@/lib/privacy/pii-detection';
//
// const messageContent = "Hi! Email me at john@example.com";
// const conversationStage = "masked";
//
// const { shouldBlock, reason, detection } = shouldBlockMessage(messageContent, conversationStage);
//
// if (shouldBlock) {
//   // Show warning to user
//   alert(reason);
//   // User can choose to send anyway or edit message
// }
