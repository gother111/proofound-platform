import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Private check-in trend analytics are not part of MVP',
      message: 'This endpoint is disabled in the private check-ins MVP corridor.',
    },
    { status: 410 }
  );
}
