import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import {
  buildSupabaseAuthTemplatePatch,
  getSupabaseAuthTemplateKinds,
  SUPABASE_AUTH_TEMPLATE_FIELDS,
  type AuthEmailTemplateKind,
} from '../src/lib/email/auth-templates';

const SUPABASE_MANAGEMENT_API_BASE = 'https://api.supabase.com/v1';

dotenv.config({ path: '.env.local' });
dotenv.config();

export type SupabaseAuthConfig = Record<string, unknown>;

interface BuildPatchResult {
  patch: Record<string, string>;
  supportedKinds: AuthEmailTemplateKind[];
  skippedKinds: AuthEmailTemplateKind[];
}

interface ScriptOptions {
  projectRef: string;
  accessToken: string;
  apply: boolean;
  siteUrlTemplate: string;
}

function getArgValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }

  const value = process.argv[index + 1];
  return value ?? null;
}

function hasArg(name: string): boolean {
  return process.argv.includes(name);
}

function requireSetting(value: string | null | undefined, name: string): string {
  if (value && value.trim()) {
    return value.trim();
  }

  throw new Error(`${name} is required. Provide it via CLI argument or environment variable.`);
}

function resolveProjectRefFromUrl(urlValue: string | undefined): string | null {
  if (!urlValue) {
    return null;
  }

  try {
    const parsed = new URL(urlValue);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('supabase.')) {
      return null;
    }

    const projectRef = host.split('.')[0];
    return projectRef || null;
  } catch {
    return null;
  }
}

function parseScriptOptions(): ScriptOptions {
  const projectRefFromUrl =
    resolveProjectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    resolveProjectRefFromUrl(process.env.SUPABASE_URL);

  const projectRef = requireSetting(
    getArgValue('--project-ref') ?? process.env.SUPABASE_PROJECT_REF ?? projectRefFromUrl,
    'SUPABASE_PROJECT_REF'
  );

  const accessToken = requireSetting(
    getArgValue('--access-token') ?? process.env.SUPABASE_ACCESS_TOKEN,
    'SUPABASE_ACCESS_TOKEN'
  );

  const siteUrlTemplate = getArgValue('--site-url-template') ?? '{{ .SiteURL }}';

  return {
    projectRef,
    accessToken,
    apply: hasArg('--apply'),
    siteUrlTemplate,
  };
}

function authConfigUrl(projectRef: string): string {
  return `${SUPABASE_MANAGEMENT_API_BASE}/projects/${projectRef}/config/auth`;
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase Management API request failed (${response.status} ${response.statusText}): ${bodyText}`
    );
  }

  if (!bodyText.trim()) {
    return {} as T;
  }

  return JSON.parse(bodyText) as T;
}

export async function fetchSupabaseAuthConfig(
  projectRef: string,
  accessToken: string
): Promise<SupabaseAuthConfig> {
  return requestJson<SupabaseAuthConfig>(authConfigUrl(projectRef), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function patchSupabaseAuthConfig(
  projectRef: string,
  accessToken: string,
  patch: Record<string, string>
): Promise<SupabaseAuthConfig> {
  return requestJson<SupabaseAuthConfig>(authConfigUrl(projectRef), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
}

export function getSupportedTemplateKinds(config: SupabaseAuthConfig): AuthEmailTemplateKind[] {
  const allKinds = getSupabaseAuthTemplateKinds();

  return allKinds.filter((kind) => {
    const fields = SUPABASE_AUTH_TEMPLATE_FIELDS[kind];
    return fields.subjectKey in config || fields.contentKey in config;
  });
}

export function buildPatchForAuthConfig(
  config: SupabaseAuthConfig,
  siteUrlTemplate = '{{ .SiteURL }}'
): BuildPatchResult {
  const allKinds = getSupabaseAuthTemplateKinds();
  const supportedKinds = getSupportedTemplateKinds(config);
  const skippedKinds = allKinds.filter((kind) => !supportedKinds.includes(kind));

  const generated = buildSupabaseAuthTemplatePatch({
    includeKinds: supportedKinds,
    siteUrl: siteUrlTemplate,
  });

  const patch: Record<string, string> = {};

  for (const kind of supportedKinds) {
    const fields = SUPABASE_AUTH_TEMPLATE_FIELDS[kind];

    if (fields.subjectKey in config) {
      patch[fields.subjectKey] = generated[fields.subjectKey];
    }

    if (fields.contentKey in config) {
      patch[fields.contentKey] = generated[fields.contentKey];
    }
  }

  return {
    patch,
    supportedKinds,
    skippedKinds,
  };
}

export function summarizePatch(patch: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [key, `${value.length} chars`])
  );
}

async function writeBackupSnapshot(
  projectRef: string,
  config: SupabaseAuthConfig
): Promise<string> {
  const directory = path.join(process.cwd(), 'artifacts', 'supabase-auth-config');
  await fs.mkdir(directory, { recursive: true });

  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  const filePath = path.join(directory, `${timestamp}-${projectRef}.json`);

  await fs.writeFile(filePath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return filePath;
}

export async function runSync(options: ScriptOptions): Promise<void> {
  const currentConfig = await fetchSupabaseAuthConfig(options.projectRef, options.accessToken);
  const backupFile = await writeBackupSnapshot(options.projectRef, currentConfig);

  const { patch, supportedKinds, skippedKinds } = buildPatchForAuthConfig(
    currentConfig,
    options.siteUrlTemplate
  );

  if (supportedKinds.length === 0) {
    throw new Error('No supported auth template keys detected on this Supabase project config.');
  }

  if (Object.keys(patch).length === 0) {
    throw new Error('Detected template kinds but no patchable keys were available.');
  }

  console.log('Supabase auth template sync');
  console.log(`Project ref: ${options.projectRef}`);
  console.log(`Backup snapshot: ${backupFile}`);
  console.log(`Supported kinds: ${supportedKinds.join(', ')}`);

  if (skippedKinds.length > 0) {
    console.log(`Skipped kinds (unsupported by current auth config): ${skippedKinds.join(', ')}`);
  }

  console.log('Patch summary:');
  console.table(summarizePatch(patch));

  if (!options.apply) {
    console.log('Dry run complete. Re-run with --apply to push templates to Supabase Auth.');
    return;
  }

  await patchSupabaseAuthConfig(options.projectRef, options.accessToken, patch);
  console.log('Templates were updated in Supabase Auth config.');
}

export async function main(): Promise<void> {
  const options = parseScriptOptions();
  await runSync(options);
}

const isDirectRun =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to sync Supabase auth templates: ${message}`);
    process.exit(1);
  });
}
