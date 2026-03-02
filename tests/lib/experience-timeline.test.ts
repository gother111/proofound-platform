import { describe, expect, it } from 'vitest';
import {
  buildExperienceTimeline,
  formatExperienceDurationFromDates,
  monthInputToIsoDate,
  parseLegacyDurationToTimeline,
} from '@/lib/profile/experience-timeline';

describe('experience timeline helpers', () => {
  it('converts month input to ISO date', () => {
    expect(monthInputToIsoDate('2024-02')).toBe('2024-02-01');
    expect(monthInputToIsoDate('2024-13')).toBeNull();
    expect(monthInputToIsoDate('')).toBeNull();
  });

  it('formats canonical duration with and without end date', () => {
    expect(formatExperienceDurationFromDates('2024-01-01', '2024-07-01')).toBe(
      'Jan 2024 - Jul 2024'
    );
    expect(formatExperienceDurationFromDates('2024-01-01', null)).toBe('Jan 2024 - Present');
  });

  it('parses common legacy duration formats', () => {
    expect(parseLegacyDurationToTimeline('2024-01 - 2024-04')).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-04-01',
    });

    expect(parseLegacyDurationToTimeline('Jan 2022 - Present')).toEqual({
      startDate: '2022-01-01',
      endDate: null,
    });

    expect(parseLegacyDurationToTimeline('2024-01-01 - 2024-07-01')).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-07-01',
    });

    expect(parseLegacyDurationToTimeline('04/2023 - 09/2025')).toEqual({
      startDate: '2023-04-01',
      endDate: '2025-09-01',
    });

    expect(parseLegacyDurationToTimeline('2023/04 - 2025/09')).toEqual({
      startDate: '2023-04-01',
      endDate: '2025-09-01',
    });

    expect(parseLegacyDurationToTimeline('April 2023 to September 2025')).toEqual({
      startDate: '2023-04-01',
      endDate: '2025-09-01',
    });

    expect(parseLegacyDurationToTimeline('2021 — Present')).toEqual({
      startDate: '2021-01-01',
      endDate: null,
    });

    expect(parseLegacyDurationToTimeline('2019 — 2021')).toEqual({
      startDate: '2019-01-01',
      endDate: '2021-01-01',
    });
  });

  it('preserves legacy duration when parsing fails', () => {
    expect(
      buildExperienceTimeline({
        duration: 'Summer internship era',
      })
    ).toEqual({
      startDate: null,
      endDate: null,
      duration: 'Summer internship era',
    });
  });
});
