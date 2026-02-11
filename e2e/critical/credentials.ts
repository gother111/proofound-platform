export function getCriticalE2ECredentials(source: NodeJS.ProcessEnv = process.env): {
  email: string;
  password: string;
} {
  const email = source.E2E_INDIVIDUAL_EMAIL;
  const password = source.E2E_INDIVIDUAL_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing E2E credentials: E2E_INDIVIDUAL_EMAIL and E2E_INDIVIDUAL_PASSWORD are required.'
    );
  }

  return { email, password };
}
