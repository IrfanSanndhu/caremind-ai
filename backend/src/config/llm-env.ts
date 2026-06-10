import { z } from 'zod';

export const LLM_PROVIDERS = ['openrouter', 'anthropic', 'openai', 'google'] as const;
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export const LLM_PROVIDER_DEFAULTS: Record<LlmProvider, { baseUrl?: string; model: string }> = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3.5-sonnet',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  anthropic: {
    model: 'claude-3-5-sonnet-20241022',
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.0-flash',
  },
};

const llmProviderSchema = z.enum(LLM_PROVIDERS);

export const llmEnvFields = {
  LLM_PROVIDER: llmProviderSchema.optional(),
  LLM_API_KEY: z.string().min(1).optional(),
  LLM_MODEL: z.string().min(1).optional(),
  LLM_BASE_URL: z.string().url().optional(),
  // Legacy OpenRouter vars (still accepted)
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('anthropic/claude-3.5-sonnet'),
};

export type ResolvedLlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export function resolveLlmConfig(data: {
  LLM_PROVIDER?: LlmProvider;
  LLM_API_KEY?: string;
  LLM_MODEL?: string;
  LLM_BASE_URL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_BASE_URL?: string;
  OPENROUTER_MODEL?: string;
}): ResolvedLlmConfig | null {
  const provider = data.LLM_PROVIDER ?? (data.OPENROUTER_API_KEY ? 'openrouter' : undefined);
  const apiKey = data.LLM_API_KEY ?? data.OPENROUTER_API_KEY;
  if (!provider || !apiKey) {
    return null;
  }

  const defaults = LLM_PROVIDER_DEFAULTS[provider];
  const model = data.LLM_MODEL ?? data.OPENROUTER_MODEL ?? defaults.model;
  const baseUrl = data.LLM_BASE_URL ?? data.OPENROUTER_BASE_URL ?? defaults.baseUrl;

  return { provider, apiKey, model, baseUrl };
}

type LlmEnvInput = {
  LLM_PROVIDER?: LlmProvider;
  LLM_API_KEY?: string;
  LLM_MODEL?: string;
  LLM_BASE_URL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_BASE_URL?: string;
  OPENROUTER_MODEL?: string;
};

export function refineLlmEnv(data: LlmEnvInput, ctx: z.RefinementCtx): void {
  const resolved = resolveLlmConfig(data);
  if (!resolved) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['LLM_API_KEY'],
      message: 'Set LLM_API_KEY (and LLM_PROVIDER) or legacy OPENROUTER_API_KEY',
    });
  }
}
