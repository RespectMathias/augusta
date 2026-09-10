import type { InventoryItem } from '@/lib/listings'

export default function SourceInformation({ item }: { item: InventoryItem }) {
  return (
    <section className="card source-card" aria-labelledby="source-heading">
      <span className="step" aria-hidden="true">
        1
      </span>
      <h2 id="source-heading">Source information</h2>
      <p className="muted">Use these facts to check the generated listing.</p>
      <dl className="source-condition">
        <dt>Condition</dt>
        <dd>{item.condition ?? 'Unknown'}</dd>
      </dl>
      <details className="source-facts" open>
        <summary>Specifications</summary>
        <dl>
          <div>
            <dt>Brand</dt>
            <dd>{item.brand ?? 'Unknown'}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{item.category ?? 'Unknown'}</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{item.weight_kg === null ? 'Unknown' : `${String(item.weight_kg)} kg`}</dd>
          </div>
          <div>
            <dt>Dimensions</dt>
            <dd>{item.dimensions_cm ? `${item.dimensions_cm} cm` : 'Unknown'}</dd>
          </div>
          {Object.entries(item.attributes).map(([name, value]) => (
            <div key={name}>
              <dt>{name.replaceAll('_', ' ')}</dt>
              <dd>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</dd>
            </div>
          ))}
        </dl>
      </details>
      <div className="supplier-notes">
        <h3>Supplier notes</h3>
        <p>{item.notes ?? 'No supplier notes.'}</p>
      </div>
    </section>
  )
}
