import { afterEach, describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { withManagedServer } from '../../scripts/lib/strict-gates-runner.mjs';

const trackedChildren: Array<{ pid: number | undefined; child: any }> = [];

afterEach(async () => {
  for (const item of trackedChildren.splice(0, trackedChildren.length)) {
    if (!item.child.killed && item.child.exitCode === null) {
      item.child.kill('SIGKILL');
    }
  }
});

describe('strict gates runner', () => {
  it('fails when server never becomes healthy and tears down process', async () => {
    let childRef: any;

    await expect(
      withManagedServer({
        startCommand: 'node',
        startArgs: ['-e', 'setInterval(() => {}, 1000)'],
        healthUrl: 'http://127.0.0.1:65534/api/health',
        healthTimeoutMs: 400,
        commands: [],
        onServerStarted: (child) => {
          childRef = child;
          trackedChildren.push({ pid: child.pid, child });
        },
      })
    ).rejects.toThrow(/did not become healthy/);

    expect(childRef).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(childRef.exitCode !== null || childRef.killed).toBeTruthy();
  });

  it('fails if managed server exits early even when health endpoint is already up', async () => {
    const healthServer = createServer((req, res) => {
      if (req.url === '/api/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => {
      healthServer.listen(0, '127.0.0.1', () => resolve());
    });

    const address = healthServer.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const healthUrl = `http://127.0.0.1:${port}/api/health`;

    try {
      await expect(
        withManagedServer({
          startCommand: 'node',
          startArgs: ['-e', 'process.exit(1)'],
          healthUrl,
          healthTimeoutMs: 1000,
          commands: [],
        })
      ).rejects.toThrow(/exited before gate execution/);
    } finally {
      await new Promise<void>((resolve) => healthServer.close(() => resolve()));
    }
  });
});
