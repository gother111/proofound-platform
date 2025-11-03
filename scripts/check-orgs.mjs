/**
 * Quick script to check what organizations and assignments exist
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && !key.startsWith('#') && values.length > 0) {
      const value = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (err) {
  console.error('⚠️  Could not load .env.local file');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('🔍 Checking organizations...\n');
  
  // Get organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, slug, display_name, type, created_at');
  
  if (orgsError) {
    console.error('❌ Error fetching organizations:', orgsError.message);
    return;
  }
  
  console.log(`📊 Found ${orgs?.length || 0} organizations:\n`);
  orgs?.forEach((org, idx) => {
    console.log(`${idx + 1}. ${org.display_name} (${org.type})`);
    console.log(`   Slug: ${org.slug}`);
    console.log(`   ID: ${org.id}`);
    console.log(`   Created: ${new Date(org.created_at).toLocaleString()}\n`);
  });
  
  // Get assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, role, org_id, status, creation_status, created_at');
  
  if (assignmentsError) {
    console.error('❌ Error fetching assignments:', assignmentsError.message);
    return;
  }
  
  console.log(`\n💼 Found ${assignments?.length || 0} assignments:\n`);
  assignments?.forEach((assignment, idx) => {
    const org = orgs?.find(o => o.id === assignment.org_id);
    console.log(`${idx + 1}. ${assignment.role}`);
    console.log(`   Organization: ${org?.display_name || 'Unknown'}`);
    console.log(`   Status: ${assignment.status} (${assignment.creation_status})`);
    console.log(`   Created: ${new Date(assignment.created_at).toLocaleString()}\n`);
  });
  
  // Get organization members
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('org_id, user_id, role, status');
  
  if (!membersError) {
    console.log(`\n👥 Found ${members?.length || 0} organization members\n`);
    for (const member of members || []) {
      const org = orgs?.find(o => o.id === member.org_id);
      console.log(`   • User ${member.user_id.substring(0, 8)}... → ${org?.display_name || 'Unknown'} (${member.role})`);
    }
  }
  
  // Get organization projects
  const { data: projects, error: projectsError } = await supabase
    .from('organization_projects')
    .select('org_id, title, status');
  
  if (!projectsError) {
    console.log(`\n\n🚀 Found ${projects?.length || 0} organization projects\n`);
  }
}

main();

