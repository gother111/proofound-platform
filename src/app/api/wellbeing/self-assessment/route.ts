import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Self-assessment is deferred',
      message: 'This endpoint is disabled in the Zen Hub MVP corridor.',
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Self-assessment is deferred',
      message: 'This endpoint is disabled in the Zen Hub MVP corridor.',
    },
    { status: 410 }
  );
}
