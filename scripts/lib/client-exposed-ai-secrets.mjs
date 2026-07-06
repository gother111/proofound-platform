const CLIENT_EXPOSED_PREFIX = 'NEXT_PUBLIC_';

const AI_PROVIDER_SECRET_NAME_PATTERN =
  /(?:^|_)(?:AI|LLM|GEMINI|OPENAI|ANTHROPIC|CLAUDE|MISTRAL|GROQ|PERPLEXITY|COHERE|OPENROUTER|DEEPSEEK|HUGGINGFACE|TOGETHER|FIREWORKS|XAI|GOOGLE_AI|VERTEX)(?:_|$)/i;

const SECRET_NAME_PATTERN = /(?:^|_)(?:API_)?(?:KEY|TOKEN|SECRET|CREDENTIALS?)(?:_|$)/i;

export function isClientExposedAiSecretKey(name) {
  if (!name.startsWith(CLIENT_EXPOSED_PREFIX)) {
    return false;
  }

  return AI_PROVIDER_SECRET_NAME_PATTERN.test(name) && SECRET_NAME_PATTERN.test(name);
}

export function listClientExposedAiSecretKeys(env = process.env) {
  return Object.entries(env)
    .filter(([key, value]) => isClientExposedAiSecretKey(key) && value?.trim())
    .map(([key]) => key)
    .sort();
}
