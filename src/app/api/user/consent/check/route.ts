/**
 * Policy Consent Check API
 *
 * Check if user needs to re-consent to updated policies
 *
 * GET /api/user/consent/check
 * Returns: { needsConsent, tosUpToDate, privacyUpToDate, missingConsents[] }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConsentCheck } from '@/lib/workflow/service';
import { log } from '@/lib/log';

export async function GET() {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check consent status
    const consentStatus = await getConsentCheck(user.id);

    return NextResponse.json(consentStatus);
  } catch (error) {
    log.error('user.consent_check.get_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
