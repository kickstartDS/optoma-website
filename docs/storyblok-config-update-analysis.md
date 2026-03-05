# Storyblok Config Update Analysis

> **Created:** 2026-03-05
> **Context:** Analysis of `components.123456.json` (generated) vs `components-schema.json` (live) to understand risks and strategies for pushing updated component configs after schema layer changes (e.g. visibility layer).

---

## 1. Current State of Drift

The generated `packages/website/cms/components.123456.json` has **69 components**, while the live `packages/website/types/components-schema.json` has **76 components**.

### 1a. Components only in live (7 — manually added after init)

| Component            | Purpose                 |
| -------------------- | ----------------------- |
| `button`             | Standalone button       |
| `descriptionItems`   | Description list items  |
| `energy-calculator`  | Custom domain component |
| `meter-form`         | Custom domain component |
| `meter-reading-form` | Custom domain component |
| `timeline`           | Timeline component      |
| `timelineItems`      | Timeline sub-component  |

These are **safe** during a push — `storyblok components push` only creates/updates components present in the file, it never deletes absent ones.

### 1b. Schema fields only in live (manually added post-init) — AT RISK

If you push the full generated file, these fields would be **overwritten/removed** because `storyblok components push` replaces the entire schema of a matched component:

| Component        | Fields that would be lost                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `cta`            | `inverted`                                                                                                                                |
| `hero`           | `mobileTextBelow`                                                                                                                         |
| `page`           | `footer_logo`, `header_logo`, `hiedBreadcrumbs`, `token`                                                                                  |
| `section`        | `aiDraft`                                                                                                                                 |
| `settings`       | `hideBreadcrumbs`                                                                                                                         |
| `split-even`     | `firstLayout_layout`, `firstLayout_stretchVertically`, `secondLayout_layout`, `secondLayout_stretchVertically`, `stretchContent` + 2 tabs |
| `split-weighted` | `asideLayout_layout`, `asideLayout_stretchVertically`, `mainLayout_layout`, `mainLayout_stretchVertically`                                |
| `stats`          | `align`                                                                                                                                   |

**This is the biggest risk.** Any existing content that uses these fields would still have the data stored on the story, but the field definition would vanish from the component schema — making it invisible in the Visual Editor and potentially orphaned.

### 1c. Component Group UUID mismatch

The generated file uses **locally-generated UUIDs** for component groups (`Components`, `FirstComponents`, `Global`), but the live system assigns its **own UUIDs** at creation time. The generated file references:

| Group             | Generated UUID                         | Live UUID                                                |
| ----------------- | -------------------------------------- | -------------------------------------------------------- |
| `Components`      | `ab810e22-a464-4876-9f50-9a126b0cbb16` | `b2d71812-e4b5-4525-9832-549eb8322725`                   |
| `FirstComponents` | `d6dc36ea-6625-4103-8784-af891d6b18bb` | _(doesn't exist in live — consolidated into Components)_ |
| `Global`          | `4ccc7daa-eeb1-4f0b-9f51-99e9707e10e4` | `92914027-98be-4347-a164-f55476b59eee`                   |

This affects `component_group_whitelist` on blok fields (`section.components`, `slider.components`, `split-even.firstComponents`, etc.). **Pushing stale UUIDs would break which components are allowed inside composition slots.**

#### Affected `component_group_whitelist` fields

| Component.Field                  | Generated                | Live                                |
| -------------------------------- | ------------------------ | ----------------------------------- |
| `global.global`                  | `[ab810e22…]`            | `[b2d71812…]`                       |
| `section.components`             | `[ab810e22…, 4ccc7daa…]` | `[b2d71812…, 92914027…]`            |
| `slider.components`              | `[ab810e22…]`            | `[b2d71812…, 92914027…]`            |
| `split-even.firstComponents`     | `[d6dc36ea…]`            | `[b2d71812…, 92914027…]`            |
| `split-even.secondComponents`    | `[2d07c612…]`            | `[2d07c612…, b2d71812…, 92914027…]` |
| `split-weighted.asideComponents` | `[029a2a48…]`            | `[029a2a48…, b2d71812…, 92914027…]` |
| `split-weighted.mainComponents`  | `[0ba8037d…]`            | `[0ba8037d…, b2d71812…, 92914027…]` |

### 1d. Component group assignments diverged

The generated file assigns 14 components to `FirstComponents`, but in live these are all under `Components` (likely the groups were consolidated manually). Pushing would re-split them.

Affected components: `blog-teaser`, `business-card`, `content-nav`, `divider`, `downloads`, `event-latest-teaser`, `event-list-teaser`, `faq`, `html`, `image-story`, `mosaic`, `prompter`, `slider`, `video-curtain`.

### 1e. Live metadata not in generated file

Live components carry extra keys that the generator never produces: `description`, `image`, `preview_field`, `preview_tmpl`, `all_presets`, `preset_id`, `internal_tags_list`, `internal_tag_ids`, `content_type_asset_preview`, `metadata`. The CLI ignores most of these (they're read-only server-side), but `all_presets` (105 presets in live, 0 in generated) is noteworthy — presets are managed separately via the presets file.

### 1f. The `prompter` whitelist difference

The live `page.section` allows `['section', 'prompter']` while generated only has `['section']`. Pushing would remove the ability to place the Prompter inside pages in the Visual Editor.

---

## 2. Pitfalls to Avoid

1. **Full-file push is destructive for manually-added fields.** The CLI replaces the _entire_ schema of every component in the file. There's no merge — it's a full overwrite per component.

2. **Component group UUIDs are server-assigned.** You can't predict them. The generated file's UUIDs are placeholders that become stale after first init. A push with wrong UUIDs silently breaks blok-field restrictions.

3. **Tab UUIDs are also positional.** Fields like `tab-649fe063-2a01-4d6c-835a-4c2a90b56803` create field grouping in the UI. If these change, field ordering in the editor shifts.

4. **No selective field update.** The CLI replaces the _entire_ component schema on push. Even if you only want to add a visibility change to one field, you must push the complete field set. You can target a single component with `--filter` or `storyblok components push <name>`, but it's still a full schema replacement — not a field-level merge.

5. **Preset references use component IDs.** The presets file references components by `component_id`. The generated file uses placeholder IDs (0, 1, 2…) while live has real IDs (134345…). Pushing presets alongside re-generated components could break associations.

---

## 3. Recommendations for Safe Updates

### Strategy A: Merge-before-push (recommended)

Instead of pushing the raw generated file, build a merge step:

1. **Pull the live config** (`components-schema.json`) as the base.
2. **Apply only the delta** from the newly generated config — e.g. if the visibility layer hides a field, add the appropriate field config, but preserve all live-only fields, UUIDs, and tabs.
3. **Push the merged result.**

This requires a script that does a per-component, per-field diff and merge.

### Strategy B: Single-component push

For the "push a single component" use case:

1. Extract the target component from the newly generated config.
2. Fetch the live version of that component from `components-schema.json` (or via the Storyblok Management API directly).
3. Merge: start with the live component, overlay only the fields that exist in the generated version, preserve live-only fields.
4. Push via `storyblok components push <name>` or `--filter <glob>` (see Appendix C).

The merge step (3) is still necessary — even single-component push is a full schema replacement.

### Strategy C: Use the Management API directly

Instead of the CLI, call `PUT /v1/spaces/:space_id/components/:component_id` per component. This gives you full control and lets you read-then-patch individual components. Advantages:

- Full programmatic control — read current state, merge, then write in one script
- No UUID mismatch risk since you're working with server-assigned values

CLI v4 already covers single-component targeting (`components push <name>`) and dry-run preview (`--dry-run`). The remaining advantage of the Management API is that the _read_ step is built-in (you GET before you PUT), whereas the CLI still requires a separate pull + merge + push cycle. See Appendix D for the chosen approach.

---

## 4. Proposed Per-Component Update Flow

```
1. Generate new config (with visibility layer)
2. Pull current live config from Storyblok
3. Run merge script (see Appendix D, Phase 1):
   For each component in the generated config:
   a. Look up live component by name
   b. Merge:
      - Keep live-only fields (manual additions)
      - Keep live component_group_uuid / component_group_whitelist values
      - Apply new/changed field configs from the generated version
      - Apply visibility changes (x-cms-hidden → field group/tab changes)
      - Preserve tabs with their live UUIDs
   c. Write merged component to output file
4. Review merge report
5. Dry-run push (CLI v4: --dry-run)
6. Push merged config
7. Skip components that have zero changes after merge
```

This avoids every pitfall above, supports selective single-component updates via `components push <name>` / `--filter`, and is implemented as a concrete workflow in Appendix D (Phase 3).

---

## Appendix A: Storyblok CLI Push/Pull Internals

> **Reference implementation:** v3.36.1 source (`node_modules/.pnpm/storyblok@3.36.1/node_modules/storyblok/dist/cli.mjs`). The core push/pull logic is **unchanged in v4** (see Appendix C) — these internals still apply.

### `pull-components` (L1893–L1938)

Straightforward read-only operation:

1. Calls `api.getComponentGroups()` to fetch all component groups
2. Calls `api.getComponents()` to fetch all components
3. Calls `api.getPresets()` to fetch all presets
4. **Enriches** each component with `component_group_name` by looking up `component_group_uuid` against the fetched groups
5. Writes `components.{spaceId}.json` with `{ components, component_groups }` and `presets.{spaceId}.json` separately
6. Supports `--separate-files` to write one file per component instead of a single monolith
7. Supports `--resolve-datasources` to inline datasource options into option fields

The pull dumps **everything** the API returns — including `all_presets`, `internal_tags_list`, `metadata`, `preview_field`, etc. This is why the live file has all those extra keys not present in the generated file.

### `push-components` (L2017–L2185)

Significantly more complex. Step-by-step flow:

#### Step 1 — Parse inputs

Reads the source JSON and extracts three lists: `components`, `component_groups`, and `presets` (from the separate presets file via `--presets-source`).

#### Step 2 — Push component groups first

Builds a tree from `component_groups` (supports parent/child nesting) and creates them via `POST component_groups`. If a group already exists, it catches the error and logs a warning — **it does NOT update existing groups**. Newly created groups are pushed to a module-level `listOfGroups` array.

#### Step 3 — For each component in the file

**a) Fetch presets from the source file** — matches presets to components by `component_id` (the local file's IDs).

**b) Clean up IDs** — `delete components[i].id` and `delete components[i].created_at` — these are stripped before sending to the API.

**c) Resolve component group** — Looks up `component_group_name` in the `listOfGroups` (which only contains groups the CLI just created in step 2) to get the real UUID → sets `component_group_uuid`. Then deletes `component_group_name`.

**d) Handle internal tags** — Processes `internal_tags_list`: creates tags that don't exist yet, maps existing ones by name → builds `internal_tag_ids`.

**e) Remap `component_group_whitelist` UUIDs** — For every schema field that has a `component_group_whitelist`, it tries to map each UUID via `getGroupByUuid()`:

```js
schema[field].component_group_whitelist = schema[
  field
].component_group_whitelist.map(
  (uuid) =>
    getGroupByUuid(listOfGroups, uuid)
      ? getGroupByUuid(listOfGroups, uuid).uuid
      : uuid // ← falls back to the UUID as-is if not found!
);
```

**Critical insight:** `getGroupByUuid` searches by `source_uuid` — a property that only exists on groups the CLI just created and that maps the _old_ UUID to the _new_ one. If the group already existed (creation was skipped with a warning), the mapping is absent, and the **stale UUID from the file passes through unchanged**. This is the root cause of the UUID mismatch problem identified in §1c.

**f) Match against live components** — Calls `api.getComponents()` to get all existing components, then does a name-based match:

```js
const exists = apiComponents.filter((comp) => comp.name === components[i].name);
```

**g) If component EXISTS → UPDATE:**

- Fetches the component by ID: `api.get(`components/${id}`)`
- Handles presets: compares source presets against target presets **by name** — creates new ones (`POST`), updates matching ones (`PUT`)
- **Replaces the entire component** via `api.put(`components/${id}`, { component: components[i] })` — this is a **full replacement**, not a merge. The entire `schema` object is overwritten.

**h) If component does NOT exist → CREATE:**

- Creates via `api.post("components", { component: components[i] })`
- Creates presets afterward
- Sets default preset if applicable

### Key Behaviors Summary

| Behavior                                                     | Implication                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| **Full schema replacement** on update                        | Any field in live but not in the file gets deleted              |
| **Name-based matching**                                      | Works reliably — component names are stable identifiers         |
| **Group UUID remapping only works for newly-created groups** | Pre-existing groups keep stale UUIDs from the file              |
| **No delete**                                                | Components in Storyblok but absent from the file are untouched  |
| **Preset matching by name**                                  | Presets are upserted by name — generally safe                   |
| **`id` and `created_at` are stripped**                       | File IDs are irrelevant; the API assigns real IDs on create     |
| **Sequential processing**                                    | Components are pushed one at a time, not in parallel            |
| **Dry-run available**                                        | `--dry-run` flag previews changes without pushing               |
| **Module-level `listOfGroups`**                              | Shared mutable state — groups created in this push session only |

### Single-Component Push

The CLI supports pushing a single component via `storyblok components push <name>` or `--filter <glob>` — no need to craft a single-component JSON file.

The same full-replacement caveat applies — the single component's schema must include **all** its fields (including any manually-added live ones), not just the generated ones.

---

## Appendix B: Preset Behavior in the Push Flow

### How the CLI Matches Presets to Components

The `PresetsLib.getComponentPresets()` method (L971) matches presets to components using the **file-local `component_id`**:

```js
return presets.filter((preset) => preset.component_id === component.id);
```

This is only used for grouping — when actually creating/updating presets in Storyblok, `createPresets()` (L942) overwrites `component_id` with the **real ID** returned by the Storyblok API:

```js
preset: { name: presetData.name, component_id: componentId, preset: presetData.preset, image: presetData.image }
```

So placeholder IDs in the generated file are harmless **for the API call itself**.

### Name-Based Upsert Logic

For existing components, `filterPresetsFromTargetComponent()` (L988) compares presets by **name**:

- Presets in the file whose name **doesn't exist** on the live component → **POST** (create new)
- Presets in the file whose name **matches** a live preset → **PUT** (update existing, using live preset's ID)
- Live presets **not in the file** → **untouched** (CLI never deletes presets)

### Preset Count Parity

Both the generated `presets.123456.json` and the live `components-presets.json` contain exactly **105 presets**. Preset names match 1:1 per component — with one critical exception (see below).

### Critical Bug: `section` / `prompter` ID Collision

Both `section` and `prompter` are assigned **`id: 299`** in the generated components file. Since `getComponentPresets()` matches by `component_id`, the 10 section-layout presets are returned for **both** components:

| Preset             | Generated `component_id` | Intended component | Live component |
| ------------------ | ------------------------ | ------------------ | -------------- |
| `DynamicLayout`    | 299                      | `section`          | `section`      |
| `TileLayout`       | 299                      | `section`          | `section`      |
| `ListLayout`       | 299                      | `section`          | `section`      |
| `Slider`           | 299                      | `section`          | `section`      |
| `Inverted`         | 299                      | `section`          | `section`      |
| `AccentBackground` | 299                      | `section`          | `section`      |
| `BoldBackground`   | 299                      | `section`          | `section`      |
| `Framed`           | 299                      | `section`          | `section`      |
| `BackgroundImage`  | 299                      | `section`          | `section`      |
| `WithButtons`      | 299                      | `section`          | `section`      |

**What happens during sequential push:**

| Step | Component  | `getComponentPresets` returns           | Live presets on target               | Result                                                   |
| ---- | ---------- | --------------------------------------- | ------------------------------------ | -------------------------------------------------------- |
| 1    | `section`  | 10 layout presets + section's own       | 10 layout presets exist on `section` | All 10 matched by name → PUT update (harmless)           |
| 2    | `prompter` | Same 10 layout presets + prompter's own | 0 layout presets on `prompter`       | 10 presets are **NEW** → POST creates them on `prompter` |

**Result:** After push, the 10 layout presets exist on **both** `section` (correctly updated) **and** `prompter` (incorrectly created). The prompter component gets 10 spurious presets it shouldn't have.

### Root Cause

The `create-storyblok-config` generator assigns the same `id: 299` to both `section` and `prompter` — likely because prompter is derived from section in the schema (they share the same base component). In the live Storyblok space, each component has a distinct API-assigned ID, so this collision doesn't exist.

### Risk Assessment

| Aspect                        | Risk   | Detail                                                                      |
| ----------------------------- | ------ | --------------------------------------------------------------------------- |
| Existing preset updates       | Low    | Name matching ensures correct updates                                       |
| Preset deletion               | None   | CLI never deletes presets                                                   |
| `id: 0` placeholders          | None   | `id` is stripped; CLI uses live ID for PUT                                  |
| `component_id` resolution     | None   | Real API ID is always used for the POST/PUT call                            |
| **Prompter preset pollution** | Medium | 10 section-layout presets wrongly created on `prompter`                     |
| Cleanup                       | Manual | Spurious presets must be deleted via Management API (no CLI delete command) |

### Recommendations

1. **Fix the generated file** — Ensure `section` and `prompter` have distinct placeholder IDs so presets are correctly assigned
2. **Filter presets before push** — Remove section-layout presets from the presets file, push only component-specific presets
3. **Skip presets entirely** — If live presets are already correct, omit the presets file (CLI only processes presets if present alongside the components file)

---

## Appendix C: Storyblok CLI Changelog (3.36.1 → 4.15.2)

> **Source:** [github.com/storyblok/monoblok/releases](https://github.com/storyblok/monoblok/releases) (filtered for `storyblok@4.*` tags)

The Storyblok CLI moved from a standalone repo to the `monoblok` monorepo at 4.0.0. The core `push-components` and `pull-components` code was ported as-is — **no behavioral changes** to the push/pull flow documented in Appendix A.

### CLI-Only Releases

| Version    | Date        | Category | Changes                                                                                       |
| ---------- | ----------- | -------- | --------------------------------------------------------------------------------------------- |
| **4.0.0**  | 2025-06-23  | Major    | Monorepo migration — CLI moved into `monoblok`. Core push/pull code ported unchanged.         |
| 4.0.5      | 2025-07-07  | Fix      | Handle uniqueness for nested presets with hierarchical keys (#179)                            |
| 4.1.0      | 2025-07-09  | Feature  | `storyblok create` command. Fix: remove unnecessary auth on `types generate` for CI           |
| 4.2.0      | 2025-07-17  | Feature  | Datasources pull/push/delete. Datasources added as dependency to `push-components`            |
| 4.3.2      | 2025-08-06  | Fix      | **Removed** datasources from `push-components`. Sanitize filenames. Tag-based type generation |
| 4.4.0      | 2025-08-26  | Feature  | UTM params in space URLs, org/partner space creation                                          |
| **4.5.0**  | 2025-09-05  | Feature  | Internal client swap to `@storyblok/management-api-client`                                    |
| 4.6.0      | 2025-09-10  | Feature  | Stream-based migrations. Fix: multilink type generation                                       |
| 4.6.14     | 2025-11-07  | Fix      | Recursive fetching for paginated datasources                                                  |
| 4.7.0      | 2025-11-18  | Feature  | Datasource types in `types generate`. Several type gen fixes                                  |
| 4.8.0–4.10 | Nov–Dec '25 | Feature  | Migration tooling: loggers, reporters, target space support                                   |
| **4.11.0** | 2025-12-04  | Feature  | Config system (`.storyblok` config file)                                                      |
| 4.12.0     | 2025-12-31  | Feature  | Region flag for `create` command                                                              |
| 4.13.0     | 2026-01-20  | Feature  | Interactive login flow for `create` command                                                   |
| **4.14.0** | 2026-01-27  | Feature  | **New: Stories and assets pull/push commands**                                                |
| 4.14.1     | 2026-01-29  | Fix      | Pushing stories with required fields                                                          |
| 4.14.3     | 2026-02-10  | Fix      | Recursive types for better type checking                                                      |
| 4.15.0     | 2026-02-11  | Feature  | Separate type file generation                                                                 |
| 4.15.1     | 2026-02-23  | Fix      | Story parent ID ordering, publishing status preservation                                      |
| 4.15.2     | 2026-03-03  | Fix      | Windows path support, build fixes                                                             |

### Key v4 Changes from Blog Post

> **Source:** [storyblok.com/mp/introducing-storyblok-cli-v4](https://www.storyblok.com/mp/introducing-storyblok-cli-v4) (June 19, 2025)

The blog post reveals several capabilities not obvious from the release notes alone:

#### New command structure (`domain verb` replaces `verb-domain`)

| v3 command                               | v4 command                      |
| ---------------------------------------- | ------------------------------- |
| `storyblok pull-components`              | `storyblok components pull`     |
| `storyblok push-components`              | `storyblok components push`     |
| `storyblok generate-migration`           | `storyblok migrations generate` |
| `storyblok run-migration`                | `storyblok migrations run`      |
| `storyblok generate-typescript-typedefs` | `storyblok types generate`      |

#### Single-component push by name (new in v4)

```bash
storyblok components push button --space 78910
```

This is a **first-class feature** now — no need to create a single-component JSON file. Directly pushes one component by name. This directly supports our Strategy B (§3) use case.

#### Glob-based pull

```bash
storyblok components pull "marketing-*" --space 78910
```

Selective pull by name pattern — useful for inspecting a subset of live components.

#### Cross-space push with `--from`

```bash
storyblok components push --space 5678 --from 1234
```

Pull from one space and push to another in a single command. Not directly relevant for our use case but useful for staging → production workflows.

#### Separated file output

v4 writes pulled artifacts into a structured `.storyblok` directory instead of the root:

```
.storyblok/
├─ components/
│  └── SPACE_ID/
│      ├── components.json    # All components
│      ├── groups.json        # Component groups (separate!)
│      ├── presets.json       # Component presets (separate!)
│      └── tags.json          # Component tags
├─ migrations/
└─ types/
```

Key difference: **groups, presets, and tags are now in separate files** instead of being bundled into one monolithic JSON. This is a more granular layout. Override path with `--path` flag.

#### `sync` command dropped

The v3 `sync` command (full cross-space sync of stories, roles, datasources, etc.) is **not in v4**. They're reimagining it as a server-side endpoint. For now, use `components pull` + `components push` for schema transfers. We don't use `sync` currently.

#### Other improvements

- **`--verbose` flag** for full error details (no more `[Object object]` stack traces)
- **`--dry-run`** support for `components push` (confirmed in docs — `modules.components.push.dryRun` config option)
- **Smart retries & back-off** for flaky networks (`api.maxRetries` config option)
- Better UI with color-coded domain badges, progress spinners, and timing

### v4 Config System (from CLI docs)

> **Source:** [storyblok.com/docs/libraries/storyblok-cli](https://www.storyblok.com/docs/libraries/storyblok-cli)

The v4 CLI introduces a layered config file system that eliminates repeated `--space` and `--region` flags:

#### Config file format

```ts
// storyblok.config.ts
import { defineConfig } from "storyblok/config";

export default defineConfig({
  region: "eu",
  space: "123456",
  path: ".storyblok",
  verbose: false,
  api: {
    maxRetries: 3,
    maxConcurrency: 6,
  },
  modules: {
    components: {
      pull: {
        separateFiles: false,
        filename: "components",
      },
      push: {
        dryRun: false,
      },
    },
    types: {
      generate: {
        output: "storyblok-component-types.d.ts",
      },
    },
  },
});
```

Supports `.ts`, `.mjs`, `.cjs`, `.json`, `.yaml`, `.toml`, and more. Runs in Node, so `process.env` is available — can read from `.env.local` via `dotenv`.

#### Config layers (merged, higher overrides lower)

1. **Home directory:** `~/.storyblok/config.*` — global defaults
2. **Workspace:** `<workspace>/.storyblok/config.*` — monorepo-level
3. **Project root:** `<project>/storyblok.config.*` — per-package
4. **CLI flags** — always win

#### Key flags confirmed in docs

| Flag/Config        | Domain                 | Description                                                                            |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------- |
| `--dry-run`        | `components push`      | Preview changes without pushing (also: datasources push, stories push, migrations run) |
| `--filter "glob*"` | `components push`      | Push only components matching glob pattern                                             |
| `--separate-files` | `components pull/push` | One file per component (must match between pull and push)                              |
| `--from`           | `components push`      | Source space ID for cross-space sync                                                   |
| `--path`           | All commands           | Override output directory (default: `.storyblok/<domain>/<space-id>/`)                 |

### Impact Assessment for Our Use Case

**`components push` / `components pull`:** Core behavior (full schema replacement, name-based matching, group UUID remapping issues, preset matching) is identical to the v3 internals documented in Appendix A.

**Single-component push by name** (`storyblok components push <name>`) is the most impactful feature for our workflow. Directly supports Strategy B (§3).

**Separated file output** (`groups.json`, `presets.json`, etc.) simplifies our merge workflow — we can pull groups separately to get the correct UUIDs without parsing a monolithic file.

**`--dry-run` flag** lets us preview what would change before pushing. Essential for the safe push workflow.

**Preset fix in 4.0.5** (#179): Fixes hierarchical key uniqueness for nested presets. Does not change the push flow itself.

**Config system** (4.11.0): Eliminates repeated `--space` and `--region` flags via `storyblok.config.ts`.

**Story/asset push commands** (4.14.0): `storyblok stories push` and `storyblok assets push` — separate from component push, potentially useful for content migration.

**`sync` command dropped:** Not available in v4. We don't use it currently.

**Caveat:** The fundamental limitations (full schema replacement, no merge, stale UUID passthrough) are **not fixed** in v4. Our merge-before-push strategy (§3 Strategy A) remains necessary. The v4 CLI gives us better tooling around it (`--dry-run`, `--filter`, config file), not a fix for the core problem.

### Features We'll Use

| Feature                                              | Version | How it helps                                  |
| ---------------------------------------------------- | ------- | --------------------------------------------- |
| **Single-component push** (`components push <name>`) | 4.0.0   | Strategy B — push one component after merge   |
| **`--dry-run`**                                      | 4.0.0   | Preview changes before pushing                |
| **`--filter <glob>`**                                | 4.0.0   | Push subset of components                     |
| **Separated file output** (groups/presets/tags)      | 4.0.0   | Cleaner merge inputs                          |
| **Config file** (`storyblok.config.ts`)              | 4.11.0  | No more `--space`/`--region` flags everywhere |
| **Preset uniqueness fix**                            | 4.0.5   | Handles nested preset key collisions          |
| **`--verbose`**                                      | 4.0.0   | Better error diagnostics                      |
| **Story/asset push**                                 | 4.14.0  | Future content migration workflows            |

---

## Appendix D: Implementation Strategy

This appendix covers the full technical approach to safely push updated component configs to Storyblok after schema layer changes and establish a repeatable workflow for future config updates.

### Problem Summary

We have two interleaved problems to solve:

1. **Config drift** (§1–§2) — The generated config has diverged from live Storyblok. Pushing it naively would destroy ~20 manually-added fields, break UUID-based component whitelists, and pollute prompter with section presets.
2. **No merge capability** (§3–§4, Appendix A) — The CLI does full schema replacement per component. There is no selective field update, even in v4.

### Technical Approach: Merge Script + CLI v4

The core of the implementation is a **merge script** that sits between `create-storyblok-config` (generates from schemas) and `storyblok components push` (pushes to Storyblok). This is Strategy A from §3, implemented as a concrete Node.js script.

```
┌─────────────────────────┐     ┌───────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ create-storyblok-config │ ──▸ │   merge-config    │ ──▸ │ components push  │ ──▸ │    Storyblok    │
│ (kickstartDS CLI)       │     │ (new script)      │     │ (Storyblok CLI)  │     │    Space        │
│                         │     │                   │     │                  │     │                 │
│ Inputs:                 │     │ Inputs:           │     │ Inputs:          │     │                 │
│ • base DS schemas       │     │ • generated config│     │ • merged config  │     │                 │
│ • cms/ layer            │     │ • live config     │     │ (or single       │     │                 │
│ • language/ layer       │     │   (pulled or API) │     │  component)      │     │                 │
│ • visibility/ layer     │     │                   │     │                  │     │                 │
│                         │     │ Outputs:          │     │                  │     │                 │
│ Output:                 │     │ • merged config   │     │                  │     │                 │
│ • components.*.json     │     │ • diff report     │     │                  │     │                 │
│ • presets.*.json        │     │ • merged presets   │     │                  │     │                 │
└─────────────────────────┘     └───────────────────┘     └──────────────────┘     └─────────────────┘
```

### Phase 1: Merge Script (`scripts/mergeStoryblokConfig.ts`)

**Location:** `packages/website/scripts/mergeStoryblokConfig.ts`

**Purpose:** Read the generated config and the live config, produce a merged config that is safe to push.

#### Merge rules (per component, per field)

For each component present in the generated config:

1. **Look up live component** by `name` (same matching the CLI uses).
2. If no live match exists → use generated component as-is (new component).
3. If live match exists → start from **live component** as base, then apply generated deltas:

| Property                                                 | Merge rule                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Schema fields present in both**                        | Replace with generated version (this is the point — apply schema layer changes)                  |
| **Schema fields only in live**                           | **Preserve** (these are manually-added fields like `cta.inverted`, `hero.mobileTextBelow`, etc.) |
| **Schema fields only in generated**                      | **Add** (new fields from schema layers, e.g. visibility-related changes)                         |
| `component_group_uuid`                                   | Keep live value                                                                                  |
| `component_group_name`                                   | Keep live value (or delete — CLI strips it anyway)                                               |
| `component_group_whitelist` on blok fields               | Keep live values (never use generated UUIDs)                                                     |
| Tab UUIDs (`tab-*` field keys)                           | Keep live tab UUIDs; map generated tab content to live tab positions                             |
| `id`, `created_at`                                       | Keep live values (CLI strips `id` anyway, but useful for the diff report)                        |
| `is_root`, `is_nestable`                                 | Use generated (structural, should match schema)                                                  |
| Metadata (`description`, `image`, `preview_field`, etc.) | Keep live values                                                                                 |
| `component_whitelist` on blok fields                     | Smart merge: start with live, add any new entries from generated                                 |

#### Tab UUID mapping

This is the trickiest part. Tabs in Storyblok are schema fields with keys like `tab-649fe063-...`. The generated config creates new UUIDs for these, but live has existing ones.

Strategy:

1. Extract ordered list of tabs from both generated and live schemas.
2. Match tabs by **label** (`display_name`).
3. Replace generated tab UUIDs with live tab UUIDs.
4. For new tabs that don't exist in live — use generated UUIDs (they'll be created fresh).

#### Preset handling

For the section/prompter ID collision bug (Appendix B):

1. After merge, assign **unique** placeholder IDs to all components (ensure no collisions).
2. Re-map preset `component_id` references to match the deduped IDs.
3. Alternatively: write a separate presets file that **excludes** section-layout presets from prompter (filter by component name + preset name).

#### Output

The merge script produces:

- `cms/merged-components.json` — safe to push (or a directory of separate files for v4)
- `cms/merged-presets.json` — deduped presets
- `cms/merge-report.json` — diff report: what changed, what was preserved, what was added

#### CLI interface

```bash
# Full merge
node scripts/mergeStoryblokConfig.ts

# Merge single component
node scripts/mergeStoryblokConfig.ts --component section

# Merge with dry-run (report only, no file output)
node scripts/mergeStoryblokConfig.ts --dry-run

# Merge using live API instead of pulled file
node scripts/mergeStoryblokConfig.ts --source api
```

#### Inputs

| Input             | Source                                                              | Flag                                        |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| Generated config  | `cms/components.123456.json`                                        | `--generated` (default)                     |
| Live config       | `types/components-schema.json` (pulled) or Storyblok Management API | `--source file` (default) or `--source api` |
| Generated presets | `cms/presets.123456.json`                                           | `--generated-presets`                       |
| Live presets      | `types/components-presets.json`                                     | `--live-presets`                            |

### Phase 2: CLI v4 Config File

#### 2a. Create `packages/website/storyblok.config.ts`

```ts
import { defineConfig } from "storyblok/config";

export default defineConfig({
  region: process.env.STORYBLOK_REGION ?? "eu",
  space: process.env.NEXT_STORYBLOK_SPACE_ID,
  verbose: false,
  api: {
    maxRetries: 3,
    maxConcurrency: 6,
  },
  modules: {
    components: {
      push: {
        dryRun: false,
      },
    },
  },
});
```

#### 2b. Upgrade dependency

```bash
cd packages/website && pnpm add -D storyblok@^4.15.2
```

#### 2c. Migrate npm scripts

```json
// Pull
"storyblok-pull-content-schema": "storyblok components pull --path types/ && mv types/components.json types/components-schema.json && mv types/presets.json types/components-presets.json",

// Push merged config
"storyblok-push-components": "storyblok components push --path cms/merged/",

// Dry-run push
"push-components-dry-run": "dotenvx run -f .env.local -- storyblok components push --path cms/merged/ --dry-run",

// Single component push
"push-component": "dotenvx run -f .env.local -- storyblok components push --path cms/merged/ --filter",

// Full workflow (generate → merge → push)
"update-storyblok-config": "npm run create-storyblok-config && npm run merge-storyblok-config && npm run push-components",

// Merge step
"merge-storyblok-config": "npx tsx scripts/mergeStoryblokConfig.ts",
```

#### 2d. Verify v4 file format compatibility

Test whether `storyblok components push` accepts a monolithic JSON or requires the separated directory layout. If separated is required, the merge script output (Phase 1) should write the v4 directory structure:

```
cms/merged/
├── components.json
├── groups.json
├── presets.json
└── tags.json
```

#### 2e. Auth migration

Test whether v4 still supports `.netrc`. If not, update the `netrc` script to use `storyblok login --token $TOKEN --region $REGION` instead. The config file stores the region, reducing the login command to `storyblok login --token $TOKEN`.

### Phase 3: Safe Push Workflow

With Phases 1+2 in place, establish the complete workflow as npm scripts:

```bash
# Step 1: Regenerate config from schemas (including visibility layer)
pnpm --filter website create-storyblok-config

# Step 2: Pull current live state
pnpm --filter website pull-content-schema

# Step 3: Merge generated → live (produces cms/merged/ + report)
pnpm --filter website merge-storyblok-config

# Step 4: Review report
cat packages/website/cms/merge-report.json | jq .

# Step 5: Dry-run push
pnpm --filter website push-components-dry-run

# Step 6: Push for real
pnpm --filter website push-components

# Step 7: Regenerate TypeScript types from the now-updated live config
pnpm --filter website generate-content-types
```

Single-component variant:

```bash
# Merge + push just 'section'
pnpm --filter website merge-storyblok-config -- --component section
pnpm --filter website push-component -- "section"
```

### Phase 4: Activate Visibility Layer

Once the merge workflow is validated, wire up the visibility layer (from [docs/schema-layers-prd.md](schema-layers-prd.md) Phase 1):

1. **Update `create-storyblok-config`** in `package.json`:

   ```
   --schema-paths .../dist/components components cms/visibility cms/language
   --layer-order visibility language cms schema
   ```

2. **Run the full workflow:**

   ```bash
   pnpm --filter website create-storyblok-config   # now includes visibility
   pnpm --filter website pull-content-schema        # fresh live state
   pnpm --filter website merge-storyblok-config     # merge (visibility changes are "generated-only" fields → added)
   pnpm --filter website push-components-dry-run    # preview
   pnpm --filter website push-components            # push
   ```

3. The merge script handles visibility fields naturally:
   - New `x-cms-hidden`-derived field configs from the generated file are **added** (they're "generated-only" fields)
   - Existing live fields are **preserved**
   - No manual intervention needed

### Phase 5: Fix Preset Collision

Address the section/prompter preset bug (Appendix B):

**Option A (in merge script):** During preset merging, filter by component name. If a preset name matches a well-known section layout preset (`DynamicLayout`, `TileLayout`, etc.), only assign it to `section`, not `prompter`.

**Option B (upstream fix):** Fix `create-storyblok-config` generator to assign unique IDs. This requires a change in the `kickstartDS cms storyblok` CLI command — possibly out of scope for this repo.

**Option C (skip presets):** Don't push presets at all. Live presets are already correct. The merge script can produce a merged presets file but mark it as optional, and the push script can omit it.

**Recommended:** Option A (pragmatic, keeps everything self-contained) combined with Option C as fallback (if presets don't need updating, don't touch them).

### Files to Create / Modify

| File                                               | Action                | Purpose                                                  |
| -------------------------------------------------- | --------------------- | -------------------------------------------------------- |
| `packages/website/scripts/mergeStoryblokConfig.ts` | **Create**            | Core merge script                                        |
| `packages/website/storyblok.config.ts`             | **Create**            | CLI v4 config file                                       |
| `packages/website/package.json`                    | **Modify**            | Bump storyblok, add new scripts, update existing scripts |
| `.gitignore`                                       | **Modify**            | Add `.storyblok/` directory, maybe `cms/merged/`         |
| `packages/website/cms/merged/`                     | **Created by script** | Output directory for merged config                       |

### Dependencies & Sequencing

```
Phase 1 (merge script) + Phase 2 (CLI v4 config)
  ↓ both needed before pushing
Phase 3 (workflow)
  ↓ depends on Phase 1 + 2
Phase 4 (visibility layer)
  ↓ depends on Phase 3 (workflow must be validated first)
Phase 5 (preset fix)
  ↓ can happen anytime after Phase 1
```

### Open Questions

1. **Does `storyblok components push` accept a monolithic JSON?** Or does it require the v4 directory structure with separate files? Determines merge script output format.

2. **Auth compatibility:** Does v4 still support `.netrc`? Or must we switch to `storyblok login --token`?

3. **`dotenvx` + config file:** The config file runs in Node and uses `process.env`. But `dotenvx` loads env vars via the npm script wrapper. We need to confirm env vars are available when the config file is loaded by the CLI. If not, we may need to add a dotenv import in the config file.

4. **Upstream ID fix:** Should we fix the section/prompter ID collision in the `kickstartDS cms storyblok` generator? This is in a separate package (`@kickstartds/kickstartds`) — possibly out of scope.

5. **Tab UUID matching:** Should we match tabs by position or by label? Position is simpler but fragile if tabs are reordered. Label-based matching requires `display_name` to be stable.

6. **`create-storyblok-config` output format:** Currently outputs `components.123456.json` with `123456` as a literal placeholder. Should the merge script expect this exact filename, or should we make it configurable?

---

## Appendix E: Quick Reference

### Commands

```bash
# Full workflow: generate → merge → push
pnpm --filter website update-storyblok-config

# Individual steps:
pnpm --filter website create-storyblok-config       # 1. Generate from schemas
pnpm --filter website pull-content-schema            # 2. Pull live state
pnpm --filter website merge-storyblok-config         # 3. Merge generated → live
pnpm --filter website push-components-dry-run        # 4. Preview changes
pnpm --filter website push-components                # 5. Push for real
pnpm --filter website generate-content-types         # 6. Regenerate TypeScript types

# Single-component variant:
pnpm --filter website merge-storyblok-config -- --component section
pnpm --filter website push-component -- "section"
```

### File Locations

| File                                            | Purpose                                                |
| ----------------------------------------------- | ------------------------------------------------------ |
| `packages/website/cms/components.123456.json`   | Generated component config (from schema layers)        |
| `packages/website/types/components-schema.json` | Live config pulled from Storyblok                      |
| `packages/website/cms/presets.123456.json`      | Generated presets (105 in live)                        |
| `packages/website/cms/merged/`                  | Merged output — safe to push (created by merge script) |
| `packages/website/cms/merge-report.json`        | Diff report from last merge                            |
| `packages/website/cms/language/`                | Language layer schemas                                 |
| `packages/website/cms/visibility/`              | Visibility layer schemas (not yet active)              |
| `packages/website/storyblok.config.ts`          | CLI v4 config file                                     |
