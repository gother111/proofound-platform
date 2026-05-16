#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });

const args = process.argv.slice(2);

function readArg(flag, fallback = null) {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

function hasFlag(flag) {
  return args.includes(flag);
}

const outputPath = readArg('--out');
const schemaName = readArg('--schema', 'public');
const failOnWarnings = hasFlag('--fail-on-warnings');

function formatIdentifier(name) {
  return String(name).replaceAll('"', '""');
}

async function writeReport(report) {
  if (!outputPath) {
    return;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Report written to ${outputPath}`);
}

async function loadRlsSummary(client) {
  const result = await client.query(
    `
      SELECT
        COUNT(*)::int AS table_count,
        COUNT(*) FILTER (WHERE c.relrowsecurity)::int AS rls_enabled_count,
        COUNT(*) FILTER (WHERE NOT c.relrowsecurity)::int AS rls_disabled_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
        AND c.relkind IN ('r', 'p')
    `,
    [schemaName]
  );

  return result.rows[0] ?? {
    table_count: 0,
    rls_enabled_count: 0,
    rls_disabled_count: 0,
  };
}

async function loadRlsDisabledExposedTables(client) {
  const result = await client.query(
    `
      WITH role_privileges AS (
        SELECT
          table_schema,
          table_name,
          array_agg(DISTINCT grantee || ':' || privilege_type ORDER BY grantee || ':' || privilege_type) AS grants
        FROM information_schema.table_privileges
        WHERE table_schema = $1
          AND grantee IN ('anon', 'authenticated')
        GROUP BY table_schema, table_name
      )
      SELECT
        n.nspname AS schema_name,
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        c.relforcerowsecurity AS rls_forced,
        COALESCE(rp.grants, ARRAY[]::text[]) AS grants,
        COALESCE(s.n_live_tup, 0)::bigint AS estimated_live_rows
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN role_privileges rp ON rp.table_schema = n.nspname AND rp.table_name = c.relname
      LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
      WHERE n.nspname = $1
        AND c.relkind IN ('r', 'p')
        AND NOT c.relrowsecurity
      ORDER BY c.relname
    `,
    [schemaName]
  );

  return result.rows;
}

async function loadSecurityDefinerViews(client) {
  const result = await client.query(
    `
      WITH role_privileges AS (
        SELECT
          table_schema,
          table_name,
          array_agg(DISTINCT grantee || ':' || privilege_type ORDER BY grantee || ':' || privilege_type) AS grants,
          bool_or(privilege_type = 'SELECT') AS has_select
        FROM information_schema.table_privileges
        WHERE table_schema = $1
          AND grantee IN ('anon', 'authenticated')
        GROUP BY table_schema, table_name
      )
      SELECT
        n.nspname AS schema_name,
        c.relname AS view_name,
        COALESCE(c.reloptions, ARRAY[]::text[]) AS reloptions,
        COALESCE(rp.grants, ARRAY[]::text[]) AS grants
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN role_privileges rp ON rp.table_schema = n.nspname AND rp.table_name = c.relname
      WHERE n.nspname = $1
        AND c.relkind = 'v'
        AND rp.has_select
        AND NOT ('security_invoker=true' = ANY(COALESCE(c.reloptions, ARRAY[]::text[])))
      ORDER BY c.relname
    `,
    [schemaName]
  );

  return result.rows;
}

async function loadExecutableSecurityDefinerFunctions(client) {
  const result = await client.query(
    `
      SELECT
        n.nspname AS schema_name,
        p.proname AS function_name,
        pg_get_function_identity_arguments(p.oid) AS arguments,
        l.lanname AS language,
        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
        EXISTS (
          SELECT 1
          FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) setting
          WHERE setting LIKE 'search_path=%'
        ) AS has_search_path
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_language l ON l.oid = p.prolang
      WHERE n.nspname = $1
        AND p.prosecdef = true
        AND (
          has_function_privilege('anon', p.oid, 'EXECUTE')
          OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
        )
      ORDER BY p.proname, pg_get_function_identity_arguments(p.oid)
    `,
    [schemaName]
  );

  return result.rows;
}

async function loadDefaultPrivileges(client) {
  const result = await client.query(
    `
      SELECT
        pg_get_userbyid(defaclrole) AS owner_role,
        COALESCE(n.nspname, '') AS schema_name,
        defaclobjtype AS object_type,
        COALESCE(defaclacl::text[], ARRAY[]::text[]) AS acl
      FROM pg_default_acl d
      LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
      WHERE COALESCE(n.nspname, $1) = $1
        AND EXISTS (
          SELECT 1
          FROM unnest(COALESCE(defaclacl::text[], ARRAY[]::text[])) acl_entry
          WHERE acl_entry LIKE 'anon=%'
             OR acl_entry LIKE 'authenticated=%'
        )
      ORDER BY owner_role, object_type
    `,
    [schemaName]
  );

  return result.rows;
}

function buildSummary({ rlsSummary, rlsDisabledExposedTables, securityDefinerViews, executableSecurityDefinerFunctions, defaultPrivileges }) {
  return {
    schema: schemaName,
    tableCount: Number(rlsSummary.table_count ?? 0),
    rlsEnabledCount: Number(rlsSummary.rls_enabled_count ?? 0),
    rlsDisabledCount: Number(rlsSummary.rls_disabled_count ?? 0),
    rlsDisabledExposedTableCount: rlsDisabledExposedTables.length,
    securityDefinerViewCount: securityDefinerViews.length,
    executableSecurityDefinerFunctionCount: executableSecurityDefinerFunctions.length,
    defaultPrivilegeFindingCount: defaultPrivileges.length,
  };
}

function printReport(report) {
  const schemaLabel = `"${formatIdentifier(report.summary.schema)}"`;
  console.log(`Supabase public surface audit for schema ${schemaLabel}`);
  console.log(`Tables: ${report.summary.tableCount}`);
  console.log(`RLS enabled: ${report.summary.rlsEnabledCount}`);
  console.log(`RLS disabled: ${report.summary.rlsDisabledCount}`);
  console.log(`RLS-disabled tables exposed to anon/authenticated: ${report.summary.rlsDisabledExposedTableCount}`);
  console.log(`Security-definer views selectable by anon/authenticated: ${report.summary.securityDefinerViewCount}`);
  console.log(`Executable security-definer functions: ${report.summary.executableSecurityDefinerFunctionCount}`);
  console.log(`Default privilege findings: ${report.summary.defaultPrivilegeFindingCount}`);

  if (report.findings.rlsDisabledExposedTables.length > 0) {
    console.log('\nRLS-disabled exposed tables:');
    for (const row of report.findings.rlsDisabledExposedTables) {
      console.log(`- ${row.schema_name}.${row.table_name} (${row.estimated_live_rows} estimated rows)`);
    }
  }

  if (report.findings.securityDefinerViews.length > 0) {
    console.log('\nSecurity-definer views:');
    for (const row of report.findings.securityDefinerViews) {
      console.log(`- ${row.schema_name}.${row.view_name}`);
    }
  }

  if (report.findings.executableSecurityDefinerFunctions.length > 0) {
    console.log('\nExecutable security-definer functions:');
    for (const row of report.findings.executableSecurityDefinerFunctions) {
      const roles = [
        row.anon_execute ? 'anon' : null,
        row.authenticated_execute ? 'authenticated' : null,
      ].filter(Boolean);
      console.log(`- ${row.schema_name}.${row.function_name}(${row.arguments}) to ${roles.join(', ')}`);
    }
  }
}

async function main() {
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DIRECT_URL or DATABASE_URL is required.');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  let report;
  try {
    const [
      rlsSummary,
      rlsDisabledExposedTables,
      securityDefinerViews,
      executableSecurityDefinerFunctions,
      defaultPrivileges,
    ] = await Promise.all([
      loadRlsSummary(client),
      loadRlsDisabledExposedTables(client),
      loadSecurityDefinerViews(client),
      loadExecutableSecurityDefinerFunctions(client),
      loadDefaultPrivileges(client),
    ]);

    report = {
      generatedAt: new Date().toISOString(),
      summary: buildSummary({
        rlsSummary,
        rlsDisabledExposedTables,
        securityDefinerViews,
        executableSecurityDefinerFunctions,
        defaultPrivileges,
      }),
      findings: {
        rlsDisabledExposedTables,
        securityDefinerViews,
        executableSecurityDefinerFunctions,
        defaultPrivileges,
      },
    };
  } finally {
    await client.end();
  }

  printReport(report);
  await writeReport(report);

  const blockerCount =
    report.summary.rlsDisabledExposedTableCount + report.summary.securityDefinerViewCount;
  const warningCount =
    report.summary.executableSecurityDefinerFunctionCount +
    report.summary.defaultPrivilegeFindingCount;

  if (blockerCount > 0 || (failOnWarnings && warningCount > 0)) {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error('Supabase public surface audit failed:', error.message);
  process.exit(1);
});
