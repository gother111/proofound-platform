const fs = require('fs');
const path = require('path');

const targetPath = path.join(process.cwd(), '.env.local');
const force = process.argv.includes('--force');

if (fs.existsSync(targetPath) && !force) {
  console.error(
    'Refusing to overwrite existing .env.local. Re-run with --force if you want to replace it.'
  );
  process.exit(1);
}

const template = `# Proofound local environment template
# Fill values from your secret manager or Vercel project settings.
# Never commit real credentials.

NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Cron
CRON_SECRET=

# OAuth
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=http://localhost:3000/api/integrations/zoom/callback
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

# Verification
VERIFF_API_KEY=
VERIFF_API_SECRET=
VERIFF_BASE_URL=https://stationapi.veriff.com

# Runtime
NODE_OPTIONS=--dns-result-order=ipv4first
`;

fs.writeFileSync(targetPath, template, 'utf8');
console.log('.env.local template created. Populate values before running the app.');
