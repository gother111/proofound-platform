/**
 * LinkedIn API Helper Library
 *
 * Handles LinkedIn OAuth and API interactions for profile data retrieval
 */

import type { NextRequest } from 'next/server';

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePicture?: string;
  headline?: string;
  vanityName?: string; // The custom URL part (e.g., 'johndoe' from linkedin.com/in/johndoe)
}

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

const LINKEDIN_CALLBACK_PATH = '/api/auth/linkedin/callback';
const DEFAULT_LINKEDIN_OIDC_SCOPES = ['openid', 'profile', 'email'];
const LINKEDIN_VERIFICATION_SCOPES = ['r_profile_basicinfo', 'r_verify'];

function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function resolveBaseUrl(request: Pick<NextRequest, 'nextUrl'>): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_URL,
    process.env.SITE_URL,
    request.nextUrl.origin,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeHttpUrl(candidate);
    if (!normalized) continue;
    return normalized;
  }

  return request.nextUrl.origin;
}

/**
 * Resolve LinkedIn OAuth redirect URI using explicit override first and then
 * canonical site URL fallbacks.
 */
export function resolveLinkedInRedirectUri(request: Pick<NextRequest, 'nextUrl'>): string {
  const configured = process.env.LINKEDIN_REDIRECT_URI;
  if (configured && configured.trim()) {
    if (configured.startsWith('/')) {
      const baseUrl = resolveBaseUrl(request);
      return new URL(configured, baseUrl).toString();
    }

    const normalized = normalizeHttpUrl(configured);
    if (normalized) {
      return normalized;
    }
  }

  const baseUrl = resolveBaseUrl(request);
  return new URL(LINKEDIN_CALLBACK_PATH, baseUrl).toString();
}

/**
 * Fetch LinkedIn profile data using access token
 */
export async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  try {
    // Fetch basic profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      throw new Error(
        `LinkedIn API error: ${profileResponse.status} ${profileResponse.statusText}`
      );
    }

    const profileData = await profileResponse.json();

    // Fetch email separately (requires separate scope)
    let email: string | undefined;
    try {
      const emailResponse = await fetch(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        email = emailData?.elements?.[0]?.['handle~']?.emailAddress;
      }
    } catch (error) {
      // Email is optional, continue without it
      console.warn('Failed to fetch LinkedIn email:', error);
    }

    return {
      id: profileData.id,
      firstName: profileData.localizedFirstName || '',
      lastName: profileData.localizedLastName || '',
      email,
      vanityName: profileData.vanityName,
      headline: profileData.headline?.localized?.en_US,
      profilePicture:
        profileData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
    };
  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error);
    throw error;
  }
}

/**
 * Exchange OAuth authorization code for access token
 */
export async function exchangeLinkedInCode(
  code: string,
  redirectUri: string
): Promise<LinkedInTokenResponse> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('LinkedIn OAuth credentials not configured');
  }

  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn token exchange failed: ${response.status} ${errorText}`);
    }

    const data: LinkedInTokenResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error exchanging LinkedIn code:', error);
    throw error;
  }
}

/**
 * Refresh LinkedIn access token
 */
export async function refreshLinkedInToken(refreshToken: string): Promise<LinkedInTokenResponse> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('LinkedIn OAuth credentials not configured');
  }

  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn token refresh failed: ${response.status} ${errorText}`);
    }

    const data: LinkedInTokenResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error refreshing LinkedIn token:', error);
    throw error;
  }
}

/**
 * Construct public LinkedIn profile URL from profile data
 */
export function constructLinkedInProfileUrl(profile: LinkedInProfile): string {
  // If we have the vanity name (custom URL), use that
  if (profile.vanityName) {
    return `https://www.linkedin.com/in/${profile.vanityName}`;
  }

  // Fallback: construct from name (not ideal but better than nothing)
  // This will need manual correction but gives admin something to work with
  const namePart = `${profile.firstName}-${profile.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  return `https://www.linkedin.com/in/${namePart}`;
}

function uniqueScopes(scopes: string[]): string[] {
  return [...new Set(scopes.map((scope) => scope.trim()).filter(Boolean))];
}

export function getLinkedInAuthScopes(context: 'integrations' | 'verification' = 'integrations') {
  if (context === 'verification') {
    return uniqueScopes([...DEFAULT_LINKEDIN_OIDC_SCOPES, ...LINKEDIN_VERIFICATION_SCOPES]);
  }

  return [...DEFAULT_LINKEDIN_OIDC_SCOPES];
}

/**
 * Generate LinkedIn OAuth authorization URL
 */
export function generateLinkedInAuthUrl(
  state: string,
  redirectUri: string,
  scopes: string[] = DEFAULT_LINKEDIN_OIDC_SCOPES
): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;

  if (!clientId) {
    throw new Error('LinkedIn Client ID not configured');
  }

  const normalizedScopes = uniqueScopes(scopes);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: normalizedScopes.join(' '),
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Validate that required LinkedIn OAuth environment variables are set
 */
export function validateLinkedInConfig(): {
  valid: boolean;
  missingVars: string[];
} {
  const requiredVars = ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'];
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  return {
    valid: missingVars.length === 0,
    missingVars,
  };
}
