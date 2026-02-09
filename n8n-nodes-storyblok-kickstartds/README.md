# n8n-nodes-storyblok-kickstartds

n8n community node package for **Storyblok CMS** with **kickstartDS Design System** — AI-powered content generation and import.

This package provides two operations as a single n8n node:

| Operation            | Description                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Generate Content** | Generate structured content via OpenAI GPT-4 using JSON Schema — auto-derived from the Design System, preset, or custom                      |
| **Import Content**   | Import generated content into a Storyblok story — replace a prompter component or insert at any position, with automatic Storyblok transform |

Together they enable fully automated content pipelines: trigger → generate → import → publish/notify.

## Installation

### n8n Community Nodes (recommended)

1. Open your n8n instance
2. Go to **Settings → Community Nodes**
3. Click **Install a community node**
4. Enter: `n8n-nodes-storyblok-kickstartds`
5. Click **Install**

### Manual Installation

```bash
# In your n8n installation directory
npm install n8n-nodes-storyblok-kickstartds

# Or via N8N_CUSTOM_EXTENSIONS
export N8N_CUSTOM_EXTENSIONS="/path/to/n8n-nodes-storyblok-kickstartds"
```

### Docker

```dockerfile
FROM n8nio/n8n:latest
RUN cd /usr/local/lib/node_modules/n8n && npm install n8n-nodes-storyblok-kickstartds
```

## Credentials Setup

### Storyblok API

| Field                      | Description                                                                    |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Space ID**               | Your numeric Storyblok space ID (visible in dashboard URL)                     |
| **Preview API Token**      | Content Delivery API token (Settings → API-Keys → Preview)                     |
| **Management OAuth Token** | Personal access token for Management API (My Account → Personal access tokens) |

### OpenAI API

| Field       | Description                             |
| ----------- | --------------------------------------- |
| **API Key** | Your OpenAI API key starting with `sk-` |

> The OpenAI credential is only required for the **Generate Content** operation.

## Node Reference

### Resource: AI Content

#### Operation: Generate

Generate structured content using OpenAI with JSON Schema constraints.

| Parameter            | Type   | Required    | Description                                                                                 |
| -------------------- | ------ | ----------- | ------------------------------------------------------------------------------------------- |
| **System Prompt**    | String | ✅          | Sets the AI's persona, tone, and domain knowledge                                           |
| **Prompt**           | String | ✅          | Describes what content to generate                                                          |
| **Schema Mode**      | Select | ✅          | `Auto (Design System)` (default), `Preset`, or `Custom JSON Schema`                         |
| **Component Type**   | Select | When Auto   | Component to generate (e.g. Hero, FAQ, Features). Omit for full-page generation             |
| **Section Count**    | Number | When Auto   | Number of sections to generate (default: 3, for full-page mode)                             |
| **Component Schema** | Select | When Preset | Choose from: Hero, FAQ, Testimonials, Features, CTA, Text, Blog Teaser, Stats, Image + Text |
| **Schema Name**      | String | When Custom | Identifier for the custom schema                                                            |
| **JSON Schema**      | JSON   | When Custom | Full JSON Schema object for structured output                                               |
| **Model**            | Select | ✅          | OpenAI model: `gpt-4o-2024-08-06` (default), `gpt-4o-mini`, `gpt-4-turbo`                   |

**Output (Auto mode):**

```json
{
  "designSystemProps": { "headline": "...", "sub": "...", "text": "..." },
  "storyblokContent": { "component": "hero", "headline": "...", "sub": "...", "text": "..." },
  "rawResponse": { ... },
  "_meta": {
    "model": "gpt-4o-2024-08-06",
    "schemaMode": "auto",
    "schemaName": "page_schema",
    "timestamp": "2026-02-07T10:00:00.000Z"
  }
}
```

**Output (Preset / Custom mode):**

```json
{
  "generatedContent": { ... },
  "_meta": {
    "model": "gpt-4o-2024-08-06",
    "schemaMode": "preset",
    "schemaName": "hero_section",
    "timestamp": "2026-02-07T10:00:00.000Z"
  }
}
```

#### Operation: Import

Import generated content into a Storyblok story. Two placement modes are available:

- **Replace Prompter Component** — finds a prompter component by its `_uid` and replaces it with the new sections
- **Insert at Position** — inserts sections at a specific position (beginning, end, or index) without removing existing content

| Parameter                  | Type    | Required                       | Description                                                                     |
| -------------------------- | ------- | ------------------------------ | ------------------------------------------------------------------------------- |
| **Story UID**              | String  | ✅                             | Numeric ID of the Storyblok story to update                                     |
| **Placement Mode**         | Select  | ✅                             | `Replace Prompter Component` or `Insert at Position`                            |
| **Prompter Component UID** | String  | When mode = Replace Prompter   | `_uid` of the prompter component to replace                                     |
| **Insert Position**        | Select  | When mode = Insert at Position | `Beginning`, `End`, or `Specific Index`                                         |
| **Index**                  | Number  | When position = Specific Index | Zero-based index where sections should be inserted (clamped to bounds)          |
| **Page Content**           | JSON    | ✅                             | Object with `{ content: { section: [...] } }` structure                         |
| **Skip Transform**         | Boolean | No                             | Skip automatic Storyblok flattening (for pre-formatted content). Default: false |
| **Publish Immediately**    | Boolean | No                             | If true, publishes the story; if false (default), saves as draft                |

**Output (Replace Prompter mode):**

```json
{
  "success": true,
  "message": "Content imported as draft successfully",
  "story": { ... },
  "_meta": {
    "storyUid": "123456",
    "placementMode": "prompter",
    "placementDetail": "replaced prompter abc-123",
    "sectionsImported": 2,
    "published": false,
    "timestamp": "2026-02-07T10:00:05.000Z"
  }
}
```

**Output (Insert at Position mode):**

```json
{
  "success": true,
  "message": "Content imported as draft successfully",
  "story": { ... },
  "_meta": {
    "storyUid": "123456",
    "placementMode": "position",
    "placementDetail": "appended at end",
    "sectionsImported": 2,
    "published": false,
    "timestamp": "2026-02-07T10:00:05.000Z"
  }
}
```

## Preset Component Schemas

The following kickstartDS component schemas are built in for the **Preset** schema mode. For most use cases, the **Auto (Design System)** mode is recommended instead — it dynamically derives schemas from the full Design System page schema, supporting all components and producing both Design System–shaped and Storyblok-ready output automatically.

| Preset           | Key Fields                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| **Hero**         | `headline`, `sub`, `text`, `buttons[]`, `textPosition`, `height`         |
| **FAQ**          | `questions[]` → `{ question, answer }`                                   |
| **Testimonials** | `testimonial[]` → `{ quote, name, title, rating }`                       |
| **Features**     | `feature[]` → `{ icon, title, text, cta_label, cta_url }`                |
| **CTA**          | `headline`, `sub`, `text`, `buttons[]`, `textAlign`                      |
| **Text**         | `text`, `layout`, `align`, `highlightText`                               |
| **Blog Teaser**  | `headline`, `teaserText`, `date`, `readingTime`, `author_name`, `tags[]` |
| **Stats**        | `stat[]` → `{ number, title, description, icon }`                        |
| **Image + Text** | `text`, `layout`, `highlightText`, `image_alt`                           |

## Example Workflows

Three ready-to-import workflow templates are included in the `workflows/` directory:

### Template 1: Manual → Generate Hero → Import

Simple manual trigger flow. Good for testing and one-off content generation.

### Template 2: Webhook → Generate Full Page → Import → Slack Notification

Receive a webhook with prompt + story/prompter UIDs, generate multi-section page content, import it, and send a Slack notification.

**Webhook payload:**

```json
{
  "prompt": "Create a landing page about our new AI product",
  "storyUid": "123456",
  "prompterUid": "abc-123-def-456"
}
```

### Template 3: Schedule → Batch Generate Blog Teasers → Import

Weekly scheduled workflow that fetches the latest blog posts and generates teaser content for each using `gpt-4o-mini` for cost efficiency.

## Data Flow Between Nodes

The output of **Generate Content** feeds directly into **Import Content**:

```
Generate Content → $json.generatedContent → Import Content (page parameter)
```

**Example n8n expression for the page parameter:**

```
={{ JSON.stringify({ content: { section: [{ component: 'hero', ...($json.generatedContent) }] } }) }}
```

Or, if the generated content is already structured with multiple sections:

```
={{ JSON.stringify({ content: { section: $json.generatedContent.sections } }) }}
```

## Error Handling

| Error                              | Cause                                             | Resolution                                                                                                                              |
| ---------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `OpenAI content generation failed` | Invalid API key, rate limit, or model error       | Check OpenAI credentials and quota                                                                                                      |
| `Storyblok import failed`          | Invalid story UID or API permissions              | Verify the story exists and tokens have write access                                                                                    |
| `Prompter component not found`     | The `_uid` doesn't match any section in the story | The error message lists all available section UIDs for reference. Or switch to **Insert at Position** mode if the story has no prompter |
| `Invalid JSON in custom schema`    | Malformed JSON Schema input                       | Validate your JSON Schema syntax                                                                                                        |

All operations support n8n's built-in **Retry on Fail** setting for transient errors.

## Development

```bash
cd n8n-nodes-storyblok-kickstartds

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Watch mode
npm run dev
```

### Local Testing with n8n

```bash
# Link the package globally
npm link

# In your n8n installation
npm link n8n-nodes-storyblok-kickstartds

# Start n8n
n8n start
```

## Related

- [Shared Service Library](../shared/storyblok-services/) — `@kickstartds/storyblok-services` — shared Storyblok, OpenAI, schema preparation, and content transformation logic consumed by this package, the MCP server, and the Next.js API routes
- [Storyblok MCP Server](../mcp-server/) — The MCP server that this n8n node is based on (deployable to the cloud via Kamal with Streamable HTTP transport)
- [kickstartDS Design System](https://www.kickstartds.com/) — The component library powering the content schemas
- [n8n Community Nodes docs](https://docs.n8n.io/integrations/community-nodes/) — How to install and use community nodes

## Key Dependencies

| Package                           | Version   | Purpose                                     |
| --------------------------------- | --------- | ------------------------------------------- |
| `@kickstartds/storyblok-services` | `file:..` | Shared Storyblok + OpenAI service functions |
| `openai`                          | `^6.18.0` | OpenAI API client                           |
| `storyblok-js-client`             | `^7.2.3`  | Storyblok Management API client             |
| `n8n-workflow`                    | `^1.0.0`  | n8n workflow types                          |

## License

MIT
