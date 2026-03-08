# Design Tokens Editor Migration Checklist

**Tracking document for [design-tokens-editor-migration-prd.md](design-tokens-editor-migration-prd.md)**
**ADR:** [adr-design-tokens-editor-migration.md](adr-design-tokens-editor-migration.md)
**Branch:** `feature/inline-more-projects`
**Started:** 2026-03-08

---

## Phase 1 — Storyblok Content Type & Field Plugin

### CT-1: Create `token-theme` Content Type Schema

- [x] Create `packages/website/components/token-theme/token-theme.schema.json` (JSON Schema Draft-07)
- [x] Add `token-theme` to the `--templates` list in `create-storyblok-config` script (`packages/website/package.json`)
- [x] Run `pnpm --filter website create-storyblok-config` — verify `token-theme` appears in `cms/components.123456.json`
- [x] Patch `@kickstartds/jsonschema-utils@3.8.1` — add `"textarea"` and `"theme"` to AJV `ignoredFormats`
- [x] Patch `@kickstartds/jsonschema2storyblok` — add `format: "textarea"` → `type: "textarea"` mapping
- [x] Verify `token-theme.tokens` and `token-theme.css` render as `type: "textarea"` in generated config
- [ ] Inside `packages/website/cms/components.123456.json` strip to only the new component, push: `pnpm --filter website push-components`
- [ ] Run `pnpm --filter website generate-content-types` — verify TypeScript types include `TokenThemeStoryblok`

### CT-2: Add `theme` Field to Settings & Page

- [x] Create website-level `packages/website/components/page/page.schema.json` extending design system page schema with `theme` field (`format: "theme"`)
- [x] Create website-level `packages/website/components/settings/settings.schema.json` extending design system settings schema with `theme` field (`format: "theme"`)
- [x] Swap `--schema-paths` order in `create-storyblok-config` so `components` precedes `dist/components` (local extensions win on `$id` deduplication)
- [x] Patch `@kickstartds/jsonschema2storyblok` — add `format: "theme"` → `type: "custom"` + `field_type: "storyblok-theme-select-field-plugin"` mapping
- [x] Run `pnpm --filter website create-storyblok-config` — verify `page.theme` and `settings.theme` appear as `type: "custom"` with field plugin
- [ ] Push to Storyblok → regenerate types
- [ ] Manually create `settings/themes/` folder in Storyblok
- [ ] Create 2–3 test `token-theme` stories under `settings/themes/` to validate

### CT-3: Build `theme-selector` Field Plugin

- [x] Scaffold field plugin project (`packages/storyblok-theme-select-field-plugin/`)
- [x] Implement CDN API query for `token-theme` stories (`starts_with: "settings/themes/"`)
- [x] Render searchable dropdown with theme names + primary color dot
- [x] Store selected theme UUID as field value, with "None" clear option
- [x] Wire `format: "theme"` in JSON Schema → `field_type: "storyblok-theme-select-field-plugin"` in generated CMS config (via pnpm patch)
- [ ] Deploy field plugin to Storyblok

---

## Phase 2 — Website Runtime Integration

### RT-1: Theme UUID Resolution in `fetchPageProps()`

- [x] Update `fetchPageProps()` in `helpers/storyblok.ts` to resolve theme UUIDs
- [x] Fetch `token-theme` story by UUID → extract `css` field
- [x] Return resolved theme CSS alongside existing settings/page props

### RT-2: Token Resolution & Injection in `_app.tsx`

- [x] Extend token resolution: `themeCSS + manualTokenCSS` (theme first, manual overrides on top)
- [x] Support both `page.theme` and `settings.theme` with priority chain
- [x] Inject combined CSS via existing `<style data-tokens>` mechanism

### RT-3: Google Fonts Detection in `_document.tsx`

- [x] Update font detection regex to parse both theme CSS and manual token CSS
- [x] Ensure Google Fonts `<link>` tags are injected for theme-referenced fonts

---

## Phase 3 — Editor Backend Migration

### EB-1: Create Express Server

- [x] Create `packages/design-tokens-editor/src/server/index.ts` — Express server
- [x] Implement `GET /api/tokens/` — list `token-theme` stories via Storyblok Management API
- [x] Implement `GET /api/tokens/:name` — fetch `token-theme` story by slug
- [x] Implement `POST /api/tokens/:name` — create `token-theme` story via Management API
- [x] Implement `PUT /api/tokens/:name` — update `token-theme` story via Management API
- [x] Implement `DELETE /api/tokens/:name` — delete `token-theme` story via Management API
- [x] Add `tokensToCss()` call on POST/PUT to populate `css` field
- [ ] Add JSON Schema validation on POST/PUT (`branding-tokens.schema.validate.mjs`)
- [x] Implement `GET /api/health` health check endpoint
- [x] Serve Vite SPA static files from Express in production mode

### EB-2: Update Vite Config

- [x] Remove `@netlify/vite-plugin` from `vite.config.ts`
- [x] Keep dual entry points (`index.html` + `preview.html`)
- [x] Add Vite proxy for `/api` to Express server in dev mode
- [ ] Verify dev mode still works with Express server proxy

### EB-3: Deployment Artifacts

- [x] Create `packages/design-tokens-editor/Dockerfile` (multi-stage build)
- [x] Create `config/deploy-design-tokens-editor.yml` (Kamal config)
- [ ] Add environment variables to `.kamal/secrets`
- [ ] Verify `docker build` succeeds locally

---

## Phase 4 — Cleanup & Documentation

### CL-1: Remove Netlify Dependencies

- [x] Remove `@netlify/blobs` from `devDependencies`
- [x] Remove `@netlify/functions` from `devDependencies`
- [x] Remove `@netlify/vite-plugin` from `devDependencies`
- [x] Delete `packages/design-tokens-editor/netlify.toml`
- [x] Delete `packages/design-tokens-editor/netlify/` directory
- [x] Run `pnpm install` — verify clean resolution

### CL-2: Documentation Updates

- [x] Update `copilot-instructions.md` — remove "stays on Netlify" note, update deployment info to Kamal/Docker + Express backend + Storyblok storage
- [x] Update `monorepo-integration-checklist.md` — mark Netlify migration as superseded by Storyblok + Kamal/Docker
- [x] Root `package.json` convenience scripts — verified `dev:tokens-editor` already present, no changes needed
- [x] Clean up `.gitignore` — removed Netlify folder reference from `packages/design-tokens-editor/.gitignore`; root `.gitignore` already has `dist/` entry

---

## Phase 5 — MCP & n8n Integration (deferred)

### MI-1: Shared Services — Theme Helpers

Extract reusable theme CRUD logic from the Express backend into `storyblok-services` so both MCP and n8n can share it:

- [x] Create `packages/storyblok-services/src/themes.ts` with shared helpers:
  - `listThemes(client, spaceId)` — list `token-theme` stories under `settings/themes/`
  - `getTheme(client, spaceId, slugOrUid)` — fetch a single theme story by slug or UUID
  - `applyTheme(client, spaceId, storyUid, themeUid, scope)` — set `theme` field on a page or settings story (`scope: "page" | "settings"`)
  - `previewThemeCSS(client, spaceId, themeUid)` — resolve theme UUID → return compiled CSS (for preview use)
- [ ] Refactor `packages/design-tokens-editor/src/server/routes.ts` to use shared helpers (optional, keeps editor backend thin)

### MI-2: Storyblok MCP Server — Theme Tools

Register new tools in `packages/storyblok-mcp/src/register-tools.ts` following the existing `registerTool()` + Zod schema + `TOOL_DESCRIPTIONS` pattern:

- [x] `list_themes` — list available `token-theme` stories (name, slug, primary color preview). Lightweight, read-only, no output schema needed. Useful for LLMs to discover available themes before applying one.
- [x] `get_theme` — fetch full theme config (branding tokens JSON + compiled CSS) for a specific theme. Supports lookup by slug or UUID.
- [x] `apply_theme` — set `theme` field (UUID) on a page or settings story. Accepts `storyUid` + `themeUid` + `scope: "page" | "settings"`. Could also accept `themeSlug` for convenience (resolved server-side). Add output schema with `success`, `storyId`, `previousTheme`, `newTheme`.
- [x] `remove_theme` — clear the `theme` field on a page or settings story (reset to default branding). Thin wrapper around `apply_theme(themeUid: null)`.
- [x] Add Zod schemas to `src/config.ts` for all 4 tools
- [x] Add output schemas to `src/output-schemas.ts` for write tools (`apply_theme`, `remove_theme`)
- [x] Add `theme-management` prompt to `src/prompts.ts` — guided workflow: `list_themes` → pick theme → `apply_theme` (per-page or global)

### MI-3: n8n Node — Theme Operations

Add a `Theme` resource to the n8n node alongside existing `AI Content`, `Story`, and `Space` resources:

- [x] Create `packages/storyblok-n8n/nodes/StoryblokKickstartDs/descriptions/ThemeDescription.ts`
- [x] Add operations: `list`, `get`, `apply`, `remove`
- [x] Wire operations to shared helpers from `storyblok-services/src/themes.ts`
- [ ] Add workflow template: "Apply theme to all pages matching a slug pattern"

### MI-4: Documentation & PRD Alignment

- [x] Update `docs/design-token-theming-prd.md` — align with `token-theme` content type architecture and theme field plugin
- [x] Add theme tools to MCP server README / tool catalog
- [x] Add theme operations to n8n node README
