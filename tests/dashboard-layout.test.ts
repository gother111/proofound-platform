import { describe, it, expect } from 'vitest';

import {
  AVAILABLE_WIDGETS,
  DEFAULT_LAYOUT,
  sanitizeLayout,
  validateLayout,
} from '@/lib/dashboard/layout';

describe('dashboard layout', () => {
  it('keeps default layout valid and sequential', () => {
    const result = validateLayout(DEFAULT_LAYOUT);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(DEFAULT_LAYOUT.map((w) => w.position)).toEqual([...Array(DEFAULT_LAYOUT.length).keys()]);
  });

  it('includes new individual tiles required by PRD', () => {
    const requiredIds = [
      'profile-activation',
      'matching-readiness',
      'interviews-feedback',
      'momentum-metrics',
      'zen-snapshot',
      'notifications',
      'next-best-actions',
    ];

    requiredIds.forEach((id) => {
      expect(AVAILABLE_WIDGETS[id]).toBeDefined();
    });
  });

  it('sanitizes duplicate widgets and keeps first visible entry', () => {
    const rawLayout = [
      { widgetId: 'goals', position: 0, visible: false, size: 'default', settings: {} },
      { widgetId: 'goals', position: 1, visible: true, size: 'default', settings: {} },
      { widgetId: 'tasks', position: 2, visible: true, size: 'default', settings: {} },
    ];

    const sanitized = sanitizeLayout(rawLayout, {
      defaultLayout: DEFAULT_LAYOUT,
      availableWidgets: AVAILABLE_WIDGETS,
    });

    expect(sanitized.map((widget) => widget.widgetId)).toEqual(['goals', 'tasks']);
    expect(sanitized[0].visible).toBe(true);
    expect(sanitized.map((widget) => widget.position)).toEqual([0, 1]);
  });

  it('drops unknown widgets and normalizes invalid sizes', () => {
    const rawLayout = [
      { widgetId: 'goals', position: 0, visible: true, size: 'full', settings: {} },
      { widgetId: 'unknown-widget', position: 1, visible: true, size: 'default', settings: {} },
      { widgetId: 'notifications', position: 2, visible: true, size: 'large', settings: {} },
    ];

    const sanitized = sanitizeLayout(rawLayout, {
      defaultLayout: DEFAULT_LAYOUT,
      availableWidgets: AVAILABLE_WIDGETS,
    });

    expect(sanitized.map((widget) => widget.widgetId)).toEqual(['goals', 'notifications']);
    expect(sanitized[0].size).toBe('default');
    expect(sanitized[1].size).toBe('small');
  });

  it('falls back to default layout when all entries are invalid', () => {
    const sanitized = sanitizeLayout(
      [{ widgetId: 'invalid-widget', position: 5, visible: true, size: 'default', settings: {} }],
      {
        defaultLayout: DEFAULT_LAYOUT,
        availableWidgets: AVAILABLE_WIDGETS,
      }
    );

    expect(sanitized.map((widget) => widget.widgetId)).toEqual(
      DEFAULT_LAYOUT.map((widget) => widget.widgetId)
    );
    expect(sanitized.map((widget) => widget.position)).toEqual([...Array(sanitized.length).keys()]);
  });
});
