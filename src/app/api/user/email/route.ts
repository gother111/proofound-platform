import { NextRequest, NextResponse } from 'next/server';
import { safeApiErrorResponse } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/user/email
 *
 * Updates the user's email address via Supabase auth
 * Sends verification email to the new address
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Update user email via Supabase auth
    // This will send a confirmation email to the new address
    const { data, error } = await supabase.auth.updateUser({
      email: email,
    });

    if (error) {
      return safeApiErrorResponse({
        event: 'user.email.update_failed',
        error,
        status: 400,
        publicMessage: 'Unable to update email. Please check the address or try again later.',
        context: { userId: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email update initiated. Please check your new email for confirmation.',
      user: data.user,
    });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'user.email.update_unexpected',
      error,
      status: 500,
      publicMessage: 'Unable to update email. Please try again later.',
    });
  }
}

/**
 * GET /api/user/email
 *
 * Returns the current user's email address
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      email: user.email || null,
      emailConfirmedAt: user.email_confirmed_at || null,
    });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'user.email.get_failed',
      error,
      status: 500,
      publicMessage: 'Unable to load email settings. Please try again later.',
    });
  }
}
