import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { imageResponseMock, renderedImages } = vi.hoisted(() => ({
  renderedImages: [] as Array<{
    element: React.ReactElement;
    init: { width: number; height: number };
  }>,
  imageResponseMock: vi.fn(
    (element: React.ReactElement, init: { width: number; height: number }) => {
      renderedImages.push({ element, init });
      return new Response('mock-og-image', {
        headers: {
          'content-type': 'image/png',
        },
      });
    }
  ),
}));

vi.mock('next/og', () => ({
  ImageResponse: imageResponseMock,
}));

vi.mock('@/lib/portfolio/public-projection', () => ({
  resolvePublicIndividualPortfolioAccessByHandle: vi.fn(),
}));

import OpenGraphImage from '@/app/portfolio/[handle]/opengraph-image';
import { resolvePublicIndividualPortfolioAccessByHandle } from '@/lib/portfolio/public-projection';

function buildProjection(overrides: Partial<any> = {}) {
  return {
    publicDisplayName: 'Jane Doe',
    publicHeadline: 'Impact builder',
    publicProofCount: 3,
    verifiedPublicProofPackCount: 1,
    ...overrides,
  };
}

describe('public portfolio Open Graph image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderedImages.length = 0;
    cleanup();
  });

  it('renders candidate-specific public data and trust tier into the image', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockImplementation(
      async (handle) => ({
        status: 'accessible',
        projection:
          handle === 'alex'
            ? buildProjection({
                publicDisplayName: 'Alex Rivera',
                publicHeadline: 'Community operations lead',
                publicProofCount: 1,
                verifiedPublicProofPackCount: 0,
              })
            : buildProjection(),
      })
    );

    await OpenGraphImage({ params: Promise.resolve({ handle: 'jane' }) });

    expect(renderedImages[0]?.init).toEqual({ width: 1200, height: 630 });
    render(renderedImages[0].element);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Impact builder')).toBeInTheDocument();
    expect(screen.getByText('3 public proofs')).toBeInTheDocument();
    expect(screen.getByText('Verified ✓')).toBeInTheDocument();

    cleanup();
    await OpenGraphImage({ params: Promise.resolve({ handle: 'alex' }) });

    render(renderedImages[1].element);
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Community operations lead')).toBeInTheDocument();
    expect(screen.getByText('1 public proof')).toBeInTheDocument();
    expect(screen.getByText('Self-reported')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
