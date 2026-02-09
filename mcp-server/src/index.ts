#!/usr/bin/env node

import { createServer } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadConfig, schemas } from "./config.js";
import { StoryblokService, ContentGenerationService } from "./services.js";
import {
  formatErrorResponse,
  ValidationError,
  ConfigurationError,
  StoryblokApiError,
  OpenAIApiError,
} from "./errors.js";

/**
 * MCP Server for Storyblok CMS integration
 *
 * Provides tools for:
 * - AI content generation
 * - Story management (CRUD)
 * - Component introspection
 * - Asset management
 * - Content search
 */

// Initialize services
let storyblokService: StoryblokService;
let contentService: ContentGenerationService;

try {
  const config = loadConfig();
  storyblokService = new StoryblokService(config);
  contentService = new ContentGenerationService(config.openAiApiKey);
} catch (error) {
  console.error("Failed to initialize services:", error);
  process.exit(1);
}

/**
 * Create a fresh MCP Server instance with all handlers registered.
 *
 * In HTTP mode the SDK requires one Server per transport/session,
 * so we mint a new instance for every request (stateless).
 * In stdio mode a single instance is reused for the lifetime of the process.
 */
function createMcpServer() {
  const mcpServer = new Server(
    {
      name: "storyblok-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  /**
   * Tool definitions
   */
  const TOOLS = [
    {
      name: "generate_content",
      description: `Generate structured content using AI (OpenAI GPT-4).

Use this tool to generate page content, section content, or any other structured data
that follows a JSON schema. The generated content will match the schema used by
the kickstartDS Design System components.

Example use cases:
- Generate a hero section with headline, text, and CTA
- Create a features section with multiple feature items
- Generate FAQ content with questions and answers
- Create testimonials with quotes and author info`,
      inputSchema: {
        type: "object",
        properties: {
          system: {
            type: "string",
            description:
              "System prompt to guide the AI's behavior and expertise",
          },
          prompt: {
            type: "string",
            description: "User prompt describing what content to generate",
          },
          schema: {
            type: "object",
            description: "JSON schema for structured output",
            properties: {
              name: { type: "string" },
              strict: { type: "boolean" },
              schema: { type: "object" },
            },
            required: ["name", "schema"],
          },
        },
        required: ["system", "prompt", "schema"],
      },
    },
    {
      name: "import_content",
      description: `Import generated content into a Storyblok story.

This tool replaces a prompter component in a story with new section content.
It's used after generating content with AI to persist it into the CMS.

The tool:
1. Fetches the current story
2. Finds the prompter component by its UID
3. Replaces it with the new sections
4. Saves the story as a draft`,
      inputSchema: {
        type: "object",
        properties: {
          storyUid: {
            type: "string",
            description: "The UID of the story to update",
          },
          prompterUid: {
            type: "string",
            description: "The UID of the prompter component to replace",
          },
          page: {
            type: "object",
            description: "Page content with sections to import",
            properties: {
              content: {
                type: "object",
                properties: {
                  section: {
                    type: "array",
                    items: { type: "object" },
                  },
                },
                required: ["section"],
              },
            },
            required: ["content"],
          },
        },
        required: ["storyUid", "prompterUid", "page"],
      },
    },
    {
      name: "import_content_at_position",
      description: `Import content into an existing Storyblok story at a specific position.

Inserts section content at a given index in the story's section array without
removing any existing content. This is useful for adding new sections to an
existing page without replacing anything.

Position semantics:
- 0 = insert at the beginning
- -1 = append at the end
- Any other number = insert at that index (clamped to bounds)`,
      inputSchema: {
        type: "object",
        properties: {
          storyUid: {
            type: "string",
            description: "The UID (or numeric ID) of the story to update",
          },
          position: {
            type: "number",
            description:
              "Zero-based insertion index. 0 = beginning, -1 = end, any other value is clamped to bounds",
          },
          sections: {
            type: "array",
            items: { type: "object" },
            description:
              "Array of section objects to insert at the given position",
          },
          publish: {
            type: "boolean",
            description:
              "Publish the story immediately after importing (default: false)",
          },
        },
        required: ["storyUid", "position", "sections"],
      },
    },
    {
      name: "create_page_with_content",
      description: `Create a new page in Storyblok pre-populated with section content.

This is the recommended way to create a brand new page with AI-generated or
pre-built content. It handles all the boilerplate:
1. Auto-generates _uid fields for every nested component that is missing one
2. Wraps sections in a standard "page" component envelope
3. Creates the story in Storyblok
4. Optionally publishes it

Use this instead of create_story when you have section content ready to go.`,
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Display name for the page",
          },
          slug: {
            type: "string",
            description: "URL slug for the page",
          },
          parentId: {
            type: "number",
            description: "Parent folder ID (for nested content)",
          },
          sections: {
            type: "array",
            items: { type: "object" },
            description:
              "Array of section objects to populate the page with. Missing _uid fields will be auto-generated.",
          },
          publish: {
            type: "boolean",
            description:
              "Publish the page immediately after creation (default: false)",
          },
        },
        required: ["name", "slug", "sections"],
      },
    },
    {
      name: "get_ideas",
      description: `Fetch ideas from the Storyblok space.

Ideas in Storyblok are suggestions or notes that can be associated with stories.
This tool retrieves all ideas in the space for review or processing.`,
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "list_stories",
      description: `List stories in the Storyblok space with optional filtering.

Use this to browse content, find stories by type, or paginate through large collections.

Returns story metadata including:
- ID, UUID, slug
- Name and full_slug
- Content type
- Created/updated timestamps
- Published status`,
      inputSchema: {
        type: "object",
        properties: {
          startsWith: {
            type: "string",
            description:
              "Filter stories by slug prefix (e.g., 'blog/' for all blog posts)",
          },
          contentType: {
            type: "string",
            description:
              "Filter by content type (e.g., 'page', 'blog-post', 'event-detail')",
          },
          page: {
            type: "number",
            description: "Page number for pagination (default: 1)",
          },
          perPage: {
            type: "number",
            description: "Stories per page (default: 25, max: 100)",
          },
        },
        required: [],
      },
    },
    {
      name: "get_story",
      description: `Get a single story with its full content.

Retrieves the complete story including all nested components and content.
Useful for inspecting existing content or getting a template structure.`,
      inputSchema: {
        type: "object",
        properties: {
          identifier: {
            type: "string",
            description: "Story slug (e.g., 'home'), ID, or UUID",
          },
          findBy: {
            type: "string",
            enum: ["slug", "id", "uuid"],
            description: "How to find the story (default: 'slug')",
          },
          version: {
            type: "string",
            enum: ["draft", "published"],
            description: "Content version to fetch (default: 'published')",
          },
        },
        required: ["identifier"],
      },
    },
    {
      name: "create_story",
      description: `Create a new story in Storyblok.

Creates a new page, blog post, or other content type with the specified content.
The content should match the component schema for the content type.`,
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Display name for the story",
          },
          slug: {
            type: "string",
            description: "URL slug (will be auto-generated if not provided)",
          },
          parentId: {
            type: "number",
            description: "Parent folder ID (for nested content)",
          },
          content: {
            type: "object",
            description: "Story content object with component data",
          },
          isFolder: {
            type: "boolean",
            description: "Create as a folder instead of a story",
          },
        },
        required: ["name", "slug", "content"],
      },
    },
    {
      name: "update_story",
      description: `Update an existing story in Storyblok.

Modifies story content, name, or slug. Can optionally publish the changes.`,
      inputSchema: {
        type: "object",
        properties: {
          storyId: {
            type: "number",
            description: "Story ID to update",
          },
          content: {
            type: "object",
            description: "Updated content object",
          },
          name: {
            type: "string",
            description: "Updated story name",
          },
          slug: {
            type: "string",
            description: "Updated URL slug",
          },
          publish: {
            type: "boolean",
            description: "Publish the story after updating (default: false)",
          },
        },
        required: ["storyId"],
      },
    },
    {
      name: "delete_story",
      description: `Delete a story from Storyblok.

Permanently removes the story. This action cannot be undone.`,
      inputSchema: {
        type: "object",
        properties: {
          storyId: {
            type: "number",
            description: "Story ID to delete",
          },
        },
        required: ["storyId"],
      },
    },
    {
      name: "list_components",
      description: `List all components defined in the Storyblok space.

Returns all component schemas including:
- Component name and display name
- Field definitions and types
- Validation rules
- Available presets

Useful for understanding what content structures are available.`,
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "get_component",
      description: `Get detailed information about a specific component.

Returns the full component schema including:
- All field definitions
- Field types (text, bloks, asset, etc.)
- Restrictions and validations
- Default values

Use this to understand how to structure content for a component.`,
      inputSchema: {
        type: "object",
        properties: {
          componentName: {
            type: "string",
            description:
              "Name of the component (e.g., 'hero', 'section', 'blog-teaser')",
          },
        },
        required: ["componentName"],
      },
    },
    {
      name: "list_assets",
      description: `List assets (images, files) in the Storyblok space.

Returns asset metadata including:
- Filename and URL
- File type and size
- Alt text
- Folder location`,
      inputSchema: {
        type: "object",
        properties: {
          page: {
            type: "number",
            description: "Page number for pagination",
          },
          perPage: {
            type: "number",
            description: "Assets per page (default: 25)",
          },
          search: {
            type: "string",
            description: "Search term to filter assets by filename",
          },
          inFolder: {
            type: "number",
            description: "Filter by asset folder ID",
          },
        },
        required: [],
      },
    },
    {
      name: "search_content",
      description: `Search for content across all stories.

Performs a full-text search across story content.
Useful for finding specific text, topics, or references.`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          contentType: {
            type: "string",
            description: "Filter results by content type",
          },
        },
        required: ["query"],
      },
    },
  ];

  /**
   * Handle tool listing
   */
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  /**
   * Handle tool execution
   */
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "generate_content": {
          if (!contentService.isConfigured()) {
            throw new ConfigurationError(
              "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
            );
          }
          const validated = schemas.generateContent.parse(args);
          const result = await contentService.generateContent(validated);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "import_content": {
          const validated = schemas.importContent.parse(args);
          const result = await storyblokService.importContent(validated);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: "Content imported successfully",
                    story: result,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "import_content_at_position": {
          const validated = schemas.importContentAtPosition.parse(args);
          const result = await storyblokService.importContentAtPosition({
            storyUid: validated.storyUid,
            position: validated.position,
            page: { content: { section: validated.sections } },
            publish: validated.publish,
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Content imported at position ${validated.position}`,
                    story: result,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "create_page_with_content": {
          const validated = schemas.createPageWithContent.parse(args);
          const result = await storyblokService.createPageWithContent(
            validated
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: validated.publish
                      ? "Page created and published"
                      : "Page created (draft)",
                    story: result,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "get_ideas": {
          const result = await storyblokService.getIdeas();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "list_stories": {
          const validated = schemas.listStories.parse(args);
          const result = await storyblokService.listStories(validated);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_story": {
          const validated = schemas.getStory.parse(args);
          const result = await storyblokService.getStory(
            validated.identifier,
            validated.findBy,
            validated.version
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "create_story": {
          const validated = schemas.createStory.parse(args);
          const result = await storyblokService.createStory(validated);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: "Story created successfully",
                    story: result,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "update_story": {
          const validated = schemas.updateStory.parse(args);
          const result = await storyblokService.updateStory(
            validated.storyId,
            {
              content: validated.content,
              name: validated.name,
              slug: validated.slug,
            },
            validated.publish
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: validated.publish
                      ? "Story updated and published"
                      : "Story updated (draft)",
                    story: result,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "delete_story": {
          const validated = schemas.deleteStory.parse(args);
          await storyblokService.deleteStory(validated.storyId);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Story ${validated.storyId} deleted successfully`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "list_components": {
          const result = await storyblokService.listComponents();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_component": {
          const validated = schemas.getComponent.parse(args);
          const result = await storyblokService.getComponent(
            validated.componentName
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "list_assets": {
          const validated = schemas.listAssets.parse(args);
          const result = await storyblokService.listAssets(validated);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "search_content": {
          const validated = schemas.searchContent.parse(args);
          const result = await storyblokService.searchContent(
            validated.query,
            validated.contentType
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new ValidationError(`Unknown tool: ${name}`);
      }
    } catch (error) {
      // Handle Zod validation errors
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as {
          issues: Array<{ path: string[]; message: string }>;
        };
        throw new ValidationError("Invalid input parameters", {
          issues: zodError.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }

      // Re-throw MCP errors
      if (error instanceof Error && error.name.includes("Error")) {
        return formatErrorResponse(error);
      }

      throw error;
    }
  });

  /**
   * Handle resource listing
   */
  mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "storyblok://components",
          name: "Component Schemas",
          description: "All component schemas defined in the Storyblok space",
          mimeType: "application/json",
        },
        {
          uri: "storyblok://stories",
          name: "Stories Overview",
          description: "Overview of all stories in the space",
          mimeType: "application/json",
        },
      ],
    };
  });

  /**
   * Handle resource reading
   */
  mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case "storyblok://components": {
        const components = await storyblokService.listComponents();
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(components, null, 2),
            },
          ],
        };
      }

      case "storyblok://stories": {
        const stories = await storyblokService.listStories({ perPage: 100 });
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(stories, null, 2),
            },
          ],
        };
      }

      default:
        throw new ValidationError(`Unknown resource: ${uri}`);
    }
  });

  return mcpServer;
}

/**
 * Main entry point
 *
 * Supports two transport modes:
 * - stdio (default): For local usage with Claude Desktop, etc.
 * - http: For cloud deployment via Streamable HTTP (set MCP_TRANSPORT=http)
 */
async function main() {
  const transportMode = process.env.MCP_TRANSPORT || "stdio";

  if (transportMode === "http") {
    const PORT = parseInt(process.env.MCP_PORT || "8080", 10);

    const httpServer = createServer(async (req, res) => {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);

      // Health check endpoint for Kamal / load balancer probes
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      // Only handle /mcp path
      if (url.pathname !== "/mcp") {
        res.writeHead(404).end("Not found");
        return;
      }

      // CORS headers for remote clients
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version"
      );
      res.setHeader(
        "Access-Control-Expose-Headers",
        "mcp-session-id, mcp-protocol-version"
      );

      if (req.method === "OPTIONS") {
        res.writeHead(204).end();
        return;
      }

      try {
        // Parse the request body for POST
        let body: unknown;
        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
          }
          body = JSON.parse(Buffer.concat(chunks).toString());
        }

        // Stateless mode: create a fresh server + transport for every request.
        // This avoids the "already connected" error and keeps things simple —
        // no session tracking required.
        const mcpServer = createMcpServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined as unknown as () => string,
        });

        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, body);

        // Clean up after the response is sent
        res.on("finish", () => {
          mcpServer.close().catch(() => {});
          transport.close().catch(() => {});
        });
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32603, message: "Internal server error" },
              id: null,
            })
          );
        }
      }
    });

    httpServer.listen(PORT, () => {
      console.error(
        `Storyblok MCP Server (Streamable HTTP, stateless) listening on port ${PORT}`
      );
      console.error(`Endpoint: http://0.0.0.0:${PORT}/mcp`);
      console.error(`Health check: http://0.0.0.0:${PORT}/health`);
      console.error(
        `OpenAI integration: ${
          contentService.isConfigured() ? "enabled" : "disabled"
        }`
      );
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.error("Shutting down...");
      httpServer.close();
      process.exit(0);
    });
  } else {
    // Default: stdio transport for local usage
    const transport = new StdioServerTransport();
    const mcpServer = createMcpServer();

    console.error("Starting Storyblok MCP Server...");
    console.error(
      `OpenAI integration: ${
        contentService.isConfigured() ? "enabled" : "disabled"
      }`
    );

    await mcpServer.connect(transport);
    console.error("Storyblok MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
