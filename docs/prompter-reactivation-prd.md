# PRD: Prompter Component Reactivation & Guided Generation Integration

**Status:** Draft
**Date:** 2026-02-24
**Author:** Generated from codebase analysis

---

## 1. Background & Problem Statement

### What Is the Prompter?

The Prompter is an **in-Visual-Editor AI content generation component** for Storyblok. Content editors place it inside a `section` in Storyblok's Visual Editor. From there, they can:

1. Select a Storyblok **Idea** as seed content
2. Configure generation parameters (section count, system prompt, user prompt, story context)
3. Click **"Generate Content"** — which calls OpenAI structured outputs via `/api/content`
4. **Preview** the generated sections inline (rendered as real kickstartDS components)
5. Click **"Save Content"** — which calls `/api/import` to **replace the Prompter component itself** in the story with the generated sections

The key architectural insight: the Prompter reads its own Storyblok `_uid` from the DOM and passes it to the import API, which locates and replaces the Prompter blok in the story's section array. After saving, the Prompter is gone and the AI-generated sections take its place.

### Why Was It Deactivated?

During the refactoring that introduced the shared services library (`@kickstartds/storyblok-services`), the MCP server's guided generation tools, and multi-content-type support, the Prompter's component registration was **commented out** in [packages/website/components/index.tsx](../packages/website/components/index.tsx#L248-L253):

```tsx
// prompter: editable(
//   dynamic(() =>
//     import("./prompter/PrompterComponent").then(
//       (mod) => mod.PrompterComponent
//     )
//   )
// ),
```

This is the **only deactivation point**. All other infrastructure remains intact:

| Artifact                                                         | Status                                            |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| Component files (`packages/website/components/prompter/`)        | ✅ All 9 sub-components + main component present  |
| Section schema (`anyOf` reference to `prompter.schema.json`)     | ✅ Still included                                 |
| CMS component definition (`cms/components.123456.json`, id: 299) | ✅ Still defined                                  |
| API routes (`/api/content`, `/api/import`, `/api/ideas`)         | ✅ All present and functional                     |
| Shared services (`importByPrompterReplacement`)                  | ✅ Exported and used by MCP + n8n                 |
| MCP tool `import_content` (prompter UID-based)                   | ✅ Fully active                                   |
| n8n "Import" operation (prompter mode)                           | ✅ Fully active                                   |
| Tests for prompter replacement                                   | ✅ Exist in both storyblok-services and n8n-nodes |

### The Gap

The Prompter was built before the MCP server gained its guided generation toolkit. It uses a **monolithic, single-shot generation approach** that is now significantly inferior to the MCP server's multi-step workflow:

| Capability            | Old Prompter                                                     | MCP Server (Current)                                                                                     |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Generation strategy   | Single `generateStructuredContent` call for all sections at once | `plan_page` → `generate_section` (per section) → `generate_root_field` → `generate_seo`                  |
| Site awareness        | None — no pattern analysis                                       | `analyze_content_patterns` injects component frequency, sub-item counts, section sequences               |
| Recipe best practices | None                                                             | `list_recipes` + automatic recipe injection in `generate_section`                                        |
| Field-level guidance  | None                                                             | Field value distributions + compositional hints from `guidance.ts`                                       |
| Transition context    | None                                                             | `previousSection` / `nextSection` context for coherent flow                                              |
| Content types         | Hardcoded to `page` only                                         | 5 content types via schema registry (`page`, `blog-post`, `blog-overview`, `event-detail`, `event-list`) |
| Root fields           | Not supported                                                    | `generate_root_field` for `head`, `aside`, `cta`; `generate_seo` for SEO metadata                        |
| Asset upload          | Not supported                                                    | `uploadAssets: true` downloads + uploads to Storyblok CDN                                                |
| Quality checks        | None                                                             | Compositional quality warnings (duplicate heroes, sparse stats, missing CTAs, etc.)                      |
| Schema caching        | Client-side, per-render                                          | Server-side startup cache in registry                                                                    |
| Validation            | Basic (API-side only)                                            | Schema-driven validation with nesting rules + compositional warnings                                     |

**Goal:** Reactivate the Prompter component and integrate it with the guided generation workflow so that content editors in the Visual Editor get the same high-quality, site-aware, section-by-section generation that MCP/n8n users enjoy — without needing to leave Storyblok.

---

## 2. Goals & Non-Goals

### Goals

1. **Re-enable the Prompter** in the component registry so it renders in the Visual Editor again
2. **Replace the monolithic generation flow** with the guided generation pipeline (`plan_page` → `generate_section` → import)
3. **Add site-aware context** — patterns, recipes, field guidance — to Prompter-driven generation
4. **Support multi-content-type generation** — detect the current story's content type and use the appropriate schema
5. **Add asset upload support** — generated image URLs are uploaded to Storyblok CDN on import
6. **Surface compositional quality warnings** — show the editor any issues before they save
7. **Improve the preview experience** — render sections incrementally as they're generated (section-by-section streaming)
8. **Remove hardcoded credentials and German-language strings** — clean up tech debt from the prototype

### Non-Goals

- Replacing the MCP server or n8n nodes — the Prompter is an **additional** interface for the same underlying pipeline
- Supporting Tier 2 flat content types (`event-detail`, `event-list`) in the Prompter's first iteration — these have no section array, so the "replace prompter in sections" pattern doesn't apply directly
- Building a full page builder UI — the Prompter is a lightweight generation trigger, not a drag-and-drop editor
- Removing the `import_content` MCP tool — it remains useful for programmatic prompter replacement from external agents

---

## 3. Proposed Architecture

### 3.1 New API Routes

Replace the three existing API routes with a richer set that mirrors the MCP server's guided generation tools. All new routes delegate to `@kickstartds/storyblok-services` shared functions.

| Route                            | Method | Purpose                                          | Shared Service Function                       |
| -------------------------------- | ------ | ------------------------------------------------ | --------------------------------------------- |
| `/api/prompter/patterns`         | GET    | Analyze content patterns for site context        | `analyzeContentPatterns()`                    |
| `/api/prompter/recipes`          | GET    | List section recipes, templates, anti-patterns   | Static JSON from `section-recipes.json`       |
| `/api/prompter/plan`             | POST   | Plan page structure (section sequence)           | `planPage()` (new, extracted from MCP)        |
| `/api/prompter/generate-section` | POST   | Generate a single section with site context      | `generateSection()` (new, extracted from MCP) |
| `/api/prompter/import`           | POST   | Import generated sections (prompter replacement) | `importByPrompterReplacement()`               |
| `/api/prompter/ideas`            | GET    | Fetch Storyblok Ideas                            | Direct Storyblok API call                     |

**Key change:** The monolithic `/api/content` route (which took a raw schema and prompt) is replaced by `/api/prompter/plan` + `/api/prompter/generate-section`, which encapsulate the schema preparation, pattern analysis, recipe injection, and field guidance internally.

The existing `/api/content`, `/api/import`, and `/api/ideas` routes should be preserved for backward compatibility but can be deprecated.

### 3.2 Shared Service Extraction

Currently, the MCP server's `plan_page` and `generate_section` logic lives inline in `packages/mcp-server/src/index.ts` (lines ~1937–2340). To share with the Prompter's API routes:

1. **Extract `planPage()`** into `packages/storyblok-services/src/plan.ts`

   - Inputs: intent string, content type, optional `startsWith` filter, OpenAI client, Storyblok client
   - Outputs: section sequence plan, rootFieldMeta (for hybrid types)
   - Internally calls `analyzeContentPatterns()`, loads recipes, builds prompt, calls OpenAI

2. **Extract `generateSection()`** into `packages/storyblok-services/src/generate-section.ts`

   - Inputs: component type, prompt, previousSection, nextSection, content type, OpenAI client, patterns cache
   - Outputs: generated section object (Design System format)
   - Internally calls `buildFieldGuidance()`, injects sub-item counts, recipe best practices, transition context

3. **Extract `generateRootField()`** into `packages/storyblok-services/src/generate-root-field.ts` (already partially extracted to `pipeline.ts`)

4. **Extract `generateSeo()`** into `packages/storyblok-services/src/generate-seo.ts` (already partially extracted to `pipeline.ts`)

After extraction, the MCP server's tool handlers become thin wrappers around these shared functions (just like `importByPrompterReplacement` already is).

### 3.3 Updated Prompter Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Storyblok Visual Editor                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Prompter Component                       │  │
│  │                                                           │  │
│  │  Step 1: Configure                                        │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ • Select Idea (optional, from Storyblok Ideas)       │ │  │
│  │  │ • Enter intent / user prompt                         │ │  │
│  │  │ • Content type auto-detected from current story      │ │  │
│  │  │ • Toggle: include current story as context           │ │  │
│  │  │ • [Plan Content] button                              │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                          │                                │  │
│  │                          ▼                                │  │
│  │  Step 2: Review Plan                                      │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ • Shows planned section sequence from plan_page      │ │  │
│  │  │   e.g. hero → features → testimonials → cta         │ │  │
│  │  │ • Editor can reorder, remove, or add sections        │ │  │
│  │  │ • Shows compositional warnings (if any)              │ │  │
│  │  │ • [Generate All Sections] button                     │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                          │                                │  │
│  │                          ▼                                │  │
│  │  Step 3: Generate & Preview (section-by-section)          │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ • Calls generate_section for each planned section    │ │  │
│  │  │ • Renders each section preview as it completes       │ │  │
│  │  │ • Shows progress: "Generating section 2 of 5..."     │ │  │
│  │  │ • Compositional quality warnings shown inline        │ │  │
│  │  │ • Editor can regenerate individual sections          │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                          │                                │  │
│  │                          ▼                                │  │
│  │  Step 4: Save                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ • [Save Content] replaces Prompter with sections     │ │  │
│  │  │ • Asset upload happens server-side during import     │ │  │
│  │  │ • [Discard] removes generated content                │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Content Type Detection

The Prompter currently hardcodes `page` as the content type. The updated Prompter should:

1. Read the current story via the Storyblok API (already done)
2. Detect the story's root `component` field (e.g. `page`, `blog-post`, `blog-overview`)
3. Pass the detected content type to `plan_page` and `generate_section`
4. For Tier 1 section-based types: full section generation workflow
5. For hybrid types (`blog-post`): section generation + root field generation (show additional fields in the plan step)

### 3.5 Schema Handling

The current Prompter runs `prepareSchemaForOpenAi` client-side on every render. The updated architecture:

- **Server-side schema preparation:** The `/api/prompter/generate-section` route handles schema prep internally via the shared services registry (which caches dereferenced schemas at startup)
- **Client sends only:** `componentType`, `prompt`, `previousSection`, `nextSection`, `contentType`
- **No raw JSON Schema in the browser**

---

## 4. Detailed Task Breakdown

### Phase 1: Cleanup & Reactivation (Low Risk)

| #   | Task                                                                                | Files                                                        | Effort |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------ |
| 1.1 | Uncomment Prompter registration in component index                                  | `packages/website/components/index.tsx`                      | S      |
| 1.2 | Remove `@ts-nocheck` from `PrompterComponent.tsx` and fix TypeScript errors         | `packages/website/components/prompter/PrompterComponent.tsx` | M      |
| 1.3 | Remove hardcoded Storyblok API token (`"tiiyPe4tqKDSQEdBa9qtRwtt"`) — use env var   | `PrompterComponent.tsx`                                      | S      |
| 1.4 | Replace German-language UI strings with English (or add i18n)                       | `PrompterComponent.tsx`, sub-components                      | S      |
| 1.5 | Verify the Prompter renders in Storyblok Visual Editor with the existing (old) flow | Manual testing                                               | S      |

### Phase 2: Service Extraction (Medium Risk)

| #   | Task                                                                                          | Files                                            | Effort |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------ |
| 2.1 | Extract `planPage()` from MCP server into `storyblok-services/src/plan.ts`                    | New file + MCP server refactor                   | L      |
| 2.2 | Extract `generateSection()` from MCP server into `storyblok-services/src/generate-section.ts` | New file + MCP server refactor                   | L      |
| 2.3 | Verify `generateRootField()` and `generateSeo()` are already extractable from `pipeline.ts`   | `storyblok-services/src/pipeline.ts`             | M      |
| 2.4 | Update MCP server tool handlers to use extracted shared functions                             | `packages/mcp-server/src/index.ts`               | M      |
| 2.5 | Update n8n node operations to use extracted shared functions                                  | `packages/n8n-nodes/nodes/StoryblokKickstartDs/` | M      |
| 2.6 | Add tests for extracted functions                                                             | `packages/storyblok-services/test/`              | M      |
| 2.7 | Ensure patterns cache can be initialized from API routes (not just MCP server startup)        | `storyblok-services/src/patterns.ts`             | M      |

### Phase 3: New API Routes (Medium Risk)

| #   | Task                                                                                                            | Files                                                     | Effort |
| --- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| 3.1 | Create `/api/prompter/patterns` route                                                                           | `packages/website/pages/api/prompter/patterns.ts`         | S      |
| 3.2 | Create `/api/prompter/recipes` route                                                                            | `packages/website/pages/api/prompter/recipes.ts`          | S      |
| 3.3 | Create `/api/prompter/plan` route                                                                               | `packages/website/pages/api/prompter/plan.ts`             | M      |
| 3.4 | Create `/api/prompter/generate-section` route                                                                   | `packages/website/pages/api/prompter/generate-section.ts` | M      |
| 3.5 | Create `/api/prompter/import` route (wrapping existing `importByPrompterReplacement` with asset upload support) | `packages/website/pages/api/prompter/import.ts`           | M      |
| 3.6 | Move `/api/ideas` to `/api/prompter/ideas` (keep old route as redirect)                                         | `packages/website/pages/api/prompter/ideas.ts`            | S      |

### Phase 4: Component Rewrite (High Effort)

| #   | Task                                                                           | Files                                | Effort |
| --- | ------------------------------------------------------------------------------ | ------------------------------------ | ------ |
| 4.1 | Refactor component into multi-step wizard (Configure → Plan → Generate → Save) | `PrompterComponent.tsx`              | XL     |
| 4.2 | Add plan review UI (section sequence display, reorder, add/remove)             | New sub-component                    | L      |
| 4.3 | Implement section-by-section generation with progress indicator                | `PrompterComponent.tsx`              | L      |
| 4.4 | Add per-section regenerate button in preview                                   | `PrompterComponent.tsx`              | M      |
| 4.5 | Add content type auto-detection from current story                             | `PrompterComponent.tsx`              | S      |
| 4.6 | Add compositional quality warnings display                                     | New sub-component                    | M      |
| 4.7 | Remove client-side schema preparation (move to server)                         | `PrompterComponent.tsx`              | M      |
| 4.8 | Update preview rendering to handle all current component types                 | `PrompterComponent.tsx` componentMap | S      |

### Phase 5: Polish & Testing (Medium Risk)

| #   | Task                                                                          | Files                            | Effort |
| --- | ----------------------------------------------------------------------------- | -------------------------------- | ------ |
| 5.1 | End-to-end testing in Storyblok Visual Editor                                 | Manual                           | L      |
| 5.2 | Add loading states and error handling for each API call                       | `PrompterComponent.tsx`          | M      |
| 5.3 | Handle edge cases: no OpenAI key, no patterns, empty plan                     | API routes + component           | M      |
| 5.4 | Deprecate old `/api/content`, `/api/import`, `/api/ideas` routes              | Old API routes                   | S      |
| 5.5 | Update CMS component schema if new fields needed (e.g. content type selector) | `prompter.schema.json`, CMS push | S      |
| 5.6 | Documentation update                                                          | `docs/skills/`, `README.md`      | M      |

---

## 5. Schema Changes

### Current Prompter Schema (`prompter.schema.json`)

```json
{
  "sections": { "type": "integer" },
  "includeStory": { "type": "boolean", "default": true },
  "useIdea": { "type": "boolean", "default": true },
  "relatedStories": { "type": "array", "items": { "type": "string" } },
  "userPrompt": { "type": "string" },
  "systemPrompt": { "type": "string" }
}
```

### Proposed Schema Additions

```json
{
  "sections": {
    "type": "integer",
    "description": "Deprecated — section count is now determined by plan_page. Kept for backward compat."
  },
  "includeStory": { "type": "boolean", "default": true },
  "useIdea": { "type": "boolean", "default": true },
  "relatedStories": { "type": "array", "items": { "type": "string" } },
  "userPrompt": {
    "type": "string",
    "description": "Intent / prompt for page planning and section generation"
  },
  "systemPrompt": {
    "type": "string",
    "description": "Optional system prompt override (default: auto-generated with site context)"
  },
  "contentType": {
    "type": "string",
    "enum": ["page", "blog-post", "blog-overview"],
    "default": "page",
    "description": "Content type for generation. Auto-detected from story if not set."
  },
  "startsWith": {
    "type": "string",
    "description": "Optional slug prefix filter for pattern analysis (e.g. 'case-studies/' to match style of that section)"
  },
  "uploadAssets": {
    "type": "boolean",
    "default": true,
    "description": "Upload generated image URLs to Storyblok CDN on save"
  }
}
```

---

## 6. Migration Path

### For Existing Prompter Instances in Storyblok

If any stories currently have Prompter bloks (from before deactivation), they will start rendering again after Phase 1. The old flow (monolithic generation) will still work via the existing `/api/content` and `/api/import` routes.

The Phase 4 component rewrite introduces the new multi-step flow. Since the Prompter is ephemeral by design (it replaces itself on save), there's no data migration concern — old Prompter instances simply get the new UI.

### For MCP Server & n8n Nodes

The Phase 2 extraction is a **refactor, not a behavior change**. After extraction:

- MCP tool handlers become thin wrappers: `plan_page` tool calls `planPage()` from shared services
- n8n node operations call the same shared functions
- All three interfaces (Prompter, MCP, n8n) use identical generation logic

### Backward Compatibility

- Old API routes (`/api/content`, `/api/import`, `/api/ideas`) remain functional but deprecated
- The `import_content` MCP tool continues to accept `prompterUid` — unchanged
- The `sections` schema field is preserved but ignored by the new flow (plan determines section count)

---

## 7. Open Questions

1. **Should the Prompter support Tier 2 flat types (`event-detail`, `event-list`)?**
   These don't have a section array, so the "replace prompter" pattern doesn't apply. Options: (a) skip for v1, (b) use a different insertion strategy (replace entire story content), (c) restrict Prompter to section-based types only.

2. **Should plan editing be rich or lightweight?**
   The plan review step (Step 2) could be a simple list with reorder, or a more visual component-type picker with descriptions. Start lightweight and iterate.

3. **Should we stream section generation results?**
   OpenAI structured outputs don't support streaming, but we can show each section's preview as soon as its API call completes (parallel or sequential). Sequential with progress is simpler and provides transition context.

4. **How should asset upload interact with the preview?**
   Option A: Upload on save (simpler — preview shows external URLs, save uploads to CDN).
   Option B: Upload during generation (preview shows CDN URLs immediately, but slower).
   Recommendation: Option A — upload on save via the import API route.

5. **Should the Prompter's "Idea" integration be preserved?**
   The Storyblok Ideas feature is lightweight and may not be used by all teams. Consider making it optional (already gated by `useIdea` flag) and enhancing the user prompt field to be the primary input.

6. **Should there be a way to generate into an existing page (append sections)?**
   Currently the Prompter replaces itself. A variation could append sections at a specific position (using `import_content_at_position` logic). This would allow editors to add AI-generated sections to an already-populated page.

---

## 8. Success Metrics

- **Reactivation:** Prompter renders and generates content in the Visual Editor (Phase 1)
- **Quality:** Generated content quality matches MCP server output (same pipeline, same context injection)
- **Usability:** Content editors can go from intent to published sections in < 3 minutes
- **Code sharing:** Zero duplication between Prompter API routes, MCP tools, and n8n operations — all use shared services
- **Reliability:** Compositional quality warnings surface before save, preventing common structural issues

---

## 9. Dependencies

- `@kickstartds/storyblok-services` — must export new shared functions (`planPage`, `generateSection`)
- `@kickstartds/ds-agency-premium` — component library (already a dependency)
- OpenAI API key — required for generation (already configured via `NEXT_OPENAI_API_KEY`)
- Storyblok Management API credentials — required for import (already configured)

---

## 10. Appendix: Current File Inventory

### Prompter Component Files (all in `packages/website/components/prompter/`)

| File                            | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `PrompterComponent.tsx`         | Main component (504 lines) — generation, preview, import |
| `PrompterProps.ts`              | TypeScript interface                                     |
| `PrompterDefaults.ts`           | Default prop values                                      |
| `prompter.schema.json`          | JSON Schema                                              |
| `prompter.schema.dereffed.json` | Dereferenced schema with `$defs`                         |
| `prompter.scss`                 | Main styles                                              |
| `prompter-badge/`               | "KI Draft" / "AI Draft" badge for unsaved content        |
| `prompter-button/`              | Action buttons (Generate, Save, Discard, Reload)         |
| `prompter-headline/`            | Section headline                                         |
| `prompter-loading-indicator/`   | Three-dots animation during generation                   |
| `prompter-section/`             | Wrapper section for Prompter UI                          |
| `prompter-section-input/`       | Input area for idea selection                            |
| `prompter-select-field/`        | Dropdown for idea selection                              |
| `prompter-selection-display/`   | Shows selected idea                                      |
| `prompter-submitted-text/`      | Post-save message                                        |

### API Routes

| Route          | File                                          |
| -------------- | --------------------------------------------- |
| `/api/content` | `packages/website/pages/api/content/index.ts` |
| `/api/import`  | `packages/website/pages/api/import/index.ts`  |
| `/api/ideas`   | `packages/website/pages/api/ideas/index.ts`   |

### Shared Services (Prompter-relevant exports)

| Function                        | File           | Used By                                |
| ------------------------------- | -------------- | -------------------------------------- |
| `prepareSchemaForOpenAi()`      | `schema.ts`    | Prompter (client-side), MCP            |
| `generateStructuredContent()`   | `pipeline.ts`  | Prompter (via `/api/content`), MCP     |
| `processOpenAiResponse()`       | `transform.ts` | Prompter (client-side), MCP            |
| `processForStoryblok()`         | `transform.ts` | Prompter (client-side), MCP, n8n       |
| `importByPrompterReplacement()` | `import.ts`    | Prompter (via `/api/import`), MCP, n8n |
| `validateSections()`            | `validate.ts`  | Prompter (via `/api/import`), MCP, n8n |
| `analyzeContentPatterns()`      | `patterns.ts`  | MCP only (needs Prompter route)        |
| `buildFieldGuidance()`          | `guidance.ts`  | MCP only (needs extraction)            |
| `createOpenAiClient()`          | `pipeline.ts`  | Prompter (via `/api/content`), MCP     |
| `createStoryblokClient()`       | `client.ts`    | Prompter (via `/api/import`), MCP, n8n |
