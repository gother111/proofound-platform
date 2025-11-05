/**
 * Google Meet API Integration
 * Implements PRD Gap 1: Interview scheduling with Google Meet
 *
 * Features:
 * - OAuth 2.0 authentication
 * - Calendar event creation with Google Meet link
 * - Event cancellation
 * - Calendar invite generation
 *
 * Uses Google Calendar API v3 with conference data
 * Docs: https://developers.google.com/calendar/api/v3/reference
 */

interface GoogleMeetEventParams {
  summary: string; // Meeting title
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  attendees: string[]; // Email addresses
  organizerEmail: string;
  description?: string;
  timezone?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus: string;
  }>;
  hangoutLink?: string; // Google Meet link
  conferenceData?: {
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
    conferenceSolution: {
      name: string;
      iconUri: string;
    };
    conferenceId: string;
  };
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

/**
 * Get Google OAuth access token
 * This assumes we have a refresh token stored for the user
 * For server-to-server, use service account
 */
export async function getGoogleAccessToken(refreshToken?: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  // If using service account (for org-level integration)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return await getServiceAccountToken();
  }

  // User-level OAuth with refresh token
  if (!refreshToken) {
    throw new Error('No refresh token available for Google Calendar');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Google access token: ${error}`);
  }

  const data: GoogleTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Get service account token for server-to-server Google Calendar access
 */
async function getServiceAccountToken(): Promise<string> {
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

  // Use Google Auth library for service account
  // For MVP, we'll implement OAuth flow per user
  throw new Error('Service account not yet implemented - use user OAuth');
}

/**
 * Create Google Calendar event with Meet link
 * API Docs: https://developers.google.com/calendar/api/v3/reference/events/insert
 */
export async function createGoogleMeetEvent(
  params: GoogleMeetEventParams,
  accessToken: string
): Promise<{
  eventId: string;
  meetLink: string;
  calendarLink: string;
}> {
  // PRD requirement: 30-minute duration
  // Calculate end time if not provided
  const startDate = new Date(params.startTime);
  const endDate = params.endTime
    ? new Date(params.endTime)
    : new Date(startDate.getTime() + 30 * 60000);

  const requestBody = {
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
    attendees: params.attendees.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`, // Unique request ID
        conferenceSolutionKey: {
          type: 'hangoutsMeet', // Creates Google Meet link
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
    sendUpdates: 'all', // Send calendar invites to all attendees
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${error}`);
  }

  const event: GoogleCalendarEvent = await response.json();

  // Extract Google Meet link
  const meetLink =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
    '';

  if (!meetLink) {
    throw new Error('Failed to generate Google Meet link');
  }

  return {
    eventId: event.id,
    meetLink,
    calendarLink: `https://calendar.google.com/calendar/event?eid=${event.id}`,
  };
}

/**
 * Cancel Google Calendar event
 * API Docs: https://developers.google.com/calendar/api/v3/reference/events/delete
 */
export async function cancelGoogleMeetEvent(eventId: string, accessToken: string): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    // 404/410 are acceptable - event might already be deleted
    const error = await response.text();
    throw new Error(`Failed to cancel Google Calendar event: ${error}`);
  }
}

/**
 * Get Google Calendar event details
 * API Docs: https://developers.google.com/calendar/api/v3/reference/events/get
 */
export async function getGoogleCalendarEvent(
  eventId: string,
  accessToken: string
): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Google Calendar event: ${error}`);
  }

  return response.json();
}

/**
 * Update Google Calendar event (for rescheduling)
 * API Docs: https://developers.google.com/calendar/api/v3/reference/events/patch
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  params: Partial<GoogleMeetEventParams>,
  accessToken: string
): Promise<void> {
  const requestBody: any = {};

  if (params.summary) requestBody.summary = params.summary;
  if (params.description) requestBody.description = params.description;

  if (params.startTime) {
    requestBody.start = {
      dateTime: params.startTime,
      timeZone: params.timezone || 'UTC',
    };
  }

  if (params.endTime) {
    requestBody.end = {
      dateTime: params.endTime,
      timeZone: params.timezone || 'UTC',
    };
  }

  if (params.attendees) {
    requestBody.attendees = params.attendees.map((email) => ({ email }));
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Google Calendar event: ${error}`);
  }
}

/**
 * Check if user has Google Calendar connected
 */
export async function hasGoogleCalendarConnected(userId: string): Promise<boolean> {
  // This would check the user_integrations table
  // Implementation depends on how we store integration tokens
  // For now, return a placeholder
  return false;
}
