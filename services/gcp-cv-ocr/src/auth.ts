import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export type NonceStore = {
  consume(nonce: string, expiresAtMs: number, nowMs: number): boolean;
};

export type HmacVerificationResult =
  | { ok: true; bodyHash: string }
  | {
      ok: false;
      code:
        | 'missing_auth'
        | 'bad_timestamp'
        | 'stale_timestamp'
        | 'bad_nonce'
        | 'bad_body_hash'
        | 'bad_signature';
    };

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const NONCE_PATTERN = /^[a-zA-Z0-9._:-]{8,128}$/;

export class InMemoryNonceStore implements NonceStore {
  private readonly seen = new Map<string, number>();

  consume(nonce: string, expiresAtMs: number, nowMs: number): boolean {
    for (const [storedNonce, storedExpiresAt] of this.seen.entries()) {
      if (storedExpiresAt <= nowMs) {
        this.seen.delete(storedNonce);
      }
    }

    if (this.seen.has(nonce)) {
      return false;
    }

    this.seen.set(nonce, expiresAtMs);
    return true;
  }
}

export function sha256Hex(body: string): string {
  return createHash('sha256').update(body).digest('hex');
}

export function signHmacRequest(params: {
  secret: string;
  timestamp: string;
  nonce: string;
  bodyHash: string;
}): string {
  const digest = createHmac('sha256', params.secret)
    .update(`${params.timestamp}.${params.nonce}.${params.bodyHash}`)
    .digest('hex');

  return `sha256=${digest}`;
}

export function verifyHmacRequest(params: {
  headers: Headers;
  rawBody: string;
  secret: string | null;
  nowMs: number;
  nonceStore: NonceStore;
}): HmacVerificationResult {
  if (!params.secret) {
    return { ok: false, code: 'missing_auth' };
  }

  const timestamp = params.headers.get('x-proofound-timestamp')?.trim() ?? '';
  const nonce = params.headers.get('x-proofound-nonce')?.trim() ?? '';
  const suppliedBodyHash =
    params.headers.get('x-proofound-content-sha256')?.trim().toLowerCase() ?? '';
  const suppliedSignature = params.headers.get('x-proofound-signature')?.trim().toLowerCase() ?? '';

  if (!timestamp || !nonce || !suppliedBodyHash || !suppliedSignature) {
    return { ok: false, code: 'missing_auth' };
  }

  if (!/^\d{10}$/.test(timestamp)) {
    return { ok: false, code: 'bad_timestamp' };
  }

  const timestampMs = Number.parseInt(timestamp, 10) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(params.nowMs - timestampMs) > MAX_CLOCK_SKEW_MS) {
    return { ok: false, code: 'stale_timestamp' };
  }

  if (!NONCE_PATTERN.test(nonce)) {
    return { ok: false, code: 'bad_nonce' };
  }

  const computedBodyHash = sha256Hex(params.rawBody);
  if (!safeEqualHex(suppliedBodyHash, computedBodyHash)) {
    return { ok: false, code: 'bad_body_hash' };
  }

  const expectedSignature = signHmacRequest({
    secret: params.secret,
    timestamp,
    nonce,
    bodyHash: computedBodyHash,
  }).toLowerCase();

  if (!safeEqualText(suppliedSignature, expectedSignature)) {
    return { ok: false, code: 'bad_signature' };
  }

  if (!params.nonceStore.consume(nonce, timestampMs + MAX_CLOCK_SKEW_MS, params.nowMs)) {
    return { ok: false, code: 'bad_nonce' };
  }

  return { ok: true, bodyHash: computedBodyHash };
}

function safeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(left) || !/^[a-f0-9]{64}$/.test(right)) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

function safeEqualText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.byteLength !== rightBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
