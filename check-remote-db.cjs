const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking remote Supabase tables via API...');

    // Try to select from 'user_consents'
    const { data, error } = await supabase
        .from('user_consents')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error accessing user_consents:', error.message);
        if (error.code === '42P01') { // undefined_table
            console.log('⚠️ Table user_consents does NOT exist.');
        }
    } else {
        console.log('✅ Table user_consents exists.');
    }

    // Try 'profiles'
    const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

    if (profilesError) {
        console.error('❌ Error accessing profiles:', profilesError.message);
    } else {
        console.log('✅ Table profiles exists.');
    }
}

checkTables();
