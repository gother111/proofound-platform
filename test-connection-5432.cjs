const postgres = require('postgres');

const connectionString = 'postgres://postgres.cjpfrgmsxwxhuomnvciq:Gara1299442!@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

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
