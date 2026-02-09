#!/usr/bin/env node
/**
 * MCP Postgres Server Wrapper
 *
 * Purpose:
 * - Avoid committing DB connection strings into repo-tracked MCP config.
 * - Load DATABASE_URL from .env.test or .env.local (both gitignored).
 *
 * Usage (via mcp-config.json):
 * - command: node
 * - args: ["scripts/mcp-postgres.mjs"]
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

const cwd = process.cwd();
const envTestPath = path.resolve(cwd, '.env.test');
const envLocalPath = path.resolve(cwd, '.env.local');

if (fs.existsSync(envTestPath)) {
  dotenvConfig({ path: envTestPath });
} else if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath });
}

const databaseUrl = (process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is missing. Set it in .env.test or .env.local.');
  process.exit(1);
}

const child = spawn(
  'npx',
  ['-y', '@modelcontextprotocol/server-postgres', databaseUrl],
  { stdio: 'inherit', env: process.env }
);

child.on('exit', (code, signal) => {
  if (typeof code === 'number') process.exit(code);
  process.exit(signal ? 1 : 0);
});

child.on('error', (err) => {
  console.error('❌ Failed to start MCP Postgres server:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

