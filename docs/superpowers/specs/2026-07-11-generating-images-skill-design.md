# Generating Images Global Skill Design

## Goal

Create a personal Claude Code skill named `generating-images` that generates project-ready image assets through the user's local OpenAI-compatible image endpoint, saves them according to the current project's conventions, integrates them into the requested product surface, and verifies the result.

## Scope

The skill applies to requests for logos, icons, hero artwork, backgrounds, illustrations, and replacement imagery. It is installed globally under the user's Claude configuration rather than in this repository.

## Architecture

The skill consists of:

- `SKILL.md`: discovery triggers and the agent workflow.
- `scripts/generate-image.mjs`: a reusable Node.js command-line client for the image API.
- `tests/generate-image.test.mjs`: tests for request construction, credential validation, response parsing, and file output.

The endpoint defaults to `http://localhost:20128/v1/images/generations` and may be overridden with `IMAGE_GENERATION_BASE_URL`. The default model is `ag/gemini-3.1-flash-image`. Authentication is read exclusively from `IMAGE_GENERATION_API_KEY`; no credential is embedded in the skill.

## Agent workflow

1. Inspect the current project for branding, colors, typography, existing image conventions, and the target component.
2. Resolve meaningful creative ambiguity before generation. Avoid asking when the request and project context already provide enough direction.
3. Choose the destination by following existing project conventions (`public/images`, `public/assets`, `src/assets`, or equivalents), falling back to `public/generated` for web projects.
4. Construct a specific prompt including subject, composition, visual style, palette, intended placement, background treatment, and constraints such as avoiding embedded text unless requested.
5. Invoke the generator script with prompt, output path, and appropriate format/options. Logos default to transparent PNG.
6. Inspect the generated asset before replacing or integrating anything.
7. Update the relevant source code to use the new asset while preserving responsive behavior and accessibility.
8. Run the project's applicable checks and exercise the affected UI end to end.

## Script interface

Required arguments:

- `--prompt <text>`
- `--output <path>`

Optional arguments:

- `--model` (default `ag/gemini-3.1-flash-image`)
- `--size` (default `auto`)
- `--quality` (default `auto`)
- `--background` (default `auto`)
- `--image-detail` (default `high`)
- `--format` (default inferred from output, otherwise `png`)

The script sends one image request and supports responses containing either base64 image data (`b64_json`) or a downloadable URL. It creates the output directory when needed and exits nonzero with actionable errors for missing credentials, connection failures, non-success HTTP responses, malformed response data, and download failures.

## Security

- The supplied API key is considered exposed and must be rotated by the user.
- The replacement key is provided through `IMAGE_GENERATION_API_KEY`.
- Errors must not print authorization headers or secret values.
- Generated assets may be written only to the explicit output path.
- Existing files are inspected before replacement; the skill does not silently overwrite unrelated assets.

## Testing

Skill behavior is developed using baseline and enabled scenarios. Scenarios cover logo generation, hero artwork, missing credentials, directory selection, integration, and verification. The script uses Node's built-in test runner with injected local HTTP test servers so tests do not consume real image generations.

Acceptance criteria:

- The skill is discoverable from ordinary image-generation requests.
- No secret is hard-coded in any skill file.
- The script produces the documented JSON request.
- Both base64 and URL response forms save a valid file.
- Failure messages are actionable and do not leak credentials.
- The skill directs the agent to inspect, save, integrate, and verify assets.
