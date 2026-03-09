import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Zen Hub trend analytics are not part of MVP',
      message: 'This endpoint is disabled in the Zen Hub MVP corridor.',
    },
    { status: 410 }
  );
}
