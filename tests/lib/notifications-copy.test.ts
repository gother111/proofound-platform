import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFirstMock = vi.hoisted(() => vi.fn());
const valuesMock = vi.hoisted(() => vi.fn());
const returningMock = vi.hoisted(() => vi.fn());
const enqueuePushForNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('@/db', () => ({
  db: {
    query: {
      notificationPreferences: {
        findFirst: (...args: any[]) => findFirstMock(...args),
      },
    },
    insert: vi.fn(() => ({
      values: (...args: any[]) => {
        valuesMock(...args);
        return {
          returning: (...returningArgs: any[]) => returningMock(...returningArgs),
        };
      },
    })),
  },
}));

vi.mock('@/db/schema', () => ({
  notifications: {
    id: 'notifications.id',
  },
  notificationPreferences: {
    userId: 'notification_preferences.user_id',
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/notifications/push', () => ({
  enqueuePushForNotification: (...args: any[]) => enqueuePushForNotificationMock(...args),
}));

import { notifyAssignmentPublished } from '@/lib/notifications';

describe('notification copy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstMock.mockResolvedValue(null);
    returningMock.mockResolvedValue([{ id: 'notification-1' }]);
    enqueuePushForNotificationMock.mockResolvedValue(undefined);
  });

  it('keeps assignment notifications proof-review scoped instead of opportunity scoped', async () => {
    await notifyAssignmentPublished(
      'user-1',
      'assignment-1',
      'Evidence review lead',
      'Acme Studio'
    );

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'assignment_published',
        title: 'New Assignment Review',
        message: 'Acme Studio posted an assignment for proof review: Evidence review lead',
        actionUrl: '/app/i/matching?assignment=assignment-1',
        entityType: 'assignment',
        entityId: 'assignment-1',
      })
    );
    expect(valuesMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Opportunity',
      })
    );
  });
});
