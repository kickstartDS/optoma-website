# Plan: n8n Nodes for Storyblok Content Generation & Import

## Overview

This plan covers adding two custom n8n community nodes that mirror the `generate_content` and `import_content` tools currently implemented in the Storyblok MCP server ([mcp-server/src/services.ts](../mcp-server/src/services.ts)). The nodes will allow n8n workflows to trigger AI-powered content generation via OpenAI and then import that content into Storyblok stories — enabling fully automated, event-driven content pipelines without an LLM intermediary.

---

## Key Considerations

### 1. Architecture: Reuse vs. Rewrite

The MCP server currently bundles both the business logic (in `StoryblokService` and `ContentGenerationService`) and the MCP transport layer (stdio). Two approaches exist:

| Approach                                                                                                                                                          | Pros                                                       | Cons                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **A) Extract shared service library** — Move `services.ts`, `config.ts`, `errors.ts` into a shared npm package consumed by both the MCP server and the n8n nodes. | Single source of truth; bug fixes propagate automatically. | Requires refactoring MCP server to depend on the library; more upfront work. |
| **B) Re-implement logic directly in n8n nodes** — Copy the relevant API calls into the n8n node execute functions.                                                | Faster to ship; fully decoupled.                           | Logic duplication; divergence risk over time.                                |

**Decision:** Went with **Approach B** — logic is re-implemented directly in `GenericFunctions.ts`. Services are kept thin enough that extraction into a shared package (Approach A) remains viable in Milestone 6.

### 2. Authentication & Credentials

n8n uses a Credentials system. We implemented two custom credential types:

- **StoryblokApi** — stores `apiToken`, `oauthToken`, `spaceId` with a test connection that calls `GET /v1/spaces/{spaceId}` via the Management API.
- **OpenAiApi** — stores `apiKey` with a test connection that calls `GET /v1/models`.

### 3. Structured Output Schema Handling

`generate_content` takes a full JSON Schema as input to drive OpenAI's structured output mode. The implementation offers:

- **Preset schemas** (dropdown) for 9 common kickstartDS component types: Hero, FAQ, Testimonials, Features, CTA, Text, Blog Teaser, Stats, Image + Text.
- **Custom JSON** mode for raw JSON Schema input with a custom name field.
- All schemas enforce `additionalProperties: false` and proper `required` arrays for OpenAI strict mode.

### 4. Data Flow Between Nodes

The typical workflow is:

```
Trigger → Generate Content → Import Content → (optional) Publish / Notify
```

The output of `generate_content` is a clean JSON object under `$json.generatedContent` that n8n can reference with expressions. `import_content` accepts the `page` parameter via expression.

### 5. Error Handling & Retries

- OpenAI API errors are caught and surfaced as `NodeApiError` with descriptive messages.
- Storyblok API errors include available UIDs in the error message when a prompter component is not found.
- All operations support n8n's built-in **Retry on Fail** setting for transient errors.
- Empty or invalid JSON responses from OpenAI are caught and thrown as clear errors.

### 6. n8n Community Node Packaging

The package follows the [n8n community node structure](https://docs.n8n.io/integrations/creating-nodes/):

- Package name: `n8n-nodes-storyblok-kickstartds`
- Single node with `resource: "AI Content"` and `operation: "Generate" | "Import"` (per recommendation in Open Questions #1).
- Codex metadata for n8n search discovery.

---

## Milestones

### Milestone 1: Project Scaffolding & Credentials ✅

> **Goal:** Set up the n8n community node project and implement the credential types.

- [x] Initialize n8n community node project
  - Created `n8n-nodes-storyblok-kickstartds/` directory alongside `mcp-server/`
  - Set up `package.json` with `n8n.nodes` and `n8n.credentials` fields
  - Configured TypeScript (CommonJS target es2021), Jest (ts-jest), Gulp build, `.gitignore`
- [x] Implement `StoryblokApi` credential type
  - Fields: `apiToken`, `oauthToken`, `spaceId`
  - Test connection method: `GET /v1/spaces/{spaceId}` via Management API
- [x] Implement `OpenAiApi` credential type
  - Custom credential (not reusing n8n built-in, for self-contained packaging)
  - Fields: `apiKey`
  - Test connection method: `GET /v1/models`
- [x] Project builds and type-checks cleanly (`tsc --noEmit` and `tsc` both pass)

### Milestone 2: `Generate Content` Operation ✅

> **Goal:** Implement the operation that calls OpenAI with a system prompt, user prompt, and JSON Schema to produce structured content.

- [x] Create single `StoryblokKickstartDs` node class with resource/operation pattern
  - Display name: "Storyblok kickstartDS"
  - Icon: custom SVG (`storyblokKickstartDs.svg`)
  - Category: "Content & Data", subcategory: "Content Management"
  - Resource: `aiContent` ("AI Content"), Operations: `generate` | `import`
- [x] Define Generate parameters
  - `system` (string, multiline) — System prompt
  - `prompt` (string, multiline, supports expressions) — User prompt
  - `schemaMode` (options: "Preset" | "Custom JSON Schema")
  - `presetSchema` (dropdown, visible when mode = Preset) — 9 component types
  - `customSchemaName` (string, visible when mode = Custom)
  - `customSchema` (json, visible when mode = Custom)
  - `model` (options: `gpt-4o-2024-08-06`, `gpt-4o-mini`, `gpt-4-turbo`)
- [x] Implement `executeGenerate()` method
  - Validates inputs, instantiates OpenAI client, calls structured output API
  - Parses JSON response, returns as `generatedContent` with `_meta` object
- [x] Implement error handling
  - OpenAI API errors → `NodeApiError`
  - Empty AI responses → clear error message
  - Invalid JSON in response → caught and thrown
- [x] Add 9 preset schema definitions (JSON files)
  - `hero`, `faq`, `testimonials`, `features`, `cta`, `text`, `blog-teaser`, `stats`, `image-text`
- [x] Write unit tests (7 tests, all passing)
  - Preset schema validation (expected presets exist, hero requires headline/text/buttons, faq requires questions)
  - OpenAI call parameters verified
  - Empty response handling
  - Invalid JSON response handling
  - Custom schema pass-through

### Milestone 3: `Import Content` Operation ✅

> **Goal:** Implement the operation that takes generated content and writes it into a Storyblok story.

- [x] Define Import parameters with **two placement modes**
  - `storyUid` (string, supports expressions) — Story ID to update
  - `placementMode` (options: "Replace Prompter Component" | "Insert at Position")
  - `prompterUid` (string, visible when mode = prompter) — Prompter component UID to replace
  - `insertPosition` (options: "Beginning" | "End" | "Specific Index", visible when mode = position)
  - `insertIndex` (number, min 0, visible when position = index)
  - `page` (json, supports expressions) — Page content with `content.section[]`
  - `publish` (boolean, default false) — Publish immediately or save as draft
- [x] Implement `executeImport()` method with two code paths
  - **Prompter mode:** Fetches story, finds prompter by UID in `section[]`, splices in new sections (removing prompter), saves
  - **Position mode:** Fetches story, inserts sections at specified position (0 = beginning, -1 = end, or specific index), clamped to bounds, saves
  - Both paths support optional publish flag
  - Returns updated story with descriptive `_meta.placementMode` and `_meta.placementDetail`
- [x] Implement error handling
  - Story not found → clear error message
  - Prompter UID not found → error includes available UIDs for reference
  - Missing section array → created automatically in position mode, error in prompter mode
- [x] Write unit tests (13 tests, all passing)
  - **Prompter mode** (6 tests): successful replacement, publish flag, prompter not found, available UIDs in error, no section array, single section replacement
  - **Position mode** (7 tests): insert at beginning (0), append at end (-1), specific middle index, clamp oversized position, create section array if missing, no existing sections removed, publish flag

### Milestone 4: Integration Testing & Workflow Templates ✅

> **Goal:** Validate end-to-end flows and provide starter workflow templates.

- [x] Create example n8n workflow templates (JSON exports)
  - **Template 1: Manual trigger → Generate hero content → Import into story**
  - **Template 2: Webhook trigger → Generate full page (multiple sections) → Import → Slack notification**
  - **Template 3: Schedule trigger → Batch generate blog teasers → Import into overview page**
- [ ] End-to-end integration test (deferred — requires live Storyblok space + OpenAI key)
  - Would use a test Storyblok space for full generate → import → verify cycle
  - Gated behind environment variables
- [ ] Test with n8n Cloud and self-hosted n8n (deferred — requires publishing first)
- [x] Document data mapping between nodes in README
  - `$json.generatedContent` → Import Content `page` parameter
  - Expression examples for single and multi-section flows

### Milestone 5: Documentation & Publishing ⏳

> **Goal:** Publish the community node package and provide comprehensive documentation.

- [x] Write README.md for the npm package
  - Installation instructions (community nodes, manual, Docker)
  - Credential setup guide
  - Node parameter reference for both operations
  - Preset schemas table
  - Example workflows
  - Data flow and expression examples
  - Error handling reference table
  - Development guide
- [x] Add inline node documentation
  - `description` and `subtitle` for the node
  - Parameter `description` and `hint` fields
  - `codex` file (`StoryblokKickstartDs.node.json`) with categories, aliases, and subcategories
- [x] Update README with placement mode documentation (position-based insertion)
- [x] Update MCP server README to reference n8n nodes as an alternative trigger mechanism
- [ ] Publish to npm
  - Package name: `n8n-nodes-storyblok-kickstartds`
  - Verify installation via n8n community nodes UI
- [ ] Submit to n8n community nodes directory (optional)

### Milestone 6 (Future): Shared Service Library

> **Goal:** Reduce duplication by extracting shared logic into a common package.

- [ ] Create `@kickstartds/storyblok-services` package
  - Extract `StoryblokService` and `ContentGenerationService` from MCP server
  - Extract Zod schemas and TypeScript types
  - Publish as internal or scoped npm package
- [ ] Refactor MCP server to consume shared package
- [ ] Refactor n8n nodes to consume shared package
- [ ] Add additional n8n nodes for other MCP tools (list_stories, search_content, etc.)

---

## Actual File Structure

```
n8n-nodes-storyblok-kickstartds/
├── package.json
├── package-lock.json
├── tsconfig.json
├── jest.config.js
├── gulpfile.js
├── .gitignore
├── README.md
├── credentials/
│   ├── StoryblokApi.credentials.ts
│   └── OpenAiApi.credentials.ts
├── nodes/
│   └── StoryblokKickstartDs/
│       ├── StoryblokKickstartDs.node.ts        # Single node with resource/operation pattern
│       ├── StoryblokKickstartDs.node.json       # Codex file (search metadata)
│       ├── storyblokKickstartDs.svg             # Node icon
│       ├── GenericFunctions.ts                  # Shared API helpers (Storyblok + OpenAI clients)
│       ├── descriptions/
│       │   ├── GenerateContentDescription.ts    # Parameter definitions for Generate operation
│       │   └── ImportContentDescription.ts      # Parameter definitions for Import operation (with placement modes)
│       └── schemas/
│           ├── hero.schema.json
│           ├── faq.schema.json
│           ├── testimonials.schema.json
│           ├── features.schema.json
│           ├── cta.schema.json
│           ├── text.schema.json
│           ├── blog-teaser.schema.json
│           ├── stats.schema.json
│           └── image-text.schema.json
├── test/
│   ├── GenerateContent.test.ts                  # 7 tests
│   └── ImportContent.test.ts                    # 13 tests (6 prompter + 7 position)
└── workflows/
    ├── template-1-manual-hero.json
    ├── template-2-webhook-full-page.json
    └── template-3-scheduled-batch-blog-teasers.json
```

---

## Resolved Decisions

These questions from the original plan have been resolved during implementation:

1. **Single node with operations vs. two separate nodes?** → **Single node** with `resource: "AI Content"` and `operation: "Generate" | "Import"`. Consistent with n8n conventions.

2. **Preset schemas scope** → 9 presets: Hero, FAQ, Testimonials, Features, CTA, Text, Blog Teaser, Stats, Image + Text. Covers the most commonly generated kickstartDS component types.

3. **Publish behavior** → The Import operation has a `publish` boolean toggle (default: false/draft). This goes beyond the MCP server, which always saves as draft.

4. **Placement flexibility** → The Import operation supports two placement modes:

   - **Replace Prompter** — original behavior, replaces a prompter component by UID
   - **Insert at Position** — added as an alternative for stories without a prompter; inserts at beginning, end, or specific index without removing existing content

5. **Webhook-driven generation** → Supported via workflow templates (Template 2 uses webhook trigger). The n8n node itself is trigger-agnostic.

6. **Rate limiting strategy** → Relies on n8n's built-in **Retry on Fail** and **Split in Batches** nodes rather than implementing internal throttling.
