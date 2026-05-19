'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api/fetch';
import { uploadFile, validateFile } from '@/lib/upload';
import { skillDisplayLabel } from '@/lib/copy/labels';
import { normalizeSkillForClient } from '../../utils/normalizeSkill';
import {
  fetchL1Domains,
  fetchL2Categories as apiFetchL2Categories,
  fetchL3Subcategories as apiFetchL3Subcategories,
  fetchL4Skills as apiFetchL4Skills,
  searchL4Skills,
  addUserSkill,
  deleteUserSkill,
  attachSkillProof,
} from './api';
import type {
  AddSkillDrawerProps,
  L1Domain,
  L2Category,
  L3Subcategory,
  L4Skill,
  SkillProofSource,
  SkillVerificationSource,
} from './types';
import { useDebouncedSearch } from './useDebouncedSearch';
import { AddSkillDrawerView } from './AddSkillDrawerView';

export function AddSkillDrawer({
  open,
  onOpenChange,
  domains,
  taxonomyReady = true,
  onSkillAdded,
}: AddSkillDrawerProps) {
  const { toast } = useToast();
  const taxonomyUnavailableMessage =
    'The skill library is currently unavailable. Please retry after recovery completes.';

  // Mode: 'search' (default) or 'browse' (L1→L2→L3→L4)
  const [mode, setMode] = useState<'search' | 'browse'>('search');
  const [step, setStep] = useState(1);
  const [selectedL1, setSelectedL1] = useState<L1Domain | null>(null);
  const [selectedL2, setSelectedL2] = useState<L2Category | null>(null);
  const [selectedL3, setSelectedL3] = useState<L3Subcategory | null>(null);
  const [selectedL4, setSelectedL4] = useState<L4Skill | null>(null);

  // L1 domains with fallback loading
  const [loadedDomains, setLoadedDomains] = useState<L1Domain[]>(domains);
  const [domainsLoading, setDomainsLoading] = useState(false);

  // Step 2 data
  const [l2Categories, setL2Categories] = useState<L2Category[]>([]);
  const [l2Loading, setL2Loading] = useState(false);

  // Step 3 data
  const [l3Subcategories, setL3Subcategories] = useState<L3Subcategory[]>([]);
  const [l3Loading, setL3Loading] = useState(false);

  // Step 4: L4 skill details
  const [l4Name, setL4Name] = useState('');
  const [level, setLevel] = useState(2);
  const [lastUsedDate, setLastUsedDate] = useState('');
  const [proofSource, setProofSource] = useState<SkillProofSource>('url');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFilePath, setProofFilePath] = useState('');
  const [proofUploadedFileId, setProofUploadedFileId] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [proofUploadError, setProofUploadError] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofNotes, setProofNotes] = useState('');
  const [proofIssuedDate, setProofIssuedDate] = useState('');
  const [proofExpiresDate, setProofExpiresDate] = useState('');
  const [requestVerification, setRequestVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationSource, setVerificationSource] = useState<SkillVerificationSource>('peer');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // L4 Skills autocomplete (for both modes)
  const [l4Skills, setL4Skills] = useState<L4Skill[]>([]);
  const [l4Search, setL4Search] = useState('');
  const [l4Loading, setL4Loading] = useState(false);
  const [showL4Dropdown, setShowL4Dropdown] = useState(false);

  // Search mode: global skill search
  const {
    query: searchQuery,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    onChange: handleSearchChange,
    reset: resetSearch,
  } = useDebouncedSearch<L4Skill>({
    search: searchL4Skills,
  });
  const [quickAddingCodes, setQuickAddingCodes] = useState<Set<string>>(new Set());
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);
  const lastSelectionsRef = useRef<{
    l1?: L1Domain | null;
    l2?: L2Category | null;
    l3?: L3Subcategory | null;
  }>({});
  const emitClientMetric = (event: string, payload?: Record<string, any>) => {
    try {
      console.debug('analytics:event', event, payload);
    } catch (err) {
      // ignore
    }
  };

  const deriveProofTitleFromUrl = (rawUrl: string) => {
    try {
      const parsed = new URL(rawUrl);
      const pathname = parsed.pathname.replace(/\/+$/, '');
      const lastSegment = pathname.split('/').filter(Boolean).pop();

      if (lastSegment) {
        const decoded = decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ').trim();
        if (decoded.length > 0) return decoded.slice(0, 80);
      }

      return parsed.hostname || 'Proof Link';
    } catch {
      return 'Proof Link';
    }
  };

  const deriveProofTitleFromFilePath = (rawPath: string) => {
    const normalized = rawPath.trim().replace(/\/+$/, '');
    if (!normalized) return 'Uploaded Document';

    const lastSegment = normalized.split('/').filter(Boolean).pop();
    if (!lastSegment) return 'Uploaded Document';

    const decoded = decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ').trim();
    return decoded.length > 0 ? decoded.slice(0, 80) : 'Uploaded Document';
  };

  const hasProofContext = Boolean(
    proofSource === 'url'
      ? proofUrl.trim()
      : proofUploadedFileId.trim() || proofFilePath.trim() || proofUrl.trim()
  );

  // Reset drawer state when closed
  useEffect(() => {
    if (!open) {
      resetSearch();

      setTimeout(() => {
        setMode('search');
        setStep(1);
        setSelectedL1(null);
        setSelectedL2(null);
        setSelectedL3(null);
        setSelectedL4(null);
        setL2Categories([]);
        setL3Subcategories([]);
        setL4Name('');
        setLevel(2);
        setLastUsedDate('');
        setProofSource('url');
        setProofUrl('');
        setProofFilePath('');
        setProofUploadedFileId('');
        setProofFileName('');
        setProofUploadError('');
        setProofUploading(false);
        setProofNotes('');
        setProofIssuedDate('');
        setProofExpiresDate('');
        setRequestVerification(false);
        setVerificationEmail('');
        setVerificationSource('peer');
        setVerificationMessage('');
        setL4Skills([]);
        setL4Search('');
        setShowL4Dropdown(false);
        setBulkSelection(new Set());
        setBulkAdding(false);
      }, 300);
    }
  }, [open, resetSearch]);

  // Reuse last selections when reopening for faster add
  useEffect(() => {
    if (open && lastSelectionsRef.current.l1) {
      setMode('browse');
      setSelectedL1(lastSelectionsRef.current.l1 || null);
      if (lastSelectionsRef.current.l2) {
        setSelectedL2(lastSelectionsRef.current.l2 || null);
        setStep(3);
      } else {
        setStep(2);
      }
      if (lastSelectionsRef.current.l3) {
        setSelectedL3(lastSelectionsRef.current.l3 || null);
        setStep(4);
      }
    }
  }, [open]);

  // Fetch L1 domains if not provided or empty
  useEffect(() => {
    if (open && mode === 'browse' && (!loadedDomains || loadedDomains.length === 0)) {
      const fetchDomains = async () => {
        setDomainsLoading(true);
        try {
          const nextDomains = await fetchL1Domains();
          if (nextDomains.length > 0) setLoadedDomains(nextDomains);
        } catch (error) {
          console.error('Error fetching L1 domains:', error);
        } finally {
          setDomainsLoading(false);
        }
      };
      fetchDomains();
    }
  }, [open, mode, loadedDomains]);

  useEffect(() => {
    if (open && !taxonomyReady) {
      setMode('search');
      setStep(1);
    }
  }, [open, taxonomyReady]);

  // Update loadedDomains when domains prop changes
  useEffect(() => {
    if (domains && domains.length > 0) {
      setLoadedDomains(domains);
    }
  }, [domains]);

  const fetchL2Categories = useCallback(async () => {
    if (!selectedL1) return;

    setL2Loading(true);
    try {
      const categories = await apiFetchL2Categories(selectedL1.catId);
      setL2Categories(categories);
    } catch (error) {
      console.error('Error fetching L2 categories:', error);
    } finally {
      setL2Loading(false);
    }
  }, [selectedL1]);

  const fetchL3Subcategories = useCallback(async () => {
    if (!selectedL2) return;

    setL3Loading(true);
    try {
      const subcategories = await apiFetchL3Subcategories(selectedL2.slug);
      setL3Subcategories(subcategories);
    } catch (error) {
      console.error('Error fetching L3 subcategories:', error);
    } finally {
      setL3Loading(false);
    }
  }, [selectedL2]);

  const fetchL4Skills = useCallback(async () => {
    if (!selectedL3) return;

    setL4Loading(true);
    try {
      const skills = await apiFetchL4Skills({
        catId: selectedL3.catId,
        subcatId: selectedL3.subcatId,
        l3Id: selectedL3.l3Id,
      });
      setL4Skills(skills);
    } catch (error) {
      console.error('Error fetching L4 skills:', error);
      setL4Skills([]);
      toast({
        title: 'Could not load skills',
        description:
          error instanceof Error
            ? error.message
            : 'Please retry in a few moments. You can still add a custom skill.',
        variant: 'destructive',
      });
    } finally {
      setL4Loading(false);
    }
  }, [selectedL3, toast]);

  // Fetch L2 categories when L1 is selected
  useEffect(() => {
    if (selectedL1 && step === 2) {
      fetchL2Categories();
    }
  }, [selectedL1, step, fetchL2Categories]);

  // Fetch L3 subcategories when L2 is selected
  useEffect(() => {
    if (selectedL2 && step === 3) {
      fetchL3Subcategories();
    }
  }, [selectedL2, step, fetchL3Subcategories]);

  // Fetch L4 skills when L3 is selected
  useEffect(() => {
    if (selectedL3 && step === 4) {
      fetchL4Skills();
    }
  }, [selectedL3, step, fetchL4Skills]);

  const handleL1Select = (domain: L1Domain) => {
    setSelectedL1(domain);
    lastSelectionsRef.current.l1 = domain;
    setStep(2);
  };

  const handleL2Select = (category: L2Category) => {
    setSelectedL2(category);
    lastSelectionsRef.current.l2 = category;
    setStep(3);
  };

  const handleL3Select = (subcategory: L3Subcategory) => {
    setSelectedL3(subcategory);
    lastSelectionsRef.current.l3 = subcategory;
    setStep(4);
  };

  // Handle selecting a skill from search results
  const handleSearchResultSelect = (skill: L4Skill) => {
    setSelectedL4(skill);
    const skillName = skill.nameI18n?.en || '';
    setL4Search(skillName);
    setL4Name(skillName); // Also set l4Name for consistency with button validation

    // Auto-populate L1/L2/L3 from the skill's parent context
    let hasAllContext = true;
    if (skill.l1) {
      const l1Domain = domains.find((d) => d.catId === skill.l1?.catId);
      if (l1Domain) {
        setSelectedL1(l1Domain);
        lastSelectionsRef.current.l1 = l1Domain;
      } else {
        hasAllContext = false;
      }
    } else {
      hasAllContext = false;
    }
    if (skill.l2) {
      setSelectedL2({
        subcatId: skill.l2.subcatId,
        catId: skill.l2.catId,
        slug: skill.l2.slug,
        nameI18n: skill.l2.nameI18n,
      });
      lastSelectionsRef.current.l2 = {
        subcatId: skill.l2.subcatId,
        catId: skill.l2.catId,
        slug: skill.l2.slug,
        nameI18n: skill.l2.nameI18n,
        l4Count: 0,
      };
    } else {
      hasAllContext = false;
    }
    if (skill.l3) {
      setSelectedL3({
        l3Id: skill.l3.l3Id,
        subcatId: skill.l3.subcatId,
        catId: skill.l3.catId,
        slug: skill.l3.slug,
        nameI18n: skill.l3.nameI18n,
      });
      lastSelectionsRef.current.l3 = {
        l3Id: skill.l3.l3Id,
        subcatId: skill.l3.subcatId,
        catId: skill.l3.catId,
        slug: skill.l3.slug,
        nameI18n: skill.l3.nameI18n,
        l4Count: 0,
      };
    } else {
      hasAllContext = false;
    }

    // Warn if parent context is incomplete
    if (!hasAllContext) {
      toast({
        title: '⚠️ Incomplete Skill Data',
        description:
          'Some parent category information is missing. You may need to select the parent categories manually.',
        variant: 'destructive',
      });
    }

    // Go directly to details step (step 4)
    setMode('browse'); // Switch to browse mode for step navigation
    setStep(4);
  };

  // Undo helper for quick/bulk add
  const handleUndoAdd = async (skillId: string, skillName: string) => {
    try {
      const response = await deleteUserSkill(skillId);
      if (response.ok) {
        emitClientMetric('expertise_undo_add', { skill_id: skillId, skill_name: skillName });
        toast({
          title: 'Skill removed',
          description: `"${skillName}" was removed.`,
        });
        onSkillAdded();
      } else {
        toast({
          title: 'Undo failed',
          description: 'Could not remove the skill. Please refresh and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Undo add failed:', error);
      toast({
        title: 'Undo failed',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    }
  };

  // Quick add straight from search card with defaults
  const handleQuickAdd = async (skill: L4Skill) => {
    if (!skill?.code) return;
    const skillName = skillDisplayLabel({ taxonomyName: skill.nameI18n?.en, code: skill.code });
    if (!taxonomyReady) {
      toast({
        title: 'Skill library unavailable',
        description: taxonomyUnavailableMessage,
        variant: 'destructive',
      });
      return;
    }

    setQuickAddingCodes((prev) => new Set(prev).add(skill.code));
    try {
      const response = await addUserSkill({
        skill_code: skill.code,
        level: 2,
        months_experience: 0,
        last_used_at: new Date().toISOString(),
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = normalizeSkillForClient(
          data?.skill || skill,
          skill as unknown as L4Skill
        );
        emitClientMetric('expertise_quick_add', {
          skill_code: skill.code,
          skill_name: skill.nameI18n?.en,
        });
        toast({
          title: '✅ Skill Added',
          description: `"${skillName}" was added to your atlas.`,
          action: data?.skill?.id && (
            <ToastAction altText="Undo add" onClick={() => handleUndoAdd(data.skill.id, skillName)}>
              Undo
            </ToastAction>
          ),
        });
        onSkillAdded(normalized || data?.skill || skill);
      } else {
        const error = await response.json();
        toast({
          title: 'Could not add skill',
          description: error?.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Quick add failed:', error);
      emitClientMetric('expertise_quick_add_failed', { skill_code: skill.code });
      toast({
        title: 'Could not add skill',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setQuickAddingCodes((prev) => {
        const next = new Set(prev);
        next.delete(skill.code);
        return next;
      });
    }
  };

  const toggleBulkSelection = (code: string) => {
    setBulkSelection((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleBulkAdd = async () => {
    if (bulkSelection.size === 0) return;
    if (!taxonomyReady) {
      toast({
        title: 'Skill library unavailable',
        description: taxonomyUnavailableMessage,
        variant: 'destructive',
      });
      return;
    }
    setBulkAdding(true);

    const selectedSkills = searchResults.filter((skill) => bulkSelection.has(skill.code));
    const successes: string[] = [];
    const failures: string[] = [];

    for (const skill of selectedSkills) {
      try {
        const response = await addUserSkill({
          skill_code: skill.code,
          level: 2,
          months_experience: 0,
          last_used_at: new Date().toISOString(),
        });

        if (response.ok) {
          const data = await response.json();
          const normalized = normalizeSkillForClient(
            data?.skill || skill,
            skill as unknown as L4Skill
          );
          successes.push(skillDisplayLabel({ taxonomyName: skill.nameI18n?.en, code: skill.code }));
          onSkillAdded(normalized || data?.skill || skill);
          emitClientMetric('expertise_bulk_add_item', { skill_code: skill.code });
        } else {
          failures.push(skillDisplayLabel({ taxonomyName: skill.nameI18n?.en, code: skill.code }));
        }
      } catch (error) {
        console.error('Bulk add failed for', skill.code, error);
        failures.push(skillDisplayLabel({ taxonomyName: skill.nameI18n?.en, code: skill.code }));
      }
    }

    setBulkSelection(new Set());
    setBulkAdding(false);

    if (successes.length > 0) {
      emitClientMetric('expertise_bulk_add', {
        added: successes.length,
        failed: failures.length,
      });
      toast({
        title: `Added ${successes.length} skill${successes.length > 1 ? 's' : ''}`,
        description:
          failures.length > 0
            ? `Added: ${successes.join(', ')}. Failed: ${failures.join(', ')}.`
            : successes.join(', '),
      });
    }

    if (failures.length > 0 && successes.length === 0) {
      toast({
        title: 'Could not add selected skills',
        description: failures.join(', '),
        variant: 'destructive',
      });
    }
  };

  const handleProofFileUpload = async (file: File | null) => {
    if (!file) return;

    const validation = validateFile(file, 'document', { category: 'proof' });
    if (!validation.valid) {
      setProofUploadError(validation.error || 'Invalid file');
      return;
    }

    setProofUploading(true);
    setProofUploadError('');
    setProofFileName(file.name);

    try {
      const result = await uploadFile({
        file,
        type: 'document',
        category: 'proof',
      });

      if (!result.success || !result.uploadedFileId) {
        setProofUploadError(result.error || result.message || 'Upload failed');
        return;
      }

      setProofSource('document');
      setProofFilePath(result.path || '');
      setProofUploadedFileId(result.uploadedFileId || '');
      setProofUrl(result.url || '');
      setProofUploadError('');
      if (!proofNotes.trim()) {
        setProofNotes(result.artifactDisplayName || result.fileName || file.name);
      }
    } catch (error) {
      console.error('Proof upload failed:', error);
      setProofUploadError('Upload failed. Please try again.');
    } finally {
      setProofUploading(false);
    }
  };

  const handleSave = async (saveAndAddAnother: boolean = false) => {
    if (!taxonomyReady) {
      toast({
        title: 'Skill library unavailable',
        description: taxonomyUnavailableMessage,
        variant: 'destructive',
      });
      return;
    }

    // Validate required fields with user-friendly error messages
    if (!l4Search || l4Search.trim() === '') {
      toast({
        title: 'Missing Skill Name',
        description: 'Please enter or select a skill name before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedL1) {
      toast({
        title: 'Missing Domain',
        description:
          'Please select a domain for this skill. Try browsing categories to select the correct domain.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedL2) {
      toast({
        title: 'Missing Category',
        description:
          'Please select a category for this skill. Try browsing categories to select the correct category.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedL3) {
      toast({
        title: 'Missing Subcategory',
        description:
          'Please select a subcategory for this skill. Try browsing categories to select the correct subcategory.',
        variant: 'destructive',
      });
      return;
    }

    if (proofUploading) {
      toast({
        title: 'Proof upload in progress',
        description: 'Please wait for the document upload to complete before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (proofIssuedDate && proofExpiresDate) {
      const issuedAt = new Date(proofIssuedDate).getTime();
      const expiresAt = new Date(proofExpiresDate).getTime();
      if (Number.isFinite(issuedAt) && Number.isFinite(expiresAt) && expiresAt < issuedAt) {
        toast({
          title: 'Invalid proof dates',
          description: 'Expiration date must be on or after issued date.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (requestVerification) {
      if (!hasProofContext) {
        toast({
          title: 'Add proof first',
          description: 'Attach a proof link or upload before asking someone to confirm this skill.',
          variant: 'destructive',
        });
        return;
      }

      const normalizedEmail = verificationEmail.trim().toLowerCase();
      if (!normalizedEmail) {
        toast({
          title: 'Verifier email required',
          description: 'Enter an email address before requesting verification.',
          variant: 'destructive',
        });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        toast({
          title: 'Invalid verifier email',
          description: 'Enter a valid verifier email address.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      // Create payload - different based on whether skill is from taxonomy or custom
      const payload: any = {
        level,
        months_experience: 0,
        last_used_at: lastUsedDate || new Date().toISOString(),
      };

      if (selectedL4) {
        // Skill from taxonomy - use skill_code
        payload.skill_code = selectedL4.code;
      } else {
        // Custom skill - provide L1/L2/L3 context and custom name
        payload.cat_id = selectedL1.catId;
        payload.subcat_id = selectedL2.subcatId;
        payload.l3_id = selectedL3.l3Id;
        payload.custom_skill_name = l4Search;
      }

      const response = await addUserSkill(payload);

      if (response.ok) {
        const skillData = await response.json();

        // Optionally attach proof to the newly created skill.
        let proofAttached = false;
        let proofAttachError: string | null = null;
        const trimmedProofUrl = proofUrl.trim();
        const trimmedProofFilePath = proofFilePath.trim();
        const trimmedProofUploadedFileId = proofUploadedFileId.trim();
        const shouldAttachProof = Boolean(
          skillData.skill?.id &&
            (proofSource === 'url'
              ? trimmedProofUrl
              : trimmedProofUploadedFileId || trimmedProofFilePath || trimmedProofUrl)
        );

        if (shouldAttachProof) {
          try {
            const proofType = proofSource === 'document' ? 'document' : 'link';
            const proofTitle = proofNotes.trim()
              ? proofNotes.trim()
              : proofSource === 'document'
                ? deriveProofTitleFromFilePath(trimmedProofFilePath)
                : deriveProofTitleFromUrl(trimmedProofUrl);
            const proofResponse = await attachSkillProof(skillData.skill.id, {
              proofType,
              title: proofTitle,
              description: proofNotes.trim() || '',
              url: trimmedProofUrl,
              filePath: proofSource === 'document' ? trimmedProofFilePath : '',
              uploadedFileId: proofSource === 'document' ? trimmedProofUploadedFileId : '',
              issuedDate: proofIssuedDate || '',
              expiresDate: proofExpiresDate || '',
            });
            if (proofResponse.ok) {
              proofAttached = true;
              if (skillData?.skill) {
                skillData.skill.proof_count = (skillData.skill.proof_count || 0) + 1;
              }
            } else {
              const proofErrorBody = (await proofResponse.json().catch(() => null)) as {
                error?: string;
                message?: string;
              } | null;
              proofAttachError =
                proofErrorBody?.message ||
                proofErrorBody?.error ||
                'Proof could not be attached. Please try again.';
            }
          } catch (proofError) {
            console.error('Error attaching proof:', proofError);
            proofAttachError = 'Network error while attaching proof.';
          }
        }

        // Optionally request verification after save.
        let verificationRequested = false;
        let verificationError: string | null = null;
        const shouldRequestVerification = Boolean(
          requestVerification && verificationEmail.trim() && skillData.skill?.id
        );

        if (shouldRequestVerification) {
          try {
            const verificationResponse = await apiFetch('/api/verification/requests/skill', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                skillId: skillData.skill.id,
                verifierSource: verificationSource,
                verifierEmail: verificationEmail.trim().toLowerCase(),
                message: verificationMessage.trim(),
              }),
            });
            if (verificationResponse.ok) {
              verificationRequested = true;
              if (skillData?.skill) {
                skillData.skill.verification_count = (skillData.skill.verification_count || 0) + 1;
              }
            } else {
              const verificationErrorBody =
                ((await verificationResponse.json().catch(() => null)) as {
                  error?: string;
                  details?: string;
                } | null) || null;
              verificationError =
                verificationErrorBody?.error ||
                verificationErrorBody?.details ||
                'Verification could not be requested. Please try again.';
            }
          } catch (verificationRequestError) {
            console.error(
              'Error requesting verification from add skill flow:',
              verificationRequestError
            );
            verificationError = 'Network error while requesting verification.';
          }
        }

        const warnings: string[] = [];
        if (shouldAttachProof && !proofAttached) {
          warnings.push(
            proofAttachError
              ? `proof could not be attached: ${proofAttachError}`
              : 'proof could not be attached'
          );
        }
        if (shouldRequestVerification && !verificationRequested) {
          warnings.push(
            verificationError
              ? `verification request failed: ${verificationError}`
              : 'verification request failed'
          );
        }

        if (warnings.length > 0) {
          toast({
            title: '⚠️ Skill added with follow-up needed',
            description: `The skill was saved, but ${warnings.join('; ')}.`,
            variant: 'destructive',
          });
        } else if (proofAttached && verificationRequested) {
          toast({
            title: '✅ Skill Added',
            description: `"${l4Search}" was added with proof attached and verification requested.`,
          });
        } else if (proofAttached) {
          toast({
            title: '✅ Skill Added',
            description: `"${l4Search}" was added with proof attached.`,
          });
        } else if (verificationRequested) {
          toast({
            title: '✅ Skill Added',
            description: `"${l4Search}" was added and verification was requested.`,
          });
        } else {
          toast({
            title: '✅ Skill Added',
            description: `"${l4Search}" has been added to your Expertise Atlas.`,
          });
        }

        onSkillAdded(skillData?.skill);

        if (saveAndAddAnother) {
          // Reset to step 1 but keep drawer open
          setStep(1);
          setSelectedL1(null);
          setSelectedL2(null);
          setSelectedL3(null);
          setSelectedL4(null);
          setL4Name('');
          setL4Search('');
          setL4Skills([]);
          setShowL4Dropdown(false);
          setLevel(2);
          setLastUsedDate('');
          setProofSource('url');
          setProofUrl('');
          setProofFilePath('');
          setProofUploadedFileId('');
          setProofFileName('');
          setProofUploadError('');
          setProofUploading(false);
          setProofNotes('');
          setProofIssuedDate('');
          setProofExpiresDate('');
          setRequestVerification(false);
          setVerificationEmail('');
          setVerificationSource('peer');
          setVerificationMessage('');
        } else {
          // Close drawer
          onOpenChange(false);
        }
      } else {
        const error = await response.json();
        console.error('Error saving skill:', error);
        toast({
          title: 'Error',
          description: error.error || 'Failed to save skill. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving skill:', error);
      toast({
        title: 'Error',
        description: 'Failed to save skill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const navigateToStep = (targetStep: 1 | 2 | 3 | 4) => {
    if (targetStep === 1) {
      setStep(1);
      setSelectedL2(null);
      setSelectedL3(null);
      setSelectedL4(null);
      setL4Search('');
      setL4Name('');
      setShowL4Dropdown(false);
      lastSelectionsRef.current.l2 = undefined;
      lastSelectionsRef.current.l3 = undefined;
      return;
    }

    if (targetStep === 2) {
      if (!selectedL1) return;
      setStep(2);
      setSelectedL3(null);
      setSelectedL4(null);
      setL4Search('');
      setL4Name('');
      setShowL4Dropdown(false);
      lastSelectionsRef.current.l3 = undefined;
      return;
    }

    if (targetStep === 3) {
      if (!selectedL1 || !selectedL2) return;
      setStep(3);
      setSelectedL4(null);
      setL4Search('');
      setL4Name('');
      setShowL4Dropdown(false);
      return;
    }

    if (!selectedL1 || !selectedL2 || !selectedL3) return;
    setStep(4);
  };

  return (
    <AddSkillDrawerView
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      setMode={setMode}
      step={step}
      setStep={setStep}
      loadedDomains={loadedDomains}
      domainsLoading={domainsLoading}
      handleL1Select={handleL1Select}
      selectedL1={selectedL1}
      l2Categories={l2Categories}
      l2Loading={l2Loading}
      handleL2Select={handleL2Select}
      selectedL2={selectedL2}
      l3Subcategories={l3Subcategories}
      l3Loading={l3Loading}
      handleL3Select={handleL3Select}
      selectedL3={selectedL3}
      l4Skills={l4Skills}
      l4Search={l4Search}
      setL4Search={setL4Search}
      l4Loading={l4Loading}
      showL4Dropdown={showL4Dropdown}
      setShowL4Dropdown={setShowL4Dropdown}
      selectedL4={selectedL4}
      setSelectedL4={setSelectedL4}
      setL4Name={setL4Name}
      level={level}
      setLevel={setLevel}
      lastUsedDate={lastUsedDate}
      setLastUsedDate={setLastUsedDate}
      proofSource={proofSource}
      setProofSource={setProofSource}
      proofUrl={proofUrl}
      setProofUrl={setProofUrl}
      proofFilePath={proofFilePath}
      proofFileName={proofFileName}
      proofUploadError={proofUploadError}
      proofUploading={proofUploading}
      onProofFileSelected={handleProofFileUpload}
      proofNotes={proofNotes}
      setProofNotes={setProofNotes}
      proofIssuedDate={proofIssuedDate}
      setProofIssuedDate={setProofIssuedDate}
      proofExpiresDate={proofExpiresDate}
      setProofExpiresDate={setProofExpiresDate}
      hasProofContext={hasProofContext}
      requestVerification={requestVerification}
      setRequestVerification={setRequestVerification}
      verificationEmail={verificationEmail}
      setVerificationEmail={setVerificationEmail}
      verificationSource={verificationSource}
      setVerificationSource={setVerificationSource}
      verificationMessage={verificationMessage}
      setVerificationMessage={setVerificationMessage}
      saving={saving}
      handleSave={handleSave}
      searchQuery={searchQuery}
      taxonomyReady={taxonomyReady}
      handleSearchChange={handleSearchChange}
      searchResults={searchResults}
      searchLoading={searchLoading}
      searchError={searchError}
      bulkSelection={bulkSelection}
      toggleBulkSelection={toggleBulkSelection}
      bulkAdding={bulkAdding}
      handleBulkAdd={handleBulkAdd}
      quickAddingCodes={quickAddingCodes}
      handleQuickAdd={handleQuickAdd}
      handleSearchResultSelect={handleSearchResultSelect}
      onNavigateToStep={navigateToStep}
      handleBack={handleBack}
    />
  );
}
