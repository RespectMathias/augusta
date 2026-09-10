import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogle } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createGateway, type LanguageModel } from 'ai'

type ResolvedModel =
  { model: LanguageModel; jsonMode?: boolean } | { error: string; model?: undefined }

/** Server-side provider selection. Every adapter receives the same explicit credential. */
export function resolveModel(): ResolvedModel {
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
  const modelId = configuredModelId()
  if (!modelId) return { error: 'Set AI_MODEL to a model available on your provider account.' }
  const baseURL = normalizedBaseURL()
  if (typeof baseURL === 'object') return baseURL
  return buildModel(provider, modelId, apiKey, baseURL)
}

function configuredModelId() {
  const configured = process.env.AI_MODEL?.trim()
  return configured === '' ? undefined : configured
}

function normalizedBaseURL(): string | undefined | { error: string } {
  const configured = process.env.AI_BASE_URL?.trim()
  if (!configured) return undefined
  const invalid = baseURLError(configured)
  if (invalid) return { error: invalid }
  return configured
}

function baseURLError(value: string) {
  let endpoint: URL
  try {
    endpoint = new URL(value)
  } catch {
    return 'AI_BASE_URL must be a valid URL.'
  }
  if (endpoint.protocol === 'https:') return undefined
  if (endpoint.protocol === 'http:' && isLoopback(endpoint.hostname)) return undefined
  return 'AI_BASE_URL must use HTTPS, except for local HTTP endpoints such as http://localhost:11434/v1.'
}

function isLoopback(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

function buildModel(
  provider: string,
  modelId: string,
  apiKey: string,
  baseURL: string | undefined,
): ResolvedModel {
  const options = { apiKey, ...(baseURL ? { baseURL } : {}) }
  if (provider === 'google')
    return { model: createGoogle(options)(modelId.replace(/^google\//, '')) }
  if (provider === 'anthropic' || provider === 'claude')
    return { model: createAnthropic(options)(modelId) }
  if (provider === 'openai') return { model: createOpenAI(options).chat(modelId) }
  if (provider === 'gateway') return { model: createGateway(options)(modelId) }
  if (!baseURL)
    return {
      error:
        'For an OpenAI-compatible provider, set AI_BASE_URL to its API endpoint, or choose google, anthropic, openai, or gateway.',
    }
  return {
    model: createOpenAICompatible({ name: provider, apiKey, baseURL })(modelId),
    jsonMode: true,
  }
}
