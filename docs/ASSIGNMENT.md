# Buy2Sell, Technical Assignment

**Role:** AI Full Stack Developer
**Stack:** TypeScript + Next.js
**Time:** 3.5 hours, hard stop.

## Please read this first

**Stop at 3.5 hours.** Set a timer. When it goes off, write your README and
submit whatever you have.

We mean this literally. We are not looking for a finished product, we're
looking at the decisions you make when you can't do everything. Submitting an
unfinished app with a clear README explaining what you prioritised is a **good**
outcome and scores well. Spending eight hours to "finish" scores badly, because
ignoring an explicit constraint is the actual thing we're testing.

If you get stuck, move on and write about it. "I couldn't work out X, here's
what I tried" is a genuinely useful answer.

## Context

At Buy2Sell we take raw inventory data and publish it as listings on online
marketplaces. Writing listing copy by hand doesn't scale, so we want to generate
it, but every marketplace has different rules, and a bad listing is a real
problem: wrong specs mean returns, complaints, and sometimes a suspended account.

So the interesting part isn't generating text. It's making sure what gets
published is safe to publish.

Two files are included:

- `inventory.json`, 14 items from our warehouse, as the data actually looks
- `marketplaces.json`, three marketplaces, each with its own rules

## What to build

A Next.js app where someone on our team can turn inventory items into
marketplace listings.

### Required

1. **Show the inventory items** from `inventory.json`.

2. **Let the user pick a target marketplace** from `marketplaces.json`.

3. **Generate a listing**, a title and a description, for an item, for the
   selected marketplace. This must go through a **Next.js API route** you write.

4. **Enforce the marketplace's rules.** `marketplaces.json` defines five kinds
   of rule per marketplace. **Three of them are required:**

   - `title_max_chars`, the title length limit
   - `banned_words`, words that must not appear
   - `require_condition_in_title`, whether the item's condition must be in the
     title

   A listing that breaks any of those must not be publishable, and the user must
   be able to see clearly what's wrong.

   The remaining two, `description_max_chars` and `allow_html`, are optional.
   Handle them if you have time; otherwise say so in your README. Don't let them
   eat the time budget.

5. **Let the user edit** the title and description, and **regenerate** if they
   don't like the result. Rule violations should be visible while editing too,
   not only after generating.

6. **Let the user approve a listing**, which moves it to a list of approved
   listings. Approving something that breaks the marketplace's rules should not
   be possible.

7. **Handle the in-between states**: generating, and failed.

### Optional, only if you have time left

Don't start these until the required list is done. If you skip all of them,
that's completely fine, write about them in the README instead, which is worth
just as much to us.

- The two optional rules (`description_max_chars`, `allow_html`)
- Generate listings for several selected items in one go
- Anything else you think the tool obviously needs

## About the AI part

Generation should go through an LLM. **You do not need to pay for an API key.**

Pick whichever is easier:

- **A real provider**, any of them (OpenAI, Anthropic, Google, or a local model
  via Ollama). Read the key from an env var, don't commit it, and say in your
  README which one you used.
- **Stub it**, write the API route exactly as though it called a real model, but
  have the call return a canned response after a short delay. Structure it so
  swapping in a real client would be a small change.

Neither is penalised. We care much more about what happens when the model is
slow, unavailable, or returns something unexpected than about which provider you
chose.

One thing to keep in mind: a model returns text, and text can be malformed or
wrong. Your API route shouldn't assume the response has the shape you asked for.

## Out of scope

Please **don't** build these. They're not assessed and they'll eat your 3.5 hours:

- Authentication, users, or accounts
- A database or persistence, in-memory is fine, refreshing may lose everything
- Actually publishing to any real marketplace
- Deployment, Docker, or CI
- Tests, there isn't time. Tell us in the README how you'd test this instead.
- Polished visual design, tidy and usable is the bar, not beautiful
- Image handling, pricing logic, translation, or multiple languages

## Suggested pacing

Only a suggestion, ignore it if you work differently:

| | |
|---|---|
| ~20 min | Read the data files properly. Decide your types and your approach. |
| ~80 min | Inventory list, marketplace selection, the API route, generation working end to end. |
| ~50 min | The three required rules, editing, regenerating, approval. |
| ~20 min | Loading and error states, tidying up. |
| ~30 min | README. Don't skip this, leave the time for it. |

That adds up to 3 hours 20, deliberately. The last 10 minutes are slack, because
something always goes wrong.

## What to submit

A Git repo link (GitHub, GitLab, or a zip if you'd rather), with your code and a
**README** covering:

1. **How to run it**, including any env vars.
2. **How you spent the time**, roughly.
3. **What you didn't finish, and what you'd do next.** Be specific.
4. **Where you cut a corner on purpose**, and why. Naming a deliberate shortcut
   is a strong answer, not a weak one.
5. **One thing that would have to change** before this could run over our real
   inventory, tens of thousands of items rather than 14.
6. **Any assumptions you made** where the brief was unclear.

The README is weighted as heavily as the code, and it's what we'll spend most of
the follow-up conversation talking about. Write it for a colleague who's about to
pick up your branch.

## Ground rules

- **Use AI tools if that's how you normally work**, Copilot, Claude, Cursor,
  whatever. We'd rather see your real workflow than a performance. The only
  condition is that you can explain any code you submit; we'll ask.
- Any libraries you like.
- Where the brief is ambiguous, **make a decision and note it** in the README.
  Deciding under ambiguity is most of the job. If you'd rather ask, email us,
  that's fine and it isn't held against you.

## Questions

Reply to this email any time and we'll come back to you quickly.

Thanks for spending three and a half hours on this, we know that's a real ask,
and we don't take it lightly.
