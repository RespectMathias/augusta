<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` / `build` / `start` - Next.js.
- `npm run lint` - `eslint .`
- `npm run typecheck` - `tsc --noEmit`
- `npm run test` - `vitest run`
- `npm run format` / `format:check` - prettier write/check.
- `npm run check` - fast local gate: format:check + lint + typecheck + test (no build).
- `npm run fallow` - `fallow audit` (dead code, duplication, complexity).
