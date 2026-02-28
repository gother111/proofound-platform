'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Briefcase, Download, FileText, Plus, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch } from '@/lib/api/fetch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type ImportContext = 'cv' | 'jd' | 'general';

type CandidateCategory =
  | 'technical'
  | 'soft_skills'
  | 'tools_technologies'
  | 'languages'
  | 'certifications'
  | 'other';

type MatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';

interface ApiSuggestion {
  skill_id: string;
  skill_name: string;
  match_method: MatchMethod;
  score: number;
}

interface ApiCandidate {
  candidate_id: string;
  raw_skill_text: string;
  category: CandidateCategory;
  evidence_snippets: string[];
  confidence: number;
  suggestions: ApiSuggestion[];
  unmapped_candidate: boolean;
}

interface ApiDocumentResult {
  document_id: string;
  file_name: string;
  context: ImportContext;
  candidate_count: number;
  candidates: ApiCandidate[];
}

interface ApiSuggestResponse {
  documents: ApiDocumentResult[];
  metadata: {
    semantic_used: boolean;
    semantic_fallback_triggered: boolean;
    unmapped_candidates_count: number;
    limits: {
      max_documents: number;
      max_chars_per_document: number;
      max_total_chars: number;
    };
  };
}

interface CandidateState extends ApiCandidate {
  approved: boolean;
  selected_skill_ids: string[];
  manual_search_query: string;
  manual_options: ApiSuggestion[];
  manual_loading: boolean;
}

interface ParsedDocumentState {
  document_id: string;
  file_name: string;
  context: ImportContext;
  parsed_text: string;
  parse_error?: string;
  candidates: CandidateState[];
}

interface LegacySuggestion {
  id: string;
  code: string;
  name: string;
  aliases: string[];
  description: string | null;
  slug: string;
  tags: string[] | null;
  score: number;
  confidence: number;
}

interface CVJDAutoSuggestProps {
  onSkillsAdded?: (skills: LegacySuggestion[]) => void;
}

const CATEGORY_OPTIONS: CandidateCategory[] = [
  'technical',
  'soft_skills',
  'tools_technologies',
  'languages',
  'certifications',
  'other',
];

function formatCategory(value: CandidateCategory): string {
  return value.replace(/_/g, ' ');
}

function parseMultiSelect(event: ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

function toSkillMap(candidates: CandidateState[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const candidate of candidates) {
    const allOptions = [...candidate.suggestions, ...candidate.manual_options];
    for (const option of allOptions) {
      map.set(option.skill_id, option.skill_name);
    }
  }

  return map;
}

function collectSelectedSkillIds(candidates: CandidateState[]): string[] {
  const selected = new Set<string>();

  for (const candidate of candidates) {
    if (!candidate.approved) {
      continue;
    }

    for (const skillId of candidate.selected_skill_ids) {
      selected.add(skillId);
    }
  }

  return Array.from(selected);
}

function collectValidatedSkillIds(candidates: CandidateState[]): string[] {
  const selected = collectSelectedSkillIds(candidates);
  const validIds = new Set<string>();

  for (const candidate of candidates) {
    const allowedIds = new Set<string>([
      ...candidate.suggestions.map((suggestion) => suggestion.skill_id),
      ...candidate.manual_options.map((option) => option.skill_id),
    ]);

    for (const skillId of selected) {
      if (allowedIds.has(skillId)) {
        validIds.add(skillId);
      }
    }
  }

  return Array.from(validIds);
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getContextTextPlaceholder(context: ImportContext): string {
  if (context === 'jd') {
    return 'Paste a job description here...';
  }

  if (context === 'general') {
    return 'Paste any general text you want to analyze for skills...';
  }

  return 'Paste CV text here...';
}

function normalizePdfParseError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Failed to parse PDF';
  }

  if (error.message.includes('GlobalWorkerOptions.workerSrc')) {
    return 'PDF parser could not start. Please refresh and re-upload the file.';
  }

  return error.message;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist/webpack.mjs');
  const buffer = await file.arrayBuffer();
  const document = await (pdfjs.getDocument as any)({
    data: new Uint8Array(buffer),
  }).promise;

  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = (textContent.items as Array<{ str?: string }>)
      .map((item) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 0) {
      pageTexts.push(text);
    }
  }

  return pageTexts.join('\n').trim();
}

function LegacyCvTextSuggest({ onSkillsAdded }: CVJDAutoSuggestProps) {
  const [text, setText] = useState('');
  const [context, setContext] = useState<ImportContext>('cv');
  const [suggestions, setSuggestions] = useState<LegacySuggestion[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((previous) => {
      const next = new Set(previous);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      toast.error('Please paste CV or job-description text first.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/expertise/auto-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || payload.error || 'Failed to analyze text');
      }

      const payload = await response.json();
      const parsedSuggestions = (payload.suggestions || []) as LegacySuggestion[];
      setSuggestions(parsedSuggestions);
      setSelectedSkillIds(new Set(parsedSuggestions.slice(0, 1).map((item) => item.id)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze text');
    } finally {
      setLoading(false);
    }
  };

  const addSelectedToProfile = async () => {
    const selected = suggestions.filter((suggestion) => selectedSkillIds.has(suggestion.id));
    if (selected.length === 0) {
      toast.error('Select at least one suggestion first.');
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      for (const suggestion of selected) {
        const response = await apiFetch('/api/expertise/user-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skill_code: suggestion.code,
            level: 2,
            months_experience: 0,
            last_used_at: new Date().toISOString(),
            relevance: 'current',
          }),
        });

        if (response.ok) {
          successCount += 1;
          continue;
        }

        const payload = await response.json();
        if (payload.error === 'Skill already exists in your profile') {
          successCount += 1;
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} skill${successCount > 1 ? 's' : ''}.`);
        onSkillsAdded?.(selected);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-proofound-forest" />
          Legacy Import (Rollback Mode)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={context === 'cv' ? 'default' : 'outline'}
            onClick={() => setContext('cv')}
          >
            <FileText className="mr-1 h-4 w-4" />
            CV/Resume
          </Button>
          <Button
            size="sm"
            variant={context === 'jd' ? 'default' : 'outline'}
            onClick={() => setContext('jd')}
          >
            <Briefcase className="mr-1 h-4 w-4" />
            Job Description
          </Button>
          <Button
            size="sm"
            variant={context === 'general' ? 'default' : 'outline'}
            onClick={() => setContext('general')}
          >
            General Text
          </Button>
        </div>

        <Textarea
          rows={8}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste your CV, resume, or job description here..."
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={analyzeText} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze & Suggest Skills'}
          </Button>
          <Button
            variant="outline"
            onClick={addSelectedToProfile}
            disabled={loading || selectedSkillIds.size === 0}
          >
            Add Selected to Profile
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between rounded border p-2"
              >
                <div>
                  <p className="text-sm font-medium">{suggestion.name}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.code}</p>
                </div>
                <input
                  type="checkbox"
                  aria-label={`Select ${suggestion.name}`}
                  checked={selectedSkillIds.has(suggestion.id)}
                  onChange={() => toggleSkill(suggestion.id)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CvPdfImportSuggest({ onSkillsAdded }: CVJDAutoSuggestProps) {
  const [context, setContext] = useState<ImportContext>('cv');
  const [manualText, setManualText] = useState('');
  const [documents, setDocuments] = useState<ParsedDocumentState[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiMetadata, setApiMetadata] = useState<ApiSuggestResponse['metadata'] | null>(null);
  const isPdfContext = context === 'cv';

  const approvedSkillIdsCombined = useMemo(() => {
    const selected = new Set<string>();

    for (const doc of documents) {
      for (const skillId of collectValidatedSkillIds(doc.candidates)) {
        selected.add(skillId);
      }
    }

    return Array.from(selected);
  }, [documents]);

  const updateCandidate = (
    documentId: string,
    candidateId: string,
    updater: (candidate: CandidateState) => CandidateState
  ) => {
    setDocuments((prev) =>
      prev.map((document) => {
        if (document.document_id !== documentId) {
          return document;
        }

        return {
          ...document,
          candidates: document.candidates.map((candidate) =>
            candidate.candidate_id === candidateId ? updater(candidate) : candidate
          ),
        };
      })
    );
  };

  const switchContext = (nextContext: ImportContext) => {
    setContext(nextContext);
    setDocuments([]);
    setManualText('');
    setApiMetadata(null);
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []);

    if (fileList.length === 0) {
      return;
    }

    const pdfFiles = fileList.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length !== fileList.length) {
      toast.error('Only PDF files are supported in V1.');
    }

    if (pdfFiles.length === 0) {
      return;
    }

    setIsParsing(true);

    try {
      const parsedDocuments: ParsedDocumentState[] = [];

      for (const file of pdfFiles) {
        const documentId = `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 8)}`;

        try {
          const text = await extractPdfText(file);

          if (!text.trim()) {
            parsedDocuments.push({
              document_id: documentId,
              file_name: file.name,
              context,
              parsed_text: '',
              parse_error: 'No text could be extracted. OCR is not supported in V1.',
              candidates: [],
            });
            continue;
          }

          parsedDocuments.push({
            document_id: documentId,
            file_name: file.name,
            context,
            parsed_text: text,
            candidates: [],
          });
        } catch (error) {
          parsedDocuments.push({
            document_id: documentId,
            file_name: file.name,
            context,
            parsed_text: '',
            parse_error: normalizePdfParseError(error),
            candidates: [],
          });
        }
      }

      setDocuments(parsedDocuments);
      setApiMetadata(null);

      const successCount = parsedDocuments.filter((document) => !document.parse_error).length;
      if (successCount > 0) {
        toast.success(`Parsed ${successCount} PDF${successCount > 1 ? 's' : ''}.`);
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleAnalyze = async () => {
    const readyDocuments = documents.filter(
      (document) => !document.parse_error && document.parsed_text.trim()
    );
    const textInput = manualText.trim();

    let requestDocuments: Array<{
      document_id: string;
      file_name: string;
      text: string;
      context: ImportContext;
    }> = [];
    let requestDocumentStates: ParsedDocumentState[] = [];

    if (isPdfContext) {
      if (readyDocuments.length === 0) {
        toast.error('Upload at least one text-based PDF before analyzing.');
        return;
      }

      requestDocuments = readyDocuments.map((document) => ({
        document_id: document.document_id,
        file_name: document.file_name,
        text: document.parsed_text,
        context: document.context,
      }));
      requestDocumentStates = readyDocuments;
    } else {
      if (!textInput) {
        toast.error('Paste text before analyzing.');
        return;
      }

      const documentId = `${context}-${Date.now()}`;
      const fileName = context === 'jd' ? 'job-description.txt' : 'general-text.txt';

      requestDocuments = [
        {
          document_id: documentId,
          file_name: fileName,
          text: textInput,
          context,
        },
      ];
      requestDocumentStates = [
        {
          document_id: documentId,
          file_name: fileName,
          context,
          parsed_text: textInput,
          candidates: [],
        },
      ];
    }

    setIsAnalyzing(true);

    try {
      const response = await apiFetch('/api/expertise/cv-import/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: requestDocuments,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || payload.message || 'Failed to analyze uploaded documents');
      }

      const payload = (await response.json()) as ApiSuggestResponse;
      setApiMetadata(payload.metadata);

      const requestStateById = new Map(
        requestDocumentStates.map((document) => [document.document_id, document])
      );

      const analyzedDocuments = payload.documents.map((result) => {
        const source = requestStateById.get(result.document_id);

        return {
          document_id: result.document_id,
          file_name: result.file_name,
          context: result.context,
          parsed_text: source?.parsed_text || '',
          parse_error: source?.parse_error,
          candidates: result.candidates.map((candidate) => ({
            ...candidate,
            approved: true,
            selected_skill_ids: candidate.suggestions.slice(0, 1).map((skill) => skill.skill_id),
            manual_search_query: candidate.raw_skill_text,
            manual_options: [],
            manual_loading: false,
          })),
        };
      });

      if (isPdfContext) {
        const parseErrorDocuments = documents.filter((document) => Boolean(document.parse_error));
        setDocuments([...parseErrorDocuments, ...analyzedDocuments]);
      } else {
        setDocuments(analyzedDocuments);
      }

      toast.success(
        `Analyzed ${payload.documents.length} document${payload.documents.length > 1 ? 's' : ''}.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze CV files');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const searchManualMappings = async (documentId: string, candidateId: string) => {
    const candidate = documents
      .find((document) => document.document_id === documentId)
      ?.candidates.find((item) => item.candidate_id === candidateId);

    if (!candidate) {
      return;
    }

    const query = candidate.manual_search_query.trim();
    if (!query) {
      toast.error('Enter a search query for manual mapping.');
      return;
    }

    updateCandidate(documentId, candidateId, (current) => ({ ...current, manual_loading: true }));

    try {
      const response = await apiFetch(
        `/api/expertise/taxonomy?search=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error('Failed to search taxonomy');
      }

      const payload = await response.json();
      const mappedOptions: ApiSuggestion[] = (payload.l4_skills || [])
        .slice(0, 8)
        .map((skill: any) => ({
          skill_id: skill.code,
          skill_name: skill.nameI18n?.en || skill.code,
          match_method: 'fuzzy' as const,
          score: 0.5,
        }));

      updateCandidate(documentId, candidateId, (current) => ({
        ...current,
        manual_loading: false,
        manual_options: mappedOptions,
      }));

      if (mappedOptions.length === 0) {
        toast.info('No taxonomy matches found for manual mapping.');
      }
    } catch (error) {
      updateCandidate(documentId, candidateId, (current) => ({
        ...current,
        manual_loading: false,
      }));
      toast.error(error instanceof Error ? error.message : 'Failed to search taxonomy');
    }
  };

  const exportDocument = (document: ParsedDocumentState) => {
    const skillIds = collectValidatedSkillIds(document.candidates);
    const skillMap = toSkillMap(document.candidates);

    const jsonPayload = {
      document_id: document.document_id,
      file_name: document.file_name,
      context: document.context,
      skill_ids: skillIds,
    };

    const csvRows: Array<Array<string | number>> = [
      ['document_id', 'file_name', 'skill_id', 'skill_name'],
    ];
    for (const skillId of skillIds) {
      csvRows.push([
        document.document_id,
        document.file_name,
        skillId,
        skillMap.get(skillId) || '',
      ]);
    }

    downloadJson(`${document.file_name.replace(/\.pdf$/i, '')}-skills.json`, jsonPayload);
    downloadCsv(`${document.file_name.replace(/\.pdf$/i, '')}-skills.csv`, csvRows);
  };

  const addApprovedSkillsToProfile = async () => {
    const skillIdSet = new Set<string>();

    for (const document of documents) {
      for (const skillId of collectValidatedSkillIds(document.candidates)) {
        skillIdSet.add(skillId);
      }
    }

    const skillIds = Array.from(skillIdSet);

    if (skillIds.length === 0) {
      toast.error('No approved skill IDs to add.');
      return;
    }

    setIsSaving(true);

    try {
      let successCount = 0;
      let failureCount = 0;
      const callbackPayload: LegacySuggestion[] = [];

      for (const skillId of skillIds) {
        const response = await apiFetch('/api/expertise/user-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skill_code: skillId,
            level: 2,
            months_experience: 0,
            last_used_at: new Date().toISOString(),
            relevance: 'current',
          }),
        });

        if (response.ok) {
          successCount += 1;
        } else {
          const payload = await response.json();
          if (payload.error === 'Skill already exists in your profile') {
            successCount += 1;
          } else {
            failureCount += 1;
            continue;
          }
        }

        callbackPayload.push({
          id: skillId,
          code: skillId,
          name: skillId,
          aliases: [],
          description: null,
          slug: skillId,
          tags: null,
          score: 1,
          confidence: 1,
        });
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} skill${successCount > 1 ? 's' : ''} to your profile.`);
        onSkillsAdded?.(callbackPayload);
      }

      if (failureCount > 0) {
        toast.error(`Failed to add ${failureCount} skill${failureCount > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save approved skills');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-proofound-forest" />
            CV Skills Import (PDF, Privacy-first)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={context === 'cv' ? 'default' : 'outline'}
              onClick={() => switchContext('cv')}
            >
              <FileText className="mr-1 h-4 w-4" />
              CV/Resume
            </Button>
            <Button
              size="sm"
              variant={context === 'jd' ? 'default' : 'outline'}
              onClick={() => switchContext('jd')}
            >
              <Briefcase className="mr-1 h-4 w-4" />
              Job Description
            </Button>
            <Button
              size="sm"
              variant={context === 'general' ? 'default' : 'outline'}
              onClick={() => switchContext('general')}
            >
              General Text
            </Button>
          </div>

          {isPdfContext ? (
            <div className="space-y-2">
              <Input
                data-testid="cv-upload"
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleUpload}
                disabled={isParsing || isAnalyzing}
              />
              <p className="text-xs text-muted-foreground">
                Text-based PDFs only. OCR is not supported in V1.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                data-testid="context-text-input"
                rows={8}
                value={manualText}
                onChange={(event) => setManualText(event.target.value)}
                placeholder={getContextTextPlaceholder(context)}
                disabled={isAnalyzing}
              />
              <p className="text-xs text-muted-foreground">
                Text is processed in-memory and sent to the local suggestion engine only.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={
                isParsing ||
                isAnalyzing ||
                (isPdfContext
                  ? !documents.some(
                      (document) => !document.parse_error && document.parsed_text.trim()
                    )
                  : !manualText.trim())
              }
            >
              {isAnalyzing
                ? 'Analyzing...'
                : isPdfContext
                  ? 'Analyze Uploaded PDFs'
                  : 'Analyze Text'}
            </Button>
            <Button
              onClick={addApprovedSkillsToProfile}
              disabled={isSaving || approvedSkillIdsCombined.length === 0}
            >
              {isSaving
                ? 'Adding...'
                : `Add Approved (${approvedSkillIdsCombined.length}) to Profile`}
            </Button>
          </div>

          {apiMetadata && (
            <div className="rounded-lg border p-3 text-sm">
              <p>Semantic used: {apiMetadata.semantic_used ? 'yes' : 'no'}</p>
              <p>
                Semantic fallback triggered:{' '}
                {apiMetadata.semantic_fallback_triggered ? 'yes' : 'no'}
              </p>
              <p>Unmapped candidates: {apiMetadata.unmapped_candidates_count}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {documents.map((document) => (
        <Card key={document.document_id}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg">{document.file_name}</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportDocument(document)}
                disabled={collectValidatedSkillIds(document.candidates).length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export This CV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {document.parse_error ? (
              <p className="text-sm text-red-600">{document.parse_error}</p>
            ) : (
              <>
                <details className="rounded-md border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Extracted text preview
                  </summary>
                  <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {document.parsed_text}
                  </pre>
                </details>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Approve</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Evidence</TableHead>
                        <TableHead>Mapped skill_ids</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {document.candidates.map((candidate) => {
                        const optionMap = new Map<string, ApiSuggestion>();
                        for (const option of [
                          ...candidate.suggestions,
                          ...candidate.manual_options,
                        ]) {
                          optionMap.set(option.skill_id, option);
                        }

                        const options = Array.from(optionMap.values());

                        return (
                          <TableRow key={candidate.candidate_id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={candidate.approved}
                                onChange={(event) => {
                                  updateCandidate(
                                    document.document_id,
                                    candidate.candidate_id,
                                    (current) => ({
                                      ...current,
                                      approved: event.target.checked,
                                    })
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className="min-w-[220px]">
                              <Textarea
                                value={candidate.raw_skill_text}
                                onChange={(event) => {
                                  updateCandidate(
                                    document.document_id,
                                    candidate.candidate_id,
                                    (current) => ({
                                      ...current,
                                      raw_skill_text: event.target.value,
                                      manual_search_query: event.target.value,
                                    })
                                  );
                                }}
                                rows={2}
                              />
                            </TableCell>
                            <TableCell>
                              <select
                                className="rounded border px-2 py-1 text-sm"
                                value={candidate.category}
                                onChange={(event) => {
                                  updateCandidate(
                                    document.document_id,
                                    candidate.candidate_id,
                                    (current) => ({
                                      ...current,
                                      category: event.target.value as CandidateCategory,
                                    })
                                  );
                                }}
                              >
                                {CATEGORY_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {formatCategory(option)}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {Math.round(candidate.confidence * 100)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-[280px]">
                              <ul className="list-disc pl-4 text-xs">
                                {candidate.evidence_snippets.map((snippet, index) => (
                                  <li key={`${candidate.candidate_id}-${index}`}>{snippet}</li>
                                ))}
                              </ul>
                            </TableCell>
                            <TableCell className="min-w-[280px] space-y-2">
                              <select
                                multiple
                                className="h-28 w-full rounded border px-2 py-1 text-xs"
                                value={candidate.selected_skill_ids}
                                onChange={(event) => {
                                  const selectedSkillIds = parseMultiSelect(event);
                                  updateCandidate(
                                    document.document_id,
                                    candidate.candidate_id,
                                    (current) => ({
                                      ...current,
                                      selected_skill_ids: selectedSkillIds,
                                    })
                                  );
                                }}
                              >
                                {options.map((option) => (
                                  <option key={option.skill_id} value={option.skill_id}>
                                    {option.skill_id} · {option.skill_name} ({option.match_method}:{' '}
                                    {(option.score * 100).toFixed(0)}%)
                                  </option>
                                ))}
                              </select>

                              <div className="flex items-center gap-2">
                                <Input
                                  value={candidate.manual_search_query}
                                  onChange={(event) => {
                                    updateCandidate(
                                      document.document_id,
                                      candidate.candidate_id,
                                      (current) => ({
                                        ...current,
                                        manual_search_query: event.target.value,
                                      })
                                    );
                                  }}
                                  placeholder="Search taxonomy for manual mapping"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    searchManualMappings(
                                      document.document_id,
                                      candidate.candidate_id
                                    )
                                  }
                                  disabled={candidate.manual_loading}
                                >
                                  <Search className="mr-2 h-4 w-4" />
                                  {candidate.manual_loading ? '...' : 'Find'}
                                </Button>
                              </div>

                              {candidate.unmapped_candidate &&
                                candidate.selected_skill_ids.length === 0 && (
                                  <p className="text-xs text-amber-700">
                                    Unmapped candidate. Select at least one taxonomy skill_id.
                                  </p>
                                )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {documents.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {isPdfContext
              ? 'Upload one or more CV PDFs to begin extraction and mapping.'
              : 'Paste text and run analysis to begin extraction and mapping.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CVJDAutoSuggest({ onSkillsAdded }: CVJDAutoSuggestProps) {
  if (process.env.NEXT_PUBLIC_CV_IMPORT_V2 === 'false') {
    return <LegacyCvTextSuggest onSkillsAdded={onSkillsAdded} />;
  }

  return <CvPdfImportSuggest onSkillsAdded={onSkillsAdded} />;
}
