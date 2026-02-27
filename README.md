# ruhmesmeile Storyblok Starter

A **pnpm workspaces monorepo** for building AI-powered websites with [Storyblok CMS](https://www.storyblok.com/) and the [kickstartDS](https://www.kickstartds.com/) design system. Includes a Next.js website, a Model Context Protocol (MCP) server, a shared services library, and n8n community nodes for workflow automation.

## Monorepo Structure

```
packages/
  website/              — Next.js 13 site (Storyblok CMS, ISR, Visual Editor)
  storyblok-services/   — Shared library (schema, validation, transforms)
  mcp-server/           — Storyblok MCP server (Model Context Protocol)
  n8n-nodes/            — n8n community node for Storyblok workflows
```

| Package                                            | npm                                      | Description                                                                                                            |
| -------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [website](packages/website/)                       | `@kickstartds/storyblok-starter-premium` | Next.js 13 site with Storyblok CMS, ISR, Visual Editor, AI Prompter, and a three-layer design token system             |
| [storyblok-services](packages/storyblok-services/) | `@kickstartds/storyblok-services`        | Framework-agnostic library for schema preparation, content validation, transforms, pattern analysis, and AI generation |
| [mcp-server](packages/mcp-server/)                 | `@kickstartds/storyblok-mcp-server`      | MCP server exposing 30+ CMS tools to AI assistants (content CRUD, AI generation, component introspection)              |
| [n8n-nodes](packages/n8n-nodes/)                   | `n8n-nodes-storyblok-kickstartds`        | n8n community node with 22 operations across 3 resources for automated content pipelines                               |

**Package manager:** pnpm 9.15.0 · **Versioning:** [Changesets](https://github.com/changesets/changesets) for independent per-package publishing

## Quick Start

### Requirements

- **Node.js 24+** — `nvs use` or `nvm use` for automatic version selection
- **pnpm 9.15.0** — `corepack enable && corepack prepare pnpm@9.15.0 --activate`
- [`mkcert`](https://github.com/FiloSottile/mkcert#installation) — for local SSL (required by the Storyblok Visual Editor iframe)

### Install & Build

```bash
pnpm install                # Install all workspaces
pnpm -r run build           # Build all packages (topological order)
```

### Environment Variables

Create `packages/website/.env.local` (see `.env.local.sample`):

| Variable                     | Required        | Description                    |
| ---------------------------- | --------------- | ------------------------------ |
| `NEXT_STORYBLOK_API_TOKEN`   | ✅              | Storyblok Preview API token    |
| `NEXT_STORYBLOK_OAUTH_TOKEN` | ✅              | Storyblok Management API token |
| `NEXT_STORYBLOK_SPACE_ID`    | ✅              | Space ID (without `#`)         |
| `NEXT_OPENAI_API_KEY`        | For AI features | OpenAI API key                 |
| `NEXT_PUBLIC_SITE_URL`       | For Prompter    | Public site URL                |

### Local Development

```bash
pnpm --filter website dev     # Website dev server (SSL on :3010)
pnpm --filter mcp-server dev  # MCP server in dev mode
```

Set Storyblok Visual Editor preview URL to `https://localhost:3010/api/preview/`

### All Commands

```bash
# Development
pnpm --filter website dev                      # Website dev server
pnpm --filter mcp-server dev                   # MCP server dev mode

# Build
pnpm -r run build                              # Build all packages

# CMS sync
pnpm --filter website push-components          # Push component schema to Storyblok
pnpm --filter website generate-content-types   # Pull schema + generate TypeScript types
pnpm --filter website create-storyblok-config  # Regenerate CMS config from JSON schemas

# Quality
pnpm -r run typecheck                          # Type-check all packages
pnpm -r run lint                               # Lint all packages
pnpm -r run test                               # Run all tests

# Publishing
pnpm changeset                                 # Create a new changeset
pnpm version-packages                          # Bump versions from changesets
pnpm publish-packages                          # Publish to npm
```

## Packages

### Website

A **Next.js 13** site with Storyblok CMS integration, featuring 7 content types, 30+ design system components, ISR, Visual Editor support, and an in-editor AI Prompter for content generation.

Key features:

- **Section-based page composition** with the kickstartDS design system
- **Prompter** — AI content generation directly inside the Visual Editor (section mode and page mode)
- **Three-layer design token architecture** with 5 pre-built color themes
- **BlurHash image placeholders**, breadcrumb with JSON-LD, Markdown endpoint, Pagefind search
- **Kamal** or **Netlify** deployment

See [packages/website/README.md](packages/website/README.md) for full documentation.

### Storyblok Services

A **shared, framework-agnostic library** consumed by the website, MCP server, and n8n nodes. Provides:

- **Schema preparation** — 15-pass transformation of kickstartDS JSON Schemas into OpenAI-compatible structured output format
- **Content validation** — Schema-driven nesting rules, component hierarchy checks, compositional quality warnings
- **Content transformation** — Bidirectional conversion between Design System props, OpenAI output, and Storyblok's flat format
- **Pattern analysis** — Component frequency, section sequences, sub-component counts, page archetypes, field value distributions
- **Guided generation** — Page planning, section-by-section generation with site-aware context, field-level compositional guidance
- **Asset management** — Download, upload to Storyblok CDN, and URL rewriting

See [packages/storyblok-services/README.md](packages/storyblok-services/README.md) for API documentation.

### MCP Server

A **Model Context Protocol server** that exposes 30+ CMS tools to AI assistants like Claude. Supports both local (stdio) and cloud (Streamable HTTP) transport.

Key capabilities:

- **Content CRUD** — list, get, create, update, delete stories; replace sections; update SEO
- **AI content generation** — auto-schema derivation, structured output, guided section-by-section generation
- **Component introspection** — list/get component schemas with nesting rules and composition annotations
- **Content intelligence** — pattern analysis, section recipes, page planning
- **Web scraping** — fetch pages as clean Markdown for content migration
- **Multi-content-type support** — 5 content types with per-type schema validation

Deploy with Kamal: `kamal deploy -d mcp`

See [packages/mcp-server/README.md](packages/mcp-server/README.md) for setup and deployment instructions.

### n8n Nodes

An **n8n community node** package providing 22 operations across 3 resources (AI Content, Story, Space) for automated content pipelines — without an LLM intermediary.

Includes 9 workflow templates for content audit, blog autopilot, content migration, SEO fixes, and more.

See [packages/n8n-nodes/README.md](packages/n8n-nodes/README.md) for the full node reference.

## Architecture

### Shared Service Layer

All three consumers (website, MCP server, n8n nodes) use the same `@kickstartds/storyblok-services` library, ensuring identical behavior for schema preparation, validation, content transformation, and pattern analysis:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Website   │  │ MCP Server  │  │  n8n Nodes  │
│  (Next.js)  │  │   (stdio/   │  │ (community  │
│             │  │    HTTP)    │  │    node)    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
              ┌─────────┴─────────┐
              │ storyblok-services│
              │  (shared library) │
              └─────────┬─────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
      ┌─────┴─────┐         ┌──────┴──────┐
      │ Storyblok │         │   OpenAI    │
      │    CMS    │         │  (GPT-4o)   │
      └───────────┘         └─────────────┘
```

### Content Generation Pipeline

```
Prompt → Schema Preparation → OpenAI Structured Output → Post-Processing → Storyblok Import
```

1. **Schema preparation**: kickstartDS JSON Schema → 15 transformation passes → OpenAI-compatible `response_format`
2. **Content generation**: OpenAI GPT-4o with enforced JSON Schema → guaranteed valid structure
3. **Post-processing**: Restore Design System discriminators, clean annotations
4. **Transform**: Design System nested props → Storyblok flat format (`image.src` → `image_src`)
5. **Validation**: Schema-driven nesting rules + compositional quality warnings
6. **Import**: Create or update stories in Storyblok via Management API

## Deployment

### Website (Kamal)

```bash
kamal deploy              # Deploy to production
kamal setup               # First-time server setup
```

Config: [config/deploy.yml](config/deploy.yml)

### MCP Server (Kamal)

```bash
kamal deploy -d mcp       # Deploy MCP server
kamal setup -d mcp        # First-time setup
```

Config: [config/deploy-mcp.yml](config/deploy-mcp.yml)

Endpoint: `https://mcp.your-domain.com/mcp`

## Contributing

Contributions are welcome. Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as below, without any additional terms or conditions.

## License

This project is licensed under either of

- [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) ([LICENSE-APACHE](LICENSE-APACHE))
- [MIT license](https://opensource.org/license/mit/) ([LICENSE-MIT](LICENSE-MIT))

at your option.

The SPDX license identifier for this project is `MIT OR Apache-2.0`.

## Support

Join our [Discord community](https://discord.gg/mwKzD5gejY) for support, or leave an issue on this repository!
