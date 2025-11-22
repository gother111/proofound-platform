const fs = require('fs');
const path = require('path');
const dns = require('dns');
const url = require('url');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));

if (!dbUrlLine) {
    console.log('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const hostname = 'aws-0-eu-west-1.pooler.supabase.com';
// const port = parsed.port;

console.log(`Hostname: ${hostname}`);

dns.resolveCname(hostname, (err, addresses) => {
    if (err) {
        console.error('DNS ResolveCname failed:', err);
    } else {
        console.log('DNS ResolveCname results:', addresses);
    }
});

dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) {
        console.error('DNS Lookup failed:', err);
        return;
    }
    console.log('DNS Lookup results:', addresses);
});

dns.resolve4(hostname, (err, addresses) => {
    if (err) {
        console.error('DNS Resolve4 failed:', err);
    } else {
        console.log('DNS Resolve4 results:', addresses);
    }
});
