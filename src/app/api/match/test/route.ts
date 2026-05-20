import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Legacy matching compatibility route archived outside the locked launch MVP.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Core Matching API is not part of the launch MVP corridor.',
      message:
        'Trial-match compatibility data is archived for launch. Use the canonical proof-first matching corridor instead.',
      surface: 'Core Matching API',
      launchState: 'non_launch',
    },
    { status: 410 }
  );
}
