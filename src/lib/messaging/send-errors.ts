export const MESSAGE_SEND_RETRY_COPY =
  'Message could not be sent. Your draft is still here; please try again.';

type PiiDetectedSendError = {
  type: 'PII_DETECTED';
  message?: unknown;
};

export function createMessageSendRetryError() {
  return new Error(MESSAGE_SEND_RETRY_COPY);
}

export function getMessageSendErrorCopy(_error?: unknown) {
  return MESSAGE_SEND_RETRY_COPY;
}

export function parsePiiDetectedSendError(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  try {
    const parsed = JSON.parse(error.message) as PiiDetectedSendError;
    if (parsed.type === 'PII_DETECTED' && typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    return null;
  }

  return null;
}
