/**
 * Ensure `supabase/migrations/` contains a `.sql` file for every remote migration version.
 *
 * This fixes Supabase CLI errors like:
 * - "Remote migration versions not found in local migrations directory."
 *
 * It is intentionally non-destructive:
 * - Does not overwrite existing files.
 * - If any file exists for a version prefix, it will not create a duplicate for that version.
 *
 * Usage:
 * - `node agent/tools/supabase-sync-migration-history.mjs`
 * - `node agent/tools/supabase-sync-migration-history.mjs --dry-run`
 *
 * Requirements:
 * - `DATABASE_URL` in `.env.local` (or environment).
 */

import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env.local or env).");
  process.exit(2);
}

const MIGRATIONS_DIR = path.join("supabase", "migrations");

const slugify = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "migration";

const parseVersionPrefix = (filename) => {
  const m = String(filename).match(/^(\d{8}|\d{14})_/);
  return m ? m[1] : null;
};

const { Client } = pg;
const client = new Client({ connectionString: url });

const main = async () => {
  await client.connect();
  const r = await client.query(
    `select version::text as version, coalesce(name, 'migration') as name
     from supabase_migrations.schema_migrations
     order by version asc`
  );
  await client.end();

  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });

  const localFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  const existingVersions = new Set(localFiles.map(parseVersionPrefix).filter(Boolean));

  let created = 0;
  let skipped = 0;

  for (const row of r.rows) {
    const version = row.version;
    if (existingVersions.has(version)) {
      skipped++;
      continue;
    }

    const filename = `${version}_${slugify(row.name)}.sql`;
    const content =
      `-- Placeholder migration file for remote version ${version} (${row.name}).\n` +
      `--\n` +
      `-- This repo did not contain the original SQL for this version when synchronized.\n` +
      `-- The canonical applied history lives in supabase_migrations.schema_migrations on the remote database.\n` +
      `--\n` +
      `-- If you need to recreate this migration precisely, recover it from the original source of migrations.\n`;

    if (!dryRun) {
      fs.writeFileSync(path.join(MIGRATIONS_DIR, filename), content, "utf8");
      existingVersions.add(version);
    }
    created++;
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        migrationsDir: MIGRATIONS_DIR,
        remoteVersions: r.rowCount,
        localFiles: localFiles.length,
        created,
        skipped,
      },
      null,
      2
    )
  );
};

main().catch((e) => {
  console.error("sync failed:", e?.message || e);
  process.exit(1);
});

