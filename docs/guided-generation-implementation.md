# Guided Generation — Implementation Checklist

> **Status: ✅ FULLY IMPLEMENTED** — All phases (1–4) complete. Subsequently extended with multi-content-type support (`contentType` parameter on all tools, content-type-specific recipes/templates).

Tracking document for implementing all four phases from
[guided-generation-plan.md](guided-generation-plan.md).

---

## Phase 1 — Immediate (skill files + static recipes)

- [x] **1.1** Create `mcp-server/schemas/section-recipes.json` with curated recipes, page templates, and anti-patterns
- [x] **1.2** Register `section-recipes.json` as an MCP resource in `mcp-server/src/index.ts`
- [x] **1.3** Add `typicalUsage` and `typicalSubItemCount` hints to `list_components` annotations in `mcp-server/src/index.ts`
- [x] **1.4** Create `docs/skills/plan-page-structure.md` skill file (section-by-section workflow)
- [x] **1.5** Update `docs/skills/create-page-from-scratch.md` to prefer section-by-section generation
- [x] **1.6** Update `docs/skills/extend-existing-page.md` to reference pattern analysis
- [x] **1.7** Update `docs/skills/content-audit.md` to include structural consistency checks
- [x] **1.8** Update `docs/skills/migrate-from-url.md` to reference recipes and patterns

## Phase 2 — Space-Aware Intelligence

- [x] **2.1** Implement `analyzeContentPatterns()` function in `mcp-server/src/services.ts`
- [x] **2.2** Add Zod schemas for all new tools in `mcp-server/src/config.ts`
- [x] **2.3** Register `analyze_content_patterns` tool definition in `mcp-server/src/index.ts`
- [x] **2.4** Add tool handler for `analyze_content_patterns` in `mcp-server/src/index.ts`
- [x] **2.5** Update skill files to reference `analyze_content_patterns` as first step (done in Phase 1)

## Phase 3 — Unified Experience

- [x] **3.1** Add `ValidationWarning` type and `checkCompositionalQuality()` to `shared/storyblok-services/src/validate.ts`
- [x] **3.2** Export new warning types and functions from `shared/storyblok-services/src/index.ts`
- [x] **3.3** Add `getCompositionalWarnings()` helper in `mcp-server/src/index.ts`
- [x] **3.4** Surface warnings in `import_content`, `import_content_at_position`, and `create_page_with_content` responses
- [x] **3.5** Implement `list_recipes` tool (merges static recipes + live patterns from `analyzeContentPatterns`)
- [x] **3.6** Implement `plan_page` tool (AI-assisted section planning with site patterns and OpenAI)

## Phase 4 — Polished Convenience

- [x] **4.1** Implement `generate_section` tool (auto-injects site context, recipe hints, transition guidance)

---

## Verification

- [x] Shared services package compiles cleanly (`npx tsc --noEmit`)
- [x] Shared services package builds cleanly (`npm run build`)
- [x] MCP server compiles cleanly (`npx tsc --noEmit`)
