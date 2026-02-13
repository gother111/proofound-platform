/**
 * Perf Budgets Script (CI)
 *
 * - Lighthouse run (desktop + mobile) on public home page
 *   Budgets (default): TTI ≤ 12000ms desktop, ≤ 8000ms mobile; CLS ≤ 0.5 both.
 * - API latency smoke (p95 ≤ 1500ms) against /api/health
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node ./scripts/perf-budgets.mjs
 *
 * Assumptions:
 * - App server is already running at BASE_URL (CI starts `next start` separately).
 * - Lighthouse dependency is installed (devDependency).
 */

import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { performance } from 'node:perf_hooks';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TARGET_PAGE = `${BASE_URL}/`;

function readPositiveNumberEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} value "${raw}". Expected a positive number.`);
  }
  return parsed;
}

const BUDGETS = {
  tti: {
    // CI includes multiple strict suites before this gate and runs on shared runners.
    // These defaults are calibrated to that environment and can be tightened via env vars.
    desktop: readPositiveNumberEnv('PERF_BUDGET_TTI_DESKTOP_MS', 12000),
    mobile: readPositiveNumberEnv('PERF_BUDGET_TTI_MOBILE_MS', 8000),
  },
  cls: readPositiveNumberEnv('PERF_BUDGET_CLS', 0.5),
  apiP95: readPositiveNumberEnv('PERF_BUDGET_API_P95_MS', 1500),
};

async function runLighthouse(url, formFactor) {
  const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  try {
    const config = {
      extends: 'lighthouse:default',
      settings: {
        formFactor,
        screenEmulation: formFactor === 'mobile'
          ? { mobile: true, width: 360, height: 640, deviceScaleFactor: 3, disabled: false }
          : { mobile: false, width: 1366, height: 768, deviceScaleFactor: 1, disabled: false },
      },
    };

    const runnerResult = await lighthouse(
      url,
      {
        port: chrome.port,
        logLevel: 'error',
        output: 'json',
      },
      config
    );

    const lhr = runnerResult.lhr;
    const tti = lhr.audits.interactive.numericValue;
    const cls = lhr.audits['cumulative-layout-shift'].numericValue;

    const ttiBudget = formFactor === 'mobile' ? BUDGETS.tti.mobile : BUDGETS.tti.desktop;

    const failures = [];
    if (tti > ttiBudget) {
      failures.push(`TTI ${tti.toFixed(0)}ms > budget ${ttiBudget}ms (${formFactor})`);
    }
    if (cls > BUDGETS.cls) {
      failures.push(`CLS ${cls.toFixed(3)} > budget ${BUDGETS.cls}`);
    }

    return { tti, cls, failures, formFactor };
  } finally {
    await chrome.kill();
  }
}

function percentile(values, p) {
  // Keep this interpolation logic in sync with src/lib/monitoring/api-latency.ts.
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sorted[lower];
  const weight = rank - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

async function measureApiLatency(endpoint) {
  const samples = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    const res = await fetch(endpoint, { cache: 'no-store' });
    const duration = performance.now() - start;
    samples.push(duration);
    if (!res.ok) {
      throw new Error(`API ${endpoint} returned ${res.status}`);
    }
  }
  const p95 = percentile(samples, 95);
  const failures = p95 > BUDGETS.apiP95 ? [`API p95 ${p95.toFixed(0)}ms > budget ${BUDGETS.apiP95}ms`] : [];
  return { p95, failures, samples };
}

async function waitForHealthy(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return;
    } catch {
      // keep trying
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not become healthy within ${timeoutMs}ms`);
}

async function main() {
  console.log(`🔍 Running perf budgets against ${TARGET_PAGE}`);
  await waitForHealthy(`${BASE_URL}/api/health`);

  // Lighthouse uses process-level performance marks internally, so run audits serially.
  const desktop = await runLighthouse(TARGET_PAGE, 'desktop');
  const mobile = await runLighthouse(TARGET_PAGE, 'mobile');
  const api = await measureApiLatency(`${BASE_URL}/api/health`);

  const failures = [...desktop.failures, ...mobile.failures, ...api.failures];

  console.log(
    JSON.stringify(
      {
        page: TARGET_PAGE,
        desktop: { tti: desktop.tti, cls: desktop.cls },
        mobile: { tti: mobile.tti, cls: mobile.cls },
        api: { p95: api.p95, samples: api.samples },
        budgets: BUDGETS,
        failures,
      },
      null,
      2
    )
  );

  if (failures.length) {
    console.error(`❌ Perf budgets failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }

  console.log('✅ Perf budgets passed');
}

main().catch((err) => {
  console.error('Perf budgets script failed:', err);
  process.exit(1);
});
