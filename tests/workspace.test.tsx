// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import InventoryWorkspace from '../src/components/inventory-workspace'
import { inventory, marketplaces } from '../src/lib/listings'
import { POST as approve } from '../src/app/api/listings/approve/route'

const listing = { title: 'Bosch drill', description: '18V, battery not included.' }
function setup(
  generate: () => Promise<Response> = () =>
    Promise.resolve(Response.json({ listing, violations: [] })),
) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) =>
    url.endsWith('approve') ? approve(new Request('http://localhost' + url, init)) : generate(),
  )
  render(<InventoryWorkspace inventory={inventory} marketplaces={marketplaces} />)
  return userEvent.setup()
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('shows every inventory item and all marketplace choices', () => {
  setup()
  expect(screen.queryAllByRole('button', { name: /B2S-/ })).toHaveLength(14)
  expect(screen.queryAllByRole('option')).toHaveLength(3)
  expect(screen.queryByRole('button', { name: 'Generate listing' })).toBeNull()
  expect(screen.getAllByRole('row')).toHaveLength(15)
})

it('validates edits immediately, approves through the server, and requires reapproval after editing', async () => {
  const user = setup()
  await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
  await user.click(screen.getByRole('button', { name: 'Generate listing' }))
  const title = await screen.findByRole('textbox', { name: 'Title' })
  fireEvent.change(title, { target: { value: 'cheap drill' } })
  expect(screen.getByText(/Remove banned term/).textContent).toContain('cheap')
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Approve listing' }).disabled).toBe(
    true,
  )
  fireEvent.change(title, { target: { value: 'Edited Bosch drill' } })
  await user.click(screen.getByRole('button', { name: 'Approve listing' }))
  expect(await screen.findByText('Listing approved for DBA')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'View approved listings' }))
  const approved = screen.getByRole('region', { name: 'Approved listings' })
  expect(await within(approved).findByText('Edited Bosch drill')).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull()
  await user.click(within(approved).getByRole('button', { name: /View.*B2S-10041/ }))
  expect(screen.getByText(listing.description)).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Edit listing' }))
  expect(screen.queryByRole('region', { name: 'Approved listings' })).toBeNull()
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Title' }).value).toBe(
    'Edited Bosch drill',
  )
})

it('preserves separate drafts when switching item or marketplace', async () => {
  const user = setup()
  await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
  await user.click(screen.getByRole('button', { name: 'Generate listing' }))
  await screen.findByRole('textbox', { name: 'Title' })
  await user.selectOptions(screen.getByLabelText('Target marketplace'), 'ebay')
  expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Generate listing' }))
  expect(await screen.findByText(/Include the full condition/)).toBeTruthy()
  await user.selectOptions(screen.getByLabelText('Target marketplace'), 'dba')
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Title' }).value).toBe('Bosch drill')
  await user.click(screen.getByRole('button', { name: 'Next item' }))
  expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull()
})

it('shows generating state and ignores a late response after selection changes', async () => {
  let finish!: (response: Response) => void
  const user = setup(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
  await user.click(screen.getByRole('button', { name: 'Generate listing' }))
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Generating…' }).disabled).toBe(true)
  await user.click(screen.getByRole('button', { name: 'Next item' }))
  await act(async () => {
    finish(Response.json({ listing, violations: [] }))
    await Promise.resolve()
  })
  expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Previous item' }))
  expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull()
})

it.each([
  [502, 'json', 'Provider unavailable. Try again.'],
  [502, '<html>Bad gateway</html>', 'Request failed. Try again.'],
  [502, '', 'Request failed. Try again.'],
  [200, '<html>Unexpected response</html>', 'The server returned an invalid listing. Try again.'],
] as const)(
  'keeps edits and allows retry after a %s response with body %s',
  async (status, body, message) => {
    let attempt = 0
    const user = setup(() =>
      Promise.resolve(
        ++attempt === 2
          ? body === 'json'
            ? Response.json({ error: message }, { status })
            : new Response(body, { status })
          : Response.json({ listing, violations: [] }),
      ),
    )
    await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
    await user.click(screen.getByRole('button', { name: 'Generate listing' }))
    const title = await screen.findByRole<HTMLInputElement>('textbox', { name: 'Title' })
    fireEvent.change(title, { target: { value: 'My edited drill' } })
    await user.click(screen.getByRole('button', { name: 'Regenerate' }))
    expect((await screen.findByRole('alert')).textContent).toContain(message)
    expect(title.value).toBe('My edited drill')
    await user.click(screen.getByRole('button', { name: 'Regenerate' }))
    await waitFor(() => {
      expect(title.value).toBe('Bosch drill')
    })
  },
)

it('rejects malformed responses without creating a draft', async () => {
  const user = setup(() => Promise.resolve(Response.json({ listing: { title: 7 } })))
  await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
  await user.click(screen.getByRole('button', { name: 'Generate listing' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull()
})

it('blocks the do-not-list item with its source reason', async () => {
  const user = setup()
  await user.click(screen.getByRole('button', { name: /B2S-10052/ }))
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Generate listing' }).disabled).toBe(
    true,
  )
  expect(screen.getByText(/This item is marked do not list/).textContent).toContain('Water damage')
})

it('shows optional rule violations while editing the description', async () => {
  const user = setup()
  await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
  await user.click(screen.getByRole('button', { name: 'Generate listing' }))
  const description = await screen.findByRole('textbox', { name: 'Description' })
  fireEvent.change(description, { target: { value: '<b>Drill</b>' } })
  expect(screen.queryByText(/HTML is not allowed/)).not.toBeNull()
  fireEvent.change(description, { target: { value: 'a'.repeat(1001) } })
  expect(screen.queryByText(/Description exceeds 1000/)).not.toBeNull()
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Approve listing' }).disabled).toBe(
    true,
  )
})

it('shows marketplace-specific queue progress and restores drafts from the queue', async () => {
  const user = setup()
  await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
  await user.click(screen.getByRole('button', { name: 'Generate listing' }))
  const title = await screen.findByRole('textbox', { name: 'Title' })
  fireEvent.change(title, { target: { value: 'My draft' } })
  await user.click(screen.getByRole('button', { name: 'Back to inventory' }))
  const row = screen.getByRole('row', { name: /B2S-10041/ })
  expect(within(row).getByText('Draft')).toBeTruthy()
  await user.selectOptions(screen.getByLabelText('Target marketplace'), 'ebay')
  expect(within(row).getByText('Not started')).toBeTruthy()
  await user.selectOptions(screen.getByLabelText('Target marketplace'), 'dba')
  await user.click(within(row).getByRole('button'))
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Title' }).value).toBe('My draft')
})

it('keeps marketplace selection and respects item navigation boundaries', async () => {
  const user = setup()
  await user.selectOptions(screen.getByLabelText('Target marketplace'), 'ebay')
  await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Previous item' }).disabled).toBe(
    true,
  )
  await user.click(screen.getByRole('button', { name: 'Next item' }))
  expect(screen.getByRole('heading', { name: inventory[1].name })).toBeTruthy()
  expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe('ebay')
  await user.click(screen.getByRole('button', { name: 'Back to inventory' }))
  await user.click(screen.getByRole('button', { name: /B2S-10054/ }))
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next item' }).disabled).toBe(true)
})

it('shows supplier notes beside the editor and a complete rule checklist', async () => {
  const user = setup()
  await user.click(screen.getByRole('button', { name: /B2S-10041/ }))
  const source = screen.getByRole('region', { name: 'Source information' })
  expect(within(source).getByText('Retail box slightly scuffed on 3 of 12 units')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Generate listing' }))
  await screen.findByRole('textbox', { name: 'Title' })
  const checks = screen.getByRole('list', { name: 'Marketplace rule checks' })
  expect(within(checks).getAllByRole('listitem')).toHaveLength(5)
  fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
    target: { value: 'a'.repeat(81) },
  })
  expect(within(checks).getByText(/Fix.*Title length/)).toBeTruthy()
})
