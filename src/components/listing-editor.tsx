'use client'

import { type Listing, type Violation } from '@/lib/listings'
import { useListingRequest, type EditorProps } from './use-listing-request'
import { GenerationRules, RuleChecks } from './listing-rules'

export default function ListingEditor(props: EditorProps) {
  const { item, marketplace, draft, onChange } = props
  const request = useListingRequest(props)
  return (
    <section
      className="editor-shell"
      aria-labelledby="editor-heading"
      aria-busy={request.busy !== null}
    >
      <div className="card editor-card">
        <span className="step" aria-hidden="true">
          2
        </span>
        <div className="section-heading">
          <h2 id="editor-heading">
            {draft ? 'Review and edit' : `Create a listing for ${marketplace.name}`}
          </h2>
          <span className="tag">{marketplace.name}</span>
        </div>
        {request.itemErrors.map((entry) => (
          <p className="error" key={entry.message}>
            {entry.message}
          </p>
        ))}
        {draft ? (
          <div className="listing-fields">
            {(['title', 'description'] as const).map((field) => (
              <ListingField
                key={field}
                field={field}
                draft={draft}
                busy={request.busy !== null}
                limit={
                  field === 'title'
                    ? marketplace.title_max_chars
                    : marketplace.description_max_chars
                }
                errors={request.violations.filter((entry) => entry.field === field)}
                onChange={(listing) => {
                  onChange(listing)
                  request.setError(null)
                }}
              />
            ))}
            <RuleChecks marketplace={marketplace} violations={request.violations} />
          </div>
        ) : (
          <GenerationRules item={item} marketplace={marketplace} />
        )}
        {request.error && (
          <p role="alert" className="error">
            {request.error}
            {draft ? ' Your previous draft is still available.' : ''}
          </p>
        )}
      </div>
      <EditorActions request={request} draft={draft} marketplaceName={marketplace.name} />
    </section>
  )
}

function ListingField({
  field,
  draft,
  busy,
  limit,
  errors,
  onChange,
}: {
  field: keyof Listing
  draft: Listing
  busy: boolean
  limit: number
  errors: Violation[]
  onChange: (listing: Listing) => void
}) {
  const fieldProps = {
    id: field,
    value: draft[field],
    disabled: busy,
    'aria-invalid': errors.length > 0,
    'aria-describedby': `${field}-feedback`,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ ...draft, [field]: event.target.value })
    },
  }
  return (
    <div>
      <div className="field-heading">
        <label htmlFor={field}>{field === 'title' ? 'Title' : 'Description'}</label>
        <span className="muted">
          {Array.from(draft[field]).length} / {limit} chars
        </span>
      </div>
      {field === 'title' ? <input {...fieldProps} /> : <textarea {...fieldProps} rows={8} />}
      <div id={`${field}-feedback`} aria-live="polite">
        {errors.map((entry) => (
          <p className="error" key={entry.message}>
            {entry.message}
          </p>
        ))}
      </div>
    </div>
  )
}

function actionStatus(
  busy: ReturnType<typeof useListingRequest>['busy'],
  draft: Listing | undefined,
  count: number,
  name: string,
) {
  if (busy === 'generate') return `Generating a draft for ${name}…`
  if (!draft) return 'Generate, review, then approve.'
  if (count) return `${String(count)} issue${count === 1 ? '' : 's'} to fix before approval.`
  return 'All checks passed. Review the product facts before approval.'
}

function EditorActions({
  request,
  draft,
  marketplaceName,
}: {
  request: ReturnType<typeof useListingRequest>
  draft?: Listing
  marketplaceName: string
}) {
  const { busy, violations, canGenerate, canApprove, submit } = request
  return (
    <div className="card action-card">
      <p className={draft && violations.length ? 'error' : 'muted'} role="status">
        {actionStatus(busy, draft, violations.length, marketplaceName)}
      </p>
      <div className="actions">
        <button
          className={draft ? 'secondary' : 'primary'}
          disabled={!canGenerate}
          onClick={() => void submit('generate')}
        >
          {busy === 'generate' ? 'Generating…' : draft ? 'Regenerate' : 'Generate listing'}
        </button>
        {draft && (
          <button className="primary" disabled={!canApprove} onClick={() => void submit('approve')}>
            {busy === 'approve' ? 'Approving…' : 'Approve listing'}
          </button>
        )}
      </div>
    </div>
  )
}
