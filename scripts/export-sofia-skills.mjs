import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && !key.startsWith('#') && values.length > 0) {
      const value = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (err) {
  console.error('Could not load .env.local file', err);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SOFIA_ID = '0584f063-58cd-4e1f-a95d-c54c105a7ac0';

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    skills: [],
  };

  const { data: skills, error } = await supabase
    .from('skills')
    .select('*')
    .eq('profile_id', SOFIA_ID)
    .order('skill_id');

  if (error) {
    report.error = error.message;
  } else {
    report.skills = skills?.map((skill) => ({
      id: skill.id,
      skill_id: skill.skill_id,
      skill_code: skill.skill_code,
      level: skill.level,
      months_experience: skill.months_experience,
    })) || [];
  }

  const tmpDir = join(__dirname, '..', 'tmp');
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(join(tmpDir, 'sofia-skills-report.json'), JSON.stringify(report, null, 2));
}

main();

