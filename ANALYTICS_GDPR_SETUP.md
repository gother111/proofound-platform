# Analytics GDPR Compliance Setup Guide

## Overview

This guide explains how to set up the GDPR-compliant analytics system that hashes IP addresses and user agents before storage.

## 🎯 What Changed

**Before**: Analytics stored raw IP addresses and user agents (GDPR violation - Article 4(1))  
**After**: Analytics stores SHA-256 hashes (GDPR compliant - Article 4(5) pseudonymization)

## 📋 Environment Variable Setup

### Required Environment Variable

Add the following to your environment configuration:

```bash
PII_HASH_SALT=<your-64-character-hex-string>
```

### How to Generate the Salt

**Option 1: Using OpenSSL (Recommended)**
```bash
openssl rand -hex 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output a 64-character hexadecimal string like:
```
a3f8c9d2e1b4f5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

### Where to Add the Salt

#### 1. Local Development (.env.local)

Create or update `/path/to/proofound/.env.local`:

```bash
# Generate with: openssl rand -hex 32
PII_HASH_SALT=a3f8c9d2e1b4f5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

**⚠️ IMPORTANT**: Add `.env.local` to `.gitignore` if not already there!

#### 2. Staging/Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `PII_HASH_SALT`
   - **Value**: (paste your generated 64-char hex string)
   - **Environments**: Select Production, Preview, and Development as needed
4. Click **Save**
5. Redeploy your application for changes to take effect

#### 3. Other Hosting Platforms

- **AWS**: Add to Lambda environment variables or Secrets Manager
- **Google Cloud**: Add to Cloud Run environment variables or Secret Manager
- **Azure**: Add to App Service Configuration
- **Docker**: Add to docker-compose.yml or Kubernetes secrets

## 🔄 Database Migration

### Step 1: Backup Your Database

Before running any migration:

```bash
# Supabase backup (via CLI)
supabase db dump > backup_before_analytics_migration.sql

# Or via Supabase dashboard: Settings → Database → Download backup
```

### Step 2: Run the Migration

The migration file is located at: `drizzle/0027_anonymize_analytics_pii.sql`

**⚠️ CRITICAL**: Before running, replace `${PII_HASH_SALT}` in the SQL file with your actual salt value!

#### Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Open `drizzle/0027_anonymize_analytics_pii.sql`
3. **Find and replace** `${PII_HASH_SALT}` with your actual salt
4. Review the SQL carefully
5. Click **Run** to execute

#### Using Drizzle Kit

```bash
# Push schema changes to database
npm run db:push

# Then manually run the migration SQL in Supabase dashboard
```

### Step 3: Verify Migration

After running the migration, verify it worked:

```sql
-- Check that new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analytics_events' 
  AND column_name IN ('ip_hash', 'user_agent_hash');

-- Check that hashes are 64 characters (SHA-256 in hex)
SELECT 
  COUNT(*) as total_hashed,
  COUNT(*) FILTER (WHERE length(ip_hash) = 64) as valid_hashes
FROM analytics_events
WHERE ip_hash IS NOT NULL;
```

Expected result: All hashes should be exactly 64 characters.

### Step 4: Drop Old Columns (Optional)

**⚠️ ONLY after confirming:**
- All code is updated (schema.ts, analytics.ts)
- All deployments are using the new code
- Migration completed successfully

Uncomment these lines in the migration file:

```sql
ALTER TABLE analytics_events DROP COLUMN IF EXISTS ip_address;
ALTER TABLE analytics_events DROP COLUMN IF EXISTS user_agent;
```

## 🧪 Testing the Implementation

### Test 1: Verify Hashing Works

Create a test file: `src/lib/utils/__tests__/privacy.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { hashPII, anonymizeIP, anonymizeUserAgent } from '../privacy';

describe('Privacy Utilities', () => {
  // Set test salt
  process.env.PII_HASH_SALT = 'test-salt-for-unit-testing';

  it('should hash IP consistently', () => {
    const ip = '192.168.1.1';
    const hash1 = anonymizeIP(ip);
    const hash2 = anonymizeIP(ip);
    
    expect(hash1).toBe(hash2); // Same input = same hash
    expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
    expect(hash1).not.toBe(ip); // Hash ≠ original
  });

  it('should throw error if salt not configured', () => {
    delete process.env.PII_HASH_SALT;
    
    expect(() => hashPII('test')).toThrow(/PII_HASH_SALT/);
  });

  it('should return empty string for empty input', () => {
    process.env.PII_HASH_SALT = 'test-salt';
    
    expect(anonymizeIP('')).toBe('');
    expect(anonymizeUserAgent('')).toBe('');
  });
});
```

Run tests:
```bash
npm test src/lib/utils/__tests__/privacy.test.ts
```

### Test 2: Track a Sample Event

In a Next.js API route:

```typescript
import { trackEvent } from '@/lib/analytics';

export async function POST(request: Request) {
  // Track event with automatic IP/UA hashing
  await trackEvent(
    'signed_up',
    { method: 'email' },
    request,
    'user-id-123'
  );
  
  return new Response('Event tracked!');
}
```

Check database:
```sql
SELECT 
  event_type,
  substring(ip_hash, 1, 16) || '...' as ip_preview,
  length(ip_hash) as ip_hash_length,
  created_at
FROM analytics_events
ORDER BY created_at DESC
LIMIT 5;
```

Expected: `ip_hash_length` = 64

## 🔒 Security Best Practices

### 1. Salt Rotation

If you need to rotate the salt (e.g., security incident):

1. Generate new salt: `openssl rand -hex 32`
2. Update environment variables with new salt
3. Run migration again to re-hash all existing data
4. Old hashes won't match new data (this is expected)

**Note**: Salt rotation breaks hash consistency. Use only if necessary.

### 2. Salt Storage

✅ **DO**:
- Store salt in environment variables
- Use different salts for dev/staging/production
- Keep salt in secret management systems (AWS Secrets Manager, etc.)
- Backup salt securely (you can't recover hashes without it)

❌ **DON'T**:
- Commit salt to Git
- Share salt in Slack/email
- Use the same salt across multiple projects
- Store salt in client-side code

### 3. Data Access

Even with hashed IPs:
- Limit database access to authorized personnel only
- Use Row Level Security (RLS) policies
- Audit who accesses analytics data
- Log all analytics queries

## 📊 Using the Analytics System

### Tracking Events in Your Code

```typescript
import { trackEvent, trackSignUp, trackMatchAccepted } from '@/lib/analytics';

// Example 1: Track signup
export async function POST(request: Request) {
  const user = await createUser(email, password);
  await trackSignUp(user.id, 'email', request);
  // ...
}

// Example 2: Track match acceptance
export async function POST(request: Request) {
  const { matchId, score } = await request.json();
  const user = await getCurrentUser();
  await trackMatchAccepted(matchId, score, user.id, request);
  // ...
}

// Example 3: Custom event
export async function POST(request: Request) {
  await trackEvent(
    'custom_event',
    { feature: 'new-button', clicked: true },
    request,
    userId
  );
  // ...
}
```

### Querying Analytics Data

**Aggregate analytics** (GDPR-compliant - no PII revealed):

```sql
-- Daily signups
SELECT 
  DATE(created_at) as date,
  COUNT(*) as signups
FROM analytics_events
WHERE event_type = 'signed_up'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most common events
SELECT 
  event_type,
  COUNT(*) as count
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;

-- Unique users (by hashed IP - approximate)
SELECT 
  COUNT(DISTINCT ip_hash) as unique_visitors
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days';
```

## 🚨 Troubleshooting

### Error: "PII_HASH_SALT environment variable is not set"

**Cause**: Missing environment variable  
**Fix**: Add `PII_HASH_SALT` to your `.env.local` or deployment platform

### Error: "Failed to track event"

**Cause**: Database connection issue or invalid data  
**Fix**: Check Supabase connection and database logs

### Hashes don't match between environments

**Cause**: Different salts in dev vs production  
**Fix**: Use the same salt across environments (or keep them separate intentionally)

### Migration fails: "column already exists"

**Cause**: Migration was partially run  
**Fix**: Check which columns exist, then run only missing ALTER statements

## 📚 Reference Documentation

- **GDPR Article 4(1)**: Definition of Personal Data (IPs are PII)
- **GDPR Article 4(5)**: Pseudonymisation requirements
- **CROSS_DOCUMENT_PRIVACY_AUDIT.md**: Section 1.4 (Analytics Privacy Violation)
- **CROSS_DOCUMENT_PRIVACY_AUDIT.md**: Section 5.4 (SQL Migration Scripts)
- **CROSS_DOCUMENT_PRIVACY_AUDIT.md**: Section 6.1 (Implementation Examples)

## ✅ Compliance Checklist

After completing this setup, verify:

- [ ] `PII_HASH_SALT` environment variable set in all environments
- [ ] Database migration completed successfully
- [ ] Old `ip_address` and `user_agent` columns dropped (or pending)
- [ ] All analytics tracking uses `trackEvent()` function
- [ ] Sample events show 64-character hashes in database
- [ ] No raw IP addresses stored anywhere
- [ ] Salt backed up securely (not in Git)
- [ ] Team trained on analytics privacy requirements

## 🎉 You're Done!

Your analytics system is now GDPR-compliant! 

**Before**: Raw IPs stored (GDPR violation)  
**After**: SHA-256 hashes stored (GDPR Article 4(5) compliant)

You can now track user behavior for product metrics while respecting user privacy. 🔒

