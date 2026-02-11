import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

export const PRIVACY_REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

type LoadedSource = '.env.test' | '.env.local' | 'process-env';

export type PrivacyEnvLoadResult = {
  source: LoadedSource;
  loadedFromPath: string | null;
};

function envFileExists(filePath: string) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export function loadPrivacyEnv(cwd: string = process.cwd()): PrivacyEnvLoadResult {
  const envTestPath = path.resolve(cwd, '.env.test');
  const envLocalPath = path.resolve(cwd, '.env.local');

  if (envFileExists(envTestPath)) {
    config({ path: envTestPath });
    return { source: '.env.test', loadedFromPath: envTestPath };
  }

  if (envFileExists(envLocalPath)) {
    config({ path: envLocalPath });
    return { source: '.env.local', loadedFromPath: envLocalPath };
  }

  return { source: 'process-env', loadedFromPath: null };
}

export function getMissingPrivacyEnvVars(source: NodeJS.ProcessEnv = process.env): string[] {
  return PRIVACY_REQUIRED_ENV_KEYS.filter((key) => !source[key]);
}
