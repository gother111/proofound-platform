import fs from 'node:fs/promises';

export const criticalTables = [
  'profiles',
  'organizations',
  'assignments',
  'interviews',
  'conversations',
  'messages',
  'analytics_events',
  'fairness_notes',
  'verification_requests',
  'user_video_integrations',
  'decision_reminders',
];

export const timestampColumnsPriority = [
  'created_at',
  'occurred_at',
  'updated_at',
  'generated_at',
  'sent_at',
  'completed_at',
];

export function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export async function getTableFingerprint(client, tableName) {
  const existsResult = await client.query(
    `
      SELECT to_regclass($1) IS NOT NULL AS exists
    `,
    [`public.${tableName}`]
  );

  const exists = Boolean(existsResult.rows[0]?.exists);
  if (!exists) {
    return { table: tableName, exists: false };
  }

  const countResult = await client.query(`SELECT COUNT(*)::bigint AS count FROM public."${tableName}"`);

  const columnResult = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = ANY($2::text[])
    `,
    [tableName, timestampColumnsPriority]
  );

  const availableColumns = new Set(columnResult.rows.map((row) => row.column_name));
  const selectedTimestampColumn = timestampColumnsPriority.find((col) => availableColumns.has(col));

  let maxTimestamp = null;
  if (selectedTimestampColumn) {
    const maxResult = await client.query(
      `SELECT MAX("${selectedTimestampColumn}") AS max_value FROM public."${tableName}"`
    );
    maxTimestamp = maxResult.rows[0]?.max_value ?? null;
  }

  return {
    table: tableName,
    exists: true,
    rowCount: countResult.rows[0]?.count ?? '0',
    timestampColumn: selectedTimestampColumn ?? null,
    maxTimestamp,
  };
}

export async function collectCheckpointFingerprint(client) {
  const fingerprint = [];
  for (const table of criticalTables) {
    fingerprint.push(await getTableFingerprint(client, table));
  }

  const migrationCount = await client.query(
    `SELECT COUNT(*)::bigint AS count FROM supabase_migrations.schema_migrations`
  );

  const dbIdentity = await client.query(
    `
      SELECT
        current_database() AS database,
        current_user AS user_name,
        inet_server_addr()::text AS server_addr,
        inet_server_port() AS server_port
    `
  );

  return {
    fingerprint,
    migrationRows: migrationCount.rows[0]?.count ?? '0',
    database: dbIdentity.rows[0],
  };
}
