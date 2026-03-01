import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScheduleInterviewModal } from '@/components/interviews/ScheduleInterviewModal';

const scheduleInterviewMock = vi.fn();

vi.mock('@/app/actions/interviews', () => ({
  scheduleInterview: (...args: any[]) => scheduleInterviewMock(...args),
}));

vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: () => true,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  DialogDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

vi.mock('@/components/ui/select', () => {
  const SelectItem = ({ value, disabled, children }: any) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  );

  const collectOptions = (children: any): React.ReactElement[] => {
    const options: React.ReactElement[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return;
      }

      if (child.type === SelectItem) {
        options.push(child as React.ReactElement);
        return;
      }

      if (child.props?.children) {
        options.push(...collectOptions(child.props.children));
      }
    });
    return options;
  };

  return {
    Select: ({ value, onValueChange, children }: any) => {
      const options = collectOptions(children);
      return (
        <select
          data-testid="mock-select"
          value={value ?? ''}
          onChange={(event) => onValueChange?.(event.target.value)}
        >
          {options.map((option, index) => (
            <option key={index} value={option.props.value} disabled={option.props.disabled}>
              {option.props.children}
            </option>
          ))}
        </select>
      );
    },
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem,
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
  };
});

describe('ScheduleInterviewModal', () => {
  const getPathname = (input: string | URL | Request) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return url.startsWith('http') ? new URL(url).pathname : url;
  };

  beforeEach(() => {
    vi.useRealTimers();
    scheduleInterviewMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits manual scheduling with manualMeetingLink when no provider is connected', async () => {
    let statusCallCount = 0;
    scheduleInterviewMock.mockResolvedValue({
      interview: {
        id: 'interview_manual_1',
        scheduledAt: new Date().toISOString(),
        meetingUrl: 'https://example.com/manual-room',
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const pathname = getPathname(input as string | URL | Request);

        if (pathname === '/api/integrations/video/status') {
          statusCallCount += 1;
          return {
            ok: true,
            json: async () => ({
              zoom: { connected: false },
              google: { connected: false },
            }),
          };
        }

        throw new Error(`Unexpected route: ${pathname}`);
      })
    );

    const onScheduled = vi.fn();
    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
        onScheduled={onScheduled}
      />
    );

    fireEvent.change(screen.getByLabelText(/meeting link/i), {
      target: { value: 'https://example.com/manual-room' },
    });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() => expect(scheduleInterviewMock).toHaveBeenCalledTimes(1));
    expect(scheduleInterviewMock.mock.calls[0][0]).toMatchObject({
      matchId: '6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd',
      platform: 'manual',
      manualMeetingLink: 'https://example.com/manual-room',
    });
    expect(onScheduled).toHaveBeenCalledTimes(1);
    expect(statusCallCount).toBe(1);
  });

  it('submits google_meet payload when Google provider is connected', async () => {
    scheduleInterviewMock.mockResolvedValue({
      interview: {
        id: 'interview_google_1',
        scheduledAt: new Date().toISOString(),
        meetingUrl: 'https://meet.google.com/test-link',
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const pathname = getPathname(input as string | URL | Request);

        if (pathname === '/api/integrations/video/status') {
          return {
            ok: true,
            json: async () => ({
              zoom: { connected: false },
              google: { connected: true },
            }),
          };
        }

        throw new Error(`Unexpected route: ${pathname}`);
      })
    );

    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          'Connected mode creates the meeting from your linked provider account automatically.'
        )
      ).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() => expect(scheduleInterviewMock).toHaveBeenCalledTimes(1));
    expect(scheduleInterviewMock.mock.calls[0][0]).toMatchObject({
      matchId: '6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd',
      platform: 'google_meet',
    });
    expect(scheduleInterviewMock.mock.calls[0][0].manualMeetingLink).toBeUndefined();
  });

  it('renders backend actionable message when schedule API returns message + code', async () => {
    scheduleInterviewMock.mockRejectedValue(
      new Error('Reconnect Google Calendar in Settings > Integrations and retry.')
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const pathname = getPathname(input as string | URL | Request);

        if (pathname === '/api/integrations/video/status') {
          return {
            ok: true,
            json: async () => ({
              zoom: { connected: false },
              google: { connected: true },
            }),
          };
        }

        throw new Error(`Unexpected route: ${pathname}`);
      })
    );

    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          'Connected mode creates the meeting from your linked provider account automatically.'
        )
      ).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Reconnect Google Calendar in Settings > Integrations and retry.')
      ).toBeInTheDocument()
    );
  });
});
