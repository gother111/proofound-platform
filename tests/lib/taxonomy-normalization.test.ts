import { describe, expect, it } from 'vitest';

import { normalizeTaxonomyAlias } from '@/lib/expertise/taxonomy-normalization';

describe('normalizeTaxonomyAlias', () => {
  it('keeps C# and C++ distinct', () => {
    expect(normalizeTaxonomyAlias('C#')).toBe('csharp');
    expect(normalizeTaxonomyAlias('C++')).toBe('cplusplus');
    expect(normalizeTaxonomyAlias('C#')).not.toBe(normalizeTaxonomyAlias('C++'));
  });

  it('collapses Node.js variants to nodejs', () => {
    expect(normalizeTaxonomyAlias('Node.js')).toBe('nodejs');
    expect(normalizeTaxonomyAlias('NodeJS')).toBe('nodejs');
    expect(normalizeTaxonomyAlias('node js')).toBe('nodejs');
  });

  it('collapses React.js variants to reactjs', () => {
    expect(normalizeTaxonomyAlias('React.js')).toBe('reactjs');
    expect(normalizeTaxonomyAlias('react js')).toBe('reactjs');
    expect(normalizeTaxonomyAlias('Next.js')).toBe('nextjs');
  });

  it('collapses CI/CD and .NET variants to stable symbols', () => {
    expect(normalizeTaxonomyAlias('CI/CD')).toBe('cicd');
    expect(normalizeTaxonomyAlias('.NET')).toBe('dotnet');
    expect(normalizeTaxonomyAlias('dot net')).toBe('dotnet');
  });
});
