#!/usr/bin/env tsx
/**
 * Execute seed SQL in chunks using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  console.error('   Please add it to your .env.local file from Supabase dashboard > Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSeedChunks() {
  const sqlPath = path.join(__dirname, 'seed-taxonomy.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  // Split by INSERT statements
  const statements = sql
    .split(/\n\n/)
    .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
    .map(stmt => stmt.trim());
  
  console.log(`📦 Found ${statements.length} SQL statements`);
  console.log('🌱 Executing L2 and L3 inserts...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Skip L1 (already done), process L2 and L3
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Skip L1 inserts (already done)
    if (stmt.includes('skills_categories')) {
      console.log(`⏭️  Skipping L1 insert (already done)`);
      continue;
    }
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
      
      if (error) {
        console.error(`❌ Error at statement ${i + 1}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`   Progress: ${successCount} statements executed`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Exception at statement ${i + 1}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n✅ Execution complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  
  // Verify the data
  const { data: l2Data } = await supabase.from('skills_subcategories').select('*', { count: 'exact', head: true });
  const { data: l3Data } = await supabase.from('skills_l3').select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Verification:`);
  console.log(`   L2 categories: ${(l2Data as any)?.count || 0}`);
  console.log(`   L3 subcategories: ${(l3Data as any)?.count || 0}`);
}

executeSeedChunks();

