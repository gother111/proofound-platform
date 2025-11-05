/**
 * Zoom API Integration
 * Implements PRD Gap 1: Interview scheduling with Zoom
 *
 * Features:
 * - OAuth 2.0 authentication
 * - Meeting creation (30 minutes, fixed duration per PRD)
 * - Meeting cancellation
 * - Calendar invite generation
 */

interface ZoomMeetingParams {
  topic: string;
  startTime: string; // ISO 8601 format
  duration: number; // minutes (default 30 per PRD)
  hostEmail: string;
  participantEmails: string[];
  timezone?: string;
}

interface ZoomMeetingResponse {
  id: string;
  joinUrl: string;
  startUrl: string;
  password?: string;
  h323Password?: string;
  settings: {
    hostVideo: boolean;
    participantVideo: boolean;
    joinBeforeHost: boolean;
    muteUponEntry: boolean;
    waitingRoom: boolean;
    autoRecording: string;
  };
}

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

/**
 * Get Zoom OAuth access token using server-to-server OAuth
 * Docs: https://marketplace.zoom.us/docs/guides/build/server-to-server-oauth-app
 */
export async function getZoomAccessToken(): Promise<string> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;

  if (!clientId || !clientSecret || !accountId) {
    throw new Error('Missing Zoom OAuth credentials');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoom access token: ${error}`);
  }

  const data: ZoomTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Create a Zoom meeting
 * API Docs: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/meetingCreate
 */
export async function createZoomMeeting(params: ZoomMeetingParams): Promise<{
  meetingId: string;
  joinUrl: string;
  password?: string;
}> {
  const accessToken = await getZoomAccessToken();

  // PRD requirement: 30-minute fixed duration
  const duration = 30;

  const requestBody = {
    topic: params.topic,
    type: 2, // Scheduled meeting
    start_time: params.startTime,
    duration,
    timezone: params.timezone || 'UTC',
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: true,
      auto_recording: 'none',
      alternative_hosts: '', // Could add participant emails here if needed
      registrants_email_notification: false,
    },
  };

  // Use the host email to find their Zoom user ID
  // For MVP, we'll use 'me' which works with server-to-server OAuth
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Zoom meeting: ${error}`);
  }

  const meeting: ZoomMeetingResponse = await response.json();

  return {
    meetingId: String(meeting.id),
    joinUrl: meeting.joinUrl,
    password: meeting.password,
  };
}

/**
 * Cancel a Zoom meeting
 * API Docs: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/meetingDelete
 */
export async function cancelZoomMeeting(meetingId: string): Promise<void> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    // 404 is acceptable - meeting might already be deleted
    const error = await response.text();
    throw new Error(`Failed to cancel Zoom meeting: ${error}`);
  }
}

/**
 * Get Zoom meeting details
 * API Docs: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/meeting
 */
export async function getZoomMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoom meeting: ${error}`);
  }

  return response.json();
}

/**
 * Update a Zoom meeting (for rescheduling)
 * API Docs: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/meetingUpdate
 */
export async function updateZoomMeeting(
  meetingId: string,
  params: Partial<ZoomMeetingParams>
): Promise<void> {
  const accessToken = await getZoomAccessToken();

  const requestBody: any = {};
  if (params.topic) requestBody.topic = params.topic;
  if (params.startTime) requestBody.start_time = params.startTime;
  if (params.duration) requestBody.duration = params.duration;
  if (params.timezone) requestBody.timezone = params.timezone;

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Zoom meeting: ${error}`);
  }
}
