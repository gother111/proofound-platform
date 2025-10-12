'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import type { AuthError } from '@supabase/supabase-js';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type SignInState = {
  error: string | null;
};

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export async function signUp(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const identifier = getRateLimitIdentifier(ip);

  // Rate limit check
  const allowed = await checkRateLimit(identifier, 'signup');
  if (!allowed) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const result = signUpSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid email or password' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signIn(
  _prevState: SignInState | undefined,
  formData: FormData
): Promise<SignInState> {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const identifier = getRateLimitIdentifier(ip);

  const allowed = await checkRateLimit(identifier, 'signin');
  if (!allowed) {
    return { error: 'Too many login attempts. Please wait a moment and try again.' };
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const result = signInSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Enter a valid email address and password.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { error: mapSupabaseSignInError(error) };
  }

  revalidatePath('/', 'layout');
  redirect('/app/i/home');

  return { error: null };
}

function mapSupabaseSignInError(error: AuthError): string {
  if (error.status === 400 || error.status === 401) {
    return 'Email or password is incorrect.';
  }

  if (error.status === 422 || /confirm/gi.test(error.message)) {
    return 'Please verify your email before logging in. Check your inbox for the verification link.';
  }

  switch (error.message) {
    case 'Invalid login credentials':
    case 'Invalid email or password':
      return 'Email or password is incorrect.';
    case 'Email not confirmed':
      return 'Please verify your email before logging in. Check your inbox for the verification link.';
    default:
      return 'We could not log you in. Please try again or reset your password.';
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordReset(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const identifier = getRateLimitIdentifier(ip);

  const allowed = await checkRateLimit(identifier, 'reset-password');
  if (!allowed) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const data = {
    email: formData.get('email') as string,
  };

  const result = resetPasswordSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid email' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function confirmPasswordReset(formData: FormData) {
  const password = formData.get('password') as string;

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyEmail(formData: FormData) {
  const token = formData.get('token') as string;

  if (!token) {
    return { error: 'No verification token provided' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email',
  });

  if (error) {
    return { error: 'Invalid or expired verification link' };
  }

  return { success: true };
}
