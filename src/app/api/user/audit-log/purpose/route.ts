import { NextResponse } from 'next/server';

/**
 * Legacy purpose-audit compatibility route archived outside the locked launch MVP.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'Retired individual purpose audit history is not an active MVP surface.',
    },
    { status: 410 }
  );
}
