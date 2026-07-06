import { describe, expect, it } from 'vitest';
import { buildGoogleCalendarUrl, buildInterviewIcs } from '@/lib/interviews/calendar';

describe('interview calendar helpers', () => {
  const payload = {
    interviewId: 'interview_123',
    scheduledAt: '2026-02-20T10:30:00.000Z',
    durationMinutes: 30,
    meetingUrl: 'https://meet.google.com/example-room',
    platform: 'google_meet',
    title: 'Proofound interview',
  };

  it('builds a Google Calendar template URL', () => {
    const url = buildGoogleCalendarUrl(payload);

    expect(url).toContain('https://calendar.google.com/calendar/render?');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain(encodeURIComponent(payload.meetingUrl));
    expect(url).toContain('dates=');
  });

  it('builds an .ics payload with meeting details', () => {
    const ics = buildInterviewIcs(payload);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain(`UID:${payload.interviewId}@proofound.io`);
    expect(ics).toContain('SUMMARY:Proofound interview');
    expect(ics).toContain(payload.meetingUrl);
    expect(ics).toContain('END:VCALENDAR');
  });
});
