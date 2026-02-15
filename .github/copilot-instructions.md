# Copilot Instructions for kickstartDS Storyblok Starter

## Project Overview

This is a **Next.js 13** website using **Storyblok** as headless CMS, powered by **kickstartDS** design system components (`@kickstartds/ds-agency-premium`). It generates static pages with ISR and supports live preview editing in Storyblok's Visual Editor.

## Architecture

### Data Flow

```
Storyblok CMS → storyblok.ts (fetch/transform) → unflatten() → React Components
```

- **Storyblok stores flattened props** (e.g., `image_src`, `image_alt`) which get transformed via `unflatten()` in [helpers/unflatten.ts](helpers/unflatten.ts) into nested objects (`{ image: { src, alt } }`)
- **Story processing** in [helpers/storyblok.ts](helpers/storyblok.ts#L70-L200) handles asset URLs, link resolution, and global references

### Component Registration Pattern

All Storyblok components are registered in [components/index.tsx](components/index.tsx):

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

- **page**: Standard pages ([components/Page.tsx](components/Page.tsx))
- **blog-post**: Blog articles ([components/BlogPost.tsx](components/BlogPost.tsx))
- **blog-overview**: Blog listing
- **event-list**, **event-detail**: Events
- **search**: Site search with Pagefind

### Provider Hierarchy

App providers in [pages/\_app.tsx](pages/_app.tsx#L108-L175):

```
LanguageProvider → BlurHashProvider → DsaProviders → ComponentProviders → ImageSizeProviders → ImageRatioProviders
```

[components/ComponentProviders.tsx](components/ComponentProviders.tsx) provides custom implementations for `Picture`, `Link`, and various kickstartDS contexts.

## Key Conventions

### Component Customization

Override kickstartDS components via React Context:

```tsx
// In ComponentProviders.tsx
<PictureContext.Provider value={CustomPicture} {...props} />
```

### Local Component Extensions

Custom components live in `components/{name}/`:

- [components/prompter/](components/prompter/) - AI content generation
- [components/info-table/](components/info-table/) - Custom info table
- [components/headline/](components/headline/) - Extended headline

### TypeScript Types

- **Generated types**: [types/components-schema.d.ts](types/components-schema.d.ts) from Storyblok schema
- Regenerate with: `npm run generate-content-types`

## Design Tokens

### Token Architecture (3 layers)

1. **Branding** (`--ks-brand-*`): Core values in [token/branding-tokens.css](token/branding-token.css)
2. **Semantic** (`--ks-*`): Purpose-based tokens in `token/*.scss`
3. **Component** (`--dsa-*`): Component-specific customizations

### Token Commands

```bash
npm run extract-tokens   # Extract component tokens
```

## Developer Workflows

### Local Development

```bash
npm run build            # Full build (required before dev)
npm run dev              # Start dev server with SSL proxy on :3010
```

Set Storyblok Visual Editor preview URL to `https://localhost:3010/api/preview/`

### CMS Sync Commands

```bash
npm run push-components              # Push cms/components.123456.json to Storyblok
npm run pull-content-schema          # Pull schema from Storyblok → types/
npm run create-storyblok-config      # Regenerate CMS config from JSON schemas
npm run generate-content-types       # Pull + generate TypeScript types
```

### Build Pipeline

```bash
npm run build  # Runs: build-tokens → extract-tokens → blurhashes → bundle-static-assets → next build → sitemap → pagefind
```

## Environment Variables

Required in `.env.local`:

- `NEXT_STORYBLOK_API_TOKEN` - Preview API token
- `NEXT_STORYBLOK_OAUTH_TOKEN` - Management API token
- `NEXT_STORYBLOK_SPACE_ID` - Space ID (without #)

## MCP Server

The project includes a Storyblok MCP server ([mcp-server/](mcp-server/)) that exposes CMS tools to AI assistants via the Model Context Protocol.

The MCP server supports **auto-schema derivation**: the `generate_content` tool can automatically derive OpenAI-compatible schemas from the kickstartDS Design System page schema (via `componentType` or `sectionCount` parameters), and import tools automatically run `processForStoryblok()` to convert Design System props into Storyblok's flat format.

The `import_content`, `import_content_at_position`, and `create_page_with_content` tools all support **automatic asset upload**: when `uploadAssets: true` is passed, any image URLs in the content (e.g. from DALL·E, scraped pages, or other external sources) are downloaded and uploaded to Storyblok as native assets before the story is saved. The original URLs are replaced with Storyblok CDN URLs. An optional `assetFolderName` parameter controls which Storyblok asset folder images are uploaded to (defaults to "AI Generated"). **Always pass `uploadAssets: true`** when creating or importing content that contains external image URLs — images should never reference third-party domains in published stories.

The `list_icons` tool returns all available icon identifiers (e.g. `arrow-right`, `star`, `email`, `phone`) that can be used in component icon fields such as hero `cta_icon`, feature `icon`, or contact-info `icon`. Always call `list_icons` before generating or importing content that includes icon fields to ensure only valid identifiers are used.

The MCP server supports **guided content generation** via four additional tools that produce higher-quality content than generating entire pages at once:

- **`analyze_content_patterns`** — Returns structural patterns (component frequency, section sequences, sub-component item counts, page archetypes) from a **startup cache** — instant, no API call. The cache is also used internally by `plan_page`, `generate_section`, and `list_recipes`. Pass `refresh: true` after publishing new content to re-fetch.
- **`list_recipes`** — Returns curated section recipes, page templates, and anti-patterns, optionally merged with live patterns from `analyze_content_patterns`.
- **`plan_page`** — AI-assisted page structure planning. Takes an intent (e.g. "product landing page") and returns a recommended section sequence based on available components and site patterns. Requires OpenAI API key.
- **`generate_section`** — Generates a single section with automatic site-aware context injection. Auto-injects sub-component counts, component frequency, transition context (`previousSection`/`nextSection`), and recipe best practices into the system prompt. Requires OpenAI API key.

The recommended workflow for multi-section pages is: `analyze_content_patterns` → `plan_page` → `generate_section` (per section) → `create_page_with_content`. This section-by-section approach outperforms `generate_content(sectionCount=N)` for pages with 3+ sections. See [docs/skills/plan-page-structure.md](docs/skills/plan-page-structure.md) for the full workflow.

Section recipes are also available as an MCP resource (`recipes://section-recipes`) with 14 proven component combinations, 7 page templates, and 10 anti-patterns.

All write tools (`create_story`, `update_story`, `import_content`, `import_content_at_position`, `create_page_with_content`) validate content against the Design System schema before writing to Storyblok. Validation rules are derived automatically from the dereferenced page schema — no component names or nesting rules are hardcoded. Validation catches unknown component types, nesting violations, sub-component misplacement, and dual-discriminator conflicts (`type` + `component` on the same node). Write tools also return **compositional quality warnings** (non-blocking) for issues like duplicate heroes, sparse sub-items, or missing CTAs. Storyblok content must only use `component` as its discriminator — `type` is reserved for user-facing variant props (e.g. CTA visual style). `processForStoryblok()` enforces this by moving `type` → `component` and deleting the original `type`, with a final safety pass to strip any leftover `type` from nodes that already carry `component`. All validated tools accept `skipValidation: true` as an escape hatch. The `list_components` and `get_component` introspection tools annotate their output with nesting and composition rules so LLMs understand where components can be placed.

### Transport Modes

- **stdio** (default): For local usage with Claude Desktop — `npm start`
- **http**: For cloud deployment via Streamable HTTP — `MCP_TRANSPORT=http npm start`
  - Exposes `/mcp` (Streamable HTTP endpoint) and `/health` (health check)
  - Port configured via `MCP_PORT` (default: 8080)

### Cloud Deployment

The MCP server has its own Kamal config at [mcp-server/config/deploy.yml](mcp-server/config/deploy.yml) and deploys to the same server as the main site under a separate subdomain.

```bash
cd mcp-server
kamal setup    # First-time
kamal deploy   # Subsequent
```

Key env vars for deployment: `DOCKER_MCP_IMAGE_NAME`, `MCP_PUBLIC_DOMAIN`, `HOSTING_SERVER_IP`, `STORYBLOK_API_TOKEN`, `STORYBLOK_OAUTH_TOKEN`, `STORYBLOK_SPACE_ID`, `OPENAI_API_KEY`.

## Important Files

- [cms/components.123456.json](cms/components.123456.json) - Storyblok component definitions
- [cms/presets.123456.json](cms/presets.123456.json) - Component presets
- [helpers/storyblok.ts](helpers/storyblok.ts) - Storyblok API utilities and story transformations
- [scripts/prepareProject.js](scripts/prepareProject.js) - Project initialization script (should never be run by Copilot)
- [mcp-server/config/deploy.yml](mcp-server/config/deploy.yml) - Kamal deployment config for the MCP server
- [config/deploy.yml](config/deploy.yml) - Kamal deployment config for the main Next.js site
- [shared/storyblok-services/src/schema.ts](shared/storyblok-services/src/schema.ts) - Schema preparation for OpenAI structured output (13 transformation passes)
- [shared/storyblok-services/src/transform.ts](shared/storyblok-services/src/transform.ts) - Content transformation (OpenAI ↔ Design System ↔ Storyblok)
- [shared/storyblok-services/src/pipeline.ts](shared/storyblok-services/src/pipeline.ts) - End-to-end content generation pipeline
- [shared/storyblok-services/src/validate.ts](shared/storyblok-services/src/validate.ts) - Schema-driven content validation (nesting rules, component hierarchy) and compositional quality warnings
- [shared/storyblok-services/src/assets.ts](shared/storyblok-services/src/assets.ts) - Asset download, upload to Storyblok, and URL rewriting
- [mcp-server/schemas/section-recipes.json](mcp-server/schemas/section-recipes.json) - Curated section recipes, page templates, and anti-patterns
- [docs/skills/plan-page-structure.md](docs/skills/plan-page-structure.md) - Section-by-section generation workflow guide
- [docs/guided-generation-plan.md](docs/guided-generation-plan.md) - Design document for guided content generation

## Common Patterns

### Adding a New Component to Storyblok

Always consult specialized MCP servers for the Design System for this:

1. Design System Component Builder MCP - for instructions on creating components
2. Design System Design Tokens MCP - for design token extraction and lookup

Steps:

1. Create component locally in `components/`
2. Add to `components` map in [components/index.tsx](components/index.tsx)
3. Update `components/section/section.schema.json` to include new component in the `anyOf` clause of the `components` field
4. Update `package.json` to also include the new component schema in the `create-storyblok-config` script
5. Run `npm run create-storyblok-config` to update CMS schema
6. Inside `cms/components.123456.json` remove everything except the new component definition
7. Run `npm run push-components` to sync with Storyblok
8. Run `npm run generate-content-types` to update TypeScript types

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
