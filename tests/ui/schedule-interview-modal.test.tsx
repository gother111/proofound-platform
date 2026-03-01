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

  it('submits manual scheduling with manualMeetingLink and manualMeetingProvider when no provider is connected', async () => {
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

    const selects = await screen.findAllByTestId('mock-select');
    const dateSelect = selects[0] as HTMLSelectElement;
    const timeSelect = selects[1] as HTMLSelectElement;
    const manualProviderSelect = selects[3] as HTMLSelectElement;

    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });
    fireEvent.change(manualProviderSelect, { target: { value: 'teams' } });
    fireEvent.change(screen.getByLabelText(/meeting link/i), {
      target: { value: 'https://example.com/manual-room' },
    });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() => expect(scheduleInterviewMock).toHaveBeenCalledTimes(1));
    expect(scheduleInterviewMock.mock.calls[0][0]).toMatchObject({
      matchId: '6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd',
      platform: 'manual',
      manualMeetingLink: 'https://example.com/manual-room',
      manualMeetingProvider: 'teams',
    });
    expect(onScheduled).toHaveBeenCalledTimes(1);
  });

  it('requires selecting manual meeting provider before submitting manual scheduling', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const pathname = getPathname(input as string | URL | Request);

        if (pathname === '/api/integrations/video/status') {
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

    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
      />
    );

    const selects = await screen.findAllByTestId('mock-select');
    const dateSelect = selects[0] as HTMLSelectElement;
    const timeSelect = selects[1] as HTMLSelectElement;

    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });
    fireEvent.change(screen.getByLabelText(/meeting link/i), {
      target: { value: 'https://example.com/manual-room' },
    });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Please select the meeting provider when using manual mode')
      ).toBeInTheDocument()
    );
    expect(scheduleInterviewMock).not.toHaveBeenCalled();
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

    const selects = await screen.findAllByTestId('mock-select');
    const dateSelect = selects[0] as HTMLSelectElement;
    const timeSelect = selects[1] as HTMLSelectElement;
    const platformSelect = selects[2] as HTMLSelectElement;

    await waitFor(() => expect(platformSelect.value).toBe('google_meet'));

    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() => expect(scheduleInterviewMock).toHaveBeenCalledTimes(1));
    expect(scheduleInterviewMock.mock.calls[0][0]).toMatchObject({
      platform: 'google_meet',
    });
    expect(scheduleInterviewMock.mock.calls[0][0].manualMeetingLink).toBeUndefined();
    expect(scheduleInterviewMock.mock.calls[0][0].manualMeetingProvider).toBeUndefined();
  });

  it('does not render Zoom as a selectable auto provider option', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const pathname = getPathname(input as string | URL | Request);

        if (pathname === '/api/integrations/video/status') {
          return {
            ok: true,
            json: async () => ({
              zoom: { connected: true },
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

    const selects = await screen.findAllByTestId('mock-select');
    const platformSelect = selects[2] as HTMLSelectElement;
    const optionValues = Array.from(platformSelect.options).map((option) => option.value);

    expect(optionValues).toContain('manual');
    expect(optionValues).toContain('google_meet');
    expect(optionValues).not.toContain('zoom');
  });

  it('renders backend actionable message when schedule action returns an error', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Reconnect Google Calendar in Settings > Integrations and retry.')
      ).toBeInTheDocument()
    );
  });
});
