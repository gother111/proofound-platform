import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LAUNCH_TIME_ZONE,
  getLaunchDateSlug,
  resolveLaunchTimeZone,
} from '@/lib/launch/date-slug';

describe('launch date slug', () => {
  it('defaults launch artifact dates to the Stockholm operating day', () => {
    expect(DEFAULT_LAUNCH_TIME_ZONE).toBe('Europe/Stockholm');
    expect(getLaunchDateSlug(new Date('2026-05-19T22:08:19.153Z'), {})).toBe('2026-05-20');
  });

  it('allows explicit launch timezone overrides', () => {
    expect(resolveLaunchTimeZone({ PROOFOUND_LAUNCH_TIME_ZONE: 'UTC' })).toBe('UTC');
    expect(getLaunchDateSlug(new Date('2026-05-19T22:08:19.153Z'), { TZ: 'UTC' })).toBe(
      '2026-05-19'
    );
  });
});
