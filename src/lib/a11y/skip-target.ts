export const APP_MAIN_SKIP_TARGET_ATTR = 'data-app-main';
export const APP_MAIN_CONTENT_ID = 'app-main-content';
export const FALLBACK_MAIN_CONTENT_ID = 'main-content';

export const APP_MAIN_SKIP_TARGET_SELECTOR = `main[${APP_MAIN_SKIP_TARGET_ATTR}]`;

export function getMainContentSkipTarget(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(APP_MAIN_SKIP_TARGET_SELECTOR) ??
    document.getElementById(FALLBACK_MAIN_CONTENT_ID)
  );
}

export function getAppMainSkipTarget(): HTMLElement | null {
  return document.querySelector<HTMLElement>(APP_MAIN_SKIP_TARGET_SELECTOR);
}
