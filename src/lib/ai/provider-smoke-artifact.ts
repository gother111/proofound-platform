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
      typeof parsed.success !== 'boolean'
    ) {
      return null;
    }
    return parsed as AiProviderSmokeArtifact;
  } catch {
    return null;
  }
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
  } = {}
): Promise<string | null> {
  const env = params.env ?? process.env;
  const envTimestamp = env.AI_PROVIDER_SMOKE_LAST_SUCCESS_AT?.trim();
  if (envTimestamp) {
    return envTimestamp;
  }

  const artifact = await readAiProviderSmokeArtifact({ artifactPath: params.artifactPath });
  return artifact?.success ? artifact.generatedAt : null;
}
