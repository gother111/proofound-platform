import { describe, expect, it } from 'vitest';
import {
  buildAuthTemplate,
  buildFallbackAuthTemplate,
  buildSupabaseAuthTemplatePatch,
  getSupabaseAuthTemplateKinds,
  SUPABASE_AUTH_TEMPLATE_FIELDS,
} from '@/lib/email/auth-templates';

describe('auth email templates', () => {
  it('builds non-empty subjects and html/text bodies for each auth template kind', () => {
    for (const kind of getSupabaseAuthTemplateKinds()) {
      const template = buildAuthTemplate(kind);
      expect(template.subject.length).toBeGreaterThan(0);
      expect(template.html.length).toBeGreaterThan(0);
      expect(template.text.length).toBeGreaterThan(0);
      expect(template.html).toContain('Proofound');
    }
  });

  it('contains required placeholders in Supabase auth template patch', () => {
    const patch = buildSupabaseAuthTemplatePatch();

    expect(patch.mailer_templates_confirmation_content).toContain('{{ .ConfirmationURL }}');
    expect(patch.mailer_templates_recovery_content).toContain('{{ .ConfirmationURL }}');
    expect(patch.mailer_templates_magic_link_content).toContain('{{ .ConfirmationURL }}');
    expect(patch.mailer_templates_invite_content).toContain('{{ .ConfirmationURL }}');
    expect(patch.mailer_templates_email_change_content).toContain('{{ .NewEmail }}');
    expect(patch.mailer_templates_reauthentication_content).toContain('{{ .Token }}');

    for (const kind of getSupabaseAuthTemplateKinds()) {
      const fields = SUPABASE_AUTH_TEMPLATE_FIELDS[kind];
      expect(patch[fields.subjectKey]).toMatch(/Proofound/);
      expect(patch[fields.contentKey]).toContain('<html');
    }
  });

  it('uses shared branded fallback template rendering for signup and recovery', () => {
    const signup = buildFallbackAuthTemplate('signup', 'https://example.com/verify');
    expect(signup.subject).toBe('Verify your email - Proofound');
    expect(signup.html).toContain('Verify your email');
    expect(signup.text).toContain('https://example.com/verify');

    const recovery = buildFallbackAuthTemplate('recovery', 'https://example.com/reset');
    expect(recovery.subject).toBe('Reset your password - Proofound');
    expect(recovery.html).toContain('Reset your password');
    expect(recovery.text).toContain('https://example.com/reset');
  });
});
