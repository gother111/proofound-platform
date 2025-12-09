import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  persona: z.enum(['individual', 'org_member']),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Privacy Policy and Terms of Service',
  }),
  marketingOptIn: z.boolean().optional(),
});

export function mapSignUpValidationError(error: z.ZodError): string {
  const passwordIssue = error.issues.find((issue) => issue.path[0] === 'password');
  if (passwordIssue && /least 8/.test(passwordIssue.message)) {
    return 'Password must be at least 8 characters';
  }

  const gdprIssue = error.issues.find((issue) => issue.path[0] === 'gdprConsent');
  if (gdprIssue) {
    return gdprIssue.message;
  }

  const emailIssue = error.issues.find((issue) => issue.path[0] === 'email');
  if (emailIssue) {
    return 'Enter a valid email address.';
  }

  return 'Enter a valid email, password (8+ characters), and account type.';
}
