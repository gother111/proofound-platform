import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AddSkillDrawer } from '@/app/app/i/expertise/components/add-skill/AddSkillDrawer';

const toastMock = vi.fn();
const addUserSkillMock = vi.fn();
const attachSkillProofMock = vi.fn();
const apiFetchMock = vi.fn();
const uploadFileMock = vi.fn();
const validateFileMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/upload', () => ({
  uploadFile: (...args: any[]) => uploadFileMock(...args),
  validateFile: (...args: any[]) => validateFileMock(...args),
}));

vi.mock('@/app/app/i/expertise/components/add-skill/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    query: '',
    results: [],
    loading: false,
    error: null,
    onChange: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/app/app/i/expertise/components/add-skill/api', () => ({
  fetchL1Domains: vi.fn(),
  fetchL2Categories: vi.fn(),
  fetchL3Subcategories: vi.fn(),
  fetchL4Skills: vi.fn(),
  searchL4Skills: vi.fn(),
  addUserSkill: (...args: any[]) => addUserSkillMock(...args),
  deleteUserSkill: vi.fn(),
  attachSkillProof: (...args: any[]) => attachSkillProofMock(...args),
}));

vi.mock('@/app/app/i/expertise/components/add-skill/AddSkillDrawerView', () => ({
  AddSkillDrawerView: (props: any) => (
    <div>
      <button
        onClick={() => {
          props.handleL1Select({
            catId: 1,
            slug: 'unite',
            nameI18n: { en: 'Unite' },
          });
          props.handleL2Select({
            subcatId: 11,
            catId: 1,
            slug: 'engineering',
            nameI18n: { en: 'Engineering' },
          });
          props.handleL3Select({
            l3Id: 111,
            subcatId: 11,
            catId: 1,
            slug: 'frontend',
            nameI18n: { en: 'Frontend' },
          });
          props.setSelectedL4({
            code: 'TSK-1',
            nameI18n: { en: 'TypeScript' },
          });
          props.setL4Search('TypeScript');
          props.setProofSource('document');
          props.setProofNotes('');
          props.setProofIssuedDate('2025-01-01');
          props.setProofExpiresDate('2028-01-01');
          props.setRequestVerification(true);
          props.setVerificationEmail('Verifier@Example.com');
          props.setVerificationSource('peer');
          props.setVerificationMessage('Please verify this skill.');
          void props.onProofFileSelected(
            new File(['proof'], 'doc.pdf', { type: 'application/pdf' })
          );
        }}
      >
        Configure
      </button>
      <button onClick={() => props.handleSave(false)}>Save</button>
    </div>
  ),
}));

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('AddSkillDrawer proof + verification flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateFileMock.mockReturnValue({ valid: true });
    uploadFileMock.mockResolvedValue({
      success: true,
      uploadedFileId: 'uploaded-file-1',
      url: 'https://example.com/doc.pdf',
      path: 'proof/user-1/doc.pdf',
      fileName: 'doc.pdf',
    });
    addUserSkillMock.mockResolvedValue(
      mockResponse({
        skill: {
          id: 'skill-1',
          proof_count: 0,
          verification_count: 0,
        },
      })
    );
    attachSkillProofMock.mockResolvedValue(mockResponse({ proof: { id: 'proof-1' } }, 201));
    apiFetchMock.mockResolvedValue(mockResponse({ request: { id: 'verification-1' } }, 201));
  });

  it('dispatches document proof attach and verification request after skill create', async () => {
    const onSkillAdded = vi.fn();

    render(
      <AddSkillDrawer
        open
        onOpenChange={vi.fn()}
        domains={[
          {
            catId: 1,
            slug: 'unite',
            nameI18n: { en: 'Unite' },
          },
        ]}
        taxonomyReady
        onSkillAdded={onSkillAdded}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    await waitFor(() => expect(uploadFileMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(addUserSkillMock).toHaveBeenCalledTimes(1));
    expect(addUserSkillMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skill_code: 'TSK-1',
      })
    );

    await waitFor(() => expect(attachSkillProofMock).toHaveBeenCalledTimes(1));
    expect(attachSkillProofMock).toHaveBeenCalledWith(
      'skill-1',
      expect.objectContaining({
        proofType: 'document',
        filePath: 'proof/user-1/doc.pdf',
        uploadedFileId: 'uploaded-file-1',
        url: 'https://example.com/doc.pdf',
        issuedDate: '2025-01-01',
        expiresDate: '2028-01-01',
      })
    );

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/verification/requests/skill',
      expect.objectContaining({
        method: 'POST',
      })
    );

    const verificationRequest = apiFetchMock.mock.calls[0][1];
    expect(JSON.parse(verificationRequest.body)).toEqual(
      expect.objectContaining({
        skillId: 'skill-1',
        verifierSource: 'peer',
        verifierEmail: 'verifier@example.com',
      })
    );

    expect(onSkillAdded).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'skill-1',
      })
    );
  });
});
