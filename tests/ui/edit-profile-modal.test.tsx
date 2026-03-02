import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditProfileModal } from '@/components/profile/EditProfileModal';

type MatchMediaListener = (event: MediaQueryListEvent) => void;

let mediaMatches = false;
const mediaListeners = new Set<MatchMediaListener>();

function installMatchMediaMock() {
  mediaListeners.clear();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: mediaMatches,
      media: query,
      onchange: null,
      addEventListener: (_: 'change', listener: MatchMediaListener) => {
        mediaListeners.add(listener);
      },
      removeEventListener: (_: 'change', listener: MatchMediaListener) => {
        mediaListeners.delete(listener);
      },
      addListener: (listener: MatchMediaListener) => {
        mediaListeners.add(listener);
      },
      removeListener: (listener: MatchMediaListener) => {
        mediaListeners.delete(listener);
      },
      dispatchEvent: vi.fn(),
    })),
  });
}

function setMediaMatches(next: boolean) {
  mediaMatches = next;
  const event = { matches: next, media: '(min-width: 768px)' } as MediaQueryListEvent;
  mediaListeners.forEach((listener) => listener(event));
}

function typeContinuously(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
  field.focus();
  expect(document.activeElement).toBe(field);

  let value = '';
  for (const character of text) {
    value += character;
    fireEvent.change(field, { target: { value } });
    expect(field).toHaveValue(value);
    expect(document.activeElement).toBe(field);
  }
}

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ open, children }: any) =>
    open ? <div data-testid="drawer-root">{children}</div> : null,
  DrawerContent: ({ children }: any) => <div>{children}</div>,
  DrawerHeader: ({ children }: any) => <div>{children}</div>,
  DrawerTitle: ({ children }: any) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: any) => <p>{children}</p>,
  DrawerFooter: ({ children }: any) => <div>{children}</div>,
}));

const baseBasicInfo = {
  name: 'Jane Doe',
  tagline: '',
  location: '',
  joinedDate: 'Jan 2026',
  avatar: null,
  coverImage: null,
};

describe('EditProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mediaMatches = false;
    installMatchMediaMock();
  });

  it('keeps tagline input while open across parent rerenders with equivalent basicInfo', async () => {
    mediaMatches = true;
    installMatchMediaMock();

    const onOpenChange = vi.fn();
    const onSave = vi.fn();

    const { rerender } = render(
      <EditProfileModal
        open={true}
        onOpenChange={onOpenChange}
        basicInfo={baseBasicInfo}
        onSave={onSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    const taglineField = screen.getByLabelText(/Tagline/i);
    fireEvent.change(taglineField, { target: { value: 'Focused on meaningful impact' } });

    expect(screen.getByLabelText(/Tagline/i)).toHaveValue('Focused on meaningful impact');

    rerender(
      <EditProfileModal
        open={true}
        onOpenChange={onOpenChange}
        basicInfo={{ ...baseBasicInfo }}
        onSave={onSave}
      />
    );

    expect(screen.getByLabelText(/Tagline/i)).toHaveValue('Focused on meaningful impact');
  });

  it('supports uninterrupted typing across name, tagline, and location fields', async () => {
    mediaMatches = true;
    installMatchMediaMock();

    const onOpenChange = vi.fn();
    const onSave = vi.fn();

    render(
      <EditProfileModal
        open={true}
        onOpenChange={onOpenChange}
        basicInfo={baseBasicInfo}
        onSave={onSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    const nameField = screen.getByLabelText(/^Name/i) as HTMLInputElement;
    const taglineField = screen.getByLabelText(/Tagline/i) as HTMLTextAreaElement;
    const locationField = screen.getByLabelText(/Location/i) as HTMLInputElement;

    fireEvent.change(nameField, { target: { value: '' } });
    typeContinuously(nameField, 'Yurii Bakurov');

    fireEvent.change(taglineField, { target: { value: '' } });
    typeContinuously(taglineField, 'Focused on meaningful impact');

    fireEvent.change(locationField, { target: { value: '' } });
    typeContinuously(locationField, 'Stockholm, Sweden');
  });

  it('locks modal surface mode while open and updates on next open', async () => {
    mediaMatches = true;
    installMatchMediaMock();

    const onOpenChange = vi.fn();
    const onSave = vi.fn();

    const { rerender } = render(
      <EditProfileModal
        open={true}
        onOpenChange={onOpenChange}
        basicInfo={baseBasicInfo}
        onSave={onSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    act(() => {
      setMediaMatches(false);
    });

    expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    expect(screen.queryByTestId('drawer-root')).not.toBeInTheDocument();

    rerender(
      <EditProfileModal
        open={false}
        onOpenChange={onOpenChange}
        basicInfo={baseBasicInfo}
        onSave={onSave}
      />
    );

    rerender(
      <EditProfileModal
        open={true}
        onOpenChange={onOpenChange}
        basicInfo={baseBasicInfo}
        onSave={onSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('drawer-root')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument();
  });
});
