import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Private check-in history export moved',
      message: 'Use GET /api/wellbeing/checkin or GET /api/wellbeing/export instead.',
    },
    { status: 410 }
  );
}
