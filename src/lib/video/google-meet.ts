/**
 * Google Meet/Calendar API Integration
 * 
 * Functions for creating, updating, and canceling Google Calendar events with Meet links
 */

import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface CreateGoogleMeetParams {
  userId: string;
  summary: string;
  startTime: Date;
  duration: number; // minutes
  timezone: string;
  attendees: Array<{ email: string; name: string }>;
  description?: string;
}

export interface GoogleMeetResult {
  meetingId: string; // Calendar event ID
  meetingUrl: string; // Meet link
  joinUrl: string; // Meet link (same as meetingUrl)
  htmlLink: string; // Calendar event link
}

/**
 * Refresh Google access token if expired
 */
async function refreshGoogleToken(integration: any): Promise<string> {
  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: integration.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google token');
  }

  const data = await response.json();

  // Update stored token
  const expiresIn = data.expires_in || 3600;
  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

  await db
    .update(userIntegrations)
    .set({
      accessToken: data.access_token,
      tokenExpiry,
      updatedAt: new Date(),
    })
    .where(eq(userIntegrations.id, integration.id));

  return data.access_token;
}

/**
 * Get valid Google access token (refresh if needed)
 */
async function getGoogleToken(userId: string): Promise<string> {
  const integration = await db
    .select()
    .from(userIntegrations)
    .where(
      and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, 'google')
      )
    )
    .limit(1);

  if (!integration.length) {
    throw new Error('Google integration not found. Please connect your Google account.');
  }

  const integrationData = integration[0];

  // Check if token is expired or about to expire (within 5 minutes)
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() + 5 * 60 * 1000);

  if (integrationData.tokenExpiry < expiryThreshold) {
    return await refreshGoogleToken(integrationData);
  }

  return integrationData.accessToken;
}

/**
 * Create a Google Calendar event with Meet link
 */
export async function createGoogleMeet(
  params: CreateGoogleMeetParams
): Promise<GoogleMeetResult> {
  const accessToken = await getGoogleToken(params.userId);

  // Calculate end time
  const endTime = new Date(params.startTime.getTime() + params.duration * 60 * 1000);

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description || '',
        start: {
          dateTime: params.startTime.toISOString(),
          timeZone: params.timezone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: params.timezone,
        },
        attendees: params.attendees.map((a) => ({
          email: a.email,
          displayName: a.name,
        })),
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
            { method: 'popup', minutes: 60 }, // 1 hour before
            { method: 'email', minutes: 1440 }, // 24 hours before
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google Calendar API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();

  // Extract Meet link
  const meetLink = data.conferenceData?.entryPoints?.find(
    (ep: any) => ep.entryPointType === 'video'
  )?.uri;

  if (!meetLink) {
    throw new Error('Failed to create Google Meet link');
  }

  return {
    meetingId: data.id,
    meetingUrl: meetLink,
    joinUrl: meetLink,
    htmlLink: data.htmlLink,
  };
}

/**
 * Update a Google Calendar event
 */
export async function updateGoogleMeet(
  userId: string,
  eventId: string,
  updates: Partial<CreateGoogleMeetParams>
): Promise<void> {
  const accessToken = await getGoogleToken(userId);

  const body: any = {};

  if (updates.summary) body.summary = updates.summary;
  if (updates.description) body.description = updates.description;

  if (updates.startTime || updates.duration) {
    const startTime = updates.startTime || new Date(); // Fallback if not provided
    const duration = updates.duration || 30;
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    if (updates.startTime) {
      body.start = {
        dateTime: startTime.toISOString(),
        timeZone: updates.timezone || 'UTC',
      };
    }

    if (updates.duration) {
      body.end = {
        dateTime: endTime.toISOString(),
        timeZone: updates.timezone || 'UTC',
      };
    }
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google Calendar API error: ${JSON.stringify(errorData)}`);
  }
}

/**
 * Cancel a Google Calendar event
 */
export async function cancelGoogleMeet(
  userId: string,
  eventId: string
): Promise<void> {
  const accessToken = await getGoogleToken(userId);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json();
    throw new Error(`Google Calendar API error: ${JSON.stringify(errorData)}`);
  }
}
