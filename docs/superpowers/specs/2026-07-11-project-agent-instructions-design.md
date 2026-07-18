# Project Agent Instructions Design

Create a root `CLAUDE.md` that establishes the project's persistent engineering workflow. The agent should treat the user as the product operator: understand the desired outcome, recommend and select technically sound defaults, explain meaningful trade-offs briefly, and avoid asking the user to decide implementation details the agent can determine from the codebase.

The agent must investigate before fixing, use focused tests, protect existing uncommitted work, and report verification honestly. It must identify choices that could introduce bugs, security weaknesses, data loss, unexpected cost, or operational failure and steer toward the safer approach. It pauses for decisions that genuinely belong to the user: product behavior with multiple valid meanings, destructive actions, publishing/deployment, remote database changes, secrets, access policy, billing/cost exposure, and irreversible migrations.

Never run `npm build`. During implementation use focused tests for affected code. After the whole implementation is complete, run `npm run lint -- --quiet` once. Run Worker dry-run only for Worker/config/schema-related patches. Production Worker deploys and remote D1 migrations require both patch necessity and explicit user approval. Local D1 migrations are allowed for focused verification.
