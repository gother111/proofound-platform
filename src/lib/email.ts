import { Resend } from 'resend';
import { VerifyEmail } from '../../emails/VerifyEmail';
import { ResetPassword } from '../../emails/ResetPassword';
import { OrgInvite } from '../../emails/OrgInvite';

// Allow build to succeed without RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key');
const fromEmail = process.env.EMAIL_FROM || 'Proofound <no-reply@proofound.com>';

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify your email - Proofound',
      react: VerifyEmail({ verifyUrl }),
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset your password - Proofound',
      react: ResetPassword({ resetUrl }),
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendOrgInviteEmail(
  email: string,
  orgName: string,
  role: string,
  token: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${token}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `You've been invited to join ${orgName} on Proofound`,
      react: OrgInvite({ orgName, role, inviteUrl }),
    });
  } catch (error) {
    console.error('Failed to send org invite email:', error);
    throw new Error('Failed to send org invite email');
  }
}
