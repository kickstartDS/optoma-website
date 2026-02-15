#!/usr/bin/env node

import { createServer } from "node:http";
import { readFileSync, readdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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
import {
  StoryblokService,
  ContentGenerationService,
  scrapeUrl,
  PAGE_VALIDATION_RULES,
} from "./services.js";
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

// Load skill files (workflow guides for AI assistants)
interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
}

function loadSkills(): Skill[] {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // In Docker / production: skills/ sits next to dist/ → ../skills/
  // In local dev: skills are at ../../docs/skills/ relative to src/
  const candidates = [
    join(__dirname, "..", "skills"),
    join(__dirname, "..", "..", "docs", "skills"),
  ];

  const skillsDir = candidates.find((dir) => {
    try {
      readdirSync(dir);
      return true;
    } catch {
      return false;
    }
  });

  if (!skillsDir) {
    console.error(
      `Skills directory not found (searched: ${candidates.join(
        ", "
      )}), skipping skill loading`
    );
    return [];
  }

  try {
    const files = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
    return files.map((file) => {
      const content = readFileSync(join(skillsDir, file), "utf-8");
      const id = basename(file, ".md");
      // Extract title from first markdown heading
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : id;
      // Extract first paragraph as description
      const descMatch = content.match(/^##\s+Wann verwenden\n\n(.+?)$/m);
      const description = descMatch ? descMatch[1] : `Workflow guide: ${title}`;
      return { id, name: title, description, content };
    });
  } catch {
    console.error(
      `Skills directory not found at ${skillsDir}, skipping skill loading`
    );
    return [];
  }
}

const skills = loadSkills();
console.error(
  `Loaded ${skills.length} skill(s): ${
    skills.map((s) => s.id).join(", ") || "none"
  }`
);

/**
 * Available icon identifiers.
 *
 * These correspond to the keys in token/InlineIcon.tsx and can be used
 * in any component icon field (hero cta_icon, feature icon, etc.).
 */
const AVAILABLE_ICONS = [
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
  "xing",
];

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

This is the recommended way to produce content that is guaranteed to comply with
the Design System's JSON Schema. The schema is auto-derived and enforced by
OpenAI's structured output. Content produced by this tool can be passed directly
to \`create_page_with_content\` or \`import_content_at_position\`.

You can either:
- Provide a custom JSON schema via the 'schema' parameter (advanced), OR
- Let the tool auto-derive the schema by providing 'componentType' and/or 'sectionCount'

When using auto-derived schemas, the tool automatically:
1. Prepares the Design System schema for OpenAI compatibility
2. Generates content via OpenAI
3. Post-processes the response back to Design System format
4. Flattens the content for Storyblok import

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
            description:
              "JSON schema for structured output. Optional when componentType or sectionCount is provided — the schema will be auto-derived from the Design System.",
            properties: {
              name: { type: "string" },
              strict: { type: "boolean" },
              schema: { type: "object" },
            },
            required: ["name", "schema"],
          },
          componentType: {
            type: "string",
            description:
              "Component type to generate (e.g. 'hero', 'faq', 'testimonials'). When provided, the schema is auto-derived and the response is automatically post-processed.",
          },
          sectionCount: {
            type: "number",
            description:
              "Number of sections to generate (for full-page generation). Defaults to 1 when componentType is used.",
          },
        },
        required: ["system", "prompt"],
      },
    },
    {
      name: "import_content",
      description: `Import generated content into a Storyblok story.

This tool replaces a prompter component in a story with new section content.
It's used after generating content with AI to persist it into the CMS.

Content is validated against the Design System's JSON Schema before import.
Invalid component nesting (e.g. placing a sub-component directly in a
top-level container) will be rejected with an actionable error message.
Use \`generate_content\` to produce schema-valid content, or consult
\`list_components\` to check the \`allowedIn\` field for each component.

The tool:
1. Validates content against the Design System schema
2. Fetches the current story
3. Finds the prompter component by its UID
4. Replaces it with the new sections
5. Saves the story as a draft`,
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
            description:
              "Page content with sections to import. Content is automatically flattened for Storyblok unless skipTransform is true.",
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
          skipTransform: {
            type: "boolean",
            description:
              "Skip automatic content flattening for Storyblok. Set to true if content is already in Storyblok format (default: false).",
          },
          uploadAssets: {
            type: "boolean",
            description:
              "When true, image URLs in the content are downloaded and uploaded to Storyblok as native assets before saving. Default: false.",
          },
          assetFolderName: {
            type: "string",
            description:
              "Name of the Storyblok asset folder to upload images into. Created if it does not exist. Defaults to 'AI Generated'.",
          },
          skipValidation: {
            type: "boolean",
            description:
              "Skip content validation against the Design System schema (default: false)",
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

Content is validated against the Design System's JSON Schema before import.
Invalid component nesting (e.g. placing a sub-component directly in a
top-level container) will be rejected with an actionable error message.
Use \`generate_content\` to produce schema-valid content, or consult
\`list_components\` to check the \`allowedIn\` field for each component.

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
              "Array of section objects to insert at the given position. Content is automatically flattened for Storyblok unless skipTransform is true.",
          },
          publish: {
            type: "boolean",
            description:
              "Publish the story immediately after importing (default: false)",
          },
          skipTransform: {
            type: "boolean",
            description:
              "Skip automatic content flattening for Storyblok. Set to true if content is already in Storyblok format (default: false).",
          },
          uploadAssets: {
            type: "boolean",
            description:
              "When true, image URLs in the content are downloaded and uploaded to Storyblok as native assets before saving. Default: false.",
          },
          assetFolderName: {
            type: "string",
            description:
              "Name of the Storyblok asset folder to upload images into. Created if it does not exist. Defaults to 'AI Generated'.",
          },
          skipValidation: {
            type: "boolean",
            description:
              "Skip content validation against the Design System schema (default: false)",
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
1. Validates sections against the Design System's JSON Schema
2. Auto-generates _uid fields for every nested component that is missing one
3. Wraps sections in a standard "page" component envelope
4. Creates the story in Storyblok
5. Optionally publishes it

Sections are validated against the Design System's JSON Schema before saving.
Each container slot (e.g. a section's component list) only accepts the component
types defined by the schema. Sub-components that belong inside a parent component
cannot be placed directly at the top level. Use \`generate_content\` to produce
schema-valid content, or consult \`list_components\` to check the \`allowedIn\`
field for each component.

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
          uploadAssets: {
            type: "boolean",
            description:
              "When true, image URLs in the content are downloaded and uploaded to Storyblok as native assets before saving. Default: false.",
          },
          assetFolderName: {
            type: "string",
            description:
              "Name of the Storyblok asset folder to upload images into. Created if it does not exist. Defaults to 'AI Generated'.",
          },
          skipValidation: {
            type: "boolean",
            description:
              "Skip content validation against the Design System schema (default: false)",
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
The content should match the component schema for the content type.

Content is validated against the Design System's JSON Schema before saving.
Component nesting must comply with the schema's composition rules —
sub-components can only appear inside their designated parent slots.`,
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
          skipValidation: {
            type: "boolean",
            description:
              "Skip content validation against the Design System schema (default: false)",
          },
        },
        required: ["name", "slug", "content"],
      },
    },
    {
      name: "update_story",
      description: `Update an existing story in Storyblok.

Modifies story content, name, or slug. Can optionally publish the changes.

Content is validated against the Design System's JSON Schema before saving.
Component nesting must comply with the schema's composition rules —
sub-components can only appear inside their designated parent slots.`,
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
          skipValidation: {
            type: "boolean",
            description:
              "Skip content validation against the Design System schema (default: false)",
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
- Nesting constraints (allowedIn, isSubComponent)

Note: Not all components can be used everywhere. Check the \`allowedIn\` and
\`isSubComponent\` fields to understand where each component can be placed.
Sub-components can only be used inside their parent component's designated
slot — they cannot be placed directly into a top-level container.

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
- Composition rules (where the component can be placed, child slots)

Note: Components have nesting constraints defined by the Design System's JSON
Schema. Check the \`composition_rules\` field to understand where a component
can be placed and which sub-components it accepts.

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
    {
      name: "scrape_url",
      description: `Fetch a web page and convert it to Markdown.

Use this tool to scrape content from any public URL and get clean Markdown output.
This is useful as a preparation step before creating new content in Storyblok —
the extracted Markdown (including images) can be used as input for content generation.

The tool:
1. Fetches the page HTML with a browser-like User-Agent
2. Extracts the main content area (strips nav, header, footer, scripts, styles)
3. Converts HTML to clean Markdown using Turndown
4. Preserves images with their alt text and absolute URLs
5. Extracts the page title

Returns the page title, source URL, and the Markdown content.`,
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "The URL of the web page to fetch and convert to Markdown",
          },
          selector: {
            type: "string",
            description:
              "Optional CSS selector to extract a specific part of the page (e.g. 'main', 'article', '.content'). Defaults to 'main' if present, otherwise the full page body.",
          },
        },
        required: ["url"],
      },
    },
    {
      name: "list_icons",
      description: `List all available icon identifiers.

Returns the complete set of icon names that can be used in component icon fields
(e.g. hero cta_icon, feature icon, contact-info icon).

Use this tool before generating or importing content that includes icon fields
to ensure only valid icon identifiers are used.`,
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
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

          // If componentType or sectionCount is provided, use auto-schema pipeline
          if (validated.componentType || validated.sectionCount) {
            const result = await contentService.generateWithSchema({
              system: validated.system,
              prompt: validated.prompt,
              componentType: validated.componentType,
              sectionCount: validated.sectionCount,
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // Otherwise, use explicit schema (legacy/custom mode)
          if (!validated.schema) {
            throw new ConfigurationError(
              "Either 'schema' or 'componentType'/'sectionCount' must be provided."
            );
          }
          const result = await contentService.generateContent({
            system: validated.system,
            prompt: validated.prompt,
            schema: validated.schema,
          });
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
          const result = await storyblokService.importContent({
            ...validated,
            skipTransform: validated.skipTransform,
            uploadAssets: validated.uploadAssets,
            assetFolderName: validated.assetFolderName,
            skipValidation: validated.skipValidation,
          });
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
            skipTransform: validated.skipTransform,
            uploadAssets: validated.uploadAssets,
            assetFolderName: validated.assetFolderName,
            skipValidation: validated.skipValidation,
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
          const result = await storyblokService.createPageWithContent({
            ...validated,
            skipValidation: validated.skipValidation,
            uploadAssets: validated.uploadAssets,
            assetFolderName: validated.assetFolderName,
          });
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
          const result = await storyblokService.createStory({
            ...validated,
            skipValidation: validated.skipValidation,
          });
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
            validated.publish,
            validated.skipValidation
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

          // Annotate each component with nesting rules from the schema
          const annotated = (result as Array<{ name: string }>).map((comp) => {
            const name = comp.name;
            const slots =
              PAGE_VALIDATION_RULES.componentToSlots.get(name) || [];
            const isSubComponent =
              slots.length > 0 &&
              slots.every((s) => {
                const parts = s.split(".");
                return !(
                  parts.length === 2 &&
                  PAGE_VALIDATION_RULES.rootArrayFields.includes(parts[0])
                );
              });
            const parentComponents = isSubComponent
              ? [...new Set(slots.map((s) => s.split(".")[0]))]
              : undefined;

            const annotation: Record<string, any> = {
              ...comp,
              allowedIn: slots.length > 0 ? slots : undefined,
              isSubComponent,
            };

            if (isSubComponent && parentComponents?.length) {
              annotation.parentComponent =
                parentComponents.length === 1
                  ? parentComponents[0]
                  : parentComponents;
              annotation.note = `This component cannot be used as a direct child of a top-level container. It must be nested inside ${
                parentComponents.length === 1
                  ? `a '${parentComponents[0]}'`
                  : `one of: ${parentComponents
                      .map((p) => `'${p}'`)
                      .join(", ")}`
              } component.`;
            }

            return annotation;
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(annotated, null, 2),
              },
            ],
          };
        }

        case "get_component": {
          const validated = schemas.getComponent.parse(args);
          const result = await storyblokService.getComponent(
            validated.componentName
          );

          // Add composition rules from the schema
          const name = validated.componentName;
          const slots = PAGE_VALIDATION_RULES.componentToSlots.get(name) || [];

          // Find child slots this component defines
          const childSlots: Record<
            string,
            { slotPath: string; allowedTypes: string[]; note: string }
          > = {};
          for (const [
            slotPath,
            allowedTypes,
          ] of PAGE_VALIDATION_RULES.containerSlots) {
            const parts = slotPath.split(".");
            if (parts.length === 2 && parts[0] === name) {
              childSlots[parts[1]] = {
                slotPath,
                allowedTypes: [...allowedTypes],
                note: `Array of ${[...allowedTypes].join(
                  "/"
                )} sub-component(s)`,
              };
            }
          }

          const compositionRules = {
            allowedIn:
              slots.length > 0
                ? slots
                : ["any (no specific constraints found)"],
            childSlots:
              Object.keys(childSlots).length > 0 ? childSlots : undefined,
          };

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    composition_rules: compositionRules,
                    schema: result,
                  },
                  null,
                  2
                ),
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

        case "scrape_url": {
          const validated = schemas.scrapeUrl.parse(args);
          const result = await scrapeUrl(validated);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "list_icons": {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    icons: AVAILABLE_ICONS,
                    count: AVAILABLE_ICONS.length,
                    usage:
                      "Use these identifiers for any icon field in component content (e.g. hero cta_icon, feature icon, contact-info icon).",
                  },
                  null,
                  2
                ),
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
        const validationErr = new ValidationError("Invalid input parameters", {
          issues: zodError.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
        console.error(
          `[MCP Error] [VALIDATION_ERROR] Invalid input parameters:`,
          JSON.stringify(validationErr.details, null, 2)
        );
        throw validationErr;
      }

      // Re-throw MCP errors (formatErrorResponse will log them)
      if (error instanceof Error && error.name.includes("Error")) {
        return formatErrorResponse(error);
      }

      // Log unexpected errors before re-throwing
      console.error(`[MCP Error] Unexpected error:`, error);
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
        ...skills.map((skill) => ({
          uri: `skill://${skill.id}`,
          name: `Skill: ${skill.name}`,
          description: skill.description,
          mimeType: "text/markdown",
        })),
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

      default: {
        // Check if it's a skill resource
        if (uri.startsWith("skill://")) {
          const skillId = uri.replace("skill://", "");
          const skill = skills.find((s) => s.id === skillId);
          if (skill) {
            return {
              contents: [
                {
                  uri,
                  mimeType: "text/markdown",
                  text: skill.content,
                },
              ],
            };
          }
        }
        throw new ValidationError(`Unknown resource: ${uri}`);
      }
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
