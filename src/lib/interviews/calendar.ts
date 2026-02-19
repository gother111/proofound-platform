export interface InterviewCalendarPayload {
  interviewId: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string;
  platform: string;
  title: string;
}

function toUtcCalendarTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildGoogleCalendarUrl(payload: InterviewCalendarPayload): string {
  const start = new Date(payload.scheduledAt);
  const end = new Date(start.getTime() + payload.durationMinutes * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: payload.title,
    dates: `${toUtcCalendarTimestamp(start)}/${toUtcCalendarTimestamp(end)}`,
    details: `Join meeting: ${payload.meetingUrl}`,
    location: payload.meetingUrl,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildInterviewIcs(payload: InterviewCalendarPayload): string {
  const start = new Date(payload.scheduledAt);
  const end = new Date(start.getTime() + payload.durationMinutes * 60 * 1000);
  const providerName = payload.platform === 'google_meet' ? 'Google Meet' : payload.platform;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Proofound//Interview//EN',
    'BEGIN:VEVENT',
    `UID:${payload.interviewId}@proofound.com`,
    `DTSTAMP:${toUtcCalendarTimestamp(new Date())}`,
    `DTSTART:${toUtcCalendarTimestamp(start)}`,
    `DTEND:${toUtcCalendarTimestamp(end)}`,
    `SUMMARY:${escapeIcsText(payload.title)}`,
    `DESCRIPTION:${escapeIcsText(`Interview via ${providerName}\nJoin meeting: ${payload.meetingUrl}`)}`,
    `LOCATION:${escapeIcsText(payload.meetingUrl)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadInterviewIcs(payload: InterviewCalendarPayload): void {
  const ics = buildInterviewIcs(payload);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `interview-${payload.interviewId}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
