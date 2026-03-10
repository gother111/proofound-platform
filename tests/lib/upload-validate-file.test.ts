import { describe, expect, it } from 'vitest';

import { validateFile } from '@/lib/upload';

describe('validateFile proof constraints', () => {
  it('accepts PDF proof documents', () => {
    const file = new File(['proof'], 'evidence.pdf', { type: 'application/pdf' });
    const validation = validateFile(file, 'document', { category: 'proof' });
    expect(validation.valid).toBe(true);
  });

  it('rejects unsupported proof file types', () => {
    const file = new File(['proof'], 'evidence.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const validation = validateFile(file, 'document', { category: 'proof' });
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('PDF, PNG, JPG, JPEG, WebP, TXT, or Markdown');
  });

  it('rejects oversized proof files', () => {
    const oversized = new File([new Uint8Array(25 * 1024 * 1024 + 1)], 'evidence.pdf', {
      type: 'application/pdf',
    });
    const validation = validateFile(oversized, 'document', { category: 'proof' });
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('25MB');
  });

  it('accepts markdown for lower-trust evidence links', () => {
    const docFile = new File(['# note'], 'artifact.md', {
      type: 'text/markdown',
    });
    const validation = validateFile(docFile, 'document', { category: 'artifact' });
    expect(validation.valid).toBe(true);
  });
});
