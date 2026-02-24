# Prompter Reactivation Implementation Progress

> **Status: 🟡 IN PROGRESS** — Phases 1–3 complete. Phase 4 (Component Rewrite) next.
> Companion PRD: [prompter-reactivation-prd.md](./prompter-reactivation-prd.md)

## Phase 1: Cleanup & Reactivation (Low Risk) ✅

- [x] 1.1 Uncomment Prompter registration in `packages/website/components/index.tsx`
- [x] 1.2 Remove `@ts-nocheck` from `PrompterComponent.tsx` — no TypeScript errors found
- [x] 1.3 Remove hardcoded Storyblok API token — now uses `NEXT_PUBLIC_STORYBLOK_API_TOKEN` env var
- [x] 1.4 Replace German-language UI strings with English (component + 2 sub-components)
- [ ] 1.5 Verify Prompter renders in Storyblok Visual Editor (manual testing)

## Phase 2: Service Extraction (Medium Risk) ✅

### 2.1 Extract `planPage()` (🔴 Critical — 319 lines inline in MCP server) ✅

- [x] 2.1.1 Create `packages/storyblok-services/src/plan.ts` with `planPageContent()` function
- [x] 2.1.2 Extract `formatPatternsContext()` helper (shared by plan + generate-section)
- [x] 2.1.3 Extract pattern context string assembly (component frequency, sequences, sub-item counts)
- [x] 2.1.4 Extract component name resolution (tier 1 vs tier 2 detection, container slot names)
- [x] 2.1.5 Extract root field meta extraction for hybrid types
- [x] 2.1.6 Extract prompt construction (flat vs section-based branches)
- [x] 2.1.7 Extract OpenAI schema construction (enum generation for valid component types)
- [x] 2.1.8 Extract usage instruction assembly
- [x] 2.1.9 Export `planPageContent()`, `formatPatternsContext()`, and types from `storyblok-services/src/index.ts`

### 2.2 Extract `generateSection()` (🟡 High — 144 lines inline) ✅

- [x] 2.2.1 Create `packages/storyblok-services/src/generate-section.ts` with `generateSectionContent()`
- [x] 2.2.2 Reuse shared `formatPatternsContext()` from plan.ts (not directly used — site context is component-specific)
- [x] 2.2.3 Extract site context assembly (sub-component stats + frequency → prose)
- [x] 2.2.4 Extract system prompt layering (base + placeholder images + site context + transitions + recipes + field guidance)
- [x] 2.2.5 Extract response unwrapping (page envelope → first section)
- [x] 2.2.6 Export `generateSectionContent()` and types from `storyblok-services/src/index.ts`

### 2.3 Verify `generateRootField()` and `generateSeo()` are already extracted ✅

- [x] 2.3.1 Confirmed `generateRootFieldContent()` in `pipeline.ts` is fully self-contained
- [x] 2.3.2 Confirmed `generateSeoContent()` in `pipeline.ts` is fully self-contained
- [x] 2.3.3 No additional extraction needed (⚪ already done per research)

### 2.4 Update MCP server to use extracted functions ✅

- [x] 2.4.1 Replace inline `plan_page` logic in `index.ts` with call to shared `planPageContent()`
- [x] 2.4.2 Replace inline `generate_section` logic in `index.ts` with call to shared `generateSectionContent()`
- [x] 2.4.3 Update `services.ts` imports + re-exports + add `getClient()` method to `ContentGenerationService`
- [x] 2.4.4 Verified MCP server builds successfully — `pnpm --filter @kickstartds/storyblok-mcp-server run build` ✅

### 2.5 Update n8n node operations ✅

- [x] 2.5.1 n8n nodes use shared services — new exports available automatically
- [x] 2.5.2 Verified n8n node builds successfully — `pnpm --filter n8n-nodes-storyblok-kickstartds run build` ✅

### 2.6 Add tests for extracted functions

- [ ] 2.6.1 Add unit tests for `planPageContent()` in `storyblok-services/test/`
- [ ] 2.6.2 Add unit tests for `generateSectionContent()` in `storyblok-services/test/`

### 2.7 Patterns cache initialization ✅

- [x] 2.7.1 Ensure `analyzeContentPatterns()` can be called from Next.js API routes (not just long-running servers)
- [x] 2.7.2 Add lazy-init caching helper for API route context — implemented in `pages/api/prompter/_helpers.ts` (lazy registry singleton) and `patterns.ts` (in-memory cache keyed by `contentType:startsWith`)

## Phase 3: New API Routes (Medium Risk) ✅

Shared helpers in `pages/api/prompter/_helpers.ts`: CORS middleware, env validation, client factories (OpenAI, Storyblok Management/Content), lazy SchemaRegistry singleton, unified error handler.

- [x] 3.1 Create `/api/prompter/patterns` route — `pages/api/prompter/patterns.ts` (GET, wraps `analyzeContentPatterns()`, in-memory cache by `contentType:startsWith`)
- [x] 3.2 Create `/api/prompter/recipes` route — `pages/api/prompter/recipes.ts` (GET, loads `section-recipes.json` from MCP server package, filters by `contentType`)
- [x] 3.3 Create `/api/prompter/plan` route — `pages/api/prompter/plan.ts` (POST, wraps `planPageContent()`)
- [x] 3.4 Create `/api/prompter/generate-section` route — `pages/api/prompter/generate-section.ts` (POST, wraps `generateSectionContent()`)
- [x] 3.5 Create `/api/prompter/import` route — `pages/api/prompter/import.ts` (POST, wraps `importByPrompterReplacement()` with validation + compositional warnings + asset upload)
- [x] 3.6 Create `/api/prompter/ideas` route — `pages/api/prompter/ideas.ts` (GET, wraps Storyblok Ideas API)

## Phase 4: Component Rewrite (High Effort)

### Mode Toggle & Shared UI

- [ ] 4.1 Add mode toggle UI (Section ↔ Page) in PrompterComponent
- [ ] 4.8 Add content type auto-detection from current story
- [ ] 4.10 Remove client-side schema preparation (move to server-side API routes)
- [ ] 4.11 Update preview `componentMap` to handle all current component types

### Section Mode

- [ ] 4.2 Add component type picker with "+ Add another section" to build ordered list
- [ ] 4.3 Derive hybrid context (story neighbors for edge sections, list neighbors for inner)
- [ ] 4.4 Sequential `generate_section` calls with progress (reuse page mode progress UI)

### Page Mode

- [ ] 4.5 Add plan review UI (section sequence display, reorder, add/remove)
- [ ] 4.6 Implement section-by-section generation with progress indicator
- [ ] 4.7 Add per-section regenerate button in preview

### Quality & Warnings

- [ ] 4.9 Add compositional quality warnings display

## Phase 5: Polish & Testing (Medium Risk)

- [ ] 5.1 End-to-end testing in Storyblok Visual Editor
- [ ] 5.2 Add loading states and error handling for each API call
- [ ] 5.3 Handle edge cases: no OpenAI key, no patterns, empty plan
- [ ] 5.4 Deprecate old `/api/content`, `/api/import`, `/api/ideas` routes
- [ ] 5.5 Update CMS component schema with new fields (`mode`, `componentTypes`, `contentType`, etc.)
- [ ] 5.6 Documentation update (`docs/skills/`, `README.md`, `copilot-instructions.md`)
