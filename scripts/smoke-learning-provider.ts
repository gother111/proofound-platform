#!/usr/bin/env node
import { courseraProvider } from '../src/lib/learning/coursera';

// Ensure global fetch exists (Node 20+ has fetch; keep fallback)
if (typeof fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const undici = require('undici');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undici.fetch;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Response = undici.Response;
}

async function main() {
  // Mock fetch to avoid real network
  const mockResponse = {
    elements: [{ id: '1', name: 'React Basics', slug: 'react-basics', difficulty: 'Beginner' }],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = async () =>
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  const result = await courseraProvider.getCoursesForSkills(['react']);
  console.log('coursera smoke ok', result.react?.[0]?.title);
}

main().catch((err) => {
  console.error('coursera smoke failed', err);
  process.exit(1);
});

