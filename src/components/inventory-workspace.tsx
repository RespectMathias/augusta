'use client'

import {
  useInventoryWorkspace,
  type WorkspaceProps,
  type WorkspaceState,
} from './use-inventory-workspace'
import { InventoryQueue, ApprovedQueue } from './workspace-queues'
import ItemWorkspace from './item-workspace'

export default function InventoryWorkspace(props: WorkspaceProps) {
  const state = useInventoryWorkspace(props)
  return (
    <main className="workspace">
      <header className="page-header">
        <h1>Inventory workspace</h1>
      </header>
      <WorkspaceNavigation state={state} inventoryCount={props.inventory.length} />
      {state.view === 'inventory' && <InventoryQueue {...props} state={state} />}
      {state.view === 'approved' && <ApprovedQueue {...props} state={state} />}
      {state.view === 'item' && <ItemWorkspace {...props} state={state} />}
    </main>
  )
}

function WorkspaceNavigation({
  state,
  inventoryCount,
}: {
  state: WorkspaceState
  inventoryCount: number
}) {
  return (
    <nav className="card workspace-nav" aria-label="Workspace views">
      <div className="view-buttons">
        <button
          aria-current={state.view !== 'approved' ? 'page' : undefined}
          onClick={() => {
            state.setView('inventory')
          }}
        >
          Inventory <span className="tag">{inventoryCount}</span>
        </button>
        <button
          aria-current={state.view === 'approved' ? 'page' : undefined}
          onClick={() => {
            state.setView('approved')
          }}
        >
          Approved <span className="tag">{state.approvedEntries.length}</span>
        </button>
      </div>
      <p className="muted">Session only · Nothing is published</p>
    </nav>
  )
}
