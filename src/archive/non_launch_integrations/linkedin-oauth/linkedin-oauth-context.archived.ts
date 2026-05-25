export type LinkedInOAuthContext = 'integrations' | 'verification';

export function parseLinkedInOAuthContext(value: string | null): LinkedInOAuthContext {
  return value === 'verification' ? 'verification' : 'integrations';
}
