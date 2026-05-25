export const DEFAULT_LAUNCH_TIME_ZONE = 'Europe/Stockholm';

export function resolveLaunchTimeZone(env: Pick<NodeJS.ProcessEnv, string> = process.env) {
  return env.PROOFOUND_LAUNCH_TIME_ZONE || env.TZ || DEFAULT_LAUNCH_TIME_ZONE;
}

export function getLaunchDateSlug(now: Date, env: Pick<NodeJS.ProcessEnv, string> = process.env) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: resolveLaunchTimeZone(env),
  }).format(now);
}
