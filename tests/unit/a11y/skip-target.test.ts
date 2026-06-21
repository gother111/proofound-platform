import { afterEach, describe, expect, it } from 'vitest';

import {
  APP_MAIN_CONTENT_ID,
  FALLBACK_MAIN_CONTENT_ID,
  getAppMainSkipTarget,
  getMainContentSkipTarget,
} from '@/lib/a11y/skip-target';

describe('skip target resolution', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('prefers the app shell main over the root fallback wrapper', () => {
    document.body.innerHTML = `
      <div id="${FALLBACK_MAIN_CONTENT_ID}" tabindex="-1">
        <main id="${APP_MAIN_CONTENT_ID}" data-app-main tabindex="0" aria-label="Main content"></main>
      </div>
    `;

    const target = getMainContentSkipTarget();

    expect(target?.tagName).toBe('MAIN');
    expect(target).toHaveAttribute('data-app-main');
    expect(target?.id).toBe(APP_MAIN_CONTENT_ID);
  });

  it('falls back to the root wrapper when no app shell main exists', () => {
    document.body.innerHTML = `<div id="${FALLBACK_MAIN_CONTENT_ID}" tabindex="-1"></div>`;

    const target = getMainContentSkipTarget();

    expect(target?.tagName).toBe('DIV');
    expect(target?.id).toBe(FALLBACK_MAIN_CONTENT_ID);
    expect(getAppMainSkipTarget()).toBeNull();
  });
});
