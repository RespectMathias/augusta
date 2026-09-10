import type { WorkspaceProps, WorkspaceState } from './use-inventory-workspace'

export default function MarketplaceSelect({
  marketplaces,
  state,
}: Pick<WorkspaceProps, 'marketplaces'> & {
  state: Pick<WorkspaceState, 'marketplaceId' | 'setMarketplaceId'>
}) {
  return (
    <div className="marketplace-select">
      <label htmlFor="marketplace">Target marketplace</label>
      <select
        id="marketplace"
        value={state.marketplaceId}
        onChange={(event) => {
          state.setMarketplaceId(event.target.value)
        }}
      >
        {marketplaces.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </select>
    </div>
  )
}
