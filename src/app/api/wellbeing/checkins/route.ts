import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Zen Hub history export moved',
      message: 'Use GET /api/wellbeing/checkin or GET /api/wellbeing/export instead.',
    },
    { status: 410 }
  );
}
