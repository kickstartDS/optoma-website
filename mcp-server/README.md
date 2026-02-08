# Storyblok MCP Server

A Model Context Protocol (MCP) server for integrating Storyblok CMS with AI assistants. This server enables LLMs to interact with your Storyblok space, manage content, and generate AI-powered content using kickstartDS Design System components.

## Features

### Content Management Tools

| Tool             | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `list_stories`   | List stories with filtering by slug prefix or content type |
| `get_story`      | Get a single story by slug, ID, or UUID                    |
| `create_story`   | Create a new story with content                            |
| `update_story`   | Update an existing story                                   |
| `delete_story`   | Delete a story                                             |
| `search_content` | Full-text search across stories                            |

### AI Content Generation

| Tool               | Description                                     |
| ------------------ | ----------------------------------------------- |
| `generate_content` | Generate structured content using OpenAI GPT-4  |
| `import_content`   | Import generated content into a Storyblok story |

### Component & Asset Management

| Tool              | Description                                  |
| ----------------- | -------------------------------------------- |
| `list_components` | List all component schemas in the space      |
| `get_component`   | Get detailed schema for a specific component |
| `list_assets`     | List assets with pagination and search       |
| `get_ideas`       | Fetch ideas from the Storyblok space         |

## Installation

### Prerequisites

- Node.js 18+
- Storyblok space with API tokens
- (Optional) OpenAI API key for content generation

### Setup

1. Install dependencies:

```bash
cd mcp-server
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:

```env
STORYBLOK_API_TOKEN=your-preview-token
STORYBLOK_OAUTH_TOKEN=your-oauth-token
STORYBLOK_SPACE_ID=123456
OPENAI_API_KEY=sk-your-openai-key  # Optional
```

4. Build the server:

```bash
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "storyblok": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
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

Build the Docker image (from the repository root):

```bash
docker build -t storyblok-mcp-server -f mcp-server/Dockerfile .
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

```bash
cd mcp-server
kamal setup    # First-time setup
kamal deploy   # Subsequent deployments
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

# Run the server
npm start
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

### Generate a hero section

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

## Resources

The server also exposes MCP resources:

- `storyblok://components` - All component schemas
- `storyblok://stories` - Overview of all stories

## Development

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts      # Main server with tool handlers (stdio + HTTP transport)
│   ├── config.ts     # Configuration and Zod schemas
│   ├── services.ts   # Storyblok and OpenAI service classes (delegates to shared lib)
│   └── errors.ts     # Error types and handling
├── config/
│   └── deploy.yml    # Kamal deployment configuration
├── .kamal/
│   └── secrets       # Kamal secrets (reads from environment)
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

Core Storyblok and OpenAI logic lives in the shared library [`@kickstartds/storyblok-services`](../shared/storyblok-services/). The service classes in `services.ts` delegate to shared pure functions for client creation, story management, content import, and structured content generation. MCP-specific operations (tool registration, transport layer, resource listing) remain in this package.

### Key Dependencies

| Package                           | Version   | Purpose                                     |
| --------------------------------- | --------- | ------------------------------------------- |
| `@modelcontextprotocol/sdk`       | `^1.0.0`  | MCP protocol implementation                 |
| `@kickstartds/storyblok-services` | `file:..` | Shared Storyblok + OpenAI service functions |
| `openai`                          | `^6.18.0` | OpenAI API client                           |
| `storyblok-js-client`             | `^7.2.3`  | Storyblok Management API client             |

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Development Mode

```bash
npm run dev  # Watch mode
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

For event-driven and scheduled content automation without an LLM intermediary, see the companion **n8n community node package**: [`n8n-nodes-storyblok-kickstartds`](../n8n-nodes-storyblok-kickstartds/).

It provides the same `generate_content` and `import_content` capabilities as n8n workflow nodes, enabling pipelines like:

- **Webhook → Generate → Import → Slack** — trigger content generation from external events
- **Schedule → Batch Generate → Import** — automated recurring content creation
- **Manual trigger → Generate hero/FAQ/features → Import as draft** — one-click content scaffolding

## License

MIT OR Apache-2.0
