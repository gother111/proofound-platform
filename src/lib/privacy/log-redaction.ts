const REDACTED = '[REDACTED]';
const REDACTED_EMAIL = '[REDACTED_EMAIL]';
const REDACTED_FILE = '[REDACTED_FILE]';
const REDACTED_STORAGE = '[REDACTED_STORAGE]';
const REDACTED_TOKEN = '[REDACTED_TOKEN]';
const REDACTED_ENV = '[REDACTED_ENV]';
const REDACTED_DATABASE_ERROR = '[REDACTED_DATABASE_ERROR]';
const REDACTED_STORAGE_ERROR = '[REDACTED_STORAGE_ERROR]';
const REDACTED_STACK = '[REDACTED_STACK]';

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const FILE_VALUE_PATTERN =
  /\b[\w .+@()[\]-]+\.(pdf|doc|docx|txt|md|png|jpe?g|webp|csv|xls|xlsx)\b/gi;
const STORAGE_URL_PATTERN =
  /\bhttps?:\/\/[^\s"'<>]*(storage|supabase|s3|blob|object|bucket|upload)[^\s"'<>]*/gi;
const STORAGE_PATH_PATTERN =
  /\b(?:storage|uploads?|bucket|objects?|individual_profile|organization)\/[^\s"'<>]+/gi;
const TOKEN_PARAM_PATTERN =
  /\b(token|token_hash|hash|secret|password|authorization|cookie|api[_-]?key)=([^\s"'&<>]+)/gi;
const LONG_SECRET_PATTERN = /\b(?:[a-f0-9]{32,}|[A-Za-z0-9_-]{40,})\b/g;
const ENV_NAME_PATTERN =
  /\b[A-Z][A-Z0-9_]{2,}(?:KEY|TOKEN|SECRET|URL|URI|DSN|SALT|PASSWORD|DATABASE|BUCKET)\b/g;
const STACK_LINE_PATTERN = /\s+at\s+.*:\d+:\d+/g;
const DATABASE_DETAIL_PATTERN =
  /\b(select|insert|update|delete|from|where|join|relation|table|column|constraint|sqlstate|postgres|supabase|drizzle|duplicate key|violates|syntax error)\b/i;
const STORAGE_DETAIL_PATTERN =
  /\b(storage|bucket|object|objects|s3|blob|upload|uploads|upload path|file path)\b/i;

const SENSITIVE_KEY_PATTERN =
  /(email|name|displayname|filename|originalfilename|filepath|storagepath|sourceurl|token|hash|secret|password|authorization|cookie|stack|sql|query|statement|env|databaseurl|database_url)/i;
const ERROR_DETAIL_KEY_PATTERN =
  /(error|message|detail|details|hint|stack|cause|query|sql|statement)/i;

export type RedactedErrorLog = {
  category: 'database' | 'storage' | 'stack' | 'sensitive' | 'unknown';
  name?: string;
  code?: unknown;
  message: string;
};

function classifySensitiveText(value: string): RedactedErrorLog['category'] {
  if (DATABASE_DETAIL_PATTERN.test(value)) return 'database';
  if (STORAGE_DETAIL_PATTERN.test(value)) return 'storage';
  if (STACK_LINE_PATTERN.test(value)) return 'stack';
  if (
    matches(EMAIL_PATTERN, value) ||
    matches(FILE_VALUE_PATTERN, value) ||
    matches(STORAGE_URL_PATTERN, value) ||
    matches(STORAGE_PATH_PATTERN, value) ||
    matches(TOKEN_PARAM_PATTERN, value) ||
    matches(LONG_SECRET_PATTERN, value) ||
    matches(ENV_NAME_PATTERN, value)
  ) {
    return 'sensitive';
  }
  return 'unknown';
}

function matches(pattern: RegExp, value: string) {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

function replacementForCategory(category: RedactedErrorLog['category']) {
  switch (category) {
    case 'database':
      return REDACTED_DATABASE_ERROR;
    case 'storage':
      return REDACTED_STORAGE_ERROR;
    case 'stack':
      return REDACTED_STACK;
    case 'sensitive':
      return REDACTED;
    default:
      return null;
  }
}

export function sanitizeSensitiveLogText(value: string, key?: string): string {
  if (ERROR_DETAIL_KEY_PATTERN.test(key ?? '')) {
    const category = classifySensitiveText(value);
    const replacement = replacementForCategory(category);
    if (replacement) return replacement;
  }

  return value
    .replace(STACK_LINE_PATTERN, REDACTED_STACK)
    .replace(STORAGE_URL_PATTERN, REDACTED_STORAGE)
    .replace(STORAGE_PATH_PATTERN, REDACTED_STORAGE)
    .replace(TOKEN_PARAM_PATTERN, (_match, keyName) => `${keyName}=${REDACTED_TOKEN}`)
    .replace(EMAIL_PATTERN, REDACTED_EMAIL)
    .replace(FILE_VALUE_PATTERN, REDACTED_FILE)
    .replace(ENV_NAME_PATTERN, REDACTED_ENV)
    .replace(LONG_SECRET_PATTERN, REDACTED_TOKEN);
}

export function sanitizeLogValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return sanitizeErrorForLog(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeLogValue(entry, key));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeLogValue(entryValue, entryKey),
      ])
    );
  }

  if (typeof value !== 'string') {
    return value;
  }

  if (SENSITIVE_KEY_PATTERN.test(key ?? '')) {
    if (/email/i.test(key ?? '')) return REDACTED_EMAIL;
    if (/(file|path|url)/i.test(key ?? '')) return REDACTED_FILE;
    if (/(token|hash|secret|password|authorization|cookie)/i.test(key ?? '')) {
      return REDACTED_TOKEN;
    }
    if (/(env|database)/i.test(key ?? '')) return REDACTED_ENV;
  }

  return sanitizeSensitiveLogText(value, key);
}

export function sanitizeLogPayload(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  return sanitizeLogValue(meta) as Record<string, unknown>;
}

export function sanitizeErrorForLog(error: unknown): RedactedErrorLog {
  if (error instanceof Error) {
    const category = classifySensitiveText(`${error.message}\n${error.stack ?? ''}`);
    const replacement = replacementForCategory(category);
    const record = error as Error & { code?: unknown; status?: unknown };
    return {
      category,
      name: sanitizeSensitiveLogText(error.name || 'Error'),
      code: sanitizeLogValue(record.code ?? record.status, 'code'),
      message: replacement ?? sanitizeSensitiveLogText(error.message || 'Unknown error', 'error'),
    };
  }

  if (typeof error === 'string') {
    const category = classifySensitiveText(error);
    return {
      category,
      message: replacementForCategory(category) ?? sanitizeSensitiveLogText(error, 'error'),
    };
  }

  return {
    category: 'unknown',
    message: 'Unknown error',
  };
}
