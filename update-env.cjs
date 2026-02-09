const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const envExamplePath = path.join(repoRoot, '.env.example');
const envLocalPath = path.join(repoRoot, '.env.local');

const force = process.argv.includes('--force');

if (!fs.existsSync(envExamplePath)) {
  console.error('❌ Missing .env.example. Expected at:', envExamplePath);
  process.exit(1);
}

if (fs.existsSync(envLocalPath) && !force) {
  console.log('✅ .env.local already exists. No changes made.');
  console.log('   Re-run with --force to overwrite from .env.example (will remove your local values).');
  process.exit(0);
}

fs.copyFileSync(envExamplePath, envLocalPath);
console.log('✅ Wrote .env.local from .env.example');
console.log('   Next: fill in your Supabase/Resend/etc values locally (do not commit secrets).');
