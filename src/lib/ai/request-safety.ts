import { z } from 'zod';

const TOKENIZED_OR_PRIVATE_URL_PATTERN =
  /\b(?:https?:\/\/[^\s<>"']*(?:[?&](?:token|access_token|refresh_token|signature|sig|key|api_key|secret|password|auth|expires|X-Amz-Signature|X-Goog-Signature)=|\/storage\/v1\/object\/sign\/)[^\s<>"']*|(?:gs|s3):\/\/[^\s<>"']+)\b/i;

const SECRET_FIELD_NAME_PATTERN =
  /^(?:api[_-]?key|authorization|cookie|secret|session[_-]?id|signed[_-]?url|storage[_-]?url|private[_-]?storage[_-]?url|token|access[_-]?token|refresh[_-]?token)$/i;

const PRIVATE_FILE_FIELD_NAME_PATTERN =
  /(?:full[_-]?file|raw[_-]?file|file[_-]?payload|file[_-]?contents|original[_-]?filename|private[_-]?file)/i;

const UNSAFE_AI_REQUEST_MESSAGE =
  'Signed URLs, tokenized links, private storage URLs, secrets, and full private file payloads are not allowed in AI requests.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function findUnsafeAiRequestPath(
  value: unknown,
  path: Array<string | number> = []
): Array<string | number> | null {
  if (typeof value === 'string') {
    return TOKENIZED_OR_PRIVATE_URL_PATTERN.test(value) ? path : null;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const unsafePath = findUnsafeAiRequestPath(item, [...path, index]);
      if (unsafePath) {
        return unsafePath;
      }
    }
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const [key, item] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (SECRET_FIELD_NAME_PATTERN.test(key) || PRIVATE_FILE_FIELD_NAME_PATTERN.test(key)) {
      return nextPath;
    }

    const unsafePath = findUnsafeAiRequestPath(item, nextPath);
    if (unsafePath) {
      return unsafePath;
    }
  }

  return null;
}

export function containsUnsafeAiRequestPayload(value: unknown): boolean {
  return Boolean(findUnsafeAiRequestPath(value));
}

export function addUnsafeAiRequestPayloadIssue(value: unknown, ctx: z.RefinementCtx): void {
  const unsafePath = findUnsafeAiRequestPath(value);
  if (!unsafePath) {
    return;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: unsafePath,
    message: UNSAFE_AI_REQUEST_MESSAGE,
  });
}
