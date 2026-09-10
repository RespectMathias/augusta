import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogle } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createGateway } from 'ai'

/** Server-side provider selection. Every adapter receives the same explicit credential. */
export function resolveModel() {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() ?? 'google'
  const apiKey = process.env.AI_API_KEY?.trim()
  if (!apiKey)
    return {
      error: 'Generation is not configured. Set AI_API_KEY in .env.local and restart the server.',
    }
  if (provider === 'gateway' && apiKey.startsWith('AIza'))
    return {
      error:
        'AI_API_KEY contains a Google AI Studio key. Set AI_PROVIDER=google, or use a Vercel Gateway key for AI_PROVIDER=gateway.',
    }
  const configuredModel = process.env.AI_MODEL?.trim()
  const modelId =
    configuredModel ??
    (provider === 'google'
      ? 'gemini-3.6-flash'
      : provider === 'gateway'
        ? 'openai/gpt-5.4'
        : undefined)
  if (!modelId) return { error: 'Set AI_MODEL to a model available on your provider account.' }
  const configuredBaseURL = process.env.AI_BASE_URL?.trim()
  const baseURL = configuredBaseURL === '' ? undefined : configuredBaseURL
  const options = { apiKey, ...(baseURL ? { baseURL } : {}) }
  switch (provider) {
    case 'google':
      return { model: createGoogle(options)(modelId.replace(/^google\//, '')) }
    case 'anthropic':
    case 'claude':
      return { model: createAnthropic(options)(modelId) }
    case 'openai':
      return { model: createOpenAI(options).chat(modelId) }
    case 'gateway':
      return { model: createGateway(options)(modelId) }
    case 'zai':
    case 'z.ai':
      return {
        model: createOpenAICompatible({
          name: 'zai',
          apiKey,
          baseURL: baseURL ?? 'https://api.z.ai/api/paas/v4',
        })(modelId),
        jsonMode: true,
      }
    default:
      if (!baseURL)
        return {
          error:
            'For an OpenAI-compatible provider, set AI_BASE_URL to its API endpoint, or choose google, anthropic, openai, zai, or gateway.',
        }
      return {
        model: createOpenAICompatible({ name: provider, apiKey, baseURL })(modelId),
        jsonMode: true,
      }
  }
}
