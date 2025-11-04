import { NextRequest, NextResponse } from 'next/server';
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

    const body = await request.json();
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
      console.error('Error updating email:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email update initiated. Please check your new email for confirmation.',
      user: data.user,
    });
  } catch (error) {
    console.error('Error in email update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    console.error('Error in get email API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
