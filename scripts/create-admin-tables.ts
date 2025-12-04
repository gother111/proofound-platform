import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function main() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL not found in environment');
        process.exit(1);
    }

    const queryClient = postgres(connectionString, {
        idle_timeout: 10,
        max_lifetime: 60 * 30,
        ssl: false,
        prepare: false,
    });

    const db = drizzle(queryClient);

    console.log('Creating missing admin tables...\n');

    try {
        // Create fairness_notes table
        console.log('Creating fairness_notes table...');
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fairness_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        release_version TEXT NOT NULL,
        generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        cohort_data JSONB NOT NULL,
        findings JSONB NOT NULL,
        recommendations JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        min_sample_size INTEGER NOT NULL DEFAULT 40,
        has_significant_gaps BOOLEAN NOT NULL DEFAULT FALSE,
        p_value NUMERIC,
        created_by UUID REFERENCES profiles(id),
        published_at TIMESTAMP
      );
    `);
        console.log('✅ fairness_notes table created\n');

        // Create performance_metrics table
        console.log('Creating performance_metrics table...');
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_type TEXT NOT NULL CHECK (metric_type IN ('page_load', 'api_latency', 'tti', 'fcp', 'lcp', 'cls', 'fid')),
        page_route TEXT,
        api_endpoint TEXT,
        value_ms NUMERIC NOT NULL,
        device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
        p50 NUMERIC,
        p95 NUMERIC,
        p99 NUMERIC,
        user_agent TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        period_start TIMESTAMP,
        period_end TIMESTAMP,
        sample_count INTEGER DEFAULT 1
      );
    `);
        console.log('✅ performance_metrics table created\n');

        // Create performance_alerts table
        console.log('Creating performance_alerts table...');
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS performance_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_type TEXT NOT NULL CHECK (alert_type IN ('sla_violation', 'degradation', 'spike')),
        metric_type TEXT NOT NULL,
        route TEXT,
        threshold_ms NUMERIC NOT NULL,
        actual_value_ms NUMERIC NOT NULL,
        percentile TEXT,
        device_type TEXT,
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
        acknowledged_by UUID REFERENCES profiles(id),
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
        console.log('✅ performance_alerts table created\n');

        console.log('All admin tables created successfully! ✅');

    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        await queryClient.end();
    }
}

main().catch(console.error).finally(() => process.exit(0));
