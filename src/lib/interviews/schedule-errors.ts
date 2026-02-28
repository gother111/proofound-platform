const GOOGLE_VERIFICATION_BLOCKED_MESSAGE =
  'Google blocked access because the Proofound app has not completed Google verification. Ask an admin to add your Google account as a test user (Testing mode) or complete Google app verification (Production mode), then try again.';

export interface GoogleScheduleErrorClassification {
  code:
    | 'GOOGLE_RECONNECT_REQUIRED'
    | 'GOOGLE_SCOPE_MISSING'
    | 'GOOGLE_VERIFICATION_BLOCKED'
    | 'GOOGLE_CALENDAR_ACCESS_BLOCKED';
  error: string;
  message: string;
  shouldDisconnectIntegration: boolean;
  providerMessage: string | null;
}

type ErrorRecord = Record<string, unknown>;

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > 0 ? compact : null;
}

function collectErrorTexts(error: unknown): string[] {
  if (!error || typeof error !== 'object') {
    if (typeof error === 'string') {
      return [error];
    }
    return [];
  }

  const typed = error as ErrorRecord;
  const texts: string[] = [];

  const directMessage = normalizeText(typeof typed.message === 'string' ? typed.message : null);
  if (directMessage) {
    texts.push(directMessage);
  }

  const response = (typed.response ?? null) as ErrorRecord | null;
  if (!response) {
    return texts;
  }

  const responseStatusText = normalizeText(
    typeof response.statusText === 'string' ? response.statusText : null
  );
  if (responseStatusText) {
    texts.push(responseStatusText);
  }

  const data = (response.data ?? null) as ErrorRecord | null;
  if (!data) {
    return texts;
  }

  const dataError = data.error;

  if (typeof dataError === 'string') {
    const normalized = normalizeText(dataError);
    if (normalized) {
      texts.push(normalized);
    }
    return texts;
  }

  if (!dataError || typeof dataError !== 'object') {
    return texts;
  }

  const typedDataError = dataError as ErrorRecord;
  const dataErrorMessage = normalizeText(
    typeof typedDataError.message === 'string' ? typedDataError.message : null
  );
  if (dataErrorMessage) {
    texts.push(dataErrorMessage);
  }

  const dataErrorStatus = normalizeText(
    typeof typedDataError.status === 'string' ? typedDataError.status : null
  );
  if (dataErrorStatus) {
    texts.push(dataErrorStatus);
  }

  const dataErrorDescription = normalizeText(
    typeof typedDataError.error_description === 'string' ? typedDataError.error_description : null
  );
  if (dataErrorDescription) {
    texts.push(dataErrorDescription);
  }

  if (Array.isArray(typedDataError.errors)) {
    for (const candidate of typedDataError.errors) {
      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const typedCandidate = candidate as ErrorRecord;
      for (const key of ['message', 'reason', 'domain'] as const) {
        const value = normalizeText(
          typeof typedCandidate[key] === 'string' ? (typedCandidate[key] as string) : null
        );
        if (value) {
          texts.push(value);
        }
      }
    }
  }

  return texts;
}

function truncateProviderMessage(input: string | null): string | null {
  if (!input) return null;
  return input.slice(0, 280);
}

export function classifyGoogleScheduleError(
  error: unknown
): GoogleScheduleErrorClassification | null {
  const texts = collectErrorTexts(error);
  const combined = texts.join(' ').toLowerCase();
  const providerMessage = truncateProviderMessage(normalizeText(texts.join(' | ')));

  const reconnectRequired =
    combined.includes('invalid_grant') ||
    combined.includes('token has been expired or revoked') ||
    combined.includes('invalid refresh token') ||
    combined.includes('token revoked') ||
    combined.includes('refresh token is invalid') ||
    combined.includes('invalid_rapt');

  if (reconnectRequired) {
    return {
      code: 'GOOGLE_RECONNECT_REQUIRED',
      error: 'Google authorization expired',
      message: 'Reconnect Google Calendar in Settings > Integrations and retry.',
      shouldDisconnectIntegration: true,
      providerMessage,
    };
  }

  const scopeMissing =
    combined.includes('insufficientpermissions') ||
    combined.includes('insufficient_permission') ||
    combined.includes('insufficient_scope') ||
    combined.includes('insufficient authentication scopes') ||
    combined.includes('request had insufficient authentication scopes');

  if (scopeMissing) {
    return {
      code: 'GOOGLE_SCOPE_MISSING',
      error: 'Google Calendar scope missing',
      message:
        'Your Google connection is missing required Calendar permissions. Reconnect Google Calendar in Settings > Integrations and retry.',
      shouldDisconnectIntegration: false,
      providerMessage,
    };
  }

  const verificationBlocked =
    combined.includes('app not verified') ||
    combined.includes('has not completed the google verification process') ||
    combined.includes('access blocked') ||
    combined.includes('unverified app') ||
    (combined.includes('access_denied') && combined.includes('verification'));

  if (verificationBlocked) {
    return {
      code: 'GOOGLE_VERIFICATION_BLOCKED',
      error: 'Google app verification required',
      message: GOOGLE_VERIFICATION_BLOCKED_MESSAGE,
      shouldDisconnectIntegration: false,
      providerMessage,
    };
  }

  const calendarBlocked =
    combined.includes('accessnotconfigured') ||
    combined.includes('calendar api has not been used') ||
    combined.includes('api has not been used') ||
    combined.includes('google calendar api is not enabled') ||
    combined.includes('forbiddenfornonorganizer') ||
    combined.includes('not a calendar user');

  if (calendarBlocked) {
    return {
      code: 'GOOGLE_CALENDAR_ACCESS_BLOCKED',
      error: 'Google Calendar access blocked',
      message:
        'Google Calendar access is blocked for this account or project. Ask an admin to enable Calendar API access and confirm organizer permissions, then retry.',
      shouldDisconnectIntegration: false,
      providerMessage,
    };
  }

  return null;
}
