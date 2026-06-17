import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScheduleInterviewModal } from '@/components/interviews/ScheduleInterviewModal';

const scheduleInterviewMock = vi.fn();
const dispatchClientDiagnosticMock = vi.fn();

vi.mock('@/app/actions/interviews', () => ({
  scheduleInterview: (...args: any[]) => scheduleInterviewMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: (...args: any[]) => dispatchClientDiagnosticMock(...args),
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
    dispatchClientDiagnosticMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const findSelectByOption = (value: string) => {
    const selects = screen.getAllByTestId('mock-select') as HTMLSelectElement[];
    const match = selects.find((select) =>
      Array.from(select.options).some((option) => option.value === value)
    );
    if (!match) {
      throw new Error(`Unable to find select containing option "${value}"`);
    }
    return match;
  };

  const typeContinuously = (field: HTMLInputElement, text: string) => {
    field.focus();
    expect(document.activeElement).toBe(field);

    let value = '';
    for (const character of text) {
      value += character;
      fireEvent.change(field, { target: { value } });
      expect(field).toHaveValue(value);
      expect(document.activeElement).toBe(field);
    }
  };

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

    await screen.findAllByTestId('mock-select');
    const dateSelect = findSelectByOption(new Date().toISOString().slice(0, 10));
    const timeSelect = findSelectByOption('09:00');
    const platformSelect = findSelectByOption('manual');
    const manualProviderSelect = findSelectByOption('teams');

    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });
    fireEvent.change(platformSelect, { target: { value: 'manual' } });
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

    await screen.findAllByTestId('mock-select');
    const dateSelect = findSelectByOption(new Date().toISOString().slice(0, 10));
    const timeSelect = findSelectByOption('09:00');
    const platformSelect = findSelectByOption('manual');

    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });
    fireEvent.change(platformSelect, { target: { value: 'manual' } });
    fireEvent.change(screen.getByLabelText(/meeting link/i), {
      target: { value: 'https://example.com/manual-room' },
    });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Select the meeting-link provider before scheduling.');
    expect(scheduleInterviewMock).not.toHaveBeenCalled();
  });

  it('marks the manual meeting link invalid when the URL is missing', async () => {
    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
      />
    );

    await screen.findAllByTestId('mock-select');
    const dateSelect = findSelectByOption(new Date().toISOString().slice(0, 10));
    const timeSelect = findSelectByOption('09:00');
    const platformSelect = findSelectByOption('manual');
    const manualProviderSelect = findSelectByOption('teams');

    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });
    fireEvent.change(platformSelect, { target: { value: 'manual' } });
    fireEvent.change(manualProviderSelect, { target: { value: 'teams' } });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    const alert = await screen.findByRole('alert');
    const meetingLinkInput = screen.getByLabelText(/meeting link/i);

    expect(alert).toHaveTextContent(
      'Paste the meeting link participants should use before scheduling.'
    );
    expect(meetingLinkInput).toHaveAttribute('aria-invalid', 'true');
    expect(meetingLinkInput).toHaveAccessibleDescription(
      'Use the meeting URL participants should open for this interview. Paste the meeting link participants should use before scheduling.'
    );
    expect(scheduleInterviewMock).not.toHaveBeenCalled();
  });

  it('marks the manual meeting link invalid when the URL is incomplete', async () => {
    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
      />
    );

    await screen.findAllByTestId('mock-select');
    const dateSelect = findSelectByOption(new Date().toISOString().slice(0, 10));
    const timeSelect = findSelectByOption('09:00');
    const platformSelect = findSelectByOption('manual');
    const manualProviderSelect = findSelectByOption('teams');
    const meetingLinkInput = screen.getByLabelText(/meeting link/i);

    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });
    fireEvent.change(platformSelect, { target: { value: 'manual' } });
    fireEvent.change(manualProviderSelect, { target: { value: 'teams' } });
    fireEvent.change(meetingLinkInput, {
      target: { value: 'meet.google.com/manual-room' },
    });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Enter a full meeting URL, including https://.');
    expect(meetingLinkInput).toHaveAttribute('aria-invalid', 'true');
    expect(scheduleInterviewMock).not.toHaveBeenCalled();
  });

  it('allows continuous typing in manual meeting link input without focus loss', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const pathname = getPathname(input as string | URL | Request);

        if (pathname === '/api/integrations/video/status') {
          return {
            ok: true,
            json: async () => ({
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

    await screen.findAllByTestId('mock-select');
    const platformSelect = findSelectByOption('manual');
    fireEvent.change(platformSelect, { target: { value: 'manual' } });

    const meetingLinkInput = screen.getByLabelText(/meeting link/i) as HTMLInputElement;
    typeContinuously(meetingLinkInput, 'https://example.com/manual-room');
  });

  it('submits a manual payload when Google Meet is chosen as the manual link provider', async () => {
    scheduleInterviewMock.mockResolvedValue({
      interview: {
        id: 'interview_manual_google_1',
        scheduledAt: new Date().toISOString(),
        meetingUrl: 'https://meet.google.com/test-link',
      },
    });

    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
      />
    );

    await screen.findAllByTestId('mock-select');
    const dateSelect = findSelectByOption(new Date().toISOString().slice(0, 10));
    const timeSelect = findSelectByOption('09:00');
    const platformSelect = findSelectByOption('manual');
    const manualProviderSelect = findSelectByOption('google_meet');

    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });
    fireEvent.change(platformSelect, { target: { value: 'manual' } });
    fireEvent.change(manualProviderSelect, { target: { value: 'google_meet' } });
    fireEvent.change(screen.getByLabelText(/meeting link/i), {
      target: { value: 'https://meet.google.com/test-link' },
    });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() => expect(scheduleInterviewMock).toHaveBeenCalledTimes(1));
    expect(scheduleInterviewMock.mock.calls[0][0]).toMatchObject({
      platform: 'manual',
      manualMeetingProvider: 'google_meet',
      manualMeetingLink: 'https://meet.google.com/test-link',
    });
  });

  it('renders only the manual scheduling platform in the launch corridor', async () => {
    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
      />
    );

    await screen.findAllByTestId('mock-select');
    const platformSelect = findSelectByOption('manual');
    const optionValues = Array.from(platformSelect.options).map((option) => option.value);

    expect(optionValues).toContain('manual');
    expect(optionValues).not.toContain('google_meet');
    expect(optionValues).not.toContain('zoom');
  });

  it('keeps failed schedule submissions retryable without raw service text', async () => {
    scheduleInterviewMock.mockRejectedValue(new Error('Calendar provider token expired'));

    const onClose = vi.fn();
    const onScheduled = vi.fn();
    render(
      <ScheduleInterviewModal
        isOpen
        onClose={onClose}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date()}
        onScheduled={onScheduled}
      />
    );

    await screen.findAllByTestId('mock-select');
    const dateSelect = findSelectByOption(new Date().toISOString().slice(0, 10));
    const timeSelect = findSelectByOption('09:00');
    const platformSelect = findSelectByOption('manual');
    const manualProviderSelect = findSelectByOption('teams');
    const meetingLinkInput = screen.getByLabelText(/meeting link/i);
    fireEvent.change(dateSelect, { target: { value: dateSelect.options[0].value } });
    fireEvent.change(timeSelect, { target: { value: timeSelect.options[0].value } });
    fireEvent.change(platformSelect, { target: { value: 'manual' } });
    fireEvent.change(manualProviderSelect, { target: { value: 'teams' } });
    fireEvent.change(meetingLinkInput, { target: { value: 'https://example.com/manual-room' } });
    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Interview could not be saved. Your selected time and meeting link are still here; please try again.'
    );
    expect(alert).not.toHaveTextContent('Calendar provider token expired');
    expect(meetingLinkInput).toHaveValue('https://example.com/manual-room');
    expect(manualProviderSelect).toHaveValue('teams');
    expect(onClose).not.toHaveBeenCalled();
    expect(onScheduled).not.toHaveBeenCalled();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'interview.schedule_modal.submit_failed',
      {
        errorName: 'Error',
        hasError: true,
        isReschedule: false,
        platform: 'manual',
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(
      'Calendar provider token expired'
    );
  });

  it('announces the reschedule limit without exposing the submit action', async () => {
    render(
      <ScheduleInterviewModal
        isOpen
        onClose={vi.fn()}
        matchId="6e704a5a-a89e-43cc-9f71-d1f29fd7f3dd"
        matchAgreedAt={new Date(Date.now() - 24 * 60 * 60 * 1000)}
        existingInterviewsCount={1}
      />
    );

    await screen.findAllByTestId('mock-select');

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Reschedule limit reached');
    expect(status).toHaveTextContent('No further reschedules are allowed.');
    expect(screen.getByRole('button', { name: /reschedule/i })).toBeDisabled();
  });
});
