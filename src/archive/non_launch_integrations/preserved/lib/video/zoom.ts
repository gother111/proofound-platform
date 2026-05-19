/**
 * Zoom API Wrapper
 *
 * Handles Zoom OAuth flow and meeting creation
 *
 * SETUP REQUIRED:
 * 1. Create Zoom OAuth app at https://marketplace.zoom.us/
 * 2. Add these to .env.local:
 *    ZOOM_CLIENT_ID=your_client_id
 *    ZOOM_CLIENT_SECRET=your_client_secret
 *    ZOOM_REDIRECT_URI=https://yourdomain.com/api/auth/zoom/callback
 * 3. Add redirect URI in Zoom app settings
 * 4. Enable scopes: meeting:write, meeting:read, user:read
 */

import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

interface ZoomMeetingConfig {
  topic: string;
  startTime: Date;
  duration: number; // minutes
  timezone: string;
  agenda?: string;
  attendeeEmails?: string[];
}

interface ZoomMeeting {
  id: string;
  joinUrl: string;
  hostUrl: string;
  password?: string;
}

/**
 * Get Zoom OAuth authorization URL
 */
export function getZoomAuthUrl(state: string): string {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const redirectUri = process.env.ZOOM_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      'Zoom OAuth credentials not configured. See src/lib/video/zoom.ts for setup instructions.'
    );
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `${ZOOM_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeZoomCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = process.env.ZOOM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Zoom OAuth credentials not configured');
  }

  const response = await fetch(ZOOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh Zoom access token
 */
export async function refreshZoomToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Zoom OAuth credentials not configured');
  }

  const response = await fetch(ZOOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get valid access token for user (refreshes if expired)
 */
async function getValidZoomToken(userId: string): Promise<string> {
  const [integration] = await db
    .select()
    .from(userIntegrations)
    .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'zoom')))
    .limit(1);

  if (!integration || !integration.accessToken) {
    throw new Error('Zoom not connected. Please connect your Zoom account first.');
  }

  // Check if token is expired
  const now = new Date();
  if (integration.tokenExpiry && now >= integration.tokenExpiry) {
    // Refresh token
    if (!integration.refreshToken) {
      throw new Error('Zoom token expired and no refresh token available');
    }

    const refreshed = await refreshZoomToken(integration.refreshToken);

    // Update database
    await db
      .update(userIntegrations)
      .set({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        tokenExpiry: new Date(Date.now() + refreshed.expiresIn * 1000),
        updatedAt: new Date(),
      })
      .where(eq(userIntegrations.id, integration.id));

    return refreshed.accessToken;
  }

  return integration.accessToken;
}

/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(
  userId: string,
  config: ZoomMeetingConfig
): Promise<ZoomMeeting> {
  const accessToken = await getValidZoomToken(userId);

  const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      topic: config.topic,
      type: 2, // Scheduled meeting
      start_time: config.startTime.toISOString(),
      duration: config.duration,
      timezone: config.timezone,
      agenda: config.agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        audio: 'both',
        auto_recording: 'none',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Zoom meeting: ${error}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    joinUrl: data.join_url,
    hostUrl: data.start_url,
    password: data.password,
  };
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(userId: string, meetingId: string): Promise<void> {
  const accessToken = await getValidZoomToken(userId);

  const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete Zoom meeting: ${error}`);
  }
}

/**
 * Check if user has Zoom connected
 */
export async function isZoomConnected(userId: string): Promise<boolean> {
  const [integration] = await db
    .select()
    .from(userIntegrations)
    .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'zoom')))
    .limit(1);

  return !!integration && !!integration.accessToken;
}
