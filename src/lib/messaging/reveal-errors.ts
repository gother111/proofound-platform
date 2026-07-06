export const REVEAL_REQUEST_RETRY_COPY =
  'Reveal request could not be sent. The thread remains masked; please try again.';

export const REVEAL_APPROVAL_RETRY_COPY =
  'Reveal approval could not be recorded. The thread remains masked; please try again.';

type RevealErrorOptions = {
  isApproval?: boolean;
};

export function createRevealIdentityRetryError(options: RevealErrorOptions = {}) {
  return new Error(getRevealIdentityErrorCopy(options));
}

export function getRevealIdentityErrorCopy(options: RevealErrorOptions = {}) {
  return options.isApproval ? REVEAL_APPROVAL_RETRY_COPY : REVEAL_REQUEST_RETRY_COPY;
}
