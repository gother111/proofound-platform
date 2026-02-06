import { describe, it, expect } from 'vitest';
import * as firewall from '../firewall';

const firewallApi = (firewall as any).default ?? firewall;

describe('Attribute Firewall', () => {
  it('should remove disallowed fields from objects', () => {
    const input = {
      name: 'John Doe',
      skills: ['javascript', 'react'],
      email: 'john@example.com',
      location: 'San Francisco',
    };

    const result = firewallApi.scrubDisallowedFields(input);

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

    const result = firewallApi.scrubDisallowedFields(input);

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

    const result = firewallApi.scrubDisallowedFields(input);

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty('name');
    expect(result[0]).toHaveProperty('skill');
  });

  it('should return primitives unchanged', () => {
    expect(firewallApi.scrubDisallowedFields('test')).toBe('test');
    expect(firewallApi.scrubDisallowedFields(123)).toBe(123);
    expect(firewallApi.scrubDisallowedFields(null)).toBe(null);
    expect(firewallApi.scrubDisallowedFields(undefined)).toBe(undefined);
  });

  it('should detect disallowed fields', () => {
    expect(firewallApi.containsDisallowedFields({ name: 'John' })).toBe(true);
    expect(firewallApi.containsDisallowedFields({ email: 'test@example.com' })).toBe(true);
    expect(firewallApi.containsDisallowedFields({ skills: ['coding'] })).toBe(false);
    expect(firewallApi.containsDisallowedFields({ nested: { phone: '123' } })).toBe(true);
  });

  it('should not mutate original object', () => {
    const input = { name: 'John', skills: ['js'] };
    const result = firewallApi.scrubDisallowedFields(input);

    expect(input).toHaveProperty('name');
    expect(result).not.toHaveProperty('name');
  });

  it('should scrub all known PII fields', () => {
    const input: Record<string, string> = {};

    // Add all disallowed fields
    firewallApi.DISALLOWED_FIELDS.forEach((field: string) => {
      input[field] = 'sensitive';
    });

    input.safe = 'this should remain';

    const result = firewallApi.scrubDisallowedFields(input);

    expect(result).toEqual({ safe: 'this should remain' });
    expect(firewallApi.containsDisallowedFields(result)).toBe(false);
  });
});
