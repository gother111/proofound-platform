import { createServer } from 'node:http';

import { createGcpCvOcrHandler } from './handler';

const port = Number.parseInt(process.env.PORT || '8080', 10);
const handler = createGcpCvOcrHandler();

createServer(async (incomingMessage, serverResponse) => {
  const chunks: Buffer[] = [];

  incomingMessage.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  incomingMessage.on('end', async () => {
    try {
      const body = Buffer.concat(chunks);
      const url = `http://${incomingMessage.headers.host || '127.0.0.1'}${incomingMessage.url || '/'}`;
      const request = new Request(url, {
        method: incomingMessage.method,
        headers: incomingMessage.headers as HeadersInit,
        body:
          incomingMessage.method === 'GET' || incomingMessage.method === 'HEAD' ? undefined : body,
      });
      const response = await handler(request);

      serverResponse.statusCode = response.status;
      response.headers.forEach((value, key) => {
        serverResponse.setHeader(key, value);
      });
      serverResponse.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      serverResponse.statusCode = 500;
      serverResponse.setHeader('content-type', 'application/json; charset=utf-8');
      serverResponse.setHeader('cache-control', 'no-store');
      serverResponse.end(JSON.stringify({ status: 'error', error: { code: 'internal_error' } }));
    }
  });
}).listen(port, '0.0.0.0');
