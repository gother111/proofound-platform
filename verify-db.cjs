const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verify() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to local DB');

        // Create a test table if not exists (though we have migrations now)
        // Let's just query a table we know exists, e.g. 'profiles' or 'assignments'
        const res = await client.query('SELECT count(*) FROM assignments');
        console.log('✅ Query successful. Assignment count:', res.rows[0].count);

        // Insert a test row into a simple table if possible?
        // Maybe 'purpose_edit_log' is simple enough?
        // Or just rely on the query.

    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verify();
