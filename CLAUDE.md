# RioAnime Instructions

## Work Fast and Directly

- For a specific request, find the named file or symbol, read only the relevant context, and make the change.
- Do not scan the whole repository, create a plan, invoke agents or skills, or inspect unrelated files unless the task requires it.
- Prefer the smallest reliable change. Avoid unrelated refactors, speculative abstractions, and unnecessary tooling.
- Investigate more deeply only for bugs, unclear behavior, cross-cutting changes, or security and data risks.
- Infer routine technical details from the codebase instead of asking the user.

## Safety and Quality

- Follow existing architecture and naming, and preserve uncommitted user work.
- Find the root cause before fixing bugs and add a focused regression test when practical.
- Ask before destructive actions, deployment, remote database changes, breaking changes, credentials, or meaningful cost exposure.
- Never expose, print, commit, or hard-code secrets.
- Report failed or skipped verification honestly.

## Verification

- Never run `npm build`.
- Use only focused checks for focused changes.
- After code changes, run `npm run lint -- --quiet` once.
- Also run `npm run worker:check` after changing `worker.js`, Worker routes or bindings, `wrangler.jsonc`, D1 access, or migrations.

## Cloudflare

- Minimize Worker and D1 usage: cache public reads, avoid polling and per-view writes, and use conditional requests where practical.
- Keep Worker/D1 authoritative and admin endpoints uncached unless a safe cache design is explicitly implemented.
- Deploy or run remote migrations only with explicit approval; never use production as verification.
