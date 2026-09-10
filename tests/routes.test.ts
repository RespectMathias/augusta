import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MockLanguageModelV4 } from 'ai/test'
import type * as AISdk from 'ai'
import { POST as generate } from '../src/app/api/listings/generate/route'
import { POST as approve } from '../src/app/api/listings/approve/route'

const provider = vi.hoisted(() => ({
  text: '{"title":"Bosch drill","description":"18V, battery not included."}',
  fail: false,
}))
vi.mock('ai', async (original) => {
  const sdk = await original<typeof AISdk>()
  return {
    ...sdk,
    createGateway:
      ({ apiKey }: { apiKey?: string }) =>
      () => {
        if (apiKey !== 'test-key') throw new Error('Gateway did not receive AI_API_KEY')
        return new MockLanguageModelV4({
          doGenerate: (options) => {
            if (provider.fail) return Promise.reject(new Error('private provider detail'))
            // Return a different output if authoritative product facts or rules are omitted.
            const prompt = JSON.stringify(options.prompt)
            const grounded =
              prompt.includes('battery_included') &&
              prompt.includes('title_max_chars') &&
              prompt.includes('Retail box slightly scuffed')
            return Promise.resolve({
              content: [{ type: 'text', text: grounded ? provider.text : 'ungrounded' }],
              finishReason: { unified: 'stop', raw: undefined },
              usage: {
                inputTokens: {
                  total: 10,
                  noCache: 10,
                  cacheRead: undefined,
                  cacheWrite: undefined,
                },
                outputTokens: { total: 20, text: 20, reasoning: undefined },
              },
              warnings: [],
            })
          },
        })
      },
  }
})

const selection = { sku: 'B2S-10041', marketplaceId: 'dba' }
const listing = { title: 'Bosch drill', description: '18V, battery not included.' }
const request = (body: unknown) =>
  new Request('http://localhost/api/listings', { method: 'POST', body: JSON.stringify(body) })
beforeEach(() => {
  vi.stubEnv('AI_PROVIDER', 'gateway')
  vi.stubEnv('AI_GATEWAY_API_KEY', '')
})
afterEach(() => {
  vi.unstubAllEnvs()
  provider.fail = false
  provider.text = JSON.stringify(listing)
})

describe('listing API', () => {
  it.each([generate, approve])('rejects malformed JSON and unknown selections', async (route) => {
    expect(
      (await route(new Request('http://localhost', { method: 'POST', body: '{' }))).status,
    ).toBe(400)
    expect((await route(request({ ...selection, ...listing, sku: 'missing' }))).status).toBe(404)
    expect(
      (await route(request({ ...selection, ...listing, marketplaceId: 'missing' }))).status,
    ).toBe(404)
    expect((await route(request(null))).status).toBe(400)
  })
  it.each([generate, approve])('blocks do-not-list inventory on the server', async (route) => {
    expect((await route(request({ ...selection, ...listing, sku: 'B2S-10052' }))).status).toBe(422)
  })
})

describe('listing generation', () => {
  it('generates structured output using source facts and server rules', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', 'openai/gpt-5.4')
    const response = await generate(request({ ...selection, rules: {}, item: { name: 'fake' } }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ listing, violations: [] })
  })
  it('returns invalid drafts with field violations for editing', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', 'openai/gpt-5.4')
    provider.text = JSON.stringify({ ...listing, title: 'CHEAP drill' })
    const response = await generate(request(selection))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      violations: [expect.objectContaining({ field: 'title' })],
    })
  })
  it('reports missing configuration without a fake fallback', async () => {
    vi.stubEnv('AI_API_KEY', '')
    expect((await generate(request(selection))).status).toBe(503)
  })
  it.each(['not JSON', '{"title":17,"description":"text"}'])(
    'rejects malformed provider output %s',
    async (text) => {
      vi.stubEnv('AI_API_KEY', 'test-key')
      vi.stubEnv('AI_MODEL', 'openai/gpt-5.4')
      provider.text = text
      expect((await generate(request(selection))).status).toBe(502)
    },
  )
  it('returns a safe retryable error on provider failure', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', 'openai/gpt-5.4')
    provider.fail = true
    const response = await generate(request(selection))
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('private provider detail')
  })
})

describe('listing approval', () => {
  it('rejects invalid approval even if the client supplies permissive rules', async () => {
    const response = await approve(
      request({ ...selection, ...listing, title: 'cheap drill', rules: { banned_words: [] } }),
    )
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      violations: [expect.objectContaining({ field: 'title' })],
    })
  })
  it('rejects missing or non-string listing fields', async () => {
    expect((await approve(request(selection))).status).toBe(400)
    expect((await approve(request({ ...selection, title: 17, description: 'text' }))).status).toBe(
      400,
    )
  })
  it('approves the exact validated snapshot with its item and marketplace', async () => {
    const response = await approve(request({ ...selection, ...listing }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ...selection, ...listing })
  })
  it.each([
    { title: 'a'.repeat(81), description: 'Drill' },
    { title: 'Drill', description: 'a'.repeat(1001) },
    { title: 'Drill', description: '<b>Drill</b>' },
  ])('rejects approval with invalid lengths or HTML', async (draft) => {
    expect((await approve(request({ ...selection, ...draft }))).status).toBe(422)
  })
  it('rejects missing condition in eBay approval', async () => {
    expect(
      (await approve(request({ ...selection, ...listing, marketplaceId: 'ebay' }))).status,
    ).toBe(422)
    expect(
      (
        await approve(
          request({
            ...selection,
            ...listing,
            sku: 'B2S-10047',
            marketplaceId: 'ebay',
            title: 'Unknown new item',
          }),
        )
      ).status,
    ).toBe(422)
  })
})
