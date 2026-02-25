import { randomBytes } from 'node:crypto';
import {
  fetch as undiciFetch,
  Headers as UndiciHeaders,
  Request as UndiciRequest,
  Response as UndiciResponse,
} from 'undici';
import dotenv from 'dotenv';

dotenv.config();

globalThis.fetch = undiciFetch as any;
globalThis.Headers = UndiciHeaders as any;
globalThis.Request = UndiciRequest as any;
globalThis.Response = UndiciResponse as any;

globalThis.React = (await import('react')).default;

const { sendWorkEmailVerification, sendSkillVerificationRequest, sendVerificationEmail } =
  await import('./src/lib/email');
const { sendEmail } = await import('./src/lib/email/sender');

const to = process.argv[2] || 'p.samoshko97@icloud.com';
const token = randomBytes(16).toString('hex');
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'Proofound Test <onboarding@resend.dev>';
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://proofound.com';

console.log('recipient', to);
console.log('api_key_set', Boolean(process.env.RESEND_API_KEY));
console.log('from', process.env.EMAIL_FROM);

async function runCall(label: string, fn: () => Promise<unknown>) {
  try {
    const value = await fn();
    console.log(`${label}: ok`, value);
    return { label, status: 'ok', value };
  } catch (error: any) {
    console.log(`${label}: fail`, error?.message || error);
    return { label, status: 'fail', value: error?.message || String(error) };
  }
}

const results = [] as Array<{ label: string; status: string; value: unknown }>;

results.push(
  await runCall('sendWorkEmailVerification', () =>
    sendWorkEmailVerification(to, token, 'Proofound Tester')
  )
);
await wait(1200);
results.push(
  await runCall('sendSkillVerificationRequest', () =>
    sendSkillVerificationRequest(
      to,
      'Proofound Tester',
      'prooftester',
      'Distributed Systems',
      randomBytes(16).toString('hex')
    )
  )
);
await wait(1200);
results.push(
  await runCall('sendVerificationEmail', () =>
    sendVerificationEmail(to, randomBytes(16).toString('hex'), 'individual')
  )
);
await wait(1200);
results.push(
  await runCall('sendEmail wrapper', () =>
    sendEmail({
      to,
      subject: 'Proofound Resend smoke test',
      html: '<p>Resend smoke test from proofound</p>',
    })
  )
);

console.log('SUMMARY');
console.table(results);
