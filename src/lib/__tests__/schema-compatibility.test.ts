import { describe, expect, it } from 'vitest';

import {
  isMissingColumnError,
  isMissingRelationError,
  isSchemaCompatibilityError,
} from '@/lib/db/schemaCompatibility';

describe('schemaCompatibility', () => {
  it('detects missing column compatibility errors', () => {
    const error = {
      code: '42703',
      message: 'column "public_portfolio_state" does not exist',
    };

    expect(isMissingColumnError(error, ['public_portfolio_state'])).toBe(true);
    expect(
      isSchemaCompatibilityError(error, {
        columns: ['public_portfolio_state'],
      })
    ).toBe(true);
  });

  it('detects missing relation compatibility errors', () => {
    const error = {
      code: '42P01',
      message: 'relation "profiles" does not exist',
    };

    expect(isMissingRelationError(error, ['profiles'])).toBe(true);
    expect(
      isSchemaCompatibilityError(error, {
        relations: ['profiles'],
      })
    ).toBe(true);
  });

  it('does not classify unrelated database errors as compatibility errors', () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    };

    expect(isMissingColumnError(error, ['public_portfolio_state'])).toBe(false);
    expect(isMissingRelationError(error, ['profiles'])).toBe(false);
    expect(
      isSchemaCompatibilityError(error, {
        columns: ['public_portfolio_state'],
        relations: ['profiles'],
      })
    ).toBe(false);
  });
});
