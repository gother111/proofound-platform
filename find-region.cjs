const postgres = require('postgres');

const path = require('path');
const fs = require('fs');
const { config } = require('dotenv');

const envTestPath = path.resolve(process.cwd(), '.env.test');
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envTestPath)) config({ path: envTestPath });
else if (fs.existsSync(envLocalPath)) config({ path: envLocalPath });

function parseProjectRef() {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
    if (supabaseUrl) {
        const host = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0] || '';
        if (host.endsWith('.supabase.co')) {
            const ref = host.split('.')[0];
            if (ref) return ref;
        }
    }

    const databaseUrl = (process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim();
    if (!databaseUrl) return null;

    try {
        const url = new URL(databaseUrl);
        if (url.hostname.startsWith('db.') && url.hostname.endsWith('.supabase.co')) {
            return url.hostname.split('.')[1] || null;
        }
        if (url.username.startsWith('postgres.')) {
            return url.username.split('.')[1] || null;
        }
    } catch {
        // Best-effort fallback for non-URL-safe connection strings.
        const m = databaseUrl.match(/postgres(?:ql)?:\/\/postgres\.([a-z0-9]+):/i);
        if (m && m[1]) return m[1];
    }

    return null;
}

function parsePassword() {
    const databaseUrl = (process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim();
    if (!databaseUrl) return null;
    try {
        const url = new URL(databaseUrl);
        return url.password || null;
    } catch {
        const m = databaseUrl.match(/postgres(?:ql)?:\/\/[^:]+:([^@]+)@/i);
        return m && m[1] ? m[1] : null;
    }
}

const projectRef = parseProjectRef();
const password = parsePassword();

if (!projectRef || !password) {
    console.error('❌ Missing Supabase project ref or DB password.');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and DATABASE_URL in .env.local (or pass env vars).');
    process.exit(1);
}
const regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1', 'eu-south-1', 'eu-south-2',
    'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'ap-southeast-4',
    'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
    'ap-south-1', 'ap-south-2', 'ap-east-1',
    'sa-east-1', 'ca-central-1',
    'me-central-1', 'me-south-1', 'af-south-1', 'il-central-1'
];

async function checkRegion(region) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const encodedPassword = encodeURIComponent(password);
    const url = `postgresql://postgres.${projectRef}:${encodedPassword}@${host}:6543/postgres?sslmode=require&connect_timeout=5&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true`;

    console.log(`Testing region: ${region} (${host})...`);

    const sql = postgres(url, {
        ssl: 'require',
        connect_timeout: 5,
        prepare: false,
        max: 1
    });

    try {
        await sql`SELECT 1`;
        console.log(`✅ SUCCESS! Found region: ${region}`);
        await sql.end();
        return region;
    } catch (error) {
        await sql.end();
        if (error.message.includes('Tenant or user not found')) {
            console.log(`❌ ${region}: Tenant not found`);
        } else if (error.code === 'EHOSTUNREACH' || error.code === 'ENOTFOUND') {
            console.log(`❌ ${region}: Host unreachable/not found`);
        } else {
            console.log(`❌ ${region}: ${error.message}`);
            // If it's a password error, we found the region but password might be wrong (unlikely if we trust .env)
            if (error.message.includes('password authentication failed')) {
                console.log(`⚠️  Possible match (auth failed): ${region}`);
                return region;
            }
        }
        return null;
    }
}

async function findRegion() {
    for (const region of regions) {
        const result = await checkRegion(region);
        if (result) {
            console.log(`\n🎉 Correct region is: ${result}`);
            process.exit(0);
        }
    }
    console.log('\n❌ Could not find correct region.');
    process.exit(1);
}

findRegion();
