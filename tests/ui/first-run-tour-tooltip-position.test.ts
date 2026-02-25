import { describe, expect, it } from 'vitest';
import { computeTooltipPosition } from '@/lib/tour/tooltip-position';

function expectInViewport(
  result: { top: number; left: number },
  tooltipSize: { width: number; height: number },
  viewport: { width: number; height: number }
) {
  expect(result.left).toBeGreaterThanOrEqual(0);
  expect(result.top).toBeGreaterThanOrEqual(0);
  expect(result.left + tooltipSize.width).toBeLessThanOrEqual(viewport.width);
  expect(result.top + tooltipSize.height).toBeLessThanOrEqual(viewport.height);
}

describe('computeTooltipPosition', () => {
  it('clamps right placement near the top edge', () => {
    const viewport = { width: 1024, height: 768 };
    const tooltipSize = { width: 320, height: 240 };

    const result = computeTooltipPosition({
      targetRect: { top: 4, left: 20, right: 60, bottom: 44, width: 40, height: 40 },
      tooltipSize,
      preferredPlacement: 'right',
      viewport,
    });

    expect(result.placement).toBe('right');
    expect(result.top).toBe(16);
    expectInViewport(result, tooltipSize, viewport);
  });

  it('clamps right placement near the bottom edge', () => {
    const viewport = { width: 1024, height: 768 };
    const tooltipSize = { width: 300, height: 180 };

    const result = computeTooltipPosition({
      targetRect: { top: 700, left: 20, right: 60, bottom: 740, width: 40, height: 40 },
      tooltipSize,
      preferredPlacement: 'right',
      viewport,
    });

    expect(result.placement).toBe('right');
    expect(result.top).toBe(572);
    expectInViewport(result, tooltipSize, viewport);
  });

  it('flips from right to left near the right edge', () => {
    const viewport = { width: 1024, height: 768 };
    const tooltipSize = { width: 280, height: 180 };

    const result = computeTooltipPosition({
      targetRect: { top: 200, left: 900, right: 980, bottom: 280, width: 80, height: 80 },
      tooltipSize,
      preferredPlacement: 'right',
      viewport,
    });

    expect(result.placement).toBe('left');
    expectInViewport(result, tooltipSize, viewport);
  });

  it('flips from left to right near the left edge', () => {
    const viewport = { width: 1024, height: 768 };
    const tooltipSize = { width: 250, height: 150 };

    const result = computeTooltipPosition({
      targetRect: { top: 260, left: 10, right: 60, bottom: 310, width: 50, height: 50 },
      tooltipSize,
      preferredPlacement: 'left',
      viewport,
    });

    expect(result.placement).toBe('right');
    expectInViewport(result, tooltipSize, viewport);
  });

  it('flips from bottom to top near the bottom edge', () => {
    const viewport = { width: 1024, height: 768 };
    const tooltipSize = { width: 260, height: 140 };

    const result = computeTooltipPosition({
      targetRect: { top: 700, left: 400, right: 480, bottom: 740, width: 80, height: 40 },
      tooltipSize,
      preferredPlacement: 'bottom',
      viewport,
    });

    expect(result.placement).toBe('top');
    expectInViewport(result, tooltipSize, viewport);
  });

  it('returns in-bounds coordinates in tiny viewports via clamped fallback', () => {
    const viewport = { width: 360, height: 240 };
    const tooltipSize = { width: 240, height: 180 };

    const result = computeTooltipPosition({
      targetRect: { top: 150, left: 300, right: 340, bottom: 190, width: 40, height: 40 },
      tooltipSize,
      preferredPlacement: 'right',
      viewport,
    });

    expect(result.placement).toBe('right');
    expectInViewport(result, tooltipSize, viewport);
  });
});
