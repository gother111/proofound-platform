import { describe, expect, it } from 'vitest';
import { getCriticalE2ECredentials } from '../../e2e/critical/credentials';

describe('critical e2e credential guard', () => {
  it('throws when required credentials are missing', () => {
    expect(() => getCriticalE2ECredentials({} as NodeJS.ProcessEnv)).toThrow(
      /Missing E2E credentials/
    );
  });

  it('returns credentials when required keys exist', () => {
    const creds = getCriticalE2ECredentials({
      E2E_INDIVIDUAL_EMAIL: 'e2e@example.com',
      E2E_INDIVIDUAL_PASSWORD: 'Pass123!',
    } as NodeJS.ProcessEnv);

    expect(creds.email).toBe('e2e@example.com');
    expect(creds.password).toBe('Pass123!');
  });
});
