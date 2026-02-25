import { describe, expect, it } from 'vitest';
import {
  buildPatchForAuthConfig,
  getSupportedTemplateKinds,
  summarizePatch,
} from '../../scripts/sync-supabase-auth-templates';

describe('sync-supabase-auth-templates', () => {
  it('detects supported kinds from present auth config keys', () => {
    const config = {
      mailer_subjects_confirmation: 'old',
      mailer_templates_confirmation_content: '<p>old</p>',
      mailer_subjects_recovery: 'old',
      mailer_templates_recovery_content: '<p>old</p>',
    };

    expect(getSupportedTemplateKinds(config)).toEqual(['confirmation', 'recovery']);
  });

  it('builds patch only for keys supported by current project config', () => {
    const config = {
      mailer_subjects_confirmation: 'old subject',
      mailer_templates_confirmation_content: 'old html',
      mailer_subjects_reauthentication: 'old reauth subject',
    };

    const { patch, supportedKinds, skippedKinds } = buildPatchForAuthConfig(config);

    expect(supportedKinds).toEqual(['confirmation', 'reauthentication']);
    expect(skippedKinds).toContain('recovery');
    expect(patch.mailer_subjects_confirmation).toContain('Proofound');
    expect(patch.mailer_templates_confirmation_content).toContain('{{ .ConfirmationURL }}');
    expect(patch.mailer_subjects_reauthentication).toContain('Proofound');
    expect(patch.mailer_templates_reauthentication_content).toBeUndefined();
  });

  it('summarizes patch values without printing full template body', () => {
    const summary = summarizePatch({
      mailer_subjects_confirmation: 'Verify your email - Proofound',
      mailer_templates_confirmation_content: '<html>..</html>',
    });

    expect(summary.mailer_subjects_confirmation).toBe('29 chars');
    expect(summary.mailer_templates_confirmation_content).toBe('15 chars');
  });
});
