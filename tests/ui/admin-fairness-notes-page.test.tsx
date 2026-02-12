import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FairnessNotesPage from '@/app/admin/fairness/notes/page';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
  CardDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>{children}</span>
  ),
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <table {...props}>{children}</table>
  ),
  TableBody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props}>{children}</tbody>
  ),
  TableCell: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...props}>{children}</td>
  ),
  TableHead: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th {...props}>{children}</th>
  ),
  TableHeader: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead {...props}>{children}</thead>
  ),
  TableRow: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr {...props}>{children}</tr>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  DialogHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props}>{children}</h3>
  ),
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label htmlFor={htmlFor ?? (rest.id as string | undefined) ?? 'mock-id'} {...rest}>
      {children}
    </label>
  ),
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  AlertDescription: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  AlertTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 {...props}>{children}</h4>
  ),
}));

describe('Admin fairness notes page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ success: true, notes: [] }),
      }))
    );
    vi.stubGlobal('alert', vi.fn());
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, noteId: 'note-1' }),
    });
  });

  it('uses apiFetch for fairness note generation POST', async () => {
    render(<FairnessNotesPage />);

    await screen.findByText(/fairness notes/i);

    fireEvent.change(screen.getByLabelText(/release version/i), {
      target: { value: 'v1.2.3' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate fairness note/i }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/admin/fairness/generate-note',
      expect.objectContaining({ method: 'POST' })
    );

    const requestInit = apiFetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toEqual({ releaseVersion: 'v1.2.3' });
  });
});
