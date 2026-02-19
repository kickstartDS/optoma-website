# Storyblok MCP Server

A Model Context Protocol (MCP) server for integrating Storyblok CMS with AI assistants. This server enables LLMs to interact with your Storyblok space, manage content, and generate AI-powered content using kickstartDS Design System components.

## Features

### Content Management Tools

| Tool             | Description                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `list_stories`   | List stories with filtering by slug prefix or content type                                                         |
| `get_story`      | Get a single story by slug, ID, or UUID                                                                            |
| `create_story`   | Create a new story with content (validates against Design System schema). Supports `path` for auto-folder creation |
| `update_story`   | Update an existing story (validates against Design System schema)                                                  |
| `delete_story`   | Delete a story                                                                                                     |
| `search_content` | Full-text search across stories                                                                                    |
| `ensure_path`    | Ensure a folder path exists (like `mkdir -p`), creating missing intermediate folders. Returns the folder ID        |

### AI Content Generation

| Tool                         | Description                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate_content`           | Generate structured content using OpenAI GPT-4 — with optional auto-schema derivation                                                                                                       |
| `import_content`             | Import generated content into a Storyblok story (replace a prompter), with automatic transform, optional asset upload, and **schema validation**                                            |
| `import_content_at_position` | Insert generated sections at a specific position in a story, with automatic transform, optional asset upload, and **schema validation**                                                     |
| `create_page_with_content`   | Create a new page story with sections, auto-wrapping in page/section structure, with automatic transform, optional asset upload, `path` for auto-folder creation, and **schema validation** |

### Web Scraping

| Tool         | Description                                                                        |
| ------------ | ---------------------------------------------------------------------------------- |
| `scrape_url` | Fetch a web page and convert it to clean Markdown, preserving images with alt text |

### Component & Asset Management

| Tool              | Description                                                                       |
| ----------------- | --------------------------------------------------------------------------------- |
| `list_components` | List all component schemas in the space, annotated with nesting/composition rules |
| `get_component`   | Get detailed schema for a specific component, including composition rules         |
| `list_assets`     | List assets with pagination and search                                            |
| `get_ideas`       | Fetch ideas from the Storyblok space                                              |

### Icon Discovery

| Tool         | Description                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `list_icons` | List all available icon identifiers for use in component icon fields (hero, features, contact, …) |

### Guided Generation & Planning

| Tool                       | Description                                                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `analyze_content_patterns` | Structural patterns across all published stories (component frequency, sequences, sub-item counts, archetypes). Cached at startup; pass `refresh: true` after publishing new content                               |
| `list_recipes`             | List curated section recipes and page templates, optionally merged with live patterns from the space                                                                                                               |
| `plan_page`                | AI-assisted page structure planning — returns a recommended section sequence based on intent and site patterns. For hybrid types (blog-post, blog-overview) also returns `rootFieldMeta` with priority annotations |
| `generate_section`         | Generate a single section with auto-injected site context, transition hints, and recipe-based best practices                                                                                                       |
| `generate_root_field`      | Generate content for a single root-level field (e.g. `head`, `aside`, `cta`) on hybrid content types. Uses OpenAI structured output with field-specific sub-schema                                                 |
| `generate_seo`             | Generate SEO metadata (title, description, keywords, OG image) for any content type with a `seo` root field. Uses a specialized SEO-expert system prompt                                                           |

## Installation

### Prerequisites

- Node.js 18+
- Storyblok space with API tokens
- (Optional) OpenAI API key for content generation

### Setup

This package lives inside a **pnpm workspaces monorepo**. All commands are run from the **repository root**.

1. Install dependencies (from repo root):

```bash
pnpm install
```

2. Create environment file:

```bash
cp packages/mcp-server/.env.example packages/mcp-server/.env
```

3. Configure environment variables in `.env`:

```env
STORYBLOK_API_TOKEN=your-preview-token
STORYBLOK_OAUTH_TOKEN=your-oauth-token
STORYBLOK_SPACE_ID=123456
OPENAI_API_KEY=sk-your-openai-key  # Optional
```

4. Build the shared library and MCP server:

```bash
pnpm --filter @kickstartds/storyblok-services run build
pnpm --filter @kickstartds/storyblok-mcp-server run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "storyblok": {
      "command": "node",
      "args": ["/path/to/packages/mcp-server/dist/index.js"],
      "env": {
        "STORYBLOK_API_TOKEN": "your-preview-token",
        "STORYBLOK_OAUTH_TOKEN": "your-oauth-token",
        "STORYBLOK_SPACE_ID": "123456",
        "OPENAI_API_KEY": "sk-your-key"
      }
    }
  }
}
```

### With Docker

Build the Docker image (from the repository root — the build context must be the repo root so workspace packages are available):

```bash
docker build -t storyblok-mcp-server -f packages/mcp-server/Dockerfile .
```

Run locally in **stdio** mode (default):

```bash
docker run -i \
  -e STORYBLOK_API_TOKEN=your-token \
  -e STORYBLOK_OAUTH_TOKEN=your-oauth-token \
  -e STORYBLOK_SPACE_ID=123456 \
  -e OPENAI_API_KEY=sk-your-key \
  storyblok-mcp-server
```

Run in **HTTP** mode (for cloud / remote access):

```bash
docker run -p 8080:8080 \
  -e MCP_TRANSPORT=http \
  -e MCP_PORT=8080 \
  -e STORYBLOK_API_TOKEN=your-token \
  -e STORYBLOK_OAUTH_TOKEN=your-oauth-token \
  -e STORYBLOK_SPACE_ID=123456 \
  -e OPENAI_API_KEY=sk-your-key \
  storyblok-mcp-server
```

The server will be available at `http://localhost:8080/mcp` with a health check at `/health`.

### Cloud Deployment with Kamal

The MCP server includes a [Kamal](https://kamal-deploy.org/) configuration for deploying to the same server as the main site.

#### Prerequisites

- Kamal 2 installed (`gem install kamal`)
- A Docker registry (Docker Hub, GHCR, etc.)
- SSH access to the target server
- A subdomain pointed at your server (e.g., `mcp.your-domain.com`)

#### Environment Variables

Set these in your shell or CI environment before deploying:

| Variable                  | Description                                 |
| ------------------------- | ------------------------------------------- |
| `DOCKER_USERNAME`         | Docker registry username                    |
| `KAMAL_REGISTRY_PASSWORD` | Docker registry password / access token     |
| `DOCKER_MCP_IMAGE_NAME`   | Image name (e.g., `youruser/storyblok-mcp`) |
| `HOSTING_SERVER_IP`       | IP of the target server (same as main site) |
| `MCP_PUBLIC_DOMAIN`       | Public domain for the MCP server            |
| `STORYBLOK_API_TOKEN`     | Storyblok Preview API token                 |
| `STORYBLOK_OAUTH_TOKEN`   | Storyblok Management API OAuth token        |
| `STORYBLOK_SPACE_ID`      | Storyblok space ID                          |
| `OPENAI_API_KEY`          | OpenAI API key (optional)                   |

#### Deploy

Run from the **repository root** — the Kamal config lives at `config/deploy-mcp.yml`:

```bash
kamal setup -c config/deploy-mcp.yml    # First-time setup
kamal deploy -c config/deploy-mcp.yml   # Subsequent deployments
```

#### Connecting Remote Clients

Once deployed, configure your MCP client to use the Streamable HTTP endpoint:

```
https://mcp.your-domain.com/mcp
```

For Claude Desktop with a remote MCP server, use an MCP client that supports the Streamable HTTP transport, pointing to the URL above.

### Direct Execution

```bash
# Set environment variables
export STORYBLOK_API_TOKEN=your-token
export STORYBLOK_OAUTH_TOKEN=your-oauth-token
export STORYBLOK_SPACE_ID=123456

# Run the server (from repo root)
pnpm --filter @kickstartds/storyblok-mcp-server start
```

## Tool Examples

### List all blog posts

```json
{
  "tool": "list_stories",
  "arguments": {
    "contentType": "blog-post",
    "perPage": 10
  }
}
```

### Get a specific page

```json
{
  "tool": "get_story",
  "arguments": {
    "identifier": "home",
    "version": "draft"
  }
}
```

### Generate a hero section (auto-schema mode)

When `componentType` is provided, the schema is automatically derived from the kickstartDS Design System schema — no manual schema needed. Use `contentType` to target a specific content type (default: `"page"`):

```json
{
  "tool": "generate_content",
  "arguments": {
    "system": "You are a content writer for a digital agency website. Create engaging, professional content.",
    "prompt": "Create a hero section for a landing page about AI-powered content generation",
    "componentType": "hero",
    "contentType": "page"
  }
}
```

The response includes both Design System–shaped props and Storyblok-ready content:

```json
{
  "designSystemProps": { "headline": "...", "sub": "...", "text": "..." },
  "storyblokContent": { "component": "hero", "headline": "...", "sub": "...", "text": "..." },
  "rawResponse": { ... }
}
```

### Generate a full page (auto-schema, multi-section)

```json
{
  "tool": "generate_content",
  "arguments": {
    "system": "You are a content writer for a digital agency website.",
    "prompt": "Create a landing page about sustainable energy solutions",
    "sectionCount": 4
  }
}
```

### Generate content for a blog post

All generation, import, and validation tools accept a `contentType` parameter. The server supports 5 content types:

- **Tier 1 (section-based):** `page`, `blog-post`, `blog-overview`
- **Tier 2 (flat):** `event-detail`, `event-list`

```json
{
  "tool": "generate_content",
  "arguments": {
    "system": "You are a content writer for a tech blog.",
    "prompt": "Create a hero section for a blog post about AI trends in 2026",
    "componentType": "hero",
    "contentType": "blog-post"
  }
}
```

### Import content with automatic asset upload

The `import_content`, `import_content_at_position`, and `create_page_with_content` tools all support automatic asset upload. When `uploadAssets` is `true`, any image URLs in the content (e.g. DALL·E URLs or scraped external URLs) are downloaded, uploaded to Storyblok as native assets, and replaced with Storyblok CDN URLs before the story is saved:

```json
{
  "tool": "import_content",
  "arguments": {
    "storyId": "home",
    "prompterUid": "abc-123",
    "content": { "sections": [{ "component": "hero", "headline": "..." }] },
    "uploadAssets": true,
    "assetFolderName": "Cloud Campaign"
  }
}
```

The response includes an `assetsSummary` with details of each uploaded asset:

```json
{
  "assetsSummary": {
    "uploaded": 2,
    "rewritten": 3,
    "assets": [
      {
        "id": 12345,
        "url": "https://a.storyblok.com/f/.../image.jpg",
        "originalUrl": "https://oaidalleapiprodscus.blob.core.windows.net/..."
      }
    ],
    "assetFolderId": 67890
  }
}
```

| Parameter         | Type    | Default          | Description                                               |
| ----------------- | ------- | ---------------- | --------------------------------------------------------- |
| `uploadAssets`    | boolean | `false`          | Enable automatic asset download + upload to Storyblok     |
| `assetFolderName` | string  | `"AI Generated"` | Storyblok asset folder name (created if it doesn't exist) |

### Generate with a custom schema

You can still provide a manual JSON Schema for full control:

```json
{
  "tool": "generate_content",
  "arguments": {
    "system": "You are a content writer for a digital agency website. Create engaging, professional content.",
    "prompt": "Create a hero section for a landing page about AI-powered content generation",
    "schema": {
      "name": "hero_section",
      "schema": {
        "type": "object",
        "properties": {
          "headline": { "type": "string" },
          "sub": { "type": "string" },
          "text": { "type": "string" },
          "ctas": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "label": { "type": "string" },
                "target": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

### Search for content

```json
{
  "tool": "search_content",
  "arguments": {
    "query": "digital transformation",
    "contentType": "page"
  }
}
```

### Scrape a web page to Markdown

Fetch any public URL and get clean Markdown output — useful as a preparation step before generating new Storyblok content from existing web pages:

```json
{
  "tool": "scrape_url",
  "arguments": {
    "url": "https://example.com/blog/interesting-article"
  }
}
```

The response includes the page title, source URL, and Markdown with images preserved:

```json
{
  "url": "https://example.com/blog/interesting-article",
  "title": "An Interesting Article",
  "markdown": "# An Interesting Article\n\n![Hero image](https://example.com/images/hero.jpg)\n\nLorem ipsum..."
}
```

You can also target a specific part of the page using a CSS selector:

```json
{
  "tool": "scrape_url",
  "arguments": {
    "url": "https://example.com/blog/interesting-article",
    "selector": "article"
  }
}
```

### List available icons

Before generating or importing content that uses icon fields (e.g. hero `cta_icon`, feature `icon`, contact-info `icon`), query the available icon identifiers:

```json
{
  "tool": "list_icons",
  "arguments": {}
}
```

The response includes the full set of valid values:

```json
{
  "icons": [
    "arrow-left",
    "arrow-right",
    "chevron-down",
    "chevron-left",
    "chevron-right",
    "close",
    "search",
    "skip-back",
    "skip-forward",
    "zoom",
    "arrow-down",
    "date",
    "download",
    "email",
    "facebook",
    "file",
    "home",
    "linkedin",
    "login",
    "map-pin",
    "map",
    "person",
    "phone",
    "star",
    "time",
    "twitter",
    "upload",
    "xing"
  ],
  "count": 28,
  "usage": "Use these identifiers for any icon field in component content (e.g. hero cta_icon, feature icon, contact-info icon)."
}
```

### Analyze content patterns

Pattern data is **cached at server startup** — this call returns instantly from memory. Other tools (`plan_page`, `generate_section`, `list_recipes`) also read from this cache automatically.

```json
{
  "tool": "analyze_content_patterns",
  "arguments": {
    "contentType": "page"
  }
}
```

Returns component frequency, common sequences, sub-component item counts, page archetypes, and unused components.

After publishing new content, pass `refresh: true` to re-fetch from Storyblok and update the cache:

```json
{
  "tool": "analyze_content_patterns",
  "arguments": { "refresh": true }
}
```

### Plan a page

Get an AI-assisted section plan based on site patterns:

```json
{
  "tool": "plan_page",
  "arguments": {
    "intent": "Product landing page for our new AI feature",
    "sectionCount": 5,
    "contentType": "page"
  }
}
```

Returns a structured plan with `componentType` and `intent` per section. Use the plan to generate each section individually.

For **Tier 2 (flat) content types**, `plan_page` returns a field population plan instead of a section sequence:

```json
{
  "tool": "plan_page",
  "arguments": {
    "intent": "Workshop on AI tools for developers",
    "contentType": "event-detail"
  }
}
```

### Generate a single section with site context

Generate content for one section with automatic site-aware context injection:

```json
{
  "tool": "generate_section",
  "arguments": {
    "componentType": "features",
    "prompt": "4 key capabilities of our AI consulting service",
    "previousSection": "hero",
    "nextSection": "testimonials",
    "contentType": "page"
  }
}
```

The tool auto-injects site-specific guidance (e.g. "this site typically uses 4 feature items") and transition context into the system prompt.

### List recipes with live patterns

Get curated component combinations merged with the site's actual usage patterns:

```json
{
  "tool": "list_recipes",
  "arguments": {
    "intent": "service landing page",
    "includePatterns": true,
    "contentType": "page"
  }
}
```

Filter by content type to get recipes specific to blog posts, events, etc.:

```json
{
  "tool": "list_recipes",
  "arguments": {
    "contentType": "blog-post"
  }
}
```

## Resources

The server also exposes MCP resources:

- `storyblok://components` - All component schemas
- `storyblok://stories` - Overview of all stories
- `recipes://section-recipes` - Curated section recipes, page templates, and anti-patterns for guided content generation

## Guided Generation

The server supports a **section-by-section generation workflow** that produces higher-quality content than generating entire pages at once. The recommended flow:

1. **Analyze** — `analyze_content_patterns` returns the site's structural patterns from a **startup cache** (instant, no API call). Pass `refresh: true` after publishing new content
2. **Plan** — `plan_page` uses AI + site patterns to suggest a section sequence for a given page intent. For hybrid content types (blog-post, blog-overview), also returns `rootFieldMeta` with priority annotations for non-section root fields
3. **Generate** — `generate_section` creates each section individually with site-aware context injection
4. **Root Fields** (hybrid types only) — `generate_root_field` generates content for each root-level field (e.g. `head`, `aside`, `cta`)
5. **SEO** — `generate_seo` generates SEO metadata (title, description, keywords, OG image) using a specialized SEO-expert prompt
6. **Assemble** — `create_page_with_content` combines all sections and root fields into a page with validation and optional asset upload

For standard pages, steps 4–5 can be skipped. For hybrid content types like `blog-post`, the full workflow is:
`plan_page` → `generate_section` (per section) → `generate_root_field` (per root field) → `generate_seo` → `create_page_with_content(sections: [...], rootFields: { head, aside, cta, seo })`

Alternatively, use `list_recipes` for a single-call overview of proven component combinations merged with the site's live patterns.

### Compositional Quality Warnings

Write tools (`import_content`, `import_content_at_position`, `create_page_with_content`) return **compositional quality warnings** alongside successful results. These are non-blocking hints about content quality:

| Warning                     | Example                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Duplicate heroes            | "Multiple hero-type components found (hero, video-curtain)"        |
| Adjacent same-type sections | "Adjacent sections both use 'features'. This may look repetitive." |
| Sparse sub-items            | "'stats' has only 2 stat items (minimum recommended: 3)"           |
| Missing blog-teaser link    | "'blog-teaser' section has no link URL"                            |
| No CTA on conversion page   | "This looks like a conversion page but has no CTA section"         |

Warnings appear in the `warnings` array of the response. Content is still saved — warnings are advisory only.

## Schema Guardrails & Content Validation

All write tools (`create_story`, `update_story`, `import_content`, `import_content_at_position`, `create_page_with_content`) validate content **before** writing to Storyblok. Validation rules are derived automatically from the dereferenced schema **for each content type** via the `SchemaRegistry` — no component names or nesting rules are hardcoded. The server loads 5 content type schemas at startup (`page`, `blog-post`, `blog-overview`, `event-detail`, `event-list`) and builds per-type validation rules.

### What is validated

| Check                      | Example error                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| Unknown component types    | `"carousel" is not a known component type`                                                       |
| Nesting violations         | `"hero" is not allowed inside "mosaic.tile"`                                                     |
| Sub-component misplacement | `"tile" can only be used inside "mosaic.tile", not at top level`                                 |
| Dual discriminator         | `Component "hero" has both "component" and "type" — Storyblok content must only use "component"` |

### Introspection annotations

The `list_components` and `get_component` tools annotate their output with nesting rules so LLMs can understand the component hierarchy before generating content:

- **`list_components`** — each component includes `allowedIn`, `isSubComponent`, `parentComponent`, and a `note` explaining placement.
- **`get_component`** — wraps the schema in a `composition_rules` object with `allowedIn` and `childSlots`.

### Escape hatch

All validated write tools accept an optional `skipValidation: true` parameter to bypass validation when needed (e.g. experimental content structures).

### Validation in other consumers

The same validation logic from `@kickstartds/storyblok-services` is also applied in:

- **n8n community nodes** — `importContentIntoStory` and `insertContentAtPosition` validate sections before writing.
- **Next.js API route** (`/api/import`) — validates sections before calling `importByPrompterReplacement`.

## Development

### Project Structure

```
# Monorepo root
config/
└── deploy-mcp.yml              # Kamal deployment configuration
.kamal/
└── secrets                     # Kamal secrets (reads from environment)

# MCP server package
packages/mcp-server/
├── src/
│   ├── index.ts                # Main server with tool handlers (stdio + HTTP transport)
│   ├── config.ts               # Configuration and Zod schemas
│   ├── services.ts             # Storyblok and OpenAI service classes (delegates to shared lib)
│   └── errors.ts               # Error types and handling
├── schemas/
│   ├── page.schema.dereffed.json           # Design System page schema
│   ├── blog-post.schema.dereffed.json      # Design System blog-post schema
│   ├── blog-overview.schema.dereffed.json  # Design System blog-overview schema
│   ├── event-detail.schema.dereffed.json   # Design System event-detail schema
│   ├── event-list.schema.dereffed.json     # Design System event-list schema
│   └── section-recipes.json               # Curated section recipes, page templates, and anti-patterns
├── .kamal/
│   └── secrets                 # MCP-specific Kamal secrets (reads from environment)
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md

# Shared library (workspace dependency)
packages/storyblok-services/
└── src/                        # Core Storyblok + OpenAI logic
```

Core Storyblok and OpenAI logic — including schema preparation for OpenAI, content transformation, validation, and the end-to-end generation pipeline — lives in the shared library [`@kickstartds/storyblok-services`](../storyblok-services/). The service classes in `services.ts` delegate to shared pure functions for client creation, story management, content import, schema preparation (`prepareSchemaForOpenAi`, `getComponentPresetSchema`), content transformation (`processOpenAiResponse`, `processForStoryblok`), content validation (`buildValidationRules`, `validateSections`, `validatePageContent`, `checkCompositionalQuality`), content pattern analysis (`analyzeContentPatterns`), and the high-level pipeline (`generateAndPrepareContent`). Pattern analysis results are **cached at startup** and shared by `plan_page`, `generate_section`, and `list_recipes` to avoid redundant API calls. MCP-specific operations (tool registration, transport layer, resource listing) remain in this package.

### Key Dependencies

| Package                           | Version       | Purpose                                                      |
| --------------------------------- | ------------- | ------------------------------------------------------------ |
| `@modelcontextprotocol/sdk`       | `^1.0.0`      | MCP protocol implementation                                  |
| `@kickstartds/storyblok-services` | `workspace:*` | Shared Storyblok + OpenAI service functions (pnpm workspace) |
| `openai`                          | `^6.18.0`     | OpenAI API client                                            |
| `storyblok-js-client`             | `^7.2.3`      | Storyblok Management API client                              |
| `turndown`                        | `^7.2.0`      | HTML-to-Markdown conversion for web scraping                 |

### Building

```bash
# From repo root (builds shared lib + MCP server):
pnpm --filter @kickstartds/storyblok-services run build
pnpm --filter @kickstartds/storyblok-mcp-server run build

# Or from packages/mcp-server/ (shared lib must already be built):
pnpm run build
```

### Type Checking

```bash
pnpm --filter @kickstartds/storyblok-mcp-server run typecheck
```

### Development Mode

```bash
pnpm --filter @kickstartds/storyblok-mcp-server run dev  # Watch mode
```

## Environment Variables

| Variable                | Required | Description                                           |
| ----------------------- | -------- | ----------------------------------------------------- |
| `STORYBLOK_API_TOKEN`   | Yes      | Preview API token for content delivery                |
| `STORYBLOK_OAUTH_TOKEN` | Yes      | Management API OAuth token                            |
| `STORYBLOK_SPACE_ID`    | Yes      | Your Storyblok space ID                               |
| `OPENAI_API_KEY`        | No       | OpenAI API key for content generation                 |
| `MCP_TRANSPORT`         | No       | Transport mode: `stdio` (default) or `http`           |
| `MCP_PORT`              | No       | HTTP port when using `http` transport (default: 8080) |

## Error Handling

The server provides structured error responses:

```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Invalid input parameters",
  "details": {
    "issues": [{ "path": "storyId", "message": "Required" }]
  }
}
```

Error codes:

- `VALIDATION_ERROR` - Invalid input parameters
- `CONFIGURATION_ERROR` - Missing or invalid configuration
- `STORYBLOK_API_ERROR` - Storyblok API errors
- `OPENAI_API_ERROR` - OpenAI API errors
- `NOT_FOUND` - Resource not found

## n8n Integration

For event-driven and scheduled content automation without an LLM intermediary, see the companion **n8n community node package**: [`n8n-nodes-storyblok-kickstartds`](../n8n-nodes/).

It provides **20 operations across 3 resources** — matching the full MCP tool surface as native n8n nodes:

| Resource       | Operations | Covers MCP tools                                                                                                                         |
| -------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Content** | 7          | `generate_content`, `import_content`, `generate_section`, `plan_page`, `analyze_content_patterns`, `generate_root_field`, `generate_seo` |
| **Story**      | 6          | `list_stories`, `get_story`, `create_page_with_content`, `update_story`, `delete_story`, `search_content`                                |
| **Space**      | 7          | `scrape_url`, `list_components`, `get_component`, `list_assets`, `list_recipes`, `list_icons`, `ensure_path`                             |

Both packages consume the same shared service library (`@kickstartds/storyblok-services`), so validation, schema preparation, and content transformation behave identically. Nine ready-to-import workflow templates are included.

## License

MIT OR Apache-2.0

## Verifying the Deployment

After a successful Kamal deploy, you can verify everything is working using cURL from your terminal. Replace `YOUR_DOMAIN` with the domain you configured for `MCP_PUBLIC_DOMAIN`.

### 1. Health check

```bash
curl -s https://YOUR_DOMAIN/health | jq .
```

Expected response:

```json
{
  "status": "ok"
}
```

- `"status": "ok"` — the container is running and responsive

### 2. MCP initialize (start a session)

Send a JSON-RPC `initialize` request to the `/mcp` endpoint to establish a session:

```bash
curl -si -X POST https://YOUR_DOMAIN/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "curl-test", "version": "1.0.0" }
    }
  }'
```

Look for a response containing `"serverInfo"` with `"name": "storyblok-mcp-server"` and a `Mcp-Session-Id` response header. Save that session ID for subsequent requests:

```bash
# Extract just the session ID header
curl -si -X POST https://YOUR_DOMAIN/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "curl-test", "version": "1.0.0" }
    }
  }' 2>&1 | grep -i mcp-session-id
```

### 3. List available tools

Using the session ID from step 2, list all registered tools:

```bash
curl -s -X POST https://YOUR_DOMAIN/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: <SESSION_ID>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

You should see tools like `list_stories`, `get_story`, `create_story`, `search_content`, `scrape_url`, `list_components`, `get_component`, `generate_content`, `list_icons`, `analyze_content_patterns`, `list_recipes`, `plan_page`, `generate_section`, `generate_root_field`, `generate_seo`, etc.

### 4. Call a tool

Test that the server can communicate with Storyblok by calling `list_components`:

```bash
curl -s -X POST https://YOUR_DOMAIN/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: <SESSION_ID>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "list_components",
      "arguments": {}
    }
  }'
```

This should return the component schemas defined in your Storyblok space.

### 5. Verify unknown routes return 404

```bash
curl -s https://YOUR_DOMAIN/nonexistent
```

Expected: `Not found`

### Verification checklist

| Check                     | Expected                         | What it confirms                    |
| ------------------------- | -------------------------------- | ----------------------------------- |
| `GET /health` returns 200 | `{"status":"ok"}`                | Container is up                     |
| `POST /mcp` initialize    | Server info + session ID         | MCP protocol is working             |
| `tools/list`              | Array of tool definitions        | Handler registration is correct     |
| `tools/call`              | Component schemas from Storyblok | API connectivity works in container |
| Unknown route             | `Not found`                      | Routing logic is correct            |
