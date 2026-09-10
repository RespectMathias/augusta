import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { POST } from '../src/app/api/listings/generate/route'

const listing = { title: 'New Bosch 18V drill', description: 'Battery not included.' }
const request = () =>
  new Request('http://localhost/api/listings/generate', {
    method: 'POST',
    body: JSON.stringify({ sku: 'B2S-10041', marketplaceId: 'dba' }),
  })
beforeEach(() => {
  vi.stubEnv('AI_PROVIDER', 'google')
  vi.stubEnv('AI_MODEL', 'gemini-3.6-flash')
  vi.stubEnv('AI_API_KEY', 'google-test-key')
  vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', '')
  vi.stubEnv('AI_GATEWAY_API_KEY', '')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it.each(['gemini-3.6-flash', 'google/gemini-3.6-flash'])(
  'generates through Google directly with model %s and its own credential',
  async (model) => {
    vi.stubEnv('AI_MODEL', model)
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      const headers = new Headers(init.headers)
      if (
        url !==
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent' ||
        headers.get('x-goog-api-key') !== 'google-test-key'
      )
        return Promise.resolve(
          Response.json(
            {
              error: {
                code: 401,
                message: 'Wrong endpoint or credential',
                status: 'UNAUTHENTICATED',
              },
            },
            { status: 401 },
          ),
        )
      return Promise.resolve(
        Response.json({
          candidates: [
            {
              content: { parts: [{ text: JSON.stringify(listing) }], role: 'model' },
              finishReason: 'STOP',
              index: 0,
            },
          ],
          usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 20, totalTokenCount: 32 },
          modelVersion: 'gemini-3.6-flash',
        }),
      )
    })
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ listing, violations: [] })
  },
)

it.each([
  [401, 'UNAUTHENTICATED', /authentication|key/i, 502],
  [404, 'NOT_FOUND', /model.*unavailable|model.*not found/i, 502],
  [429, 'RESOURCE_EXHAUSTED', /quota|rate limit/i, 429],
] as const)(
  'explains upstream HTTP %s without exposing remote secrets',
  async (status, code, message, expectedStatus) => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        Response.json(
          {
            error: {
              code: status,
              message: 'private upstream detail google-test-key',
              status: code,
            },
          },
          { status },
        ),
      ),
    )
    const response = await POST(request())
    expect(response.status).toBe(expectedStatus)
    const body = await response.text()
    expect(body).toMatch(message)
    expect(body).not.toContain('private upstream detail')
    expect(body).not.toContain('google-test-key')
  },
)

it('explains that a Google key cannot authenticate to Gateway', async () => {
  vi.stubEnv('AI_PROVIDER', 'gateway')
  vi.stubEnv('AI_API_KEY', 'AIza-test-google-key')
  const response = await POST(request())
  expect(response.status).toBe(503)
  expect(await response.text()).toMatch(/Google AI Studio.*AI_PROVIDER=google/)
})

it('requires AI_API_KEY instead of silently using legacy credential variables', async () => {
  vi.stubEnv('AI_API_KEY', '')
  vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'legacy-google-key')
  vi.stubEnv('AI_GATEWAY_API_KEY', 'gateway-key')
  const response = await POST(request())
  expect(response.status).toBe(503)
  expect(await response.text()).toContain('AI_API_KEY')
})
