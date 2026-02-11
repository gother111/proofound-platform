const postgres = require('postgres');

const projectRef = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;
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
    const url = `postgresql://postgres.${projectRef}:${password}@${host}:6543/postgres?sslmode=require&connect_timeout=5`;

    console.log(`Testing region: ${region} (${host})...`);

    const sql = postgres(url, {
        ssl: 'require',
        connect_timeout: 5,
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
    if (!projectRef || !password) {
        console.error('Set SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD before running this script.');
        process.exit(1);
    }

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
