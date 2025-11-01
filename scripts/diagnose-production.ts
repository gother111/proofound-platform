/**
 * Production Diagnostic Script
 * 
 * Quickly diagnose production environment issues by checking
 * all required environment variables and database connectivity.
 * 
 * Usage:
 *   npx tsx scripts/diagnose-production.ts
 */

import { getEnv } from '../src/lib/env';
import { checkDatabaseHealth } from '../src/lib/db-health-check';

console.log('');
console.log('🔍 Proofound Production Diagnostic');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

async function runDiagnostics() {
  try {
    // Check environment variables (non-strict mode)
    console.log('📋 Environment Variables:');
    console.log('');
    
    const env = getEnv(false);
    
    const checks = [
      { name: 'SUPABASE_URL', value: env.SUPABASE_URL, required: true },
      { name: 'SUPABASE_ANON_KEY', value: env.SUPABASE_ANON_KEY, required: true },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', value: env.SUPABASE_SERVICE_ROLE_KEY, required: true },
      { name: 'DATABASE_URL', value: env.DATABASE_URL, required: true },
      { name: 'SITE_URL', value: env.SITE_URL, required: true },
    ];
    
    let missingRequired = 0;
    
    for (const check of checks) {
      const status = check.value ? '✅' : (check.required ? '❌' : '⚠️');
      const message = check.value ? 'Set' : (check.required ? 'MISSING (Required)' : 'Missing (Optional)');
      
      console.log(`  ${status} ${check.name.padEnd(30)} ${message}`);
      
      if (!check.value && check.required) {
        missingRequired++;
      }
    }
    
    console.log('');
    
    if (missingRequired > 0) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`❌ CRITICAL: ${missingRequired} required variable(s) missing!`);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      console.log('This will cause database operations to fail in production.');
      console.log('');
      console.log('🔧 How to fix:');
      console.log('  1. Go to Vercel Dashboard → Your Project → Settings');
      console.log('  2. Click "Environment Variables"');
      console.log('  3. Add the missing variables listed above');
      console.log('  4. Redeploy your application');
      console.log('');
      console.log('📚 See PRODUCTION_ENV_CHECK.md for detailed instructions');
      console.log('');
    } else {
      console.log('✅ All required environment variables are set');
      console.log('');
    }
    
    // Check database connectivity
    console.log('🗄️  Database Connectivity:');
    console.log('');
    
    if (!env.DATABASE_URL) {
      console.log('  ❌ Cannot test - DATABASE_URL is missing');
      console.log('  ⚠️  Application will use MOCK database (data will not persist)');
    } else {
      console.log('  ⏳ Testing connection...');
      const isHealthy = await checkDatabaseHealth();
      
      if (isHealthy) {
        console.log('  ✅ Database connection successful');
      } else {
        console.log('  ❌ Database connection failed');
        console.log('');
        console.log('  Possible causes:');
        console.log('    - DATABASE_URL is incorrect');
        console.log('    - Supabase project is paused');
        console.log('    - Network connectivity issues');
        console.log('    - Database credentials are invalid');
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // Final summary
    if (missingRequired === 0 && env.DATABASE_URL) {
      console.log('✅ Environment is properly configured');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Visit /api/health in your browser to verify');
      console.log('  2. Test user flows (signup, matching, etc.)');
      console.log('  3. Check browser console for any errors');
    } else {
      console.log('⚠️  Environment needs attention');
      console.log('');
      console.log('Action required:');
      console.log('  1. Fix missing environment variables');
      console.log('  2. Verify database connectivity');
      console.log('  3. Redeploy and rerun this diagnostic');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Diagnostic failed:');
    console.error('');
    
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      
      if (error.stack) {
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('  Unknown error occurred');
    }
    
    console.error('');
    process.exit(1);
  }
}

// Run diagnostics
runDiagnostics()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });

