import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateCSRFToken, setCSRFTokenCookie } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf-token
 *
 * Returns a CSRF token for the client to use in subsequent mutating requests.
 * Sets the token in an httpOnly cookie and returns it in the response body.
 */
export async function GET(request: NextRequest) {
  // Get existing token or generate new one
  const token = await getOrGenerateCSRFToken(request);

  // Create response with token
  const response = NextResponse.json(
    {
      token,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );

  // Set token in httpOnly cookie
  setCSRFTokenCookie(response, token);

  return response;
}
