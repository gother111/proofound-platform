/**
 * Google Meet Integration
 * PRD I-21: Interview scheduling with automatic video link generation
 * 
 * Requires:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN (for service account or OAuth)
 */

interface GoogleMeetParams {
  summary: string;
  startTime: Date;
  duration: number; // minutes
  attendees?: string[];
}

/**
 * Get Google OAuth token
 * Note: In production, you'll need to implement proper OAuth flow
 * or use a service account
 */
async function getGoogleToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google credentials not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN');
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const response = await fetch(tokenUrl, {
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
    throw new Error(`Google OAuth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a Google Meet link via Calendar API
 * Google Meet links are created as part of Calendar events
 */
export async function createGoogleMeet(params: GoogleMeetParams): Promise<string> {
  try {
    const token = await getGoogleToken();

    // Calculate end time
    const endTime = new Date(params.startTime.getTime() + params.duration * 60 * 1000);

    const eventData = {
      summary: params.summary,
      start: {
        dateTime: params.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: `proofound-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      attendees: params.attendees?.map(email => ({ email })) || [],
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
    }

    const event = await response.json();

    // Extract Meet link
    const meetLink = event.conferenceData?.entryPoints?.find(
      (ep: any) => ep.entryPointType === 'video'
    )?.uri;

    if (!meetLink) {
      throw new Error('Failed to create Google Meet link');
    }

    return meetLink;
  } catch (error) {
    console.error('Google Meet creation failed:', error);
    throw error;
  }
}

/**
 * Delete a Google Calendar event (and its Meet link)
 */
export async function deleteGoogleMeetEvent(eventId: string): Promise<void> {
  try {
    const token = await getGoogleToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok && response.status !== 404 && response.status !== 410) {
      const error = await response.json();
      throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('Google Meet event deletion failed:', error);
    throw error;
  }
}

/**
 * Update a Google Calendar event
 */
export async function updateGoogleMeetEvent(
  eventId: string,
  params: Partial<GoogleMeetParams>
): Promise<void> {
  try {
    const token = await getGoogleToken();

    const updateData: any = {};
    if (params.summary) updateData.summary = params.summary;
    if (params.startTime && params.duration) {
      const endTime = new Date(params.startTime.getTime() + params.duration * 60 * 1000);
      updateData.start = {
        dateTime: params.startTime.toISOString(),
        timeZone: 'UTC',
      };
      updateData.end = {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      };
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('Google Meet event update failed:', error);
    throw error;
  }
}
