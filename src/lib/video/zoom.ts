/**
 * Zoom Meeting Integration
 * PRD I-21: Interview scheduling with automatic video link generation
 * 
 * Requires:
 * - ZOOM_CLIENT_ID
 * - ZOOM_CLIENT_SECRET
 * - ZOOM_ACCOUNT_ID (for Server-to-Server OAuth)
 */

interface ZoomMeetingParams {
  topic: string;
  startTime: Date;
  duration: number; // minutes
  timezone?: string;
  password?: string;
}

interface ZoomMeetingResponse {
  id: string;
  joinUrl: string;
  startUrl: string;
  password?: string;
  meetingId: string;
}

/**
 * Get Zoom OAuth token using Server-to-Server OAuth
 */
async function getZoomToken(): Promise<string> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;

  if (!clientId || !clientSecret || !accountId) {
    throw new Error('Zoom credentials not configured. Please set ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_ACCOUNT_ID');
  }

  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom OAuth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(
  params: ZoomMeetingParams
): Promise<ZoomMeetingResponse> {
  try {
    const token = await getZoomToken();

    // Format start time for Zoom API (ISO 8601)
    const startTime = params.startTime.toISOString();

    const meetingData = {
      topic: params.topic,
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration: params.duration,
      timezone: params.timezone || 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: false,
        auto_recording: 'none',
      },
    };

    // Use 'me' as userId for the authenticated user's account
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zoom API error: ${JSON.stringify(error)}`);
    }

    const meeting = await response.json();

    return {
      id: meeting.id.toString(),
      joinUrl: meeting.join_url,
      startUrl: meeting.start_url,
      password: meeting.password,
      meetingId: meeting.id.toString(),
    };
  } catch (error) {
    console.error('Zoom meeting creation failed:', error);
    throw error;
  }
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  try {
    const token = await getZoomToken();

    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(`Zoom API error: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('Zoom meeting deletion failed:', error);
    throw error;
  }
}

/**
 * Update a Zoom meeting
 */
export async function updateZoomMeeting(
  meetingId: string,
  params: Partial<ZoomMeetingParams>
): Promise<void> {
  try {
    const token = await getZoomToken();

    const updateData: any = {};
    if (params.topic) updateData.topic = params.topic;
    if (params.startTime) updateData.start_time = params.startTime.toISOString();
    if (params.duration) updateData.duration = params.duration;
    if (params.timezone) updateData.timezone = params.timezone;

    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zoom API error: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('Zoom meeting update failed:', error);
    throw error;
  }
}
