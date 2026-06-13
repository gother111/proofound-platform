const DEFAULT_DAILY_LIMIT = 100;
const DEFAULT_WINDOW_HOURS = 24;

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toCreatedAtMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1000;
  }

  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric > 10_000_000_000 ? numeric : numeric * 1000;
    }

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function evaluateDeploymentQuota(
  deployments,
  {
    dailyLimit = DEFAULT_DAILY_LIMIT,
    windowHours = DEFAULT_WINDOW_HOURS,
    now = Date.now(),
  } = {}
) {
  const limitedDeployments = deployments.slice(0, dailyLimit);
  const oldestTracked = limitedDeployments.at(-1);
  const oldestCreatedAt = toCreatedAtMs(oldestTracked?.createdAt);
  const windowMs = windowHours * 60 * 60 * 1000;
  const cutoff = now - windowMs;

  if (deployments.length < dailyLimit) {
    return {
      available: true,
      reason: 'under-daily-limit',
      count: deployments.length,
      oldestCreatedAt,
    };
  }

  if (oldestCreatedAt === null) {
    return {
      available: true,
      reason: 'oldest-deployment-time-unavailable',
      count: deployments.length,
      oldestCreatedAt,
    };
  }

  if (oldestCreatedAt > cutoff) {
    return {
      available: false,
      reason: 'daily-limit-window-exhausted',
      count: deployments.length,
      oldestCreatedAt,
    };
  }

  return {
    available: true,
    reason: 'daily-limit-window-has-capacity',
    count: deployments.length,
    oldestCreatedAt,
  };
}

async function fetchDeployments({ token, projectId, dailyLimit, fetchImpl = fetch }) {
  const query = new URLSearchParams({
    projectId,
    limit: String(dailyLimit),
  });

  const response = await fetchImpl(`https://api.vercel.com/v6/deployments?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`vercel_deployments_request_failed_${response.status}`);
  }

  const body = await response.json();
  return Array.isArray(body.deployments) ? body.deployments : [];
}

export async function checkDeploymentQuota({
  env = process.env,
  fetchImpl = fetch,
  now = Date.now(),
} = {}) {
  const token = env.VERCEL_TOKEN;
  const projectId = env.VERCEL_PROJECT_ID;
  const dailyLimit = readPositiveInteger(env.VERCEL_DEPLOYMENT_DAILY_LIMIT, DEFAULT_DAILY_LIMIT);
  const windowHours = readPositiveInteger(
    env.VERCEL_DEPLOYMENT_QUOTA_WINDOW_HOURS,
    DEFAULT_WINDOW_HOURS
  );

  if (!token || !projectId) {
    return {
      available: true,
      reason: 'missing-vercel-credentials',
      count: 0,
      oldestCreatedAt: null,
    };
  }

  const deployments = await fetchDeployments({ token, projectId, dailyLimit, fetchImpl });
  return evaluateDeploymentQuota(deployments, {
    dailyLimit,
    windowHours,
    now,
  });
}
