/**
 * Unit tests for smart alerts helper logic
 */
import { describe, it, expect } from 'vitest';
import {
  passesSavedSearchFilters,
  arraysOverlap,
  withinRange,
} from '@/app/api/cron/smart-alerts/route';
import type { SavedSearch } from '@/db/schema';

const baseSearch: SavedSearch = {
  id: 'search-1',
  userId: 'user-1',
  name: 'Test search',
  causes: ['climate'],
  valuesTags: ['transparency'],
  locationMode: 'remote',
  country: 'USA',
  city: 'Austin',
  compMin: 80000,
  compMax: 120000,
  hoursMin: 20,
  hoursMax: 40,
  industries: ['climate'],
  alertEnabled: true,
  alertThreshold: 0.75,
  alertFrequency: 'immediate',
  lastAlertedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('arraysOverlap', () => {
  it('returns true when lists share at least one element', () => {
    expect(arraysOverlap(['a', 'b'], ['c', 'b'])).toBe(true);
  });

  it('returns false when lists have no shared element', () => {
    expect(arraysOverlap(['a'], ['c'])).toBe(false);
  });
});

describe('withinRange', () => {
  it('allows overlapping ranges', () => {
    expect(withinRange(50, 100, 80, 120)).toBe(true);
  });

  it('rejects when max actual is below desired min', () => {
    expect(withinRange(50, 100, 10, 40)).toBe(false);
  });

  it('rejects when min actual is above desired max', () => {
    expect(withinRange(50, 100, 120, 140)).toBe(false);
  });
});

describe('passesSavedSearchFilters', () => {
  const baseRow = {
    assignmentLocationMode: 'remote',
    assignmentCountry: 'USA',
    assignmentCity: 'Austin',
    assignmentCompMin: 90000,
    assignmentCompMax: 110000,
    assignmentHoursMin: 30,
    assignmentHoursMax: 35,
    assignmentCauseTags: ['climate', 'equity'],
    assignmentValues: ['transparency'],
    orgIndustry: 'climate',
  };

  it('passes when all filters align', () => {
    expect(passesSavedSearchFilters(baseSearch, baseRow)).toBe(true);
  });

  it('fails when location mode differs', () => {
    expect(
      passesSavedSearchFilters(baseSearch, { ...baseRow, assignmentLocationMode: 'onsite' })
    ).toBe(false);
  });

  it('fails when causes do not overlap', () => {
    expect(
      passesSavedSearchFilters(baseSearch, { ...baseRow, assignmentCauseTags: ['health'] })
    ).toBe(false);
  });

  it('fails when compensation is outside desired range', () => {
    expect(
      passesSavedSearchFilters(baseSearch, {
        ...baseRow,
        assignmentCompMin: 30000,
        assignmentCompMax: 40000,
      })
    ).toBe(false);
  });
});
