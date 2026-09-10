import type { InventoryItem } from '@/lib/listings'
import type { WorkspaceProps, WorkspaceState } from './use-inventory-workspace'
import MarketplaceSelect from './marketplace-select'
import WorkspaceHeading from './workspace-heading'

type QueueProps = WorkspaceProps & { state: WorkspaceState }

export function InventoryQueue({ inventory, marketplaces, state }: QueueProps) {
  return (
    <section className="card" aria-labelledby="inventory-heading">
      <div className="section-heading">
        <div>
          <WorkspaceHeading id="inventory-heading">Inventory</WorkspaceHeading>
          <p className="muted">Open an item to generate or continue a listing.</p>
        </div>
        <MarketplaceSelect marketplaces={marketplaces} state={state} />
      </div>
      <p className="queue-caption">
        Draft and approval statuses below are for <strong>{state.marketplace.name}</strong>.
      </p>
      <table className="queue-table">
        <caption className="sr-only">Inventory for {state.marketplace.name}</caption>
        <QueueHeader labels={['Item', 'Condition', 'Qty', 'Status', 'Action']} />
        <tbody>
          {inventory.map((entry) => (
            <InventoryRow key={entry.sku} item={entry} state={state} />
          ))}
        </tbody>
      </table>
    </section>
  )
}

function QueueHeader({ labels }: { labels: string[] }) {
  return (
    <thead>
      <tr>
        {labels.map((label) => (
          <th className="queue-column" scope="col" key={label}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function InventoryRow({ item, state }: { item: InventoryItem; state: WorkspaceState }) {
  const status = state.status(item)
  const action = status === 'Approved' || status === 'Blocked' ? 'View' : 'Open'
  return (
    <tr className="queue-row">
      <th className="queue-item" scope="row">
        <strong>{item.name}</strong>
        <span className="sku">{item.sku}</span>
      </th>
      <td data-label="Condition">{item.condition ?? 'Unknown'}</td>
      <td data-label="Qty">{item.quantity}</td>
      <td data-label="Status">
        <span className={`tag status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
      </td>
      <td>
        <button
          className="secondary"
          aria-label={`${action} ${item.sku}`}
          onClick={() => {
            state.openItem(item.sku)
          }}
        >
          {action}
        </button>
      </td>
    </tr>
  )
}

export function ApprovedQueue({ inventory, marketplaces, state }: QueueProps) {
  return (
    <section className="card" aria-labelledby="approved-heading">
      <WorkspaceHeading id="approved-heading">Approved listings</WorkspaceHeading>
      <p className="muted">
        Saved in this session only. Open a listing to review its full text or make changes.
      </p>
      {state.approvedEntries.length === 0 ? (
        <div className="empty">
          <p>
            No approved listings yet. Choose an item, generate a draft, and approve it after review.
          </p>
          <button
            className="primary"
            onClick={() => {
              state.setView('inventory')
            }}
          >
            Go to inventory
          </button>
        </div>
      ) : (
        <table className="queue-table approved-table">
          <caption className="sr-only">Approved snapshots across all marketplaces</caption>
          <QueueHeader labels={['Item', 'Marketplace', 'Approved title', 'Action']} />
          <tbody>
            {state.approvedEntries.map((listing) => (
              <tr className="queue-row" key={`${listing.sku}:${listing.marketplaceId}`}>
                <th className="queue-item" scope="row">
                  {inventory.find((entry) => entry.sku === listing.sku)?.name}
                  <span className="sku">{listing.sku}</span>
                </th>
                <td data-label="Marketplace">
                  {marketplaces.find((entry) => entry.id === listing.marketplaceId)?.name}
                </td>
                <td data-label="Title">{listing.title}</td>
                <td>
                  <button
                    className="secondary"
                    aria-label={`View ${listing.sku} on ${listing.marketplaceId}`}
                    onClick={() => {
                      state.openItem(listing.sku, listing.marketplaceId)
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
