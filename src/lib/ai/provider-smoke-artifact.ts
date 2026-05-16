import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';

export type AiProviderSmokeModelResult = {
  model: string;
  accepted: boolean;
  usageMetadataState: 'returned' | 'missing_safe';
  errorCode?: string | null;
};

export type AiProviderSmokeArtifact = {
  schemaVersion: 1;
  provider: 'gemini';
  generatedAt: string;
  success: boolean;
  defaultModel: AiProviderSmokeModelResult;
  fallbackModel:
    | (AiProviderSmokeModelResult & {
        configured: true;
      })
    | {
        configured: false;
        model: null;
        accepted: null;
        usageMetadataState: 'missing_safe';
      };
  jsonSchemaResponseWorks: boolean;
  disabledFailureSafe: boolean;
};

const DEFAULT_ARTIFACT_PATH = '.artifacts/ai-provider-smoke.json';

export function resolveAiProviderSmokeArtifactPath(
  env: Record<string, string | undefined> = process.env
): string {
  return env.AI_PROVIDER_SMOKE_ARTIFACT_PATH?.trim() || DEFAULT_ARTIFACT_PATH;
}

export async function readAiProviderSmokeArtifact(
  params: {
    artifactPath?: string;
  } = {}
): Promise<AiProviderSmokeArtifact | null> {
  const artifactPath = params.artifactPath || resolveAiProviderSmokeArtifactPath();

  try {
    const raw = await readFile(artifactPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AiProviderSmokeArtifact>;
    if (
      parsed.schemaVersion !== 1 ||
      parsed.provider !== 'gemini' ||
      typeof parsed.generatedAt !== 'string' ||
      !isValidSmokeTimestamp(parsed.generatedAt) ||
      typeof parsed.success !== 'boolean' ||
      !isSmokeModelResult(parsed.defaultModel) ||
      !isSmokeFallbackModelResult(parsed.fallbackModel) ||
      typeof parsed.jsonSchemaResponseWorks !== 'boolean' ||
      typeof parsed.disabledFailureSafe !== 'boolean'
    ) {
      return null;
    }
    return parsed as AiProviderSmokeArtifact;
  } catch {
    return null;
  }
}

function isSmokeModelResult(value: unknown): value is AiProviderSmokeModelResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AiProviderSmokeModelResult>;
  return (
    typeof candidate.model === 'string' &&
    candidate.model.trim().length > 0 &&
    typeof candidate.accepted === 'boolean' &&
    (candidate.usageMetadataState === 'returned' ||
      candidate.usageMetadataState === 'missing_safe') &&
    (candidate.errorCode === undefined ||
      candidate.errorCode === null ||
      typeof candidate.errorCode === 'string')
  );
}

function isSmokeFallbackModelResult(
  value: unknown
): value is AiProviderSmokeArtifact['fallbackModel'] {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AiProviderSmokeArtifact['fallbackModel']>;
  if (candidate.configured === true) {
    return isSmokeModelResult(candidate);
  }

  return (
    candidate.configured === false &&
    candidate.model === null &&
    candidate.accepted === null &&
    candidate.usageMetadataState === 'missing_safe'
  );
}

export async function writeAiProviderSmokeArtifact(
  artifact: AiProviderSmokeArtifact,
  artifactPath = resolveAiProviderSmokeArtifactPath()
): Promise<void> {
  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(`${artifactPath}.tmp`, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  await rename(`${artifactPath}.tmp`, artifactPath);
}

export async function resolveLastSuccessfulAiProviderSmokeAt(
  params: {
    artifactPath?: string;
    env?: Record<string, string | undefined>;
    expectedDefaultModel?: string | null;
    expectedFallbackModel?: string | null;
  } = {}
): Promise<string | null> {
  const env = params.env ?? process.env;
  const envTimestamp = env.AI_PROVIDER_SMOKE_LAST_SUCCESS_AT?.trim();
  const expectedDefaultModel = normalizeModel(params.expectedDefaultModel);
  const expectedFallbackModel = normalizeModel(params.expectedFallbackModel);
  const requiresModelMatch = Boolean(expectedDefaultModel || expectedFallbackModel);

  if (envTimestamp && !requiresModelMatch && isValidSmokeTimestamp(envTimestamp)) {
    return envTimestamp;
  }

  const artifact = await readAiProviderSmokeArtifact({ artifactPath: params.artifactPath });
  if (!artifact?.success) {
    return null;
  }

  if (
    artifact.defaultModel.accepted !== true ||
    artifact.jsonSchemaResponseWorks !== true ||
    artifact.disabledFailureSafe !== true
  ) {
    return null;
  }

  if (
    expectedDefaultModel &&
    normalizeModel(artifact.defaultModel.model) !== expectedDefaultModel
  ) {
    return null;
  }

  if (artifact.fallbackModel.configured && artifact.fallbackModel.accepted !== true) {
    return null;
  }

  if (expectedFallbackModel) {
    const fallback = artifact.fallbackModel;
    if (
      !fallback.configured ||
      fallback.accepted !== true ||
      normalizeModel(fallback.model) !== expectedFallbackModel
    ) {
      return null;
    }
  }

  return artifact.generatedAt;
}

function normalizeModel(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function isValidSmokeTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}
