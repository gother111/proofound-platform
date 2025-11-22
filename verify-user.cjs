
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyUser(email) {
    console.log(`Attempting to verify user: ${email}`);

    // First, get the user ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    console.log(`Found ${users.length} users.`);
    users.forEach(u => console.log(` - ${u.email} (${u.id})`));

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found');
        return;
    }

    console.log(`Found user ${user.id}. Updating password...`);

    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: 'NewPass123!', email_confirm: true }
    );

    if (error) {
        console.error('Error updating user:', error);
    } else {
        console.log('User updated successfully:', data.user.email);
    }
}

verifyUser('demo@circularcraft.eu');
