#!/usr/bin/env tsx
/**
 * Execute the seed SQL file
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeSeedSQL() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  const sqlPath = path.join(__dirname, 'seed-taxonomy.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  console.log('📦 Connecting to database...');
  const client = new pg.Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('🌱 Executing seed SQL...');
    console.log(`   SQL size: ${(sql.length / 1024).toFixed(2)} KB`);
    
    await client.query(sql);
    
    console.log('✅ Seed SQL executed successfully!');
    
    // Verify the data
    const l1Result = await client.query('SELECT COUNT(*) FROM skills_categories');
    const l2Result = await client.query('SELECT COUNT(*) FROM skills_subcategories');
    const l3Result = await client.query('SELECT COUNT(*) FROM skills_l3');
    
    console.log('\n📊 Verification:');
    console.log(`   L1 domains: ${l1Result.rows[0].count}`);
    console.log(`   L2 categories: ${l2Result.rows[0].count}`);
    console.log(`   L3 subcategories: ${l3Result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error executing seed SQL:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeSeedSQL();

