import { describe, expect, it } from 'vitest';

import { validateFile } from '@/lib/upload';

describe('validateFile proof constraints', () => {
  it('accepts PDF proof documents', () => {
    const file = new File(['proof'], 'evidence.pdf', { type: 'application/pdf' });
    const validation = validateFile(file, 'document', { category: 'proof' });
    expect(validation.valid).toBe(true);
  });

  it('rejects unsupported proof file types', () => {
    const file = new File(['proof'], 'evidence.webp', { type: 'image/webp' });
    const validation = validateFile(file, 'document', { category: 'proof' });
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('PNG, JPG, JPEG, HEIF, HEIC, PDF');
  });

  it('rejects oversized proof files', () => {
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'evidence.pdf', {
      type: 'application/pdf',
    });
    const validation = validateFile(oversized, 'document', { category: 'proof' });
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('10MB');
  });

  it('keeps non-proof document uploads compatible with doc/docx', () => {
    const docFile = new File(['doc'], 'artifact.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const validation = validateFile(docFile, 'document', { category: 'artifact' });
    expect(validation.valid).toBe(true);
  });
});
