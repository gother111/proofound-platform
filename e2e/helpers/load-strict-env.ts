import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';

let strictEnvLoaded = false;

export function loadStrictEnv(): void {
  if (strictEnvLoaded) {
    return;
  }

  strictEnvLoaded = true;

  const envFile = process.env.STRICT_ENV_FILE || '.env.local';
  const envPath = path.resolve(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    return;
  }

  loadEnv({
    path: envPath,
    override: false,
  });
}
