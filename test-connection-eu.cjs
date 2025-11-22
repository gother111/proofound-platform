const postgres = require('postgres');

const connectionString = 'postgres://postgres.cjpfrgmsxwxhuomnvciq:Gara1299442!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require';

console.log('Testing connection to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString, {
    ssl: 'require',
    connect_timeout: 10,
    debug: (connection, query, params, types) => {
        console.log('Debug:', { query, params });
    }
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
