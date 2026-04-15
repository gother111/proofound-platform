import crypto from 'crypto';

export function hashWorkEmailVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}
