import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScheduleInterviewModal } from '@/components/interviews/ScheduleInterviewModal';

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
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits manual scheduling with manualMeetingLink when no provider is connected', async () => {
    let requestBody: Record<string, unknown> | null = null;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url === '/api/integrations/video/status') {
          return {
            ok: true,
            json: async () => ({
              zoom: { connected: false },
              google: { connected: false },
            }),
          };
        }

        if (url === '/api/interviews/schedule') {
          requestBody = JSON.parse(String(init?.body ?? '{}'));
          return {
            ok: true,
            json: async () => ({
              interview: {
                id: 'interview_manual_1',
                scheduledAt: new Date().toISOString(),
                meetingUrl: 'https://example.com/manual-room',
              },
            }),
          };
        }

        return { ok: true, json: async () => ({}) };
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
    const dateValue = dateSelect.options[0].value;
    const timeValue = timeSelect.options[0].value;

    fireEvent.change(dateSelect, { target: { value: dateValue } });
    fireEvent.change(timeSelect, { target: { value: timeValue } });

    fireEvent.change(screen.getByLabelText(/meeting link/i), {
      target: { value: 'https://example.com/manual-room' },
    });

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() => expect(requestBody).not.toBeNull());
    expect(requestBody?.platform).toBe('manual');
    expect(requestBody?.manualMeetingLink).toBe('https://example.com/manual-room');
    expect(onScheduled).toHaveBeenCalledTimes(1);
  });

  it('submits google_meet payload when Google provider is connected', async () => {
    let requestBody: Record<string, unknown> | null = null;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url === '/api/integrations/video/status') {
          return {
            ok: true,
            json: async () => ({
              zoom: { connected: false },
              google: { connected: true },
            }),
          };
        }

        if (url === '/api/interviews/schedule') {
          requestBody = JSON.parse(String(init?.body ?? '{}'));
          return {
            ok: true,
            json: async () => ({
              interview: {
                id: 'interview_google_1',
                scheduledAt: new Date().toISOString(),
                meetingUrl: 'https://meet.google.com/test-link',
              },
            }),
          };
        }

        return { ok: true, json: async () => ({}) };
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

    await waitFor(() => expect(requestBody).not.toBeNull());
    expect(requestBody?.platform).toBe('google_meet');
    expect(requestBody?.manualMeetingLink).toBeUndefined();
  });

  it('renders backend actionable message when schedule API returns message + code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url === '/api/integrations/video/status') {
          return {
            ok: true,
            json: async () => ({
              zoom: { connected: false },
              google: { connected: true },
            }),
          };
        }

        if (url === '/api/interviews/schedule') {
          return {
            ok: false,
            json: async () => ({
              error: 'Failed to create Google meeting',
              code: 'GOOGLE_RECONNECT_REQUIRED',
              message: 'Reconnect Google Calendar in Settings > Integrations and retry.',
            }),
          };
        }

        return { ok: true, json: async () => ({}) };
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
    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Reconnect Google Calendar in Settings > Integrations and retry.')
      ).toBeInTheDocument()
    );
  });
});
