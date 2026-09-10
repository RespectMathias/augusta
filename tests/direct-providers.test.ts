import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { POST } from '../src/app/api/listings/generate/route'

const listing = { title: 'Bosch drill', description: 'Battery not included.' }
const request = () =>
  new Request('http://localhost/api/listings/generate', {
    method: 'POST',
    body: JSON.stringify({ sku: 'B2S-10041', marketplaceId: 'dba' }),
  })
beforeEach(() => {
  vi.stubEnv('AI_API_KEY', 'provider-test-key')
  vi.stubEnv('AI_MODEL', 'test-model')
  vi.stubEnv('AI_BASE_URL', '')
  vi.stubGlobal('fetch', () => Promise.reject(new Error('Unexpected remote call')))
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it.each([
  ['openai', 'https://api.openai.com/v1/chat/completions'],
  ['zai', 'https://api.z.ai/api/paas/v4/chat/completions'],
  ['z.ai', 'https://api.z.ai/api/paas/v4/chat/completions'],
  ['compatible', 'https://my-provider.example/v1/chat/completions'],
] as const)(
  'generates via %s using its direct API key through the AI SDK',
  async (provider, endpoint) => {
    vi.stubEnv('AI_PROVIDER', provider)
    if (provider === 'compatible') vi.stubEnv('AI_BASE_URL', 'https://my-provider.example/v1')
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      if (
        url !== endpoint ||
        new Headers(init.headers).get('authorization') !== 'Bearer provider-test-key'
      )
        return Promise.resolve(
          Response.json(
            { error: { message: 'Wrong destination or key', type: 'authentication_error' } },
            { status: 401 },
          ),
        )
      return Promise.resolve(
        Response.json({
          id: 'chat-test',
          object: 'chat.completion',
          created: 1,
          model: 'test-model',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: JSON.stringify(listing) },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      )
    })
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ listing, violations: [] })
  },
)

it.each(['anthropic', 'claude'])(
  'generates Claude output via %s with Anthropic authentication',
  async (provider) => {
    vi.stubEnv('AI_PROVIDER', provider)
    vi.stubEnv('AI_MODEL', 'claude-sonnet-4-6')
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      if (
        url !== 'https://api.anthropic.com/v1/messages' ||
        new Headers(init.headers).get('x-api-key') !== 'provider-test-key'
      )
        return Promise.resolve(
          Response.json(
            {
              type: 'error',
              error: { type: 'authentication_error', message: 'Wrong destination or key' },
            },
            { status: 401 },
          ),
        )
      return Promise.resolve(
        Response.json({
          id: 'msg-test',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-4-6',
          content: [{ type: 'text', text: JSON.stringify(listing) }],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      )
    })
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ listing, violations: [] })
  },
)

it('requires a base URL for an OpenAI-compatible service', async () => {
  vi.stubEnv('AI_PROVIDER', 'compatible')
  const response = await POST(request())
  expect(response.status).toBe(503)
  expect(await response.text()).toContain('AI_BASE_URL')
})

it('requires an explicit model for a direct provider without a default', async () => {
  vi.stubEnv('AI_PROVIDER', 'anthropic')
  vi.stubEnv('AI_MODEL', '')
  const response = await POST(request())
  expect(response.status).toBe(503)
  expect(await response.text()).toContain('AI_MODEL')
})
