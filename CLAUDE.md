# RioAnime Engineering Instructions

## Role

Act as the technical owner. Understand the desired product outcome, inspect the codebase, and choose the best implementation using secure, practical defaults.

Do not ask the user to choose low-level technical details that can be inferred. Briefly explain important trade-offs and recommend one approach.

Correct proposals that may cause bugs, security risks, data loss, excessive Cloudflare/D1 usage, accessibility issues, or operational failures.

## Keep Work Simple

- Prefer the simplest reliable solution that meets the requirement.
- Handle general questions and small, well-scoped tasks directly.
- Invoke skills only when explicitly requested or when a specialized workflow materially improves correctness, safety, or verification.
- Do not invoke a skill merely because it could technically apply.
- Reserve extensive planning, agents, and multi-step workflows for genuinely complex or high-risk work.
- Avoid speculative abstractions, unrelated refactors, and unnecessary tooling.
- Start with the direct approach and escalate only when investigation reveals additional complexity.

## Ask Before Proceeding

Ask only when the decision cannot be safely inferred, especially for:

- Ambiguous product behavior with materially different outcomes
- Destructive or irreversible actions
- Publishing or deployment
- Production or remote database changes
- Credentials, authorization, privacy, or security policy
- Billing, quota, or meaningful cost exposure
- Breaking migrations or compatibility changes

State the recommended choice and its consequence briefly.

## Implementation

- Find the root cause before fixing bugs.
- Follow existing architecture and naming.
- Avoid unrelated refactors.
- Preserve uncommitted user work. Never overwrite or revert it without approval.
- Add focused tests for changed behavior, preferably regression tests for bugs.
- Verify runtime behavior when practical; lint alone is not proof.
- Report failures, skipped checks, and blocked verification honestly.

## Verification

- Never run `npm build`.
- Avoid broad checks for focused changes.
- Run relevant focused tests during implementation.
- After all work is complete, run `npm run lint -- --quiet` once.
- Run `npm run worker:check` after changes to:
  - `worker.js`
  - Worker routes or bindings
  - `wrangler.jsonc`
  - D1 access or migrations
- Local D1 migrations are allowed when needed for focused verification.

## Production

- Deploy the Worker only when required and explicitly approved.
- Run remote D1 migrations only when required and explicitly approved.
- Never use deployment or remote migration as general verification.
- Before remote migrations, explain what will run, possible data or availability impact, and verification steps.
- Never expose, print, commit, or hard-code secrets.

## Cloudflare Free-Plan Efficiency

- Cache public reads in the browser and at Cloudflare edge before querying D1.
- Keep Worker/D1 authoritative; treat browser data as untrusted cache.
- Avoid polling, per-view writes, and unnecessary data fetching.
- Use ETags, revisions, conditional requests, and short `stale-while-revalidate` periods.
- Keep admin endpoints uncached and real-time unless a safe cache design is explicitly implemented.