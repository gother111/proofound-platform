import {
  type AuthEmailTemplate,
  type AuthEmailTemplateKind,
  type AuthEmailTemplateRenderOptions,
  getSupportedAuthTemplateKinds,
  renderAuthEmailTemplate,
} from './content';

export type { AuthEmailTemplate, AuthEmailTemplateKind, AuthEmailTemplateRenderOptions };

export interface SupabaseAuthTemplateFieldConfig {
  subjectKey: string;
  contentKey: string;
}

export const SUPABASE_AUTH_TEMPLATE_FIELDS: Record<
  AuthEmailTemplateKind,
  SupabaseAuthTemplateFieldConfig
> = {
  confirmation: {
    subjectKey: 'mailer_subjects_confirmation',
    contentKey: 'mailer_templates_confirmation_content',
  },
  recovery: {
    subjectKey: 'mailer_subjects_recovery',
    contentKey: 'mailer_templates_recovery_content',
  },
  magic_link: {
    subjectKey: 'mailer_subjects_magic_link',
    contentKey: 'mailer_templates_magic_link_content',
  },
  invite: {
    subjectKey: 'mailer_subjects_invite',
    contentKey: 'mailer_templates_invite_content',
  },
  email_change: {
    subjectKey: 'mailer_subjects_email_change',
    contentKey: 'mailer_templates_email_change_content',
  },
  reauthentication: {
    subjectKey: 'mailer_subjects_reauthentication',
    contentKey: 'mailer_templates_reauthentication_content',
  },
};

export function buildAuthTemplate(
  kind: AuthEmailTemplateKind,
  options?: AuthEmailTemplateRenderOptions
): AuthEmailTemplate {
  return renderAuthEmailTemplate(kind, options);
}

export function buildFallbackAuthTemplate(type: 'signup' | 'recovery', actionUrl: string) {
  const kind: AuthEmailTemplateKind = type === 'signup' ? 'confirmation' : 'recovery';
  return buildAuthTemplate(kind, { actionUrl });
}

export function buildSupabaseAuthTemplatePatch(options?: {
  siteUrl?: string;
  includeKinds?: AuthEmailTemplateKind[];
}): Record<string, string> {
  const includeKinds = options?.includeKinds ?? getSupportedAuthTemplateKinds();
  const siteUrl = options?.siteUrl ?? '{{ .SiteURL }}';

  const patch: Record<string, string> = {};

  for (const kind of includeKinds) {
    const fields = SUPABASE_AUTH_TEMPLATE_FIELDS[kind];
    const template = buildAuthTemplate(kind, { siteUrl });
    patch[fields.subjectKey] = template.subject;
    patch[fields.contentKey] = template.html;
  }

  return patch;
}

export function getSupabaseAuthTemplateKinds(): AuthEmailTemplateKind[] {
  return getSupportedAuthTemplateKinds();
}
