import crypto from 'crypto';

/**
 * Privacy Utility for GDPR-Compliant Data Anonymization
 * 
 * This module provides one-way hashing functions to pseudonymize PII
 * before storage, complying with GDPR Article 4(5) (Pseudonymisation).
 * 
 * Key principles:
 * - SHA-256 hashing is irreversible (cannot recover original values)
 * - Salt prevents rainbow table attacks
 * - Consistent hashing allows aggregate analytics without storing PII
 * 
 * Reference: CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 6.1
 */

/**
 * Hash PII using SHA-256 with salt for analytics storage.
 * 
 * This function creates a one-way hash that:
 * - Cannot be reversed to recover the original value
 * - Is consistent (same input + salt = same hash)
 * - Prevents identification of individuals
 * 
 * @param value - The PII value to hash (IP address, user agent, etc.)
 * @param salt - Optional salt override (defaults to PII_HASH_SALT env var)
 * @returns 64-character hex string (SHA-256 hash)
 * @throws Error if PII_HASH_SALT environment variable is not set
 * 
 * @example
 * ```typescript
 * // Hash an IP address
 * const hashedIp = hashPII('192.168.1.1');
 * // Returns: 'a3f8c9d2e1b4f5a6...' (64 chars)
 * ```
 */
export function hashPII(value: string, salt?: string): string {
  // Return empty string for empty input
  if (!value) return '';

  // Get salt from parameter or environment variable
  const hashSalt = salt ?? process.env.PII_HASH_SALT;

  // Enforce that salt is configured (critical security requirement)
  if (!hashSalt) {
    throw new Error(
      'PII_HASH_SALT environment variable is not set. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  // Create SHA-256 hash with salt
  return crypto
    .createHash('sha256')
    .update(value + hashSalt)
    .digest('hex');
}

/**
 * Anonymize IP address for GDPR-compliant analytics.
 * 
 * Converts raw IP addresses (both IPv4 and IPv6) into irreversible hashes.
 * This ensures compliance with GDPR Article 4(1), which defines IP addresses
 * as personal data.
 * 
 * @param ip - Raw IP address (e.g., '192.168.1.1' or '2001:db8::1')
 * @returns SHA-256 hash of the IP address (64-character hex string)
 * 
 * @example
 * ```typescript
 * // Extract IP from request and hash it
 * const ip = request.headers.get('x-forwarded-for') || 'unknown';
 * const ipHash = anonymizeIP(ip);
 * // Store ipHash in database instead of raw IP
 * ```
 */
export function anonymizeIP(ip: string): string {
  return hashPII(ip);
}

/**
 * Anonymize User Agent string for privacy-preserving analytics.
 * 
 * User Agent strings can contain identifying information and should be
 * hashed before storage to minimize PII collection.
 * 
 * @param userAgent - Raw User Agent string from request headers
 * @returns SHA-256 hash of the User Agent (64-character hex string)
 * 
 * @example
 * ```typescript
 * const ua = request.headers.get('user-agent') || 'unknown';
 * const uaHash = anonymizeUserAgent(ua);
 * ```
 */
export function anonymizeUserAgent(userAgent: string): string {
  return hashPII(userAgent);
}

