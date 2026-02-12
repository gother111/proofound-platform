export function resolveCronSummaryBaseUrl(
  env: NodeJS.ProcessEnv = process.env
): string | undefined {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    return siteUrl;
  }

  const vercelUrl = env.VERCEL_URL?.trim();
  if (!vercelUrl) {
    return undefined;
  }

  return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
}
