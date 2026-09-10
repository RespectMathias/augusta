import type { Listing } from '@/lib/listings'
import type { WorkspaceProps, WorkspaceState } from './use-inventory-workspace'
import MarketplaceSelect from './marketplace-select'
import ListingEditor from './listing-editor'
import SourceInformation from './source-information'
import WorkspaceHeading from './workspace-heading'

export default function ItemWorkspace({
  inventory,
  marketplaces,
  state,
}: WorkspaceProps & { state: WorkspaceState }) {
  const { item, marketplace, snapshot } = state
  return (
    <>
      <ItemNavigation inventory={inventory} state={state} />
      <section className="card item-heading" aria-labelledby="item-heading">
        <div>
          <WorkspaceHeading id="item-heading" key={item.sku}>
            {item.name}
          </WorkspaceHeading>
          <p className="muted">
            <span className="sku">{item.sku}</span> · {item.condition ?? 'Condition unknown'} ·{' '}
            {item.quantity} in stock
          </p>
        </div>
        <div className="item-destination">
          <MarketplaceSelect marketplaces={marketplaces} state={state} />
          <span className="tag">{state.status(item)}</span>
        </div>
      </section>
      <div className="item-workspace">
        <SourceInformation key={item.sku} item={item} />
        {snapshot ? (
          <ApprovedSnapshot
            snapshot={snapshot}
            marketplaceName={marketplace.name}
            onEdit={state.editSnapshot}
            onView={() => {
              state.setView('approved')
            }}
          />
        ) : (
          <ListingEditor
            key={state.key}
            item={item}
            marketplace={marketplace}
            draft={state.draft}
            onChange={state.changeDraft}
            onApprove={state.approve}
          />
        )}
      </div>
    </>
  )
}

function ItemNavigation({
  inventory,
  state,
}: Pick<WorkspaceProps, 'inventory'> & { state: WorkspaceState }) {
  return (
    <div className="card item-navigation">
      <button
        className="secondary"
        onClick={() => {
          state.setView('inventory')
        }}
      >
        Back to inventory
      </button>
      <span className="muted">
        Item {state.itemIndex + 1} of {inventory.length}
      </span>
      <div className="navigation-actions">
        <button
          className="secondary"
          disabled={state.itemIndex === 0}
          onClick={() => {
            state.openItem(inventory[state.itemIndex - 1].sku)
          }}
        >
          Previous item
        </button>
        <button
          className="secondary"
          disabled={state.itemIndex === inventory.length - 1}
          onClick={() => {
            state.openItem(inventory[state.itemIndex + 1].sku)
          }}
        >
          Next item
        </button>
      </div>
    </div>
  )
}

function ApprovedSnapshot({
  snapshot,
  marketplaceName,
  onEdit,
  onView,
}: {
  snapshot: Listing
  marketplaceName: string
  onEdit: () => void
  onView: () => void
}) {
  return (
    <section className="card snapshot" aria-labelledby="snapshot-heading">
      <span className="step" aria-hidden="true">
        ✓
      </span>
      <h2 id="snapshot-heading">Approved listing</h2>
      <p className="success" role="status">
        Listing approved for {marketplaceName}
      </p>
      <label>Title</label>
      <h3>{snapshot.title}</h3>
      <label>Description</label>
      <p className="listing-copy">{snapshot.description}</p>
      <p className="muted">Editing moves this listing back to draft and requires approval again.</p>
      <div className="actions">
        <button className="secondary" onClick={onEdit}>
          Edit listing
        </button>
        <button className="primary" onClick={onView}>
          View approved listings
        </button>
      </div>
    </section>
  )
}
