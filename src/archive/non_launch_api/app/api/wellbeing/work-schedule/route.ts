import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Burnout schedule tracking is deferred',
      message: 'This endpoint is disabled in the private check-ins MVP corridor.',
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Burnout schedule tracking is deferred',
      message: 'This endpoint is disabled in the private check-ins MVP corridor.',
    },
    { status: 410 }
  );
}
