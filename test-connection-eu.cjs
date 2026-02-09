const postgres = require('postgres');

const path = require('path');
const fs = require('fs');
const { config } = require('dotenv');

const envTestPath = path.resolve(process.cwd(), '.env.test');
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envTestPath)) config({ path: envTestPath });
else if (fs.existsSync(envLocalPath)) config({ path: envLocalPath });

const args = process.argv.slice(2);
const dbUrlFlag = args.indexOf('--db-url');
const connectionString =
  (dbUrlFlag >= 0 ? args[dbUrlFlag + 1] : null) ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL (or pass --db-url)');
  process.exit(1);
}

let host = '';
try {
  host = new URL(connectionString).hostname;
} catch {
  // Ignore parse failures; we'll default to SSL require.
}

const isLocal = host === 'localhost' || host === '127.0.0.1' || connectionString.includes('localhost');
const redacted = connectionString.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');

console.log('Testing connection to:', redacted);

const sql = postgres(connectionString, {
    ssl: isLocal ? false : 'require',
    prepare: false,
    connect_timeout: 10,
});

async function test() {
    try {
        const result = await sql`SELECT version()`;
        console.log('Connection successful!');
        console.log('Version:', result[0].version);
    } catch (error) {
        console.error('Connection failed:', error.message);
        if (error.code) console.error('Error code:', error.code);
        console.error('Full error:', error);
    } finally {
        await sql.end();
    }
}

test();
