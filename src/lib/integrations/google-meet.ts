/**
 * Google Meet API Integration
 *
 * Handles Google OAuth and Google Calendar/Meet event creation
 * PRD Requirement: Video conferencing integration for interviews
 */

import { google } from 'googleapis';
import { log } from '@/lib/log';

export interface GoogleMeetEvent {
  id: string;
  htmlLink: string;
  hangoutLink: string; // Google Meet link
  summary: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

export interface CreateGoogleMeetParams {
  summary: string;
  start_time: string; // ISO 8601 format
  duration: number; // minutes
  timezone?: string;
  description?: string;
  attendees?: string[]; // email addresses
}

/**
 * Create a Google Meet meeting via Google Calendar
 */
export async function createGoogleMeet(
  accessToken: string,
  params: CreateGoogleMeetParams
): Promise<GoogleMeetEvent> {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDate = new Date(params.start_time);
    const endDate = new Date(startDate.getTime() + params.duration * 60000);

    const event = {
      summary: params.summary,
      description: params.description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: params.timezone || 'UTC',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: params.timezone || 'UTC',
      },
      attendees: params.attendees?.map((email) => ({ email })) || [],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    const createdEvent = response.data;

    if (!createdEvent.hangoutLink) {
      throw new Error('Failed to create Google Meet link');
    }

    log.info('google.meet.created', {
      eventId: createdEvent.id,
      summary: params.summary,
      duration: params.duration,
    });

    return {
      id: createdEvent.id!,
      htmlLink: createdEvent.htmlLink!,
      hangoutLink: createdEvent.hangoutLink,
      summary: createdEvent.summary!,
      start: createdEvent.start as any,
      end: createdEvent.end as any,
    };
  } catch (error) {
    log.error('google.meet.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google credentials not configured');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get Google tokens');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
    scope: tokens.scope || '',
  };
}

/**
 * Refresh Google access token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google credentials not configured');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh Google token');
  }

  return {
    access_token: credentials.access_token,
    expires_in: credentials.expiry_date
      ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
      : 3600,
  };
}

/**
 * Get Google OAuth URL
 */
export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google credentials not configured');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar',
    ],
    state,
    prompt: 'consent', // Force refresh token
  });
}

/**
 * Revoke Google access
 */
export async function revokeGoogleAccess(accessToken: string): Promise<void> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  await oauth2Client.revokeToken(accessToken);
}
