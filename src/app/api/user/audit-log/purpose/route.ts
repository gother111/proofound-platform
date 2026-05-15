import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'Retired individual purpose audit history is not an active MVP surface.',
    },
    { status: 410 }
  );
}
