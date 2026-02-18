# Copilot Instructions for kickstartDS Storyblok Starter

## Project Overview

This is a **pnpm workspaces monorepo** containing a Next.js 13 website, a Storyblok MCP server, a shared services library, and an n8n community node — all powered by the **kickstartDS** design system (`@kickstartds/ds-agency-premium`).

### Monorepo Structure

```
packages/
  website/          — Next.js 13 site (Storyblok CMS, ISR, Visual Editor)
  storyblok-services/ — Shared library (schema, validation, transforms)
  mcp-server/       — Storyblok MCP server (Model Context Protocol)
  n8n-nodes/        — n8n community node for Storyblok workflows
```

**Package manager:** pnpm 9.15.0 (declared in root `packageManager` field)
**Versioning:** Changesets (`@changesets/cli`) for independent per-package publishing

### Key Commands (run from monorepo root)

```bash
pnpm install                 # Install all workspaces
pnpm -r run build            # Build all packages (topological order)
pnpm --filter website dev    # Start website dev server
pnpm --filter mcp-server dev # Start MCP server in dev mode
pnpm changeset               # Create a new changeset
pnpm version-packages        # Bump versions from changesets
pnpm publish-packages        # Publish to npm
```

## Architecture

### Data Flow

```
Storyblok CMS → storyblok.ts (fetch/transform) → unflatten() → React Components
```

- **Storyblok stores flattened props** (e.g., `image_src`, `image_alt`) which get transformed via `unflatten()` in [packages/website/helpers/unflatten.ts](packages/website/helpers/unflatten.ts) into nested objects (`{ image: { src, alt } }`)
- **Story processing** in [packages/website/helpers/storyblok.ts](packages/website/helpers/storyblok.ts#L70-L200) handles asset URLs, link resolution, and global references

### Component Registration Pattern

All Storyblok components are registered in [packages/website/components/index.tsx](packages/website/components/index.tsx):

```tsx
export const components = {
  page: editablePage,
  section: editable(Section, "components"), // "components" = nested bloks key
  hero: editable(Hero),
  // ...
};
```

The `editable()` HOC wraps kickstartDS components with `storyblokEditable()` for Visual Editor support.

### Page Types

- **page**: Standard pages ([packages/website/components/Page.tsx](packages/website/components/Page.tsx))
- **blog-post**: Blog articles ([packages/website/components/BlogPost.tsx](packages/website/components/BlogPost.tsx))
- **blog-overview**: Blog listing
- **event-list**, **event-detail**: Events
- **search**: Site search with Pagefind

### Provider Hierarchy

App providers in [packages/website/pages/\_app.tsx](packages/website/pages/_app.tsx#L108-L175):

```
LanguageProvider → BlurHashProvider → DsaProviders → ComponentProviders → ImageSizeProviders → ImageRatioProviders
```

[packages/website/components/ComponentProviders.tsx](packages/website/components/ComponentProviders.tsx) provides custom implementations for `Picture`, `Link`, and various kickstartDS contexts.

## Key Conventions

### Component Customization

Override kickstartDS components via React Context:

```tsx
// In ComponentProviders.tsx
<PictureContext.Provider value={CustomPicture} {...props} />
```

### Local Component Extensions

Custom components live in `packages/website/components/{name}/`:

- [packages/website/components/prompter/](packages/website/components/prompter/) - AI content generation
- [packages/website/components/info-table/](packages/website/components/info-table/) - Custom info table
- [packages/website/components/headline/](packages/website/components/headline/) - Extended headline

### TypeScript Types

- **Generated types**: [packages/website/types/components-schema.d.ts](packages/website/types/components-schema.d.ts) from Storyblok schema
- Regenerate with: `pnpm --filter website generate-content-types`

## Design Tokens

### Token Architecture (3 layers)

1. **Branding** (`--ks-brand-*`): Core values in [packages/website/token/branding-token.css](packages/website/token/branding-token.css)
2. **Semantic** (`--ks-*`): Purpose-based tokens in `packages/website/token/*.scss`
3. **Component** (`--dsa-*`): Component-specific customizations

### Token Commands

```bash
pnpm --filter website extract-tokens   # Extract component tokens
```

## Developer Workflows

### Local Development

```bash
pnpm -r run build            # Full build (required before dev)
pnpm --filter website dev    # Start dev server with SSL proxy on :3010
```

Set Storyblok Visual Editor preview URL to `https://localhost:3010/api/preview/`

### CMS Sync Commands

```bash
pnpm --filter website push-components        # Push cms/components.123456.json to Storyblok
pnpm --filter website pull-content-schema    # Pull schema from Storyblok → types/
pnpm --filter website create-storyblok-config # Regenerate CMS config from JSON schemas
pnpm --filter website generate-content-types  # Pull + generate TypeScript types
```

### Build Pipeline

```bash
pnpm --filter website build  # Runs: build-tokens → extract-tokens → blurhashes → bundle-static-assets → next build → sitemap → pagefind
```

## Environment Variables

Required in `packages/website/.env.local`:

- `NEXT_STORYBLOK_API_TOKEN` - Preview API token
- `NEXT_STORYBLOK_OAUTH_TOKEN` - Management API token
- `NEXT_STORYBLOK_SPACE_ID` - Space ID (without #)

## MCP Server

The project includes a Storyblok MCP server ([packages/mcp-server/](packages/mcp-server/)) that exposes CMS tools to AI assistants via the Model Context Protocol.

The MCP server supports **auto-schema derivation**: the `generate_content` tool can automatically derive OpenAI-compatible schemas from the kickstartDS Design System schema (via `componentType` or `sectionCount` parameters), and import tools automatically run `processForStoryblok()` to convert Design System props into Storyblok's flat format.

### Multi-Content-Type Support

The MCP server supports **5 root content types** via a schema registry:

- **Tier 1 (section-based):** `page`, `blog-post`, `blog-overview` — these have a root array of polymorphic sections
- **Tier 2 (flat):** `event-detail`, `event-list` — these use root-level scalar/array/object fields without sections

All generation, import, and validation tools accept a `contentType` parameter (default: `"page"`). The schema registry automatically loads dereferenced schemas from `packages/mcp-server/schemas/` and builds content-type-specific validation rules. Key tools with `contentType` support:

- `generate_content(contentType: "blog-post", componentType: "hero")` — uses blog-post schema
- `plan_page(intent: "...", contentType: "event-detail")` — returns a field population plan for flat types
- `import_content_at_position(contentType: "blog-post", targetField: "section")` — specifies target array
- `create_page_with_content(contentType: "event-detail", sections: [], rootFields: { title: "...", categories: [...] })` — the `rootFields` parameter sets root-level fields for flat content types
- `list_recipes(contentType: "blog-post")` — filters recipes by content type
- `analyze_content_patterns(contentType: "blog-post")` — analyzes patterns for specific content types

For Tier 2 types, `plan_page` returns a field population plan (`fields` array) instead of a section sequence.

The `import_content`, `import_content_at_position`, and `create_page_with_content` tools all support **automatic asset upload**: when `uploadAssets: true` is passed, any image URLs in the content (e.g. from DALL·E, scraped pages, or other external sources) are downloaded and uploaded to Storyblok as native assets before the story is saved. The original URLs are replaced with Storyblok CDN URLs. An optional `assetFolderName` parameter controls which Storyblok asset folder images are uploaded to (defaults to "AI Generated"). **Always pass `uploadAssets: true`** when creating or importing content that contains external image URLs — images should never reference third-party domains in published stories.

The `list_icons` tool returns all available icon identifiers (e.g. `arrow-right`, `star`, `email`, `phone`) that can be used in component icon fields such as hero `cta_icon`, feature `icon`, or contact-info `icon`. Always call `list_icons` before generating or importing content that includes icon fields to ensure only valid identifiers are used.

The MCP server supports **guided content generation** via four additional tools that produce higher-quality content than generating entire pages at once:

- **`analyze_content_patterns`** — Returns structural patterns (component frequency, section sequences, sub-component item counts, page archetypes) from a **startup cache** — instant, no API call. The cache is also used internally by `plan_page`, `generate_section`, and `list_recipes`. Pass `refresh: true` after publishing new content to re-fetch.
- **`list_recipes`** — Returns curated section recipes, page templates, and anti-patterns, optionally merged with live patterns from `analyze_content_patterns`.
- **`plan_page`** — AI-assisted page structure planning. Takes an intent (e.g. "product landing page") and returns a recommended section sequence based on available components and site patterns. Requires OpenAI API key.
- **`generate_section`** — Generates a single section with automatic site-aware context injection. Auto-injects sub-component counts, component frequency, transition context (`previousSection`/`nextSection`), and recipe best practices into the system prompt. Requires OpenAI API key.

The recommended workflow for multi-section pages is: `analyze_content_patterns` → `plan_page` → `generate_section` (per section) → `create_page_with_content`. This section-by-section approach outperforms `generate_content(sectionCount=N)` for pages with 3+ sections. See [docs/skills/plan-page-structure.md](docs/skills/plan-page-structure.md) for the full workflow.

The `create_page_with_content` and `create_story` tools support **automatic folder creation** via the `path` parameter: provide a forward-slash-separated folder path (e.g. `path: "en/services/consulting"`) and missing intermediate folders are created automatically, like `mkdir -p`. The `path` parameter is mutually exclusive with `parentId` — use one or the other. A standalone `ensure_path` tool is also available for pre-creating folder hierarchies (useful for sitemap migration workflows where the folder tree should be established before pages are created in parallel).

Section recipes are also available as an MCP resource (`recipes://section-recipes`) with 18 proven component combinations, 13 page templates, and 10 anti-patterns.

All write tools (`create_story`, `update_story`, `import_content`, `import_content_at_position`, `create_page_with_content`) validate content against the Design System schema before writing to Storyblok. Validation rules are derived automatically from the dereferenced schema for each content type — no component names or nesting rules are hardcoded. Validation catches unknown component types, nesting violations, sub-component misplacement, and dual-discriminator conflicts (`type` + `component` on the same node). Write tools also return **compositional quality warnings** (non-blocking) for issues like duplicate heroes, sparse sub-items, or missing CTAs. Storyblok content must only use `component` as its discriminator — `type` is reserved for user-facing variant props (e.g. CTA visual style). `processForStoryblok()` enforces this by moving `type` → `component` and deleting the original `type`, with a final safety pass to strip any leftover `type` from nodes that already carry `component`. All validated tools accept `skipValidation: true` as an escape hatch. The `list_components` and `get_component` introspection tools annotate their output with nesting and composition rules so LLMs understand where components can be placed.

The `ensure_path` tool creates folder hierarchies idempotently (like `mkdir -p`) and returns the folder ID of the deepest folder. Use it for sitemap migration or when you need to pre-create a folder tree before bulk page creation.

### Transport Modes

- **stdio** (default): For local usage with Claude Desktop — `npm start`
- **http**: For cloud deployment via Streamable HTTP — `MCP_TRANSPORT=http npm start`
  - Exposes `/mcp` (Streamable HTTP endpoint) and `/health` (health check)
  - Port configured via `MCP_PORT` (default: 8080)

### Cloud Deployment

The MCP server has its own Kamal config at [config/deploy-mcp.yml](config/deploy-mcp.yml) and deploys to the same server as the main site under a separate subdomain.

```bash
kamal deploy -d mcp    # Deploy MCP server
kamal setup -d mcp     # First-time setup
```

Key env vars for deployment: `DOCKER_MCP_IMAGE_NAME`, `MCP_PUBLIC_DOMAIN`, `HOSTING_SERVER_IP`, `STORYBLOK_API_TOKEN`, `STORYBLOK_OAUTH_TOKEN`, `STORYBLOK_SPACE_ID`, `OPENAI_API_KEY`.

## Important Files

- [packages/website/cms/components.123456.json](packages/website/cms/components.123456.json) - Storyblok component definitions
- [packages/website/cms/presets.123456.json](packages/website/cms/presets.123456.json) - Component presets
- [packages/website/helpers/storyblok.ts](packages/website/helpers/storyblok.ts) - Storyblok API utilities and story transformations
- [packages/website/scripts/prepareProject.js](packages/website/scripts/prepareProject.js) - Project initialization script (should never be run by Copilot)
- [config/deploy-mcp.yml](config/deploy-mcp.yml) - Kamal deployment config for the MCP server
- [config/deploy.yml](config/deploy.yml) - Kamal deployment config for the main Next.js site
- [packages/storyblok-services/src/schema.ts](packages/storyblok-services/src/schema.ts) - Schema preparation for OpenAI structured output (13 transformation passes)
- [packages/storyblok-services/src/transform.ts](packages/storyblok-services/src/transform.ts) - Content transformation (OpenAI ↔ Design System ↔ Storyblok)
- [packages/storyblok-services/src/pipeline.ts](packages/storyblok-services/src/pipeline.ts) - End-to-end content generation pipeline
- [packages/storyblok-services/src/validate.ts](packages/storyblok-services/src/validate.ts) - Schema-driven content validation (nesting rules, component hierarchy) and compositional quality warnings
- [packages/storyblok-services/src/registry.ts](packages/storyblok-services/src/registry.ts) - Schema registry for multi-content-type support (loads all root content type schemas)
- [packages/storyblok-services/src/assets.ts](packages/storyblok-services/src/assets.ts) - Asset download, upload to Storyblok, and URL rewriting
- [packages/storyblok-services/src/patterns.ts](packages/storyblok-services/src/patterns.ts) - Content pattern analysis (component frequency, section sequences, sub-component counts, page archetypes)
- [packages/mcp-server/schemas/section-recipes.json](packages/mcp-server/schemas/section-recipes.json) - Curated section recipes, page templates, and anti-patterns
- [packages/n8n-nodes/nodes/StoryblokKickstartDs/StoryblokKickstartDs.node.ts](packages/n8n-nodes/nodes/StoryblokKickstartDs/StoryblokKickstartDs.node.ts) - Main n8n node implementation (18 operations across 3 resources)
- [packages/n8n-nodes/nodes/StoryblokKickstartDs/GenericFunctions.ts](packages/n8n-nodes/nodes/StoryblokKickstartDs/GenericFunctions.ts) - Re-exports from shared services for use in n8n node
- [docs/skills/plan-page-structure.md](docs/skills/plan-page-structure.md) - Section-by-section generation workflow guide
- [docs/guided-generation-plan.md](docs/guided-generation-plan.md) - Design document for guided content generation

## n8n Community Node

The project includes an n8n community node package ([packages/n8n-nodes/](packages/n8n-nodes/)) that provides **18 operations across 3 resources** for automating Storyblok content workflows without an LLM intermediary:

| Resource       | Operations | Description                                                                             |
| -------------- | ---------- | --------------------------------------------------------------------------------------- |
| **AI Content** | 5          | generate, import, generateSection, planPage, analyzePatterns                            |
| **Story**      | 6          | list, get, createPage, update, delete, search                                           |
| **Space**      | 7          | scrapeUrl, listComponents, getComponent, listAssets, listRecipes, listIcons, ensurePath |

The n8n node consumes the same shared service library (`@kickstartds/storyblok-services`) as the MCP server, so validation, schema preparation, content transformation, and pattern analysis behave identically across both interfaces.

Nine workflow templates are included in `packages/n8n-nodes/workflows/` covering content audit, blog autopilot, content migration, SEO fixes, section-by-section generation, and broken asset detection.

## Common Patterns

### Adding a New Component to Storyblok

Always consult specialized MCP servers for the Design System for this:

1. Design System Component Builder MCP - for instructions on creating components
2. Design System Design Tokens MCP - for design token extraction and lookup

Steps:

1. Create component locally in `packages/website/components/`
2. Add to `components` map in [packages/website/components/index.tsx](packages/website/components/index.tsx)
3. Update `packages/website/components/section/section.schema.json` to include new component in the `anyOf` clause of the `components` field
4. Update `packages/website/package.json` to also include the new component schema in the `create-storyblok-config` script
5. Run `pnpm --filter website create-storyblok-config` to update CMS schema
6. Inside `packages/website/cms/components.123456.json` remove everything except the new component definition
7. Run `pnpm --filter website push-components` to sync with Storyblok
8. Run `pnpm --filter website generate-content-types` to update TypeScript types

Important:

- Never create or use React state, always write indpendent, pure components, implementing client behaviour using vanilla JavaScript. See the Design System Component Builder MCP for more details.
- Always keep inside the already existing token definitions when adding styles to components, don't try to adopt the shown styling ever. Consult the Design System Design Tokens MCP for more details.
- Always check for existing Design System components before creating new ones, or using native HTML controls. E.g. use `Button` from kickstartDS instead of native `<button>`, the same for form fields. If in question, ask the Design System Storybook MCP.
- In the JSON Schema and prop naming, never use unspecific terms like `items`, prefer more specific names, or prefix with the component name, e.g. `timelineItems` for a Timeline component.
- CSS / SCSS should not be imported in created components, but instead be added to `index.scss` for global inclusion.

### Handling Nested Bloks

Use second argument in `editable()` for components with nested content:

```tsx
section: editable(Section, "components"),  // "components" is the blok field name
slider: editable(Slider, "components"),
```
