import type { InventoryItem, Marketplace, Violation } from '@/lib/listings'

export function GenerationRules({
  item,
  marketplace,
}: {
  item: InventoryItem
  marketplace: Marketplace
}) {
  const rules = [
    ['Title limit', `${String(marketplace.title_max_chars)} characters`],
    ['Description limit', `${String(marketplace.description_max_chars)} characters`],
    [
      'Condition in title',
      marketplace.require_condition_in_title
        ? (item.condition ?? 'Missing in source data')
        : 'Optional',
    ],
    ['Banned terms', marketplace.banned_words.join(', ')],
    ['HTML', marketplace.allow_html ? 'Permitted, displayed as text' : 'Not allowed'],
  ]
  return (
    <>
      {marketplace.require_condition_in_title && !item.condition && (
        <p className="error">
          This marketplace requires a condition, but this item&apos;s condition is missing. Approval
          will be blocked.
        </p>
      )}
      <div className="empty">
        <p>Generate a draft using the source information, then review it before approval.</p>
        <dl className="generation-rules">
          {rules.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

export function RuleChecks({
  marketplace,
  violations,
}: {
  marketplace: Marketplace
  violations: Violation[]
}) {
  const rules = [
    ['title_max_chars', 'Title length'],
    ['banned_words', 'No banned terms'],
    ['require_condition_in_title', 'Full condition in title'],
    ['description_max_chars', 'Description length'],
    ['allow_html', 'HTML policy'],
  ] as const
  return (
    <div className="rule-checks">
      <h3>Rule checks</h3>
      <ul aria-label="Marketplace rule checks">
        {rules.map(([rule, label]) => {
          const failed = violations.some((entry) => entry.rule === rule)
          return (
            <li key={rule} className={failed ? 'error' : 'success'}>
              {failed ? 'Fix' : 'OK'} · {label}
              {rule === 'require_condition_in_title' && !marketplace.require_condition_in_title
                ? ' · Optional'
                : ''}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
