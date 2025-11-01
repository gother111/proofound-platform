/**
 * Zoom API Integration
 * 
 * Functions for creating, updating, and canceling Zoom meetings
 */

import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export interface CreateZoomMeetingParams {
  userId: string;
  topic: string;
  startTime: Date;
  duration: number; // minutes
  timezone: string;
  attendees: Array<{ email: string; name: string }>;
}

export interface ZoomMeetingResult {
  meetingId: string;
  meetingUrl: string;
  joinUrl: string;
  password?: string;
}

/**
 * Refresh Zoom access token if expired
 */
async function refreshZoomToken(integration: any): Promise<string> {
  const tokenUrl = 'https://zoom.us/oauth/token';
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: integration.refreshToken,
  });

  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Zoom token');
  }

  const data = await response.json();

  // Update stored token
  const expiresIn = data.expires_in || 3600;
  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

  await db
    .update(userIntegrations)
    .set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || integration.refreshToken,
      tokenExpiry,
      updatedAt: new Date(),
    })
    .where(eq(userIntegrations.id, integration.id));

  return data.access_token;
}

/**
 * Get valid Zoom access token (refresh if needed)
 */
async function getZoomToken(userId: string): Promise<string> {
  const integration = await db
    .select()
    .from(userIntegrations)
    .where(
      and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, 'zoom')
      )
    )
    .limit(1);

  if (!integration.length) {
    throw new Error('Zoom integration not found. Please connect your Zoom account.');
  }

  const integrationData = integration[0];

  // Check if token is expired or about to expire (within 5 minutes)
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() + 5 * 60 * 1000);

  if (integrationData.tokenExpiry < expiryThreshold) {
    return await refreshZoomToken(integrationData);
  }

  return integrationData.accessToken;
}

/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(
  params: CreateZoomMeetingParams
): Promise<ZoomMeetingResult> {
  const accessToken = await getZoomToken(params.userId);

  // Format start time in ISO 8601 format
  const startTime = params.startTime.toISOString();

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration: params.duration,
      timezone: params.timezone,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        waiting_room: true,
        auto_recording: 'none',
        // Add attendees as alternative hosts if needed
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Zoom API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();

  return {
    meetingId: data.id.toString(),
    meetingUrl: data.join_url,
    joinUrl: data.join_url,
    password: data.password,
  };
}

/**
 * Update a Zoom meeting
 */
export async function updateZoomMeeting(
  userId: string,
  meetingId: string,
  updates: Partial<CreateZoomMeetingParams>
): Promise<void> {
  const accessToken = await getZoomToken(userId);

  const body: any = {};

  if (updates.topic) body.topic = updates.topic;
  if (updates.startTime) body.start_time = updates.startTime.toISOString();
  if (updates.duration) body.duration = updates.duration;
  if (updates.timezone) body.timezone = updates.timezone;

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Zoom API error: ${JSON.stringify(errorData)}`);
  }
}

/**
 * Cancel a Zoom meeting
 */
export async function cancelZoomMeeting(
  userId: string,
  meetingId: string
): Promise<void> {
  const accessToken = await getZoomToken(userId);

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json();
    throw new Error(`Zoom API error: ${JSON.stringify(errorData)}`);
  }
}
