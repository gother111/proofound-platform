import { describe, expect, it } from 'vitest';

import { GET as accountDeletionWorkflowGET } from '@/app/api/cron/account-deletion-workflow/route';
import { GET as processDeletionsGET } from '@/app/api/cron/process-deletions/route';
import { GET as sendDeletionRemindersGET } from '@/app/api/cron/send-deletion-reminders/route';

describe('GET /api/cron/account-deletion-workflow', () => {
  it('returns 410 before performing retired cron work', async () => {
    const response = await accountDeletionWorkflowGET();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toMatchObject({
      error: 'Cron route archived',
    });
    expect(body.message).toContain('Account deletion is immediate');
  });
});

describe('retired deletion cron compatibility routes', () => {
  it('returns archived responses for all retired scheduled deletion routes', async () => {
    for (const getResponse of [
      accountDeletionWorkflowGET,
      processDeletionsGET,
      sendDeletionRemindersGET,
    ]) {
      const response = await getResponse();
      const body = await response.json();

      expect(response.status).toBe(410);
      expect(body.error).toBe('Cron route archived');
      expect(body.message).toMatch(/retired|immediate/i);
    }
  });
});
