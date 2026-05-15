import { NextRequest, NextResponse } from 'next/server';
import { safeApiErrorResponse } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/user/password
 *
 * Updates the user's password
 * Requires current password for security verification
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    // This is the recommended way to verify the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return safeApiErrorResponse({
        event: 'user.password.update_failed',
        error: updateError,
        status: 400,
        publicMessage: 'Unable to update password. Please try again later.',
        context: { userId: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'user.password.update_unexpected',
      error,
      status: 500,
      publicMessage: 'Unable to update password. Please try again later.',
    });
  }
}
