export const PRIVACY_PREFLIGHT_PROMPT_VERSION = 'ai-privacy-preflight-v1';

export type PrivacyPreflightRiskLevel = 'low' | 'medium' | 'high';

export type PrivacyPreflightFlagCode =
  | 'email'
  | 'phone'
  | 'exact_address'
  | 'tokenized_url'
  | 'filename'
  | 'national_id'
  | 'api_key_or_access_token'
  | 'confidential_marker'
  | 'protected_trait'
  | 'hidden_visibility_term';

export type PrivacyPreflightField = {
  id?: string | null;
  label?: string | null;
  value?: string | null;
  visibility?: 'visible' | 'hidden' | 'public' | 'private' | 'owner_only' | 'internal_only' | null;
};

export type PrivacyPreflightFlag = {
  code: PrivacyPreflightFlagCode;
  riskLevel: Exclude<PrivacyPreflightRiskLevel, 'low'>;
  deterministic: true;
  requiresReview: boolean;
  field: string | null;
  message: string;
};

export type PrivacyPreflightRulesInput = {
  text?: string | null;
  fields?: PrivacyPreflightField[];
  hiddenTerms?: string[];
};

export type PrivacyPreflightRulesResult = {
  riskLevel: PrivacyPreflightRiskLevel;
  flags: PrivacyPreflightFlag[];
  redactedText: string;
  redactionSummary: Record<PrivacyPreflightFlagCode, number>;
};

type PatternRule = {
  code: PrivacyPreflightFlagCode;
  pattern: RegExp;
  replacement: string;
  message: string;
};

const MAX_SANITIZED_TEXT_CHARS = 1800;

const RULES: PatternRule[] = [
  {
    code: 'email',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[redacted email]',
    message: 'Email-like contact information appears in text intended for publication.',
  },
  {
    code: 'tokenized_url',
    pattern:
      /\bhttps?:\/\/[^\s<>"']*(?:[?&](?:token|access_token|refresh_token|signature|sig|key|api_key|secret|password|auth|expires|X-Amz-Signature)=|\/storage\/v1\/object\/sign\/)[^\s<>"']*/gi,
    replacement: '[redacted tokenized link]',
    message: 'A URL appears to contain a token, signature, or secret query parameter.',
  },
  {
    code: 'filename',
    pattern:
      /\b[^\s/\\]+\.(?:pdf|png|jpe?g|heic|heif|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z|key|pem|env)\b/gi,
    replacement: '[redacted filename]',
    message: 'A filename-like value appears in text intended for publication.',
  },
  {
    code: 'api_key_or_access_token',
    pattern:
      /\b(?:sk_(?:live|test)_[A-Za-z0-9]{16,}|sk-[A-Za-z0-9]{24,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{16,}|ya29\.[A-Za-z0-9_-]{20,}|(?:api[_-]?key|access[_-]?token|bearer)\s*[:=]\s*[A-Za-z0-9._-]{12,})\b/gi,
    replacement: '[redacted access token]',
    message: 'API key or access-token-like text appears in a publication field.',
  },
  {
    code: 'national_id',
    pattern:
      /\b(?:\d{3}-\d{2}-\d{4}|\d{6}[-+]\d{4}|\d{8}[-+]\d{4}|\d{4}\s?\d{2}\s?\d{2}[-+]\d{4})\b/g,
    replacement: '[redacted national id]',
    message: 'National ID-like digits appear in text intended for publication.',
  },
  {
    code: 'exact_address',
    pattern:
      /\b\d{1,6}[A-Z]?\s+[A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö0-9\s.'-]{2,}\s+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|väg|gatan|gata|gränd|allé|allee)\b/gi,
    replacement: '[redacted address]',
    message: 'Exact address-like text appears in a publication field.',
  },
  {
    code: 'phone',
    pattern: /(?:\+?\d[\d\s().-]{7,}\d)/g,
    replacement: '[redacted phone]',
    message: 'Phone-like contact information appears in text intended for publication.',
  },
  {
    code: 'confidential_marker',
    pattern:
      /\b(?:confidential|strictly confidential|nda|non[-\s]?disclosure|internal only|do not share|not for distribution|proprietary|trade secret)\b/gi,
    replacement: '[redacted confidential marker]',
    message: 'Confidentiality marker appears in text intended for publication.',
  },
  {
    code: 'protected_trait',
    pattern:
      /\b(?:age|young|younger|older|gender|male|female|race|racial|ethnicity|ethnic|religion|religious|disability|disabled|pregnant|pregnancy|marital|parenthood|native\s+speaker|nationality|citizenship|visa|sexual\s+orientation|transgender)\b/gi,
    replacement: '[redacted protected trait]',
    message: 'Protected-trait or discriminatory criteria appear in text intended for publication.',
  },
];

const FLAG_MESSAGES: Record<PrivacyPreflightFlagCode, string> = {
  email: 'Email-like contact information appears in text intended for publication.',
  phone: 'Phone-like contact information appears in text intended for publication.',
  exact_address: 'Exact address-like text appears in a publication field.',
  tokenized_url: 'A URL appears to contain a token, signature, or secret query parameter.',
  filename: 'A filename-like value appears in text intended for publication.',
  national_id: 'National ID-like digits appear in text intended for publication.',
  api_key_or_access_token: 'API key or access-token-like text appears in a publication field.',
  confidential_marker: 'Confidentiality marker appears in text intended for publication.',
  protected_trait:
    'Protected-trait or discriminatory criteria appear in text intended for publication.',
  hidden_visibility_term:
    'Text repeats a name, client, employer, or private term whose visibility is hidden.',
};

function normalizeFieldLabel(field: PrivacyPreflightField, fallback: string) {
  return field.label?.trim() || field.id?.trim() || fallback;
}

function pushFlagOnce(
  flags: PrivacyPreflightFlag[],
  seen: Set<string>,
  code: PrivacyPreflightFlagCode,
  field: string | null,
  message = FLAG_MESSAGES[code]
) {
  const key = `${code}:${field ?? 'text'}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  flags.push({
    code,
    riskLevel: 'high',
    deterministic: true,
    requiresReview: true,
    field,
    message,
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeHiddenTerms(terms: string[] | undefined) {
  return [
    ...new Set((terms ?? []).map((term) => term.trim()).filter((term) => term.length >= 3)),
  ].slice(0, 40);
}

function buildFieldEntries(input: PrivacyPreflightRulesInput) {
  const entries = (input.fields ?? [])
    .map((field, index) => ({
      label: normalizeFieldLabel(field, `field_${index + 1}`),
      value: field.value ?? '',
    }))
    .filter((entry) => entry.value.trim().length > 0);

  if (input.text?.trim()) {
    entries.unshift({ label: 'text', value: input.text });
  }

  return entries.slice(0, 32);
}

export function evaluatePrivacyPreflightRules(
  input: PrivacyPreflightRulesInput
): PrivacyPreflightRulesResult {
  const entries = buildFieldEntries(input);
  const flags: PrivacyPreflightFlag[] = [];
  const seen = new Set<string>();
  const redactionSummary = {} as Record<PrivacyPreflightFlagCode, number>;
  const hiddenTerms = normalizeHiddenTerms(input.hiddenTerms);
  const sanitizedParts: string[] = [];

  for (const entry of entries) {
    let redacted = entry.value.replace(/<[^>]*>/g, ' ');

    for (const rule of RULES) {
      let count = 0;
      redacted = redacted.replace(rule.pattern, () => {
        count += 1;
        return rule.replacement;
      });

      if (count > 0) {
        redactionSummary[rule.code] = (redactionSummary[rule.code] ?? 0) + count;
        pushFlagOnce(flags, seen, rule.code, entry.label, rule.message);
      }
    }

    for (const term of hiddenTerms) {
      const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
      let count = 0;
      redacted = redacted.replace(pattern, () => {
        count += 1;
        return '[redacted hidden term]';
      });
      if (count > 0) {
        redactionSummary.hidden_visibility_term =
          (redactionSummary.hidden_visibility_term ?? 0) + count;
        pushFlagOnce(flags, seen, 'hidden_visibility_term', entry.label);
      }
    }

    const compacted = redacted.replace(/\s+/g, ' ').trim();
    if (compacted) {
      sanitizedParts.push(`${entry.label}: ${compacted.slice(0, 600)}`);
    }
  }

  return {
    riskLevel: flags.some((flag) => flag.riskLevel === 'high') ? 'high' : 'low',
    flags,
    redactedText: sanitizedParts.join('\n').slice(0, MAX_SANITIZED_TEXT_CHARS),
    redactionSummary,
  };
}

export function sanitizePrivacyPreflightTextForPublic(
  value: string | null | undefined,
  hiddenTerms: string[] = []
) {
  if (!value?.trim()) {
    return value ?? null;
  }

  const result = evaluatePrivacyPreflightRules({
    text: value,
    hiddenTerms,
  });

  return result.redactedText.replace(/^text:\s*/, '').trim() || null;
}
