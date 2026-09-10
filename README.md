# Augusta

A Next.js tool for turning the 14 supplied inventory items into marketplace listings. Pick an item and a marketplace, generate a draft, edit it, and approve it once it passes the rules.

## How to run it

Use Node.js 22 or newer and pnpm. The repo pins pnpm in `package.json`.

1. Run `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Set your provider, API key, and model. The configuration I used for the live check was Google AI Studio with `gemini-3.6-flash`:

   ```env
   AI_PROVIDER=google
   AI_API_KEY=your_google_ai_studio_key
   AI_MODEL=gemini-3.6-flash
   ```

4. Run `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

Keep your key in `.env.local`, which Git ignores. Restart the server after changing the configuration. Generation needs a working provider key; there is no canned-response fallback in the app.

### Other providers

Every adapter reads the same `AI_API_KEY` variable. Set it to the selected provider's own key. Direct provider calls use the Vercel AI SDK and do not require a Vercel account.

| `AI_PROVIDER`           | Key and model                                | `AI_BASE_URL`                                    |
| ----------------------- | -------------------------------------------- | ------------------------------------------------ |
| `google`                | Google AI Studio key and Gemini model ID     | Leave empty                                      |
| `anthropic` or `claude` | Anthropic key and Claude model ID            | Leave empty                                      |
| `openai`                | OpenAI key and model ID                      | Leave empty                                      |
| `zai` or `z.ai`         | Z.ai key and GLM model ID                    | Defaults to `https://api.z.ai/api/paas/v4`       |
| `compatible`            | The service's key and model ID               | Required, use its OpenAI-compatible API base URL |
| `gateway`               | Vercel Gateway key and a `provider/model` ID | Leave empty                                      |

Choose a model available to your account. For compatible services, supply the base URL without `/chat/completions`; the SDK adds that path. Z.ai Coding Plan credentials need the dedicated endpoint for that plan, set through `AI_BASE_URL`.

Google, Anthropic, and OpenAI use their native SDK adapters. Z.ai and compatible services use the OpenAI-compatible adapter in JSON mode. Other proprietary APIs need a matching adapter. A Google key cannot authenticate to Vercel Gateway.

## How I spent the time

I worked through the assignment in this order:

1. Read the brief and supplied data, then recorded the requirements in [`docs/requirements.csv`](docs/requirements.csv).
2. Set up Next.js and an implementation branch. I used [`DESIGN.md`](DESIGN.md) as a visual starting point and asked the agent for a component diagram and an ASCII user journey.
3. Used the grill skill to challenge the plan before implementation. I then had the agent implement the flow with red-green TDD.
4. Worked through the generated result with corrective prompts. The main corrections were the inventory-to-editor journey and support for direct provider keys rather than only Vercel Gateway.
5. Verified generation with a real Google key. This exposed two configuration problems: the key was being sent to Gateway, and the initially selected Gemini model was unavailable to the account. Switching to the Google adapter and the model recommended by Google's error response fixed generation.
6. Ran the checks, used Fallow to find complexity problems, refactored those areas, and requested an independent code review. I also looked through the diff and wrote this README.

The agent produced the initial implementation in one run, but that was not the end of the work. The follow-up checks and corrections mattered, especially around provider configuration and the user flow. I documented while the agent was running because my $20 plan limited how much work I could run concurrently.

### AI tools I used

- OpenCode 2 beta with ChatGPT Astra Medium.
- The grill and TDD skills for planning and implementation.
- The frontend skill and `DESIGN.md` for the layout.
- The Chrome DevTools skill for browser checks.
- My code-review skill, based on a Qwen review workflow, for an independent review.
- The unslop skill to edit this README from my notes and the implementation results.

For a larger project, I would turn the work into GitHub issues and smaller feature branches. Here, I kept most of it in one implementation branch and committed less often than I normally would.

## What works, what I didn't finish, and what I'd do next

The required flow is implemented. The app loads the supplied JSON, lets the user select a marketplace, and generates a title and description through a Next.js API route. Editing shows violations immediately. Approval checks the listing again on the server against the source data and marketplace rules.

Both optional rules, `description_max_chars` and `allow_html`, are implemented alongside the three required rules. Batch generation is not implemented.

Each item-marketplace pair has its own draft. Approval creates a read-only snapshot, and the Approved view lists those snapshots across marketplaces. Editing an approved listing removes its approval until it passes review again. Refreshing clears all drafts and approvals. Nothing is published to a marketplace.

The app handles loading, failed requests, malformed model responses, and rule-breaking drafts. It gives separate messages for provider authentication, unavailable models, and quota failures. Only Google was checked with live credentials; the other adapters were checked with mocked HTTP responses.

My next step would be to watch someone process several awkward items, especially missing conditions, mixed-condition stock, and supplier notes about defects. Passing the rule checks does not prove the generated copy is factually correct. The source information stays beside the editor so the reviewer can compare it before approval.

After that, I would add batch generation with per-item progress and retry handling. I left authentication, persistence, real marketplace publishing, Docker, deployment, and CI out of this assignment as requested. Those would need separate requirements before this became an internal production tool.

## Where I cut a corner on purpose

I reused a design system from [designmd.ai](https://designmd.ai/LinuxsWar/deck-card-presentation) instead of doing a separate visual design exercise. I also asked the agent to sketch the user journey in ASCII rather than making a Figma prototype. That gave it a concrete flow to implement with little setup, but it does not replace user testing.

I kept state in the browser and loaded the two JSON files directly. That fits the supplied dataset and avoids database work, but closing or refreshing the page loses the session.

The prompt asks the model to preserve defects and missing accessories, but I did not build an automated fact-checker. Approval relies on the reviewer checking the copy against the source facts as well as fixing rule violations.

I also bundled too much work between commits. Smaller commits would make it easier to review the changes or back out one decision.

## One change needed for tens of thousands of items

I would replace the full client-side inventory list with a searchable, paginated server API backed by a database such as PostgreSQL. The current app sends the inventory to the browser and renders every row. That is fine for 14 items; tens of thousands would make both the payload and the page unnecessarily large.

The browser should request one page at a time, with search and marketplace-status filters applied on the server. This is the first scaling change I would make before adding caches or load balancers.

## Assumptions and scope decisions

- Approval means saving a reviewed snapshot in the current session, not publishing it externally.
- Banned terms match whole words and phrases, case-insensitively, in both fields. Matching normalizes whitespace and treats punctuation in a configured term literally.
- A required condition means the full source condition must appear in the title. If the condition is missing, the user can generate and edit a draft, but cannot approve it for that marketplace.
- An item marked `do not list` stays visible, but generation and approval are blocked.
- Listings are in English. The model is asked for plain text even when a marketplace permits HTML. User-entered HTML is displayed as text rather than rendered.
- A structurally valid response that breaks marketplace rules stays editable. A malformed response is a generation failure. Regeneration failures preserve the previous draft.
- I interpreted permission to use libraries as allowing the Vercel AI SDK for real provider calls. The API route validates the returned title and description with Zod rather than trusting the requested output shape.

The brief explicitly put tests out of scope. I chose TDD anyway because it is how I work with an agent and I expected it to reduce correction time. That was a deliberate deviation from the instruction, not an unclear requirement. I also used a supplied design guide to reach a tidy layout rather than planning a separate polish phase.

## Verification and how I'd test it

```sh
pnpm check
pnpm fallow
pnpm build
```

`pnpm check` runs formatting, ESLint, TypeScript, and Vitest. All tests live in `tests/`. At the last check, all 59 tests passed, Fallow reported no issues, and the production build passed. The independent code review found no actionable issues.

The automated tests cover validation boundaries, malformed API requests and model output, provider errors, editing, approval, separate drafts, navigation, and stale responses after switching items. Provider calls use mocks, so the tests do not need API credits. I also checked the real Google flow in the browser through generation, approval, and the Approved view.

For further testing, I would:

- Compare generated claims with the supplied facts across all 14 items and all three marketplaces, with particular attention to defects and missing accessories.
- Test slow requests, timeouts, rapid navigation, and repeated clicks in the browser. Confirm that an old response cannot overwrite another item's draft.
- Check the editing and approval journey with keyboard navigation and a screen reader, as well as on a narrow mobile viewport.
- Run a small live check for each provider we actually plan to support. Mocked responses prove request handling, not account access or model compatibility.
- Use mutation testing to check whether the rule tests catch a removed or weakened validation branch.
