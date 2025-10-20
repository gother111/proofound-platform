import { describe, it, expect } from 'vitest';
import { scrubDisallowedFields, containsDisallowedFields, DISALLOWED_FIELDS } from '../firewall';

describe('Attribute Firewall', () => {
  it('should remove disallowed fields from objects', () => {
    const input = {
      name: 'John Doe',
      skills: ['javascript', 'react'],
      email: 'john@example.com',
      location: 'San Francisco',
    };

    const result = scrubDisallowedFields(input);

    expect(result).toEqual({
      skills: ['javascript', 'react'],
      location: 'San Francisco',
    });
    expect(result).not.toHaveProperty('name');
    expect(result).not.toHaveProperty('email');
  });

  it('should handle nested objects', () => {
    const input = {
      profile: {
        name: 'Jane Doe',
        skills: ['python'],
        age: 30,
      },
      metadata: {
        created: '2024-01-01',
      },
    };

    const result = scrubDisallowedFields(input);

    expect(result.profile).not.toHaveProperty('name');
    expect(result.profile).not.toHaveProperty('age');
    expect(result.profile).toHaveProperty('skills');
    expect(result.metadata).toHaveProperty('created');
  });

  it('should handle arrays', () => {
    const input = [
      { name: 'Person 1', skill: 'coding' },
      { name: 'Person 2', skill: 'design' },
    ];

    const result = scrubDisallowedFields(input);

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty('name');
    expect(result[0]).toHaveProperty('skill');
  });

  it('should return primitives unchanged', () => {
    expect(scrubDisallowedFields('test')).toBe('test');
    expect(scrubDisallowedFields(123)).toBe(123);
    expect(scrubDisallowedFields(null)).toBe(null);
    expect(scrubDisallowedFields(undefined)).toBe(undefined);
  });

  it('should detect disallowed fields', () => {
    expect(containsDisallowedFields({ name: 'John' })).toBe(true);
    expect(containsDisallowedFields({ email: 'test@example.com' })).toBe(true);
    expect(containsDisallowedFields({ skills: ['coding'] })).toBe(false);
    expect(containsDisallowedFields({ nested: { phone: '123' } })).toBe(true);
  });

  it('should not mutate original object', () => {
    const input = { name: 'John', skills: ['js'] };
    const result = scrubDisallowedFields(input);

    expect(input).toHaveProperty('name');
    expect(result).not.toHaveProperty('name');
  });

  it('should scrub all known PII fields', () => {
    const input: Record<string, string> = {};

    // Add all disallowed fields
    DISALLOWED_FIELDS.forEach((field) => {
      input[field] = 'sensitive';
    });

    input.safe = 'this should remain';

    const result = scrubDisallowedFields(input);

    expect(result).toEqual({ safe: 'this should remain' });
    expect(containsDisallowedFields(result)).toBe(false);
  });
});
