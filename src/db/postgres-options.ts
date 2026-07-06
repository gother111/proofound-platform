import { isProductionDeployRuntime } from '@/lib/env';

export type PostgresConnectionOptions = {
  idle_timeout?: number;
  max_lifetime: number | null;
  ssl: 'require' | false;
  prepare: false;
};

export function buildPostgresConnectionOptions(
  env: NodeJS.ProcessEnv = process.env
): PostgresConnectionOptions {
  const lifecycleOptions = isProductionDeployRuntime(env)
    ? {
        idle_timeout: 10,
        max_lifetime: 60 * 30,
      }
    : {
        max_lifetime: null,
      };

  return {
    ...lifecycleOptions,
    ssl: env.NODE_ENV === 'production' ? 'require' : false,
    prepare: false,
  };
}
