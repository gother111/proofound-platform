const postgres = require('postgres');

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Set TEST_DATABASE_URL or DATABASE_URL before running this script.');
    process.exit(1);
}

console.log('Testing connection to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString, {
    ssl: 'require',
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
    } finally {
        await sql.end();
    }
}

test();
