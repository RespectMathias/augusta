# Augusta

## How to run it

1. Run `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `AI_API_KEY` to your provider's API key.
4. Set `AI_PROVIDER` and `AI_MODEL`.
5. Run `pnpm dev`.

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How you spent the time

Quick skim through the assignment, as I had already read it earlier.
Decided to use red-green TDD even though tests were listed as out of scope.
Initialized the project using the pnpm Next.js command and pushed the initial setup to GitHub.
Roughly followed the software development lifecycle:

1. Requirements: Extracted the requirements from the assignment document and put them in docs/requirements.csv. Determined the tech stack required for the assignment.
2. Design: Had the model make a quick component diagram. Found a design system to use with DESIGN.md.
3. Implementation:

- Created a separate branch for the implementation.
- Wrote an implementation prompt based on the assignment.
- Used the grill skill to have the model grill me while in plan mode.
- Then let the model implement the system using TDD.
- Used prompts to verify how things work.
- Astra finished the initial implementation in one run. It needed corrective prompts for the user flow and to allow API keys beyond Vercel Gateway.
- Audited with Fallow and requested a code review.
- Opened a PR, looked through the diff myself, and let GitHub Copilot and CodeRabbit review it.

## What you didn't finish, and what you'd do next

Using an AI agent, I was able to finish the required task within the given time.
Batch generation is skipped as an optional feature.
What I would do next would be the things listed as out of scope, along with further testing:

- A persistent database, probably PostgreSQL.
- Dockerization.
- CI to run tests and publish builds.
- Actual user testing.
- Design work in Figma instead of having the model generate the layout from DESIGN.md, and some A/B testing.
- Mutation testing.
- Authentication.
- per-item progress and retries

## Where you cut a corner on purpose, and why

The shortcut I used to skip a separate design phase was DESIGN.md, from [designmd.ai](https://designmd.ai/LinuxsWar/deck-card-presentation). It contains a design system, so I didn't have to determine it myself.

Another shortcut is to instruct the model to design a user-friendly journey using ASCII instead of developing it myself. That gives it more direction than leaving the journey unspecified.

I also didn't commit frequently enough.

## One thing that would have to change before this could run over tens of thousands of items rather than 14

A real database, probably PostgreSQL.

Other production work I would consider:

- Caching with Redis.
- Load balancing with nginx or Traefik.
- Authentication.
- Deployment through Docker and CI.
- Hosting.
- server-side search and pagination

## Any assumptions you made where the brief was unclear

- I assumed the exclusion of polished visual design still allowed a quick DESIGN.md for the model to base its design on.
- When a real provider was mentioned, I assumed it was okay to use an SDK that supports multiple providers instead of making my own ad hoc implementation for each one.
- I interpreted the exclusion of tests as mainly due to the time constraint. I chose TDD because I expected verification to save time when working with an agent, even though the brief explicitly listed tests as out of scope.

My $20 plan limits how much I can run concurrently, so I was documenting in the meantime.

## Tech stack

- Next.js and TypeScript.
- Vercel AI SDK.
- Zod.
- Vitest.
- ESLint and Prettier.
- Fallow.

## AI tools used

- OpenCode 2, a beta version I was trying out.
- ChatGPT Astra Medium, $20 plan.
- The grill skill.
- Obara Superpowers TDD skill.
- Chrome DevTools skill, which lets the model interact with the browser and read console errors.
- Claude frontend skill.
- My code-review skill, based on Qwen code review.
- The unslop skill for README editing.

I used my AI tools the way I would for a small greenfield project. I used research, planning, and implementation, followed by verification. For bigger projects, I would use GitHub flow with feature branches instead of putting it all on a dev branch. I would write issues on GitHub and use those as context for the agent.

## AI-generated description and additions

The following implementation details, decisions, and testing suggestions are written by the agent.

### Application workflow

```text
Inventory queue -> Open item -> Generate -> Review and edit -> Approve
      ^                            |              |              |
      |                            +-- Retry      +-- Fix rules  v
      +---------- Next item <-------------------------- Approved snapshot
                                                               |
                                       Approved view <---------+
                                            |
                                            +-- Edit -> Draft -> Reapprove
```

Each item-marketplace pair keeps its own draft. Source facts and supplier notes appear beside the editor. Approval creates a read-only snapshot; editing it removes approval until reapproved. Refreshing clears drafts and approvals. Nothing is published to a marketplace.

All five marketplace rules are implemented, including the optional description length and HTML restrictions. Batch generation is not implemented.

### Implementation decisions made by the agent

- Banned terms match whole words and phrases, case-insensitively, with whitespace normalization.
- A required condition means the full source condition must appear in the title. Missing conditions block approval for that marketplace.
- Items marked `do not list` remain visible but block generation and approval.
- Structurally valid drafts that break rules remain editable. Malformed model output is a generation failure, and failed regeneration preserves the previous draft.
- Generation requests ask for English plain text. Permitted HTML entered by the user is displayed as text rather than rendered.

### Provider configuration

All generation uses the Vercel AI SDK through the Next.js API route. The agent verified live generation with Google AI Studio:

```env
AI_PROVIDER=google
AI_API_KEY=your_google_ai_studio_key
AI_MODEL=gemini-3.6-flash
```

Native adapters support `google`, `anthropic` or `claude`, and `openai`. Use the provider's own key and an available model ID. Keep credentials in the ignored `.env.local` file and restart the server after changing configuration.

For Z.ai and other OpenAI-compatible services, use `AI_PROVIDER=compatible` and set `AI_BASE_URL` to the service's API base URL without `/chat/completions`. Z.ai's standard endpoint is `https://api.z.ai/api/paas/v4`; Coding Plan credentials use a separate endpoint.

For Gateway, set `AI_PROVIDER=gateway`, use a Vercel Gateway key in `AI_API_KEY`, and specify a `provider/model` ID in `AI_MODEL`. Provider keys do not authenticate directly to Gateway.

### Verification and further testing

Run `pnpm check` for formatting, lint, TypeScript, and tests; `pnpm fallow` for auditing; and `pnpm build` for the production build.

At the last checks, all 75 tests in `tests/` passed, Fallow reported no issues, and the production build passed. The independent code review found no actionable issues. The agent checked the live Google flow through generation, approval, and the Approved view. Other provider tests use mocked HTTP responses.

Further tests suggested by the agent are to compare generated claims against source facts for all items and marketplaces, exercise slow requests and navigation during generation, and check keyboard and screen-reader use. Passing the marketplace rules does not prove that the copy is factually correct.
