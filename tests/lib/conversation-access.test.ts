import { describe, expect, it } from 'vitest';

import {
  makeMaskedHandleForPersona,
  pickPrioritizedOrgRepresentative,
} from '@/lib/messaging/conversation-access';

describe('conversation org representative selection', () => {
  it('requires explicit active membership state for org representatives', () => {
    expect(
      pickPrioritizedOrgRepresentative([
        { userId: 'owner-null', role: 'org_owner', state: null },
        { userId: 'manager-missing', role: 'org_manager' },
        { userId: 'manager-suspended', role: 'org_manager', state: 'suspended' },
        { userId: 'manager-active', role: 'org_manager', state: 'active' },
      ])
    ).toBe('manager-active');
  });

  it('rejects unknown states and legacy roles for conversation participation', () => {
    expect(
      pickPrioritizedOrgRepresentative([
        { userId: 'owner-unknown-state', role: 'org_owner', state: 'unknown_state' },
        { userId: 'legacy-owner', role: 'owner', state: 'active' },
      ])
    ).toBeNull();
  });

  it('keeps masked individual handles proof-submission scoped', () => {
    expect(makeMaskedHandleForPersona('individual')).toMatch(/^Submission #[A-Z0-9]{6}$/);
    expect(makeMaskedHandleForPersona('organization')).toMatch(/^Organization #[A-Z0-9]{6}$/);
  });
});
