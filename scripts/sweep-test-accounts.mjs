#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import {
  buildAllowlist,
  classifyAuthUser,
  classifyOrphanProfile,
  extractEmailParts,
  summarizeIndicatorCounts,
} from './lib/account-sweep-classifier.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_TICKET = 'PRO-126';
const DEFAULT_MODE = 'dry-run';
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, 'artifacts', 'account-sweep');
const ENV_PATH = path.join(repoRoot, '.env.local');

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = {
    mode: DEFAULT_MODE,
    output: '',
    allowlistPath: '',
    approvalFilePath: '',
    expectedDeleteCount: NaN,
    ticket: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--mode') {
      options.mode = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (current === '--output') {
      options.output = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (current === '--allowlist') {
      options.allowlistPath = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (current === '--approval-file') {
      options.approvalFilePath = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (current === '--expected-delete-count') {
      options.expectedDeleteCount = Number.parseInt(argv[index + 1] || '', 10);
      index += 1;
      continue;
    }

    if (current === '--ticket') {
      options.ticket = argv[index + 1] || '';
      index += 1;
      continue;
    }
  }

  if (!options.mode) {
    options.mode = DEFAULT_MODE;
  }

  return options;
}

function timestampForPath() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) {
      continue;
    }

    const [rawKey, ...rawValue] = line.split('=');
    const key = rawKey.trim();
    if (!key || process.env[key]) {
      continue;
    }

    const value = rawValue.join('=').trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}

function resolvePathMaybeRelative(value, baseDir = repoRoot) {
  if (!value) return '';
  if (path.isAbsolute(value)) return value;
  return path.resolve(baseDir, value);
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function toMarkdownList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '- none';
  }
  return items.map((item) => `- ${item}`).join('\n');
}

function printUsage() {
  console.log('Sweep seeded test accounts with approval-gated apply mode.');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/sweep-test-accounts.mjs --mode dry-run --ticket PRO-126');
  console.log('  node scripts/sweep-test-accounts.mjs --mode apply --ticket PRO-126 --approval-file ./path/to/approval.json --expected-delete-count 10');
  console.log('');
  console.log('Options:');
  console.log('  --mode <dry-run|apply>');
  console.log('  --output <dir>');
  console.log('  --allowlist <path to json>');
  console.log('  --approval-file <path to json>   required for apply');
  console.log('  --expected-delete-count <n>      required for apply');
  console.log('  --ticket <issue key>             required for apply');
}

function buildOutputDirectory(mode, customOutput) {
  const resolvedOutput = resolvePathMaybeRelative(customOutput);
  if (resolvedOutput) {
    return ensureDirectory(resolvedOutput);
  }

  const modeSuffix = mode === 'apply' ? 'apply' : 'dry-run';
  return ensureDirectory(path.join(DEFAULT_OUTPUT_ROOT, `${timestampForPath()}__${modeSuffix}`));
}

function loadAllowlist(allowlistPath) {
  if (!allowlistPath) {
    return buildAllowlist();
  }

  const resolvedPath = resolvePathMaybeRelative(allowlistPath);
  if (!fs.existsSync(resolvedPath)) {
    fail(`Allowlist file does not exist: ${resolvedPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  return buildAllowlist(raw);
}

function parseApprovalFile(approvalFilePath) {
  const resolvedPath = resolvePathMaybeRelative(approvalFilePath);
  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    fail(`Approval file does not exist: ${resolvedPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  const approvedAuthUserIds = Array.isArray(parsed.approveDeleteAuthUserIds)
    ? parsed.approveDeleteAuthUserIds.filter((value) => typeof value === 'string' && value.trim())
    : [];
  const approvedOrphanProfileIds = Array.isArray(parsed.approveDeleteOrphanProfileIds)
    ? parsed.approveDeleteOrphanProfileIds.filter(
        (value) => typeof value === 'string' && value.trim()
      )
    : [];

  return {
    resolvedPath,
    parsed,
    approvedAuthUserIds,
    approvedOrphanProfileIds,
  };
}

function countByDomain(authUsers) {
  const counts = {};
  for (const user of authUsers) {
    const { domain } = extractEmailParts(user.email);
    if (!domain) continue;
    counts[domain] = (counts[domain] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([domain, count]) => ({ domain, count }));
}

async function listAllAuthUsers(supabase) {
  const allUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      fail(`Failed to list auth users: ${error.message}`);
    }

    const users = data?.users || [];
    allUsers.push(...users);

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

async function fetchProfilesForAuthUsers(supabase, authUsers) {
  const ids = authUsers.map((user) => user.id);
  const profiles = new Map();
  const chunkSize = 100;

  for (let offset = 0; offset < ids.length; offset += chunkSize) {
    const chunk = ids.slice(offset, offset + chunkSize);
    if (chunk.length === 0) continue;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, handle, persona, deleted, created_at, updated_at')
      .in('id', chunk);

    if (error) {
      fail(`Failed to fetch profiles for auth users: ${error.message}`);
    }

    for (const profile of data || []) {
      profiles.set(profile.id, profile);
    }
  }

  return profiles;
}

async function fetchOrphanProfiles(sqlClient) {
  return sqlClient`
    select
      p.id,
      p.display_name,
      p.handle,
      p.persona,
      p.deleted,
      p.created_at,
      p.updated_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    where u.id is null
    order by p.created_at desc nulls last;
  `;
}

async function findSkillsL4Blockers(sqlClient, candidateUserIds) {
  if (!Array.isArray(candidateUserIds) || candidateUserIds.length === 0) {
    return new Set();
  }

  const rows = await sqlClient`
    select distinct created_by::text as user_id
    from public.skills_l4
    where created_by = any(${candidateUserIds}::uuid[]);
  `;
  return new Set(rows.map((row) => row.user_id));
}

function buildAuthCandidatePayload(authUser, profile, classification) {
  return {
    entityType: 'auth_user',
    id: authUser.id,
    email: authUser.email || null,
    createdAt: authUser.created_at || null,
    lastSignInAt: authUser.last_sign_in_at || null,
    emailConfirmedAt: authUser.email_confirmed_at || null,
    profile: {
      displayName: profile?.display_name || null,
      handle: profile?.handle || null,
      persona: profile?.persona || null,
      deleted: profile?.deleted ?? null,
      createdAt: profile?.created_at || null,
      updatedAt: profile?.updated_at || null,
    },
    decision: classification.decision,
    keepReason: classification.keepReason,
    deleteReasons: classification.deleteReasons,
    indicators: classification.indicators,
    hasHumanDisplayName: classification.hasHumanDisplayName,
    allowlisted: classification.allowlisted,
    emailDomain: classification.emailDomain,
    emailLocalPart: classification.emailLocalPart,
    metadata: classification.metadata,
  };
}

function buildOrphanCandidatePayload(profile, classification) {
  return {
    entityType: 'orphan_profile',
    id: profile.id,
    displayName: profile.display_name || null,
    handle: profile.handle || null,
    persona: profile.persona || null,
    deleted: profile.deleted ?? null,
    createdAt: profile.created_at || null,
    updatedAt: profile.updated_at || null,
    decision: classification.decision,
    keepReason: classification.keepReason,
    deleteReasons: classification.deleteReasons,
    indicators: classification.indicators,
    hasHumanDisplayName: classification.hasHumanDisplayName,
    allowlisted: classification.allowlisted,
    metadata: classification.metadata,
  };
}

function createDryRunSummary({
  mode,
  ticket,
  outputDirectory,
  allowlistPath,
  authUsers,
  authProfiles,
  orphanProfiles,
  deleteAuthCandidates,
  deleteOrphanCandidates,
  keepCandidates,
  manualReviewCandidates,
}) {
  const keepAuthCandidates = keepCandidates.filter((candidate) => candidate.entityType === 'auth_user');
  const keepOrphanCandidates = keepCandidates.filter(
    (candidate) => candidate.entityType === 'orphan_profile'
  );
  const allowlistedKeeps = keepCandidates.filter((candidate) => candidate.keepReason === 'allowlisted');
  const blockedAuthCandidates = manualReviewCandidates.filter(
    (candidate) => candidate.manualReviewReason === 'blocker_skills_l4_created_by'
  );

  return {
    generatedAt: new Date().toISOString(),
    mode,
    ticket: ticket || DEFAULT_TICKET,
    outputDirectory,
    allowlistPath: allowlistPath ? resolvePathMaybeRelative(allowlistPath) : null,
    counts: {
      authUsersTotal: authUsers.length,
      authUsersWithProfile: authProfiles.size,
      authUsersWithoutProfile: authUsers.length - authProfiles.size,
      orphanProfilesTotal: orphanProfiles.length,
      candidatesDeleteAuth: deleteAuthCandidates.length,
      candidatesDeleteOrphanProfiles: deleteOrphanCandidates.length,
      candidatesKeepAuth: keepAuthCandidates.length,
      candidatesKeepOrphanProfiles: keepOrphanCandidates.length,
      candidatesKeepTotal: keepCandidates.length,
      candidatesManualReview: manualReviewCandidates.length,
      blockedAuthCandidates: blockedAuthCandidates.length,
      allowlistedKeeps: allowlistedKeeps.length,
    },
    indicators: {
      deleteAuth: summarizeIndicatorCounts(deleteAuthCandidates),
      deleteOrphans: summarizeIndicatorCounts(deleteOrphanCandidates),
      keep: summarizeIndicatorCounts(keepCandidates),
      manualReview: summarizeIndicatorCounts(manualReviewCandidates),
    },
    topEmailDomains: countByDomain(authUsers),
  };
}

function summaryMarkdown(summary, fileNames, applyNotes) {
  return [
    `# Account Sweep ${summary.mode === 'apply' ? 'Apply' : 'Dry Run'} Summary`,
    '',
    `- Generated at: ${summary.generatedAt}`,
    `- Ticket: ${summary.ticket}`,
    `- Output directory: ${summary.outputDirectory}`,
    '',
    '## Counts',
    '',
    `- Auth users total: ${summary.counts.authUsersTotal}`,
    `- Auth users with profile: ${summary.counts.authUsersWithProfile}`,
    `- Auth users without profile: ${summary.counts.authUsersWithoutProfile}`,
    `- Orphan profiles total: ${summary.counts.orphanProfilesTotal}`,
    `- Delete auth candidates: ${summary.counts.candidatesDeleteAuth}`,
    `- Delete orphan profile candidates: ${summary.counts.candidatesDeleteOrphanProfiles}`,
    `- Keep candidates total: ${summary.counts.candidatesKeepTotal}`,
    `- Manual review candidates: ${summary.counts.candidatesManualReview}`,
    `- Blocked auth candidates (skills_l4.created_by): ${summary.counts.blockedAuthCandidates}`,
    `- Allowlisted keeps: ${summary.counts.allowlistedKeeps}`,
    '',
    '## Artifacts',
    '',
    toMarkdownList(fileNames.map((entry) => `${entry.name}: ${entry.path}`)),
    '',
    '## Top Email Domains',
    '',
    toMarkdownList(summary.topEmailDomains.map((domainRow) => `${domainRow.domain}: ${domainRow.count}`)),
    '',
    '## Next Step',
    '',
    summary.mode === 'dry-run'
      ? '1. Review `summary.json` and candidate files.'
      : '1. Review `apply-results.json` for exact deletes and failures.',
    summary.mode === 'dry-run'
      ? '2. Fill `approval-template.json` with approved IDs only.'
      : '2. Re-run dry-run to confirm post-apply state.',
    summary.mode === 'dry-run'
      ? `3. Run apply with guards: \`npm run accounts:sweep:apply -- --ticket ${summary.ticket} --approval-file <path> --expected-delete-count <n>\``
      : '',
    '',
    applyNotes || '',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

async function runDryClassification({ supabase, sqlClient, allowlist, options }) {
  const authUsers = await listAllAuthUsers(supabase);
  const authProfiles = await fetchProfilesForAuthUsers(supabase, authUsers);
  const orphanProfiles = await fetchOrphanProfiles(sqlClient);

  const deleteAuthCandidatesRaw = [];
  const keepCandidates = [];

  for (const authUser of authUsers) {
    const profile = authProfiles.get(authUser.id);
    const classification = classifyAuthUser(
      {
        id: authUser.id,
        email: authUser.email || '',
        displayName: profile?.display_name || '',
        handle: profile?.handle || '',
      },
      allowlist
    );
    const payload = buildAuthCandidatePayload(authUser, profile, classification);
    if (classification.decision === 'delete') {
      deleteAuthCandidatesRaw.push(payload);
    } else {
      keepCandidates.push(payload);
    }
  }

  const deleteOrphanCandidates = [];
  for (const profile of orphanProfiles) {
    const classification = classifyOrphanProfile(
      {
        id: profile.id,
        displayName: profile.display_name || '',
        handle: profile.handle || '',
      },
      allowlist
    );
    const payload = buildOrphanCandidatePayload(profile, classification);
    if (classification.decision === 'delete') {
      deleteOrphanCandidates.push(payload);
    } else {
      keepCandidates.push(payload);
    }
  }

  const blockedAuthIds = await findSkillsL4Blockers(
    sqlClient,
    deleteAuthCandidatesRaw.map((candidate) => candidate.id)
  );
  const deleteAuthCandidates = [];
  const manualReviewCandidates = [];

  for (const candidate of deleteAuthCandidatesRaw) {
    if (blockedAuthIds.has(candidate.id)) {
      manualReviewCandidates.push({
        ...candidate,
        manualReviewReason: 'blocker_skills_l4_created_by',
      });
      continue;
    }
    deleteAuthCandidates.push(candidate);
  }

  const summary = createDryRunSummary({
    mode: options.mode,
    ticket: options.ticket,
    outputDirectory: options.outputDirectory,
    allowlistPath: options.allowlistPath,
    authUsers,
    authProfiles,
    orphanProfiles,
    deleteAuthCandidates,
    deleteOrphanCandidates,
    keepCandidates,
    manualReviewCandidates,
  });

  return {
    summary,
    deleteAuthCandidates,
    deleteOrphanCandidates,
    keepCandidates,
    manualReviewCandidates,
  };
}

function buildApprovalTemplate({ summary, deleteAuthCandidates, deleteOrphanCandidates }) {
  return {
    ticket: summary.ticket,
    generatedAt: new Date().toISOString(),
    dryRunDirectory: summary.outputDirectory,
    notes: 'Fill approved IDs only after review. Candidate IDs are listed in the dry-run files.',
    candidateDeleteAuthCount: deleteAuthCandidates.length,
    candidateDeleteOrphanCount: deleteOrphanCandidates.length,
    approveDeleteAuthUserIds: [],
    approveDeleteOrphanProfileIds: [],
    approvedBy: '',
    approvedAt: '',
  };
}

async function deleteAuthUserAndProfile(supabase, id) {
  const record = {
    id,
    authDeleted: false,
    profileDeleted: false,
    status: 'failed',
    error: null,
  };

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
  if (authDeleteError) {
    record.error = `auth_delete_failed: ${authDeleteError.message}`;
    return record;
  }
  record.authDeleted = true;

  const { error: profileDeleteError } = await supabase.from('profiles').delete().eq('id', id);
  if (profileDeleteError) {
    record.error = `profile_delete_failed: ${profileDeleteError.message}`;
    return record;
  }

  record.profileDeleted = true;
  record.status = 'deleted';
  return record;
}

async function deleteOrphanProfile(supabase, id) {
  const record = {
    id,
    profileDeleted: false,
    status: 'failed',
    error: null,
  };
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) {
    record.error = `profile_delete_failed: ${error.message}`;
    return record;
  }
  record.profileDeleted = true;
  record.status = 'deleted';
  return record;
}

function ensureSubset(approvedIds, candidates, label) {
  const candidateSet = new Set(candidates.map((candidate) => candidate.id));
  const invalid = approvedIds.filter((id) => !candidateSet.has(id));
  if (invalid.length > 0) {
    fail(
      `Approval file includes ${invalid.length} ${label} IDs that are not present in current delete candidates`
    );
  }
}

async function executeApply({
  supabase,
  sqlClient,
  dryRun,
  options,
  approval,
  outputDirectory,
}) {
  ensureSubset(approval.approvedAuthUserIds, dryRun.deleteAuthCandidates, 'auth user');
  ensureSubset(
    approval.approvedOrphanProfileIds,
    dryRun.deleteOrphanCandidates,
    'orphan profile'
  );

  const blockedAuthIds = await findSkillsL4Blockers(sqlClient, approval.approvedAuthUserIds);
  const blockedAuthUserIds = approval.approvedAuthUserIds.filter((id) => blockedAuthIds.has(id));
  const authUserIdsToDelete = approval.approvedAuthUserIds.filter((id) => !blockedAuthIds.has(id));
  const orphanProfileIdsToDelete = approval.approvedOrphanProfileIds;

  const targetDeleteCount = authUserIdsToDelete.length + orphanProfileIdsToDelete.length;
  if (targetDeleteCount !== options.expectedDeleteCount) {
    fail(
      `Expected delete count mismatch. expected=${options.expectedDeleteCount}, actual=${targetDeleteCount}`
    );
  }

  const authResults = [];
  for (const id of authUserIdsToDelete) {
    authResults.push(await deleteAuthUserAndProfile(supabase, id));
  }

  const orphanResults = [];
  for (const id of orphanProfileIdsToDelete) {
    orphanResults.push(await deleteOrphanProfile(supabase, id));
  }

  const failedAuth = authResults.filter((result) => result.status !== 'deleted');
  const failedOrphans = orphanResults.filter((result) => result.status !== 'deleted');

  const applyResults = {
    generatedAt: new Date().toISOString(),
    ticket: options.ticket || DEFAULT_TICKET,
    expectedDeleteCount: options.expectedDeleteCount,
    targetDeleteCount,
    blockedAuthUserIds,
    totals: {
      approvedAuthUserIds: approval.approvedAuthUserIds.length,
      approvedOrphanProfileIds: approval.approvedOrphanProfileIds.length,
      blockedAuthUserIds: blockedAuthUserIds.length,
      attemptedAuthDeletes: authResults.length,
      attemptedOrphanDeletes: orphanResults.length,
      authDeleted: authResults.length - failedAuth.length,
      orphanDeleted: orphanResults.length - failedOrphans.length,
      failedAuthDeletes: failedAuth.length,
      failedOrphanDeletes: failedOrphans.length,
    },
    authResults,
    orphanResults,
  };

  const applyResultsPath = path.join(outputDirectory, 'apply-results.json');
  writeJson(applyResultsPath, applyResults);

  const applyNotes =
    failedAuth.length + failedOrphans.length > 0
      ? `Apply finished with failures. Failed auth deletes: ${failedAuth.length}, failed orphan deletes: ${failedOrphans.length}.`
      : 'Apply finished without deletion failures.';

  return { applyResults, applyResultsPath, applyNotes };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.mode === '--help' || process.argv.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  if (!['dry-run', 'apply'].includes(options.mode)) {
    fail(`Unsupported mode: ${options.mode}`);
  }

  if (options.mode === 'apply') {
    if (!options.approvalFilePath) {
      fail('--approval-file is required in apply mode');
    }
    if (!Number.isInteger(options.expectedDeleteCount) || options.expectedDeleteCount < 0) {
      fail('--expected-delete-count must be a non-negative integer in apply mode');
    }
    if (!options.ticket) {
      fail('--ticket is required in apply mode');
    }
  }

  loadEnvFile(ENV_PATH);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sqlConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!supabaseUrl || !serviceRoleKey) {
    fail('Missing Supabase credentials. Required: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!sqlConnectionString) {
    fail('Missing DIRECT_URL or DATABASE_URL for orphan profile and blocker checks');
  }

  const outputDirectory = buildOutputDirectory(options.mode, options.output);
  const allowlist = loadAllowlist(options.allowlistPath);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const sqlClient = postgres(sqlConnectionString, { ssl: 'require' });

  try {
    const dryRun = await runDryClassification({
      supabase,
      sqlClient,
      allowlist,
      options: {
        ...options,
        outputDirectory,
      },
    });

    const summaryPath = path.join(outputDirectory, 'summary.json');
    const deleteAuthPath = path.join(outputDirectory, 'candidates-delete-auth.json');
    const deleteOrphansPath = path.join(outputDirectory, 'candidates-delete-orphan-profiles.json');
    const keepPath = path.join(outputDirectory, 'candidates-keep.json');
    const manualReviewPath = path.join(outputDirectory, 'candidates-manual-review.json');
    const approvalTemplatePath = path.join(outputDirectory, 'approval-template.json');

    writeJson(summaryPath, dryRun.summary);
    writeJson(deleteAuthPath, dryRun.deleteAuthCandidates);
    writeJson(deleteOrphansPath, dryRun.deleteOrphanCandidates);
    writeJson(keepPath, dryRun.keepCandidates);
    writeJson(manualReviewPath, dryRun.manualReviewCandidates);
    writeJson(
      approvalTemplatePath,
      buildApprovalTemplate({
        summary: dryRun.summary,
        deleteAuthCandidates: dryRun.deleteAuthCandidates,
        deleteOrphanCandidates: dryRun.deleteOrphanCandidates,
      })
    );

    let applyNotes = '';

    if (options.mode === 'apply') {
      const approval = parseApprovalFile(options.approvalFilePath);
      const approvalTicket = approval.parsed.ticket || '';
      if (approvalTicket && approvalTicket !== options.ticket) {
        fail(
          `Approval file ticket mismatch. file=${approvalTicket} arg=${options.ticket}`
        );
      }

      if (options.ticket !== DEFAULT_TICKET) {
        fail(`Unexpected ticket key. Expected ${DEFAULT_TICKET}, received ${options.ticket}`);
      }

      const applyResult = await executeApply({
        supabase,
        sqlClient,
        dryRun,
        options,
        approval,
        outputDirectory,
      });
      applyNotes = applyResult.applyNotes;
    }

    const summaryMarkdownPath = path.join(outputDirectory, 'summary.md');
    const markdown = summaryMarkdown(
      dryRun.summary,
      [
        { name: 'summary.json', path: summaryPath },
        { name: 'summary.md', path: summaryMarkdownPath },
        { name: 'candidates-delete-auth.json', path: deleteAuthPath },
        { name: 'candidates-delete-orphan-profiles.json', path: deleteOrphansPath },
        { name: 'candidates-keep.json', path: keepPath },
        { name: 'candidates-manual-review.json', path: manualReviewPath },
        { name: 'approval-template.json', path: approvalTemplatePath },
      ],
      applyNotes
    );
    fs.writeFileSync(summaryMarkdownPath, markdown, 'utf8');

    console.log(JSON.stringify(dryRun.summary, null, 2));
    console.log(`Artifacts written to ${outputDirectory}`);
  } finally {
    await sqlClient.end();
  }
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
