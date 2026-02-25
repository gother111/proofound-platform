export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface RectLike {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface TooltipSize {
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface TooltipPositionInput {
  targetRect: RectLike;
  tooltipSize: TooltipSize;
  preferredPlacement: TooltipPlacement;
  viewport: ViewportSize;
  offset?: number;
  viewportPadding?: number;
}

export interface TooltipPositionResult {
  top: number;
  left: number;
  placement: TooltipPlacement;
}

const DEFAULT_OFFSET = 20;
const DEFAULT_VIEWPORT_PADDING = 16;

function oppositePlacement(placement: TooltipPlacement): TooltipPlacement {
  switch (placement) {
    case 'top':
      return 'bottom';
    case 'bottom':
      return 'top';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

function getCandidateOrder(preferredPlacement: TooltipPlacement): TooltipPlacement[] {
  const opposite = oppositePlacement(preferredPlacement);

  if (preferredPlacement === 'left' || preferredPlacement === 'right') {
    return [preferredPlacement, opposite, 'bottom', 'top'];
  }

  return [preferredPlacement, opposite, 'right', 'left'];
}

function getBasePosition(
  placement: TooltipPlacement,
  targetRect: RectLike,
  tooltipSize: TooltipSize,
  offset: number
): Pick<TooltipPositionResult, 'top' | 'left'> {
  switch (placement) {
    case 'top':
      return {
        top: targetRect.top - tooltipSize.height - offset,
        left: targetRect.left + targetRect.width / 2 - tooltipSize.width / 2,
      };
    case 'bottom':
      return {
        top: targetRect.bottom + offset,
        left: targetRect.left + targetRect.width / 2 - tooltipSize.width / 2,
      };
    case 'left':
      return {
        top: targetRect.top + targetRect.height / 2 - tooltipSize.height / 2,
        left: targetRect.left - tooltipSize.width - offset,
      };
    case 'right':
    default:
      return {
        top: targetRect.top + targetRect.height / 2 - tooltipSize.height / 2,
        left: targetRect.right + offset,
      };
  }
}

function fitsViewport(
  top: number,
  left: number,
  tooltipSize: TooltipSize,
  viewport: ViewportSize,
  viewportPadding: number
): boolean {
  const right = left + tooltipSize.width;
  const bottom = top + tooltipSize.height;

  return (
    top >= viewportPadding &&
    left >= viewportPadding &&
    right <= viewport.width - viewportPadding &&
    bottom <= viewport.height - viewportPadding
  );
}

function clampToViewport(
  rawValue: number,
  viewportLimit: number,
  itemSize: number,
  viewportPadding: number
): number {
  const minPreferred = viewportPadding;
  const maxPreferred = viewportLimit - itemSize - viewportPadding;

  if (maxPreferred >= minPreferred) {
    return Math.min(Math.max(rawValue, minPreferred), maxPreferred);
  }

  const maxWithoutPadding = Math.max(0, viewportLimit - itemSize);
  return Math.min(Math.max(rawValue, 0), maxWithoutPadding);
}

export function computeTooltipPosition({
  targetRect,
  tooltipSize,
  preferredPlacement,
  viewport,
  offset = DEFAULT_OFFSET,
  viewportPadding = DEFAULT_VIEWPORT_PADDING,
}: TooltipPositionInput): TooltipPositionResult {
  const candidatePlacements = getCandidateOrder(preferredPlacement);

  for (const candidatePlacement of candidatePlacements) {
    const { top, left } = getBasePosition(candidatePlacement, targetRect, tooltipSize, offset);

    if (fitsViewport(top, left, tooltipSize, viewport, viewportPadding)) {
      return { top, left, placement: candidatePlacement };
    }
  }

  // Fallback: keep preferred side but clamp inside viewport.
  const preferred = getBasePosition(preferredPlacement, targetRect, tooltipSize, offset);

  return {
    top: clampToViewport(preferred.top, viewport.height, tooltipSize.height, viewportPadding),
    left: clampToViewport(preferred.left, viewport.width, tooltipSize.width, viewportPadding),
    placement: preferredPlacement,
  };
}
