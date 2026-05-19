import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, 'src', 'app', 'api');
const OUTPUT = path.join(ROOT, 'docs', 'API_REFERENCE.md');

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function walkRoutes(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const p = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(p);
        continue;
      }
      if (entry.isFile() && entry.name === 'route.ts') out.push(p);
    }
  }

  return out.sort();
}

function extractMethods(source) {
  const methods = new Set();
  const re = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
  let m;
  while ((m = re.exec(source)) !== null) methods.add(m[1]);

  const reExportList = /export\s*\{([^}]+)\}/g;
  while ((m = reExportList.exec(source)) !== null) {
    for (const part of m[1].split(',')) {
      const exported = part
        .trim()
        .split(/\s+as\s+/i)
        .pop()
        ?.trim();
      if (HTTP_METHODS.includes(exported)) methods.add(exported);
    }
  }

  if (methods.size === 0) return ['UNKNOWN'];

  return HTTP_METHODS.filter((method) => methods.has(method));
}

function routePath(file) {
  const relativeDir = path.relative(API_ROOT, path.dirname(file)).replaceAll(path.sep, '/');
  return relativeDir ? `/api/${relativeDir}` : '/api';
}

function sourcePath(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, '/');
}

function classifyTier(route, source) {
  const internalAdminSignals =
    /(requirePlatformAdmin|adminListGuard|assertPlatformAdmin|isPlatformAdmin)/i;
  if (route.startsWith('/api/admin/') || internalAdminSignals.test(source)) return 'internal';

  const isCronRoute = route.startsWith('/api/cron/') || route === '/api/cron';
  const cronSignals =
    /(CRON_SECRET|authorization\s*:\s*['"]Bearer|bearer\s+\$?\{?process\.env\.CRON_SECRET)/i;
  if (isCronRoute || cronSignals.test(source)) return 'cron';

  if (/requireInternalOpsRequest/i.test(source)) return 'internal';

  const serviceSignals =
    /(createServiceRoleClient|SUPABASE_SERVICE_ROLE_KEY|service[_ -]?role|admin\.generateLink|createServerSupabaseAdminClient)/i;
  if (serviceSignals.test(source)) return 'service';

  const sessionSignals =
    /(requireSession|requireApiAuthContext|getUser\(|auth\.getUser\(|createRouteHandlerClient|csrf|x-csrf-token|assertAuthenticated)/i;
  if (sessionSignals.test(source)) return 'session';

  return 'public';
}

function deriveNotes(source) {
  const notes = [];
  if (/(deprecated|legacy)/i.test(source)) notes.push('legacy/compat markers in source');
  if (/TODO/i.test(source)) notes.push('contains TODO');
  return notes.join('; ') || '-';
}

function familyKey(route) {
  const parts = route
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean);
  if (parts[0] === 'mobile' && parts[1] === 'v1') return 'mobile/v1';
  return parts[0] || 'root';
}

function escapeTableCell(value) {
  return String(value).replaceAll('|', '\\|');
}

async function classifyLaunchSurfaces(routes) {
  const ts = await import('typescript');
  const sourcePathname = path.join(ROOT, 'src', 'lib', 'launch', 'surface-policy.ts');
  const source = fs.readFileSync(sourcePathname, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      isolatedModules: true,
    },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled, 'utf8').toString('base64')}`;
  const { classifyLaunchApiPath } = await import(moduleUrl);
  return Object.fromEntries(routes.map((route) => [route, classifyLaunchApiPath(route)]));
}

function formatSurfaceLabel(value) {
  switch (value) {
    case 'active_launch_path':
      return 'active MVP';
    case 'internal_only_launch_ops':
      return 'internal launch ops';
    case 'archived':
      return 'archived compatibility';
    default:
      return value || 'unclassified';
  }
}

async function build() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const files = walkRoutes(API_ROOT);
  const routeFiles = files.map((file) => ({
    file,
    route: routePath(file),
  }));
  const launchClassifications = await classifyLaunchSurfaces(routeFiles.map((item) => item.route));
  const rows = routeFiles.map(({ file, route }) => {
    const source = fs.readFileSync(file, 'utf8');
    return {
      methods: extractMethods(source).join('|'),
      route,
      family: familyKey(route),
      tier: classifyTier(route, source),
      launchSurface: launchClassifications[route] || 'unclassified',
      notes: deriveNotes(source),
      source: sourcePath(file),
    };
  });

  rows.sort((a, b) => {
    if (a.family !== b.family) return a.family.localeCompare(b.family);
    return a.route.localeCompare(b.route);
  });

  const familyOrder = [...new Set(rows.map((row) => row.family))];

  const tierCounts = rows.reduce((acc, row) => {
    acc[row.tier] = (acc[row.tier] || 0) + 1;
    return acc;
  }, {});
  const surfaceCounts = rows.reduce((acc, row) => {
    acc[row.launchSurface] = (acc[row.launchSurface] || 0) + 1;
    return acc;
  }, {});

  const lines = [];
  lines.push('# API Reference');
  lines.push('');
  lines.push('> Doc Class: `active`');
  lines.push(
    '> Verification Source: `src/app/api/**/route.ts`, `src/middleware.ts`, `package.json`, `.github/workflows/ci.yml`, `vercel.json`'
  );
  lines.push(`> Last Verified: \`${date}\``);
  lines.push('');
  lines.push(
    'Canonical API documentation generated from the current App Router route handlers under `src/app/api/**/route.ts`.'
  );
  lines.push('');
  lines.push('## Generation Method');
  lines.push('');
  lines.push('- Source of truth: filesystem route scan of `src/app/api/**/route.ts`.');
  lines.push(
    '- HTTP methods: parsed from exported handler functions (`GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS`).'
  );
  lines.push('- Auth tier: heuristic classification from route path + handler source signals.');
  lines.push('- Launch surface: classified through `src/lib/launch/surface-policy.ts`.');
  lines.push('- Regenerate with: `node scripts/generate-api-reference.mjs`.');
  lines.push('');
  lines.push('## Base URLs');
  lines.push('');
  lines.push('- Production: `https://proofound.io/api`');
  lines.push('- Local: `http://localhost:3000/api`');
  lines.push('');
  lines.push('## Security Model (Operational)');
  lines.push('');
  lines.push('- Session routes rely on authenticated Supabase user context.');
  lines.push(
    '- Mutating routes are typically CSRF-protected via middleware and route-level checks.'
  );
  lines.push(
    '- Internal launch-ops routes require the internal bearer token accepted by `requireInternalOpsRequest`.'
  );
  lines.push('- Cron routes require `Authorization: Bearer <CRON_SECRET>`.');
  lines.push(
    '- Service routes may use privileged Supabase/admin operations and must remain server-only.'
  );
  lines.push('');
  lines.push('## Coverage Summary');
  lines.push('');
  lines.push(`- Total route handlers: **${rows.length}**`);
  lines.push(
    `- Auth tier counts: \`public=${tierCounts.public || 0}\`, \`session=${tierCounts.session || 0}\`, \`service=${tierCounts.service || 0}\`, \`cron=${tierCounts.cron || 0}\`, \`internal=${tierCounts.internal || 0}\``
  );
  lines.push(
    `- Launch surface counts: \`active MVP=${surfaceCounts.active_launch_path || 0}\`, \`internal launch ops=${surfaceCounts.internal_only_launch_ops || 0}\`, \`archived compatibility=${surfaceCounts.archived || 0}\``
  );
  lines.push(`- Family count: **${familyOrder.length}**`);
  lines.push('');
  lines.push('## Endpoint Inventory');
  lines.push('');

  for (const family of familyOrder) {
    lines.push(`### ${family}`);
    lines.push('');
    lines.push('| Methods | Path | Auth Tier | Launch Surface | Notes | Source |');
    lines.push('| --- | --- | --- | --- | --- | --- |');

    for (const row of rows.filter((item) => item.family === family)) {
      lines.push(
        `| \`${escapeTableCell(row.methods)}\` | \`${escapeTableCell(row.route)}\` | \`${escapeTableCell(row.tier)}\` | \`${escapeTableCell(formatSurfaceLabel(row.launchSurface))}\` | ${escapeTableCell(row.notes)} | \`${escapeTableCell(row.source)}\` |`
      );
    }

    lines.push('');
  }

  lines.push('## Compatibility / Deprecated Surface');
  lines.push('');
  lines.push(
    'Routes with source-level `legacy`/`deprecated` markers should be treated as compatibility surfaces and reviewed before removal.'
  );
  lines.push('');
  lines.push('| Path | Source | Marker |');
  lines.push('| --- | --- | --- |');
  const legacyRows = rows.filter((row) => row.launchSurface === 'archived');
  if (legacyRows.length === 0) {
    lines.push('| `-` | `-` | none detected |');
  } else {
    for (const row of legacyRows) {
      lines.push(
        `| \`${escapeTableCell(row.route)}\` | \`${escapeTableCell(row.source)}\` | archived by launch surface policy |`
      );
    }
  }
  lines.push('');

  lines.push('## Verification Checklist');
  lines.push('');
  lines.push('- `npm run docs:freshness`');
  lines.push('- `STRICT_DOCS_FRESHNESS=true npm run docs:freshness`');
  lines.push('- `npm run lint`');
  lines.push('- `npm run typecheck`');
  lines.push(
    '- API parity check: compare generated endpoint count with `find src/app/api -name route.ts | wc -l`'
  );
  lines.push('');

  fs.writeFileSync(OUTPUT, `${lines.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
  console.log(
    `Generated ${OUTPUT} with ${rows.length} endpoints across ${familyOrder.length} families.`
  );
}

await build();
