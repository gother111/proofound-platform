/**
 * Zoom API Integration
 *
 * Handles Zoom OAuth and meeting creation
 * PRD Requirement: Video conferencing integration for interviews
 */

import { log } from '@/lib/log';

export interface ZoomMeeting {
  id: string;
  join_url: string;
  start_url: string;
  password?: string;
  topic: string;
  start_time: string;
  duration: number;
  timezone: string;
}

export interface CreateZoomMeetingParams {
  topic: string;
  start_time: string; // ISO 8601 format
  duration: number; // minutes
  timezone?: string;
  agenda?: string;
}

/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(
  accessToken: string,
  params: CreateZoomMeetingParams
): Promise<ZoomMeeting> {
  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: params.topic,
        type: 2, // Scheduled meeting
        start_time: params.start_time,
        duration: params.duration,
        timezone: params.timezone || 'UTC',
        agenda: params.agenda || '',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          audio: 'voip',
          auto_recording: 'none',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zoom API error: ${error.message || response.statusText}`);
    }

    const meeting = await response.json();

    log.info('zoom.meeting.created', {
      meetingId: meeting.id,
      topic: params.topic,
      duration: params.duration,
    });

    return {
      id: meeting.id.toString(),
      join_url: meeting.join_url,
      start_url: meeting.start_url,
      password: meeting.password,
      topic: meeting.topic,
      start_time: meeting.start_time,
      duration: meeting.duration,
      timezone: meeting.timezone,
    };
  } catch (error) {
    log.error('zoom.meeting.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeZoomCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Zoom OAuth error: ${error.error_description || response.statusText}`);
  }

  return response.json();
}

/**
 * Refresh Zoom access token
 */
export async function refreshZoomToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Zoom token refresh error: ${error.error_description || response.statusText}`);
  }

  return response.json();
}

/**
 * Get Zoom authorization URL
 */
export function getZoomAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.ZOOM_CLIENT_ID;

  if (!clientId) {
    throw new Error('Zoom client ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

/**
 * Revoke Zoom access
 */
export async function revokeZoomAccess(accessToken: string): Promise<void> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  await fetch('https://zoom.us/oauth/revoke', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token: accessToken,
    }).toString(),
  });
}
