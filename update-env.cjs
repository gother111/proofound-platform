const fs = require('fs');
const path = require('path');

const content = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cjpfrgmsxwxhuomnvciq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcGZyZ21zeHd4aHVvbW52Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODM3NzEsImV4cCI6MjA3NTc1OTc3MX0.3QEig0RLF9rpf6pCURJ9WGTksGQLLC5gfKeKRn5TPQk

# Site URL
NEXT_PUBLIC_SITE_URL=https://proofound.io

# Database URL - Force IPv4 by resolving hostname to IP
DATABASE_URL=postgresql://postgres:Gara1299442!@db.cjpfrgmsxwxhuomnvciq.supabase.co:5432/postgres?sslmode=require&connect_timeout=10

# PII Hash Salt
PII_HASH_SALT=be059d0e80b53a26f6c6c4c5109ce9a91c74c380abc6e07d14351e923200a5d7

CRON_SECRET=3f37289d2bd45de0996ddf0e8f1a0304e2f5bde808ff63b150fe58bc3ca70021

# Veriff
VERIFF_API_KEY=9ce9d061-20f0-452b-b546-382e6252e492
VERIFF_BASE_URL=https://stationapi.veriff.com
VERIFF_API_SECRET=fe6a7efe-cea8-4a38-9bb1-fe2085757934

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcGZyZ21zeHd4aHVvbW52Y2lxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE4Mzc3MSwiZXhwIjoyMDc1NzU5NzcxfQ.wpmzx6KoUj9r--U6V2ADuu8bS6adrc1lOTnlV1vWyY0

RESEND_API_KEY=re_6HzSytvF_KWzYhg8WAGFT3QMvuGQdKnSA

# === Zoom OAuth ===
ZOOM_CLIENT_ID=g7V_nQGwRIi62IB1ehQMKA
ZOOM_CLIENT_SECRET=lca8ryaUz4aca25NIpPypCE54vyZafxb
ZOOM_REDIRECT_URI=https://proofound.io/api/auth/zoom/callback

# Force IPv4 for Node.js
NODE_OPTIONS=--dns-result-order=ipv4first


GITHUB_TOKEN=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

VERCEL_TOKEN=LKLCRRIiRC7RxBoR2MPHb8lO
`;

fs.writeFileSync(path.join(process.cwd(), '.env.local'), content);
console.log('.env.local updated successfully');
