import { createServer } from 'node:http';

import { createGcpCvOcrHandler } from './handler';

const port = Number.parseInt(process.env.PORT || '8080', 10);
const handler = createGcpCvOcrHandler();

function maxRequestBodyBytes() {
  const configuredMb = Number.parseInt(process.env.GCP_CV_OCR_MAX_REQUEST_BODY_MB || '8', 10);
  const maxMb = Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : 8;
  return maxMb * 1024 * 1024;
}

function writeJsonResponse(
  serverResponse: import('node:http').ServerResponse,
  statusCode: number,
  body: unknown
) {
  serverResponse.statusCode = statusCode;
  serverResponse.setHeader('content-type', 'application/json; charset=utf-8');
  serverResponse.setHeader('cache-control', 'no-store');
  serverResponse.end(JSON.stringify(body));
}

createServer(async (incomingMessage, serverResponse) => {
  const chunks: Buffer[] = [];
  const maxBodyBytes = maxRequestBodyBytes();
  let receivedBytes = 0;
  let rejected = false;

  incomingMessage.on('data', (chunk: Buffer) => {
    receivedBytes += chunk.byteLength;
    if (receivedBytes > maxBodyBytes) {
      rejected = true;
      incomingMessage.destroy();
      writeJsonResponse(serverResponse, 413, {
        status: 'error',
        error: { code: 'request_too_large' },
      });
      return;
    }
    chunks.push(chunk);
  });

  incomingMessage.on('end', async () => {
    if (rejected) {
      return;
    }
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
