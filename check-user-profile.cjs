const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const email = 'testorglocal@test.proofound.com';

async function checkUser() {
    console.log(`Checking for user: ${email}`);

    // 1. Check auth.users (via admin api)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('❌ Error listing users:', userError.message);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('❌ User NOT found in auth.users');
        return;
    }

    console.log(`✅ User found: ${user.id}`);

    // 2. Check public.profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('❌ Error fetching profile:', profileError.message);
        if (profileError.code === 'PGRST116') {
            console.log('⚠️ Profile does NOT exist.');
        }
    } else {
        console.log('✅ Profile found:', profile);
    }

    // 3. Check user_consents
    const { data: consents, error: consentError } = await supabase
        .from('user_consents')
        .select('*')
        .eq('profile_id', user.id);

    if (consentError) {
        console.error('❌ Error fetching consents:', consentError.message);
    } else {
        console.log(`ℹ️ Consents found: ${consents.length}`);
    }
}

// Run and ensure the async work finishes before exiting
checkUser()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Unexpected error running checkUser:', err);
        process.exit(1);
    });
