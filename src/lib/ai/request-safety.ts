import { z } from 'zod';

const TOKENIZED_OR_PRIVATE_URL_PATTERN =
  /\b(?:https?:\/\/[^\s<>"']*(?:[?&](?:token|access_token|refresh_token|signature|sig|key|api_key|secret|password|auth|expires|X-Amz-Signature|X-Goog-Signature)=|\/storage\/v1\/object\/(?:sign|authenticated|private)\/)[^\s<>"']*|(?:gs|s3):\/\/[^\s<>"']+)\b/i;

const PRIVATE_STORAGE_PATH_PATTERN =
  /(?:^|[\s"'([{])(?:user-uploads-(?:private|quarantine)|private-files|private\/uploads|storage\/v1\/object|storage\/private|uploads\/private|bucket\/private|objects\/private|individual_profile\/[^\s"'<>]+|organization\/[^\s"'<>]+)[^\s"'<>]*/i;

const API_KEY_OR_SECRET_VALUE_PATTERN =
  /\b(?:sk_(?:live|test)_[A-Za-z0-9]{16,}|sk-[A-Za-z0-9]{24,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{16,}|ya29\.[A-Za-z0-9_-]{20,}|(?:api[_-]?key|access[_-]?token|bearer|authorization|cookie|session)\s*[:=]\s*[A-Za-z0-9._-]{12,})\b/i;

const SECRET_FIELD_NAME_PATTERN =
  /^(?:api[_-]?key|authorization|auth[_-]?header|cookie|cookie[_-]?header|secret|password|jwt|session|session[_-]?(?:id|token|field|data)|signed[_-]?url|storage[_-]?url|private[_-]?storage[_-]?url|token|access[_-]?token|refresh[_-]?token)$/i;

const PRIVATE_FILE_FIELD_NAME_PATTERN =
  /(?:full[_-]?file|raw[_-]?(?:file|upload)|uploaded[_-]?file|file[_-]?(?:payload|contents|bytes|data|body|path|url)|original[_-]?file[_-]?name|original[_-]?filename|private[_-]?(?:file|storage|payload|field)|storage[_-]?path|private[_-]?path)/i;

export const FORBIDDEN_AI_OUTPUT_PATTERN =
  /\b(?:candidate\s+(?:score|rank)|fit\s+score|ranking|rank(?:ed)?\s+(?:the|this|candidates?)|shortlist(?:ed|ing)?|shortlist\s+recommendation|suitability\s+judg(?:e|ment)|verification\s+approval|trust\s+level|hiring\s+recommendation|best\s+candidate|should\s+hire|recommended\s+to\s+interview|recommend(?:ed|ation)?\s+(?:this\s+)?candidate\s+for\s+(?:hire|hiring|interview)|score\s+(?:this\s+)?candidate)\b/i;

const UNSAFE_AI_REQUEST_MESSAGE =
  'Signed URLs, tokenized links, private storage URLs, storage paths, secrets, original filenames, and private file payloads are not allowed in AI requests.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function findUnsafeAiRequestPath(
  value: unknown,
  path: Array<string | number> = []
): Array<string | number> | null {
  if (typeof value === 'string') {
    return TOKENIZED_OR_PRIVATE_URL_PATTERN.test(value) ||
      PRIVATE_STORAGE_PATH_PATTERN.test(value) ||
      API_KEY_OR_SECRET_VALUE_PATTERN.test(value)
      ? path
      : null;
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

export function containsForbiddenAiOutput(value: unknown): boolean {
  if (typeof value === 'string') {
    return FORBIDDEN_AI_OUTPUT_PATTERN.test(value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenAiOutput(item));
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).some((item) => containsForbiddenAiOutput(item));
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
