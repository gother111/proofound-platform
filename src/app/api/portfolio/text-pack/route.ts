import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchTrustExportData } from '@/lib/portfolio/export-data';
import { respondWithText } from '@/lib/portfolio/export-response';
import { buildTextPack } from '@/lib/portfolio/text-pack';
import { log } from '@/lib/log';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await fetchTrustExportData(supabase, user.id);
    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const text = buildTextPack(data);
    return respondWithText(text, `proofound-${data.profile.handle}-summary.txt`);
  } catch (error) {
    log.error('portfolio.text_pack.failed', { error });
    return NextResponse.json({ error: 'Failed to build text pack' }, { status: 500 });
  }
}
