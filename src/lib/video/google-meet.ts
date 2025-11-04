/**
 * Google Meet API Wrapper
 *
 * Handles Google OAuth flow and Google Meet meeting creation via Calendar API
 *
 * SETUP REQUIRED:
 * 1. Create Google Cloud project at https://console.cloud.google.com/
 * 2. Enable Google Calendar API
 * 3. Create OAuth 2.0 credentials
 * 4. Add these to .env.local:
 *    GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
 *    GOOGLE_CLIENT_SECRET=your_client_secret
 *    GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
 * 5. Add redirect URI in Google Cloud Console
 * 6. Add scopes: https://www.googleapis.com/auth/calendar.events
 */

import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface GoogleMeetConfig {
  summary: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  description?: string;
  attendeeEmails?: string[];
}

interface GoogleMeeting {
  id: string;
  meetLink: string;
  htmlLink: string;
  hangoutLink?: string;
}

/**
 * Get Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      'Google OAuth credentials not configured. See src/lib/video/google-meet.ts for setup instructions.'
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent to get refresh token
    state,
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh Google access token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get valid access token for user (refreshes if expired)
 */
async function getValidGoogleToken(userId: string): Promise<string> {
  const [integration] = await db
    .select()
    .from(userIntegrations)
    .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'google')))
    .limit(1);

  if (!integration || !integration.accessToken) {
    throw new Error('Google Calendar not connected. Please connect your Google account first.');
  }

  // Check if token is expired
  const now = new Date();
  if (integration.tokenExpiry && now >= integration.tokenExpiry) {
    // Refresh token
    if (!integration.refreshToken) {
      throw new Error('Google token expired and no refresh token available');
    }

    const refreshed = await refreshGoogleToken(integration.refreshToken);

    // Update database
    await db
      .update(userIntegrations)
      .set({
        accessToken: refreshed.accessToken,
        tokenExpiry: new Date(Date.now() + refreshed.expiresIn * 1000),
        updatedAt: new Date(),
      })
      .where(eq(userIntegrations.id, integration.id));

    return refreshed.accessToken;
  }

  return integration.accessToken;
}

/**
 * Create a Google Meet meeting (via Calendar API)
 */
export async function createGoogleMeeting(
  userId: string,
  config: GoogleMeetConfig
): Promise<GoogleMeeting> {
  const accessToken = await getValidGoogleToken(userId);

  // Create calendar event with Google Meet link
  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      summary: config.summary,
      description: config.description,
      start: {
        dateTime: config.startTime.toISOString(),
        timeZone: config.timezone,
      },
      end: {
        dateTime: config.endTime.toISOString(),
        timeZone: config.timezone,
      },
      attendees: config.attendeeEmails?.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Google Meet: ${error}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    meetLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri || '',
    htmlLink: data.htmlLink,
    hangoutLink: data.hangoutLink,
  };
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleMeeting(userId: string, eventId: string): Promise<void> {
  const accessToken = await getValidGoogleToken(userId);

  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const error = await response.text();
    throw new Error(`Failed to delete Google Calendar event: ${error}`);
  }
}

/**
 * Check if user has Google Calendar connected
 */
export async function isGoogleConnected(userId: string): Promise<boolean> {
  const [integration] = await db
    .select()
    .from(userIntegrations)
    .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'google')))
    .limit(1);

  return !!integration && !!integration.accessToken;
}
