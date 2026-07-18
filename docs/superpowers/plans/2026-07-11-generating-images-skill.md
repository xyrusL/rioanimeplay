# Generating Images Global Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install a tested global Claude Code skill that generates, saves, integrates, and verifies project image assets through the user's local image API.

**Architecture:** A concise `SKILL.md` teaches project-aware generation and integration. A dependency-free Node.js CLI handles HTTP requests and image persistence; its exported functions are tested with Node's built-in test runner and local HTTP servers.

**Tech Stack:** Claude Code Agent Skills, Node.js 18+ ESM, `node:test`, Fetch API.

## Global Constraints

- Install globally at `C:/Users/johnp/.claude/skills/generating-images/`.
- Read authentication only from `IMAGE_GENERATION_API_KEY`.
- Default endpoint: `http://localhost:20128/v1/images/generations`.
- Default model: `ag/gemini-3.1-flash-image`.
- Never embed or print the user's API key.
- Detect existing asset conventions; web fallback is `public/generated`.
- Default logos to transparent PNG.
- Inspect before overwriting and verify integrated UI end to end.

---

### Task 1: Establish RED skill scenarios

**Files:**
- Create: `C:/Users/johnp/.claude/skills/generating-images/tests/baseline-scenarios.md`

**Interfaces:**
- Produces: documented expected behavior for discovery, security, output placement, integration, and verification.

- [ ] Write three baseline prompts: logo generation, hero generation, and missing-key handling.
- [ ] Run each against a fresh agent without the new skill and record omissions.
- [ ] Confirm at least one baseline omits a required behavior, establishing RED.

### Task 2: Build the image-generation CLI with TDD

**Files:**
- Create: `C:/Users/johnp/.claude/skills/generating-images/tests/generate-image.test.mjs`
- Create: `C:/Users/johnp/.claude/skills/generating-images/scripts/generate-image.mjs`

**Interfaces:**
- Produces: `parseArgs(argv)`, `buildRequest(options)`, `extractImage(response, fetchImpl)`, `generateImage(options, dependencies)`, and CLI arguments `--prompt`, `--output`, `--model`, `--size`, `--quality`, `--background`, `--image-detail`, `--format`.

- [ ] Write failing tests for missing `IMAGE_GENERATION_API_KEY`, exact request fields, base64 responses, URL responses, output-directory creation, safe HTTP errors, and refusal to overwrite without `--force`.
- [ ] Run `node --test C:/Users/johnp/.claude/skills/generating-images/tests/generate-image.test.mjs` and confirm failures are due to missing implementation.
- [ ] Implement the minimal dependency-free ESM CLI using `fetch`, `Buffer`, `mkdir`, and `writeFile`.
- [ ] Run the test command and confirm all tests pass with no warnings.
- [ ] Refactor only while tests remain green.

### Task 3: Author and behavior-test the skill

**Files:**
- Create: `C:/Users/johnp/.claude/skills/generating-images/SKILL.md`

**Interfaces:**
- Consumes: CLI from Task 2.
- Produces: globally discoverable skill named `generating-images`.

- [ ] Write valid frontmatter whose description starts with `Use when...` and covers logos, icons, hero art, backgrounds, illustrations, and placeholder replacement.
- [ ] Define the required workflow: inspect project, clarify only material ambiguity, choose asset location, prompt, generate, inspect, integrate, and verify.
- [ ] Include exact environment setup and CLI usage without a literal credential.
- [ ] Run the same scenarios with the skill loaded and verify required behaviors appear.
- [ ] Add only guidance needed to close observed baseline gaps.

### Task 4: Security and end-to-end verification

**Files:**
- Verify: `C:/Users/johnp/.claude/skills/generating-images/**`

**Interfaces:**
- Consumes: completed global skill and CLI.
- Produces: verification evidence.

- [ ] Search all skill files for the exposed key prefix and confirm zero matches.
- [ ] Run `node --test C:/Users/johnp/.claude/skills/generating-images/tests/generate-image.test.mjs` and confirm all tests pass.
- [ ] Run the CLI without a key and confirm it exits nonzero with `IMAGE_GENERATION_API_KEY is required`.
- [ ] If the replacement environment variable is configured, generate one temporary PNG against the local endpoint; otherwise report this live call as blocked without exposing a secret.
- [ ] Confirm `/skills` discovers `generating-images` in a new Claude Code session.

### Task 5: Record repository documentation

**Files:**
- Commit: `docs/superpowers/specs/2026-07-11-generating-images-skill-design.md`
- Commit: `docs/superpowers/plans/2026-07-11-generating-images-skill.md`

- [ ] Run repository checks applicable to Markdown changes.
- [ ] Commit the design and plan without staging unrelated working-tree changes.
