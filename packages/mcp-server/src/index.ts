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
  registry,
  analyzeContentPatterns,
  checkCompositionalQuality,
  assembleFieldGuidance,
  PLACEHOLDER_IMAGE_INSTRUCTIONS,
  type ContentPatternAnalysis,
  type SubComponentStats,
  type RootFieldMeta,
  type SectionRecipes,
  stripEmptyAssetFields,
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

// Load section recipes (curated component combination guidance)
let sectionRecipes: Record<string, any> = {};
try {
  const __filename_recipes = fileURLToPath(import.meta.url);
  const __dirname_recipes = dirname(__filename_recipes);
  const recipesPath = join(
    __dirname_recipes,
    "..",
    "schemas",
    "section-recipes.json"
  );
  sectionRecipes = JSON.parse(readFileSync(recipesPath, "utf-8"));
  console.error(
    `Loaded section recipes: ${
      (sectionRecipes.recipes || []).length
    } recipes, ${(sectionRecipes.pageTemplates || []).length} page templates`
  );
} catch {
  console.error("Section recipes not found, skipping");
}

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

// ── Content pattern cache ──────────────────────────────────────────
// Warmed once at startup; refreshed on-demand via analyze_content_patterns(refresh: true).
let cachedPatterns: ContentPatternAnalysis | null = null;

async function warmPatternCache(): Promise<ContentPatternAnalysis> {
  console.error("[MCP] Warming content pattern cache...");
  cachedPatterns = await analyzeContentPatterns(
    storyblokService.getContentClient(),
    PAGE_VALIDATION_RULES,
    { contentType: "page", derefSchema: registry.page.schema }
  );
  console.error(
    `[MCP] Pattern cache ready (${cachedPatterns.totalStoriesAnalyzed} stories, ${cachedPatterns.componentFrequency.length} components, ${cachedPatterns.fieldProfiles.length} field profiles)`
  );
  return cachedPatterns;
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
          contentType: {
            type: "string",
            description:
              "Content type to generate for (default: 'page'). Use 'blog-post', 'blog-overview', 'event-detail', or 'event-list' for other content types.",
          },
          rootField: {
            type: "string",
            description:
              "For flat (Tier 2) content types, generate content for a specific root field only (e.g. 'categories' for event-detail).",
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
          contentType: {
            type: "string",
            description:
              "Content type being imported (default: 'page'). Use 'blog-post', 'blog-overview', 'event-detail', or 'event-list' for other content types.",
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
          contentType: {
            type: "string",
            description:
              "Content type of the target story (default: 'page'). Use 'blog-post', 'blog-overview', 'event-detail', or 'event-list' for other content types.",
          },
          targetField: {
            type: "string",
            description:
              "Target array field name to insert into. Defaults to the primary root array field for the content type (e.g. 'section' for page).",
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

Supports automatic folder creation via the 'path' parameter: provide a
forward-slash-separated folder path (e.g. 'en/services/consulting') and
missing intermediate folders are created automatically, like mkdir -p.

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
            description:
              "Parent folder ID (for nested content). Mutually exclusive with 'path'.",
          },
          path: {
            type: "string",
            description:
              "Folder path to create the page in (e.g. 'en/services/consulting'). " +
              "Intermediate folders are created automatically like mkdir -p. " +
              "Mutually exclusive with 'parentId'.",
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
          contentType: {
            type: "string",
            description:
              "Content type to create (default: 'page'). Use 'blog-post', 'blog-overview', 'event-detail', or 'event-list' for other content types.",
          },
          rootFields: {
            type: "object",
            description:
              "Additional root-level fields to set on the content (e.g. { title: 'Event Title', description: '...' } for event-detail). These are merged into the story content alongside sections.",
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

Returns story metadata by default (id, slug, name, timestamps, published status).
Pass excludeContent: false to include the full content tree — use sparingly, as
it significantly increases response size (~5,000 tokens per story).`,
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
          excludeContent: {
            type: "boolean",
            description:
              "Exclude story content from the response. When true (default), only metadata is returned (id, slug, name, timestamps, published status). Set to false to include the full content tree.",
            default: true,
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
sub-components can only appear inside their designated parent slots.

Supports automatic folder creation via the 'path' parameter: provide a
forward-slash-separated folder path (e.g. 'en/blog') and missing intermediate
folders are created automatically, like mkdir -p.`,
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
            description:
              "Parent folder ID (for nested content). Mutually exclusive with 'path'.",
          },
          path: {
            type: "string",
            description:
              "Folder path to create the story in (e.g. 'en/blog'). " +
              "Intermediate folders are created automatically like mkdir -p. " +
              "Mutually exclusive with 'parentId'.",
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
2. Parses into a full DOM via JSDOM
3. Runs @mozilla/readability to isolate the main article content
   (falls back to CSS-selector / <main> / <body> if Readability returns nothing)
4. Converts the readable HTML to clean Markdown using Turndown
5. Extracts images from <img>, <picture>/<source>, CSS background-image,
   lazy-loading data attributes, and Open Graph / meta tags

Returns the page title, source URL, Markdown content, and a structured images
array with src, alt, and context (content / background / meta / picture-source).`,
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
    {
      name: "analyze_content_patterns",
      description: `Analyze content patterns across all published stories in the Storyblok space.

This tool reads all existing stories and extracts structural patterns \u2014
no AI call needed, pure structural analysis. Use this BEFORE creating new
content to understand the site's established style and produce content that
feels native.

Returns:
- Component frequency (which components are actually used and how often)
- Common section sequences (which components typically follow each other)
- Section compositions (which components are grouped together in sections)
- Sub-component item counts (e.g. features typically has 4 items on this site)
- Page archetypes (recurring full-page patterns)
- Unused components (available but never used on this site)

This is the single most important tool for creating consistent content.
Call it before planning any new page.`,
      inputSchema: {
        type: "object",
        properties: {
          contentType: {
            type: "string",
            description:
              "Filter stories by content type (default: 'page'). Use 'blog-post', 'event-detail', etc. for other types.",
          },
          startsWith: {
            type: "string",
            description:
              "Filter stories by slug prefix (e.g., 'en/' for English pages only)",
          },
          refresh: {
            type: "boolean",
            description:
              "Force a fresh analysis instead of using the cached result. Use after publishing new content. Default: false.",
          },
        },
        required: [],
      },
    },
    {
      name: "list_recipes",
      description: `List curated section recipes, page templates, and anti-patterns.

Returns proven component combinations merged with live patterns from the
current Storyblok space (when includePatterns is true).

Use this tool when planning a page to understand:
- Which component combinations work well together (recipes)
- Ready-made page templates for common page types
- Anti-patterns to avoid (e.g. duplicate heroes, sparse stats)
- How this specific site uses components (live patterns)

This combines universal best practices with site-specific intelligence.`,
      inputSchema: {
        type: "object",
        properties: {
          intent: {
            type: "string",
            description:
              "Optional intent to help prioritize relevant recipes (e.g. 'product landing page', 'about page')",
          },
          includePatterns: {
            type: "boolean",
            description:
              "Include live patterns from existing content alongside static recipes (default: true)",
          },
          contentType: {
            type: "string",
            description:
              "Filter recipes by content type (e.g. 'blog-post', 'event-detail'). Returns universal recipes plus content-type-specific ones.",
          },
        },
        required: [],
      },
    },
    {
      name: "plan_page",
      description: `Plan a page structure with AI-assisted section selection.

Returns a recommended section sequence based on the page intent, available
components, and the site's existing content patterns. Does NOT generate
content \u2014 only plans the structure.

Use the returned plan to generate each section individually with
\`generate_content(componentType=...)\` for best results.

Requires OpenAI API key for the planning AI call.`,
      inputSchema: {
        type: "object",
        properties: {
          intent: {
            type: "string",
            description:
              "Description of the page to plan (e.g. 'Product landing page for our new AI feature')",
          },
          sectionCount: {
            type: "number",
            description:
              "Target number of sections (default: auto-determined based on intent)",
          },
          contentType: {
            type: "string",
            description:
              "Content type to plan for (default: 'page'). Use 'blog-post', 'blog-overview', 'event-detail', or 'event-list' for other content types. Tier 2 (flat) types return a field population plan instead of a section sequence.",
          },
          startsWith: {
            type: "string",
            description:
              "Filter content patterns by slug prefix (e.g. 'case-studies/' or 'en/blog/'). When set, patterns are fetched live from stories matching this prefix instead of using the global startup cache. Useful for creating pages that match the style of a specific site section.",
          },
        },
        required: ["intent"],
      },
    },
    {
      name: "generate_section",
      description: `Generate a single section with site-aware context.

A convenience wrapper around \`generate_content\` that automatically:
1. Analyzes the site's content patterns
2. Injects site-specific context into the system prompt (e.g. typical sub-item counts)
3. Accepts optional previous/next section context for better transitions
4. Validates the output against recipe anti-patterns

Use this instead of \`generate_content\` when building a page section-by-section.
For best results, call \`plan_page\` first, then \`generate_section\` for each
planned section.

Requires OpenAI API key.`,
      inputSchema: {
        type: "object",
        properties: {
          componentType: {
            type: "string",
            description:
              "Component type to generate (e.g. 'hero', 'features', 'faq')",
          },
          prompt: {
            type: "string",
            description: "Content description for this section",
          },
          system: {
            type: "string",
            description:
              "System prompt override (default: auto-generated with site context)",
          },
          previousSection: {
            type: "string",
            description:
              "Component type of the section before this one (for transitional context)",
          },
          nextSection: {
            type: "string",
            description:
              "Component type of the section after this one (for transitional context)",
          },
          contentType: {
            type: "string",
            description:
              "Content type context (default: 'page'). Affects which schema and component rules are used.",
          },
          startsWith: {
            type: "string",
            description:
              "Filter content patterns by slug prefix (e.g. 'case-studies/' or 'en/blog/'). When set, patterns are fetched live from stories matching this prefix instead of using the global startup cache. Useful for generating sections that match the style of a specific site section.",
          },
        },
        required: ["componentType", "prompt"],
      },
    },
    {
      name: "generate_root_field",
      description: `Generate content for a single root-level field on a content type.

Used for non-section root fields that exist alongside the section array on
hybrid content types. For example, blog-post has root fields \`head\`, \`aside\`,
\`cta\`, and \`seo\` alongside its \`section\` array.

This tool extracts the field's sub-schema from the content type, prepares it
for OpenAI structured output, generates content, and returns it ready for
merging into \`rootFields\` on \`create_page_with_content\`.

Typical workflow:
1. \`plan_page\` → returns sections + rootFields to generate
2. \`generate_section\` for each section
3. \`generate_root_field\` for each root field (head, aside, cta)
4. \`generate_seo\` for SEO metadata
5. \`create_page_with_content(sections: [...], rootFields: { head, aside, cta, seo })\`

Requires OpenAI API key.`,
      inputSchema: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            description:
              "Name of the root-level field to generate (e.g. 'head', 'aside', 'cta'). Must be a valid root property on the content type schema.",
          },
          prompt: {
            type: "string",
            description:
              "Content description for this field (e.g. 'Blog post about AI trends, author Jane Doe, published 2026-02-19')",
          },
          system: {
            type: "string",
            description:
              "System prompt override. If omitted, a default content-writer prompt is used.",
          },
          contentType: {
            type: "string",
            description:
              "Content type (default: 'blog-post'). Determines which schema to extract the field from.",
          },
        },
        required: ["fieldName", "prompt"],
      },
    },
    {
      name: "generate_seo",
      description: `Generate optimized SEO metadata for a content type.

Produces title, description, keywords, and optionally an OG image for the
\`seo\` root field. Designed as a post-generation step: call it AFTER
generating sections and root fields, and pass a summary of the page content
so the SEO metadata accurately reflects the actual content.

The generated SEO content can be merged into \`rootFields.seo\` when calling
\`create_page_with_content\`.

Works with any content type that has a \`seo\` field in its schema (page,
blog-post, blog-overview).

Requires OpenAI API key.`,
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description:
              "Summary of the page content to derive SEO from. Include key topics, target audience, and primary keywords.",
          },
          contentType: {
            type: "string",
            description:
              "Content type (default: 'page'). Determines which seo sub-schema to use.",
          },
          system: {
            type: "string",
            description:
              "System prompt override for the SEO specialist. If omitted, a default SEO-optimized prompt is used.",
          },
        },
        required: ["prompt"],
      },
    },
    {
      name: "ensure_path",
      description: `Ensure a folder path exists in Storyblok, creating missing folders.

Works like \`mkdir -p\`: given a path like "en/services/consulting", it walks
each segment, checks if the folder exists, and creates it if not. Returns
the numeric ID of the deepest (last) folder.

This is useful for sitemap migration workflows where you need to establish
a folder hierarchy before creating pages. The returned folder ID can be
passed as \`parentId\` to \`create_page_with_content\` or \`create_story\`.

Idempotent: calling with an already-existing path simply returns its ID.`,
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Forward-slash-separated folder path (e.g. 'en/services/consulting'). " +
              "Each segment becomes a folder. Missing intermediate folders are created automatically.",
          },
        },
        required: ["path"],
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
  /**
   * Run compositional quality checks on sections and return warnings.
   * Non-blocking — failures are logged and return empty array.
   */
  function getCompositionalWarnings(
    sections: Record<string, any>[],
    contentType?: string
  ): Array<{
    level: string;
    message: string;
    path?: string;
    suggestion?: string;
  }> {
    try {
      const rules =
        contentType && registry.has(contentType)
          ? registry.get(contentType).rules
          : PAGE_VALIDATION_RULES;
      return checkCompositionalQuality(sections, rules, {
        format: "auto",
      });
    } catch (err) {
      console.error(`[MCP] Warning: Compositional check failed: ${err}`);
      return [];
    }
  }

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

          // Append placeholder image instructions to the system prompt
          const systemWithImages = `${validated.system}\n\n${PLACEHOLDER_IMAGE_INSTRUCTIONS}`;

          // If componentType or sectionCount is provided, use auto-schema pipeline
          if (validated.componentType || validated.sectionCount) {
            const result = await contentService.generateWithSchema({
              system: systemWithImages,
              prompt: validated.prompt,
              componentType: validated.componentType,
              sectionCount: validated.sectionCount,
              contentType: validated.contentType,
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
            system: systemWithImages,
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
          const importContentType = validated.contentType || "page";
          const importEntry = registry.has(importContentType)
            ? registry.get(importContentType)
            : registry.page;
          const importRootField =
            importEntry.rules.rootArrayFields[0] || "section";
          const importSections = (
            validated.page?.content as Record<string, any>
          )?.[importRootField];
          const warnings = getCompositionalWarnings(
            Array.isArray(importSections) ? importSections : [],
            importContentType
          );
          const result = await storyblokService.importContent({
            ...validated,
            contentType: validated.contentType,
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
                    ...(warnings.length > 0 && { warnings }),
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
          const warnings = getCompositionalWarnings(
            validated.sections as Record<string, any>[],
            validated.contentType
          );
          const result = await storyblokService.importContentAtPosition({
            storyUid: validated.storyUid,
            position: validated.position,
            page: { content: { section: validated.sections } },
            contentType: validated.contentType,
            targetField: validated.targetField,
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
                    ...(warnings.length > 0 && { warnings }),
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

          // Resolve path to parentId if provided
          let parentId = validated.parentId;
          if (validated.path) {
            if (validated.parentId) {
              throw new ValidationError(
                "'path' and 'parentId' are mutually exclusive. Provide one or the other."
              );
            }
            parentId = await storyblokService.ensurePath(validated.path);
          }

          const warnings = getCompositionalWarnings(
            validated.sections as Record<string, any>[],
            validated.contentType
          );
          const result = await storyblokService.createPageWithContent({
            ...validated,
            parentId,
            contentType: validated.contentType,
            rootFields: validated.rootFields as
              | Record<string, unknown>
              | undefined,
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
                    ...(warnings.length > 0 && { warnings }),
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
                text: JSON.stringify(stripEmptyAssetFields(result), null, 2),
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
                text: JSON.stringify(stripEmptyAssetFields(result), null, 2),
              },
            ],
          };
        }

        case "create_story": {
          const validated = schemas.createStory.parse(args);

          // Resolve path to parentId if provided
          let parentId = validated.parentId;
          if (validated.path) {
            if (validated.parentId) {
              throw new ValidationError(
                "'path' and 'parentId' are mutually exclusive. Provide one or the other."
              );
            }
            parentId = await storyblokService.ensurePath(validated.path);
          }

          const result = await storyblokService.createStory({
            ...validated,
            parentId,
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

          // Component usage hints — derived from section recipes
          const COMPONENT_USAGE_HINTS: Record<
            string,
            {
              typicalUsage: string;
              typicalSubItemCount?: Record<string, [number, number]>;
            }
          > = {
            hero: {
              typicalUsage:
                "Page opener. Usually the first section. Include 1-2 CTA buttons. Pair with features, split, or logos-companies below.",
              typicalSubItemCount: { buttons: [1, 2] },
            },
            "video-curtain": {
              typicalUsage:
                "Alternative page opener with full-width video background. Use instead of hero for video-heavy pages. Maximum one per page.",
              typicalSubItemCount: { buttons: [1, 2] },
            },
            features: {
              typicalUsage:
                "Present 3-4 key capabilities or benefits with icons. Keep text concise. Great after hero. Icons must come from list_icons.",
              typicalSubItemCount: { feature: [3, 4] },
            },
            split: {
              typicalUsage:
                "Side-by-side layout: image + text. Good for feature deep-dives. Alternate sides when using multiple splits.",
            },
            testimonials: {
              typicalUsage:
                "Social proof with 2-3 customer quotes. Include real names, roles, and companies. Place before CTA for conversion.",
              typicalSubItemCount: { testimonial: [2, 3] },
            },
            stats: {
              typicalUsage:
                "Data-driven credibility with 3-4 stat items. Use specific numbers. Place before CTA to establish proof.",
              typicalSubItemCount: { stat: [3, 4] },
            },
            cta: {
              typicalUsage:
                "Conversion point. Clear, action-oriented headline with 1-2 buttons. Usually the last section on a page.",
              typicalSubItemCount: { buttons: [1, 2] },
            },
            faq: {
              typicalUsage:
                "Answer 5-8 common questions. Great for addressing objections before CTA. Order by importance.",
              typicalSubItemCount: { questions: [5, 8] },
            },
            "logos-companies": {
              typicalUsage:
                "Trust signal with 5-8 client/partner logos. Works best after hero or before CTA. Needs density to be effective.",
              typicalSubItemCount: { logo: [5, 8] },
            },
            mosaic: {
              typicalUsage:
                "Visual grid with 4-6 tiles for portfolios, team grids, or project showcases. Each tile can have its own link.",
              typicalSubItemCount: { tile: [4, 6] },
            },
            "blog-teaser": {
              typicalUsage:
                "Article teaser card. Always group 3 blog-teasers per section for visual balance. Each must have a link_url.",
            },
            contact: {
              typicalUsage:
                "Contact details section. Include relevant channels (email, phone, address). Use icons from list_icons.",
            },
            slider: {
              typicalUsage:
                "Rotating content carousel. Minimum 3 slides. Accepts full components in its slots.",
            },
            divider: {
              typicalUsage:
                "Visual separator. Use sparingly — only between major thematic shifts. Consider section background colors instead.",
            },
          };

          // Annotate each component with nesting rules from the schema
          // Aggregate rules from ALL content types in the registry
          const allContentTypes = registry.listContentTypes();
          const annotated = (result as Array<{ name: string }>).map((comp) => {
            const name = comp.name;
            // Collect slots from all content types
            const allSlots = new Set<string>();
            for (const ct of allContentTypes) {
              const entry = registry.get(ct);
              const slots = entry.rules.componentToSlots.get(name) || [];
              slots.forEach((s) => allSlots.add(s));
            }
            const slots = [...allSlots];

            const isSubComponent =
              slots.length > 0 &&
              slots.every((s) => {
                const parts = s.split(".");
                // Check across all content types' root array fields
                return !allContentTypes.some((ct) => {
                  const entry = registry.get(ct);
                  return (
                    parts.length === 2 &&
                    entry.rules.rootArrayFields.includes(parts[0])
                  );
                });
              });
            const parentComponents = isSubComponent
              ? [...new Set(slots.map((s) => s.split(".")[0]))]
              : undefined;

            const annotation: Record<string, any> = {
              ...comp,
              allowedIn: slots.length > 0 ? slots : undefined,
              isSubComponent,
            };

            // Add usage hints from recipes
            const hints = COMPONENT_USAGE_HINTS[name];
            if (hints) {
              annotation.typicalUsage = hints.typicalUsage;
              if (hints.typicalSubItemCount) {
                annotation.typicalSubItemCount = hints.typicalSubItemCount;
              }
            }

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

          // Add composition rules from the schema (aggregate across all content types)
          const name = validated.componentName;
          const allCTs = registry.listContentTypes();
          const allComponentSlots = new Set<string>();
          for (const ct of allCTs) {
            const entry = registry.get(ct);
            const s = entry.rules.componentToSlots.get(name) || [];
            s.forEach((slot) => allComponentSlots.add(slot));
          }
          const slots = [...allComponentSlots];

          // Find child slots this component defines (across all content types)
          const childSlots: Record<
            string,
            { slotPath: string; allowedTypes: string[]; note: string }
          > = {};
          for (const ct of allCTs) {
            const entry = registry.get(ct);
            for (const [slotPath, allowedTypes] of entry.rules.containerSlots) {
              const parts = slotPath.split(".");
              if (parts.length === 2 && parts[0] === name) {
                if (!childSlots[parts[1]]) {
                  childSlots[parts[1]] = {
                    slotPath,
                    allowedTypes: [...allowedTypes],
                    note: `Array of ${[...allowedTypes].join(
                      "/"
                    )} sub-component(s)`,
                  };
                } else {
                  // Merge allowed types from other content types
                  for (const t of allowedTypes) {
                    if (!childSlots[parts[1]].allowedTypes.includes(t)) {
                      childSlots[parts[1]].allowedTypes.push(t);
                    }
                  }
                }
              }
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
                text: JSON.stringify(stripEmptyAssetFields(result), null, 2),
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

        case "analyze_content_patterns": {
          const validated = schemas.analyzeContentPatterns.parse(args);
          const isDefaultQuery =
            validated.contentType === "page" && !validated.startsWith;
          console.error(
            `[MCP] Analyzing content patterns (contentType: ${
              validated.contentType
            }, startsWith: ${validated.startsWith || "all"}, refresh: ${
              validated.refresh
            }, cached: ${isDefaultQuery && !!cachedPatterns})...`
          );

          let analysis: ContentPatternAnalysis;
          if (isDefaultQuery && cachedPatterns && !validated.refresh) {
            analysis = cachedPatterns;
          } else {
            // Use the correct validation rules for the content type
            const contentTypeForAnalysis = validated.contentType || "page";
            const rules = registry.has(contentTypeForAnalysis)
              ? registry.get(contentTypeForAnalysis).rules
              : PAGE_VALIDATION_RULES;
            analysis = await analyzeContentPatterns(
              storyblokService.getContentClient(),
              rules,
              validated
            );
            // Update the cache when this is the default query
            if (isDefaultQuery) {
              cachedPatterns = analysis;
            }
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(analysis, null, 2),
              },
            ],
          };
        }

        case "list_recipes": {
          const validated = schemas.listRecipes.parse(args);
          console.error(
            `[MCP] Listing recipes (intent: ${
              validated.intent || "all"
            }, contentType: ${
              validated.contentType || "all"
            }, includePatterns: ${validated.includePatterns})...`
          );

          // Filter recipes by contentType if specified
          const filterContentType = validated.contentType;
          const filteredRecipes = filterContentType
            ? (sectionRecipes.recipes as Array<Record<string, unknown>>).filter(
                (r) => !r.contentType || r.contentType === filterContentType
              )
            : sectionRecipes.recipes;
          const filteredTemplates = filterContentType
            ? (
                sectionRecipes.pageTemplates as Array<Record<string, unknown>>
              ).filter(
                (t) => !t.contentType || t.contentType === filterContentType
              )
            : sectionRecipes.pageTemplates;

          const filteredAntiPatterns = filterContentType
            ? (
                sectionRecipes.antiPatterns as Array<Record<string, unknown>>
              ).filter(
                (a) => !a.contentType || a.contentType === filterContentType
              )
            : sectionRecipes.antiPatterns;

          const result: Record<string, unknown> = {
            recipes: filteredRecipes,
            pageTemplates: filteredTemplates,
            antiPatterns: filteredAntiPatterns,
          };

          // Optionally merge live patterns from the space (uses startup cache)
          if (validated.includePatterns && cachedPatterns) {
            result.livePatterns = {
              componentFrequency: cachedPatterns.componentFrequency.slice(
                0,
                15
              ),
              commonSequences: cachedPatterns.commonSequences.slice(0, 10),
              subComponentCounts: cachedPatterns.subComponentCounts,
              note: "Live patterns from startup cache. Use analyze_content_patterns(refresh: true) to update after publishing.",
            };
          } else if (validated.includePatterns) {
            result.livePatterns = {
              error:
                "Pattern cache not available. Call analyze_content_patterns first to populate it.",
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "plan_page": {
          const validated = schemas.planPage.parse(args);
          console.error(
            `[MCP] Planning page structure for: "${validated.intent}"...`
          );

          if (!contentService) {
            throw new ConfigurationError(
              "OpenAI API key is required for plan_page. Set OPENAI_API_KEY environment variable."
            );
          }

          // Gather site intelligence — use filtered patterns if startsWith is provided,
          // otherwise fall back to the global startup cache.
          let patternsSource: ContentPatternAnalysis | null = null;
          if (validated.startsWith) {
            const planContentTypeForPatterns = validated.contentType || "page";
            const patternRules = registry.has(planContentTypeForPatterns)
              ? registry.get(planContentTypeForPatterns).rules
              : PAGE_VALIDATION_RULES;
            console.error(
              `[MCP] plan_page: fetching filtered patterns (startsWith: ${validated.startsWith})...`
            );
            patternsSource = await analyzeContentPatterns(
              storyblokService.getContentClient(),
              patternRules,
              {
                contentType: planContentTypeForPatterns,
                startsWith: validated.startsWith,
              }
            );
          } else {
            patternsSource = cachedPatterns;
          }

          let patternsContext = "";
          if (patternsSource) {
            const topComponents = patternsSource.componentFrequency
              .slice(0, 10)
              .map(
                (c: { component: string; count: number }) =>
                  `${c.component} (used ${c.count}x)`
              )
              .join(", ");
            const topSequences = patternsSource.commonSequences
              .slice(0, 8)
              .map(
                (s: { from: string; to: string; count: number }) =>
                  `${s.from} → ${s.to} (${s.count}x)`
              )
              .join(", ");
            const subItems = Object.entries(patternsSource.subComponentCounts)
              .map(
                ([component, s]) =>
                  `${component}: median ${
                    (s as SubComponentStats).median
                  } items (${(s as SubComponentStats).min}-${
                    (s as SubComponentStats).max
                  })`
              )
              .join(", ");
            patternsContext = `\n\nSite patterns:\n- Most used: ${topComponents}\n- Common sequences: ${topSequences}\n- Sub-item counts: ${subItems}`;
          }

          // Get available components from the content type's container slots
          const planContentType = validated.contentType || "page";
          const planEntry = registry.has(planContentType)
            ? registry.get(planContentType)
            : registry.page;
          const planRules = planEntry.rules;

          // For section-based types: look up the primary container slot
          // For flat types: list the root array field names as "fields"
          let componentNames: string[];
          let isFlat = false;
          if (planEntry.hasSections) {
            const primaryArrayField = planRules.rootArrayFields[0];
            const sectionSlot = primaryArrayField
              ? [...planRules.containerSlots.entries()].find(([path]) =>
                  path.startsWith(`${primaryArrayField}.`)
                )?.[1]
              : undefined;
            componentNames = sectionSlot
              ? [...sectionSlot]
              : [...planRules.allKnownComponents];
          } else {
            // Tier 2 (flat): list root fields as planning targets
            isFlat = true;
            componentNames = planRules.rootArrayFields;
          }

          // Detect root fields that need generation (hybrid types)
          const rootFieldMeta = planEntry.rootFieldMeta || [];
          const generatableRootFields = rootFieldMeta.filter(
            (f: RootFieldMeta) => f.priority !== "excluded" && !f.isSectionArray
          );
          const hasRootFields = generatableRootFields.length > 0;

          let planPrompt: string;
          let planSchema: {
            name: string;
            schema: Record<string, unknown>;
            strict: boolean;
          };

          if (isFlat) {
            // Tier 2 (flat content types): plan which root fields to populate
            // Include ALL root fields (scalar + array + object), not just arrays
            const allRootFieldNames = rootFieldMeta
              .filter((f: RootFieldMeta) => f.priority !== "excluded")
              .map((f: RootFieldMeta) => f.name);
            const fieldDescriptions = rootFieldMeta
              .filter((f: RootFieldMeta) => f.priority !== "excluded")
              .map(
                (f: RootFieldMeta) =>
                  `- ${f.name} (${f.type}${
                    f.schemaRequired ? ", required" : ""
                  }): ${f.description || f.title || "no description"}`
              )
              .join("\n");

            planPrompt = `You are a content structure planner for "${planContentType}" content. Given an intent, suggest which root fields to populate and what content each should contain.

Available root fields:
${fieldDescriptions}
${patternsContext}

Respond with a JSON object:
{
  "fields": [
    { "fieldName": "title", "intent": "brief description of what this field should contain" }
  ],
  "reasoning": "brief explanation of the structure choices"
}`;
            planSchema = {
              name: `${planContentType.replace(/-/g, "_")}_plan`,
              schema: {
                type: "object",
                properties: {
                  fields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        fieldName: {
                          type: "string",
                          enum:
                            allRootFieldNames.length > 0
                              ? allRootFieldNames
                              : componentNames,
                        },
                        intent: { type: "string" },
                      },
                      required: ["fieldName", "intent"],
                      additionalProperties: false,
                    },
                  },
                  reasoning: { type: "string" },
                },
                required: ["fields", "reasoning"],
                additionalProperties: false,
              },
              strict: true,
            };
          } else {
            // Tier 1 (section-based): plan section sequence
            // For hybrid types, also include root field information
            let rootFieldsInstruction = "";
            if (hasRootFields) {
              const fieldDescriptions = generatableRootFields
                .map(
                  (f: RootFieldMeta) =>
                    `- ${f.name} (${f.type}, priority: ${f.priority}): ${
                      f.description || f.title || "no description"
                    }`
                )
                .join("\n");
              rootFieldsInstruction = `\n\nThis content type also has root-level fields that should be generated separately via generate_root_field:\n${fieldDescriptions}\n\nInclude these in your "rootFields" array — indicate which ones to generate and a brief intent for each. Fields with priority "required" must always be included.`;
            }

            planPrompt = `You are a web page structure planner. Given a page intent, suggest an ordered list of sections for content type "${planContentType}".

Available section component types: ${componentNames.join(", ")}
${patternsContext}

Recipes resource is also available with proven combinations.

Rules:
- Start most pages with "hero" or "video-curtain"
- End conversion pages with a CTA section
- Use "divider" sparingly, only between thematically different blocks
- Prefer variety: don't repeat the same component type in adjacent sections
- ${
              validated.sectionCount
                ? `Target exactly ${validated.sectionCount} sections`
                : "Choose an appropriate number of sections (typically 4-8)"
            }${rootFieldsInstruction}

Respond with a JSON object:
{
  "sections": [
    { "componentType": "hero", "intent": "brief description of what this section should convey" }
  ],${
    hasRootFields
      ? `
  "rootFields": [
    { "fieldName": "head", "intent": "brief description of what this field should contain" }
  ],`
      : ""
  }
  "reasoning": "brief explanation of the structure choices"
}`;

            // Build schema — include rootFields array for hybrid types
            const planProperties: Record<string, unknown> = {
              sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    componentType: {
                      type: "string",
                      enum: componentNames,
                    },
                    intent: { type: "string" },
                  },
                  required: ["componentType", "intent"],
                  additionalProperties: false,
                },
              },
              reasoning: { type: "string" },
            };
            const planRequired: string[] = ["sections", "reasoning"];

            if (hasRootFields) {
              const rootFieldNames = generatableRootFields.map(
                (f: RootFieldMeta) => f.name
              );
              planProperties.rootFields = {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    fieldName: {
                      type: "string",
                      enum: rootFieldNames,
                    },
                    intent: { type: "string" },
                  },
                  required: ["fieldName", "intent"],
                  additionalProperties: false,
                },
              };
              planRequired.push("rootFields");
            }

            planSchema = {
              name: `${planContentType.replace(/-/g, "_")}_plan`,
              schema: {
                type: "object",
                properties: planProperties,
                required: planRequired,
                additionalProperties: false,
              },
              strict: true,
            };
          }

          const response = await contentService.generateContent({
            system: planPrompt,
            prompt: `Plan ${isFlat ? "content" : "a page"} for: ${
              validated.intent
            }`,
            schema: planSchema,
          });

          // Build usage instructions based on content type characteristics
          let usage: string;
          if (isFlat) {
            usage =
              "Use generate_root_field(fieldName=..., contentType=...) for each field, then create_page_with_content with rootFields.";
          } else if (hasRootFields) {
            usage =
              "Use generate_section for each section, generate_root_field for each root field (head, aside, cta), and generate_seo for SEO metadata. Then assemble with create_page_with_content(sections: [...], rootFields: { head, aside, cta, seo }).";
          } else {
            usage =
              "Use generate_section or generate_content(componentType=...) for each section in order. Pass previousSection/nextSection for better transitions.";
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    plan: response,
                    contentType: planContentType,
                    ...(hasRootFields && {
                      rootFieldMeta: generatableRootFields.map(
                        (f: RootFieldMeta) => ({
                          name: f.name,
                          type: f.type,
                          priority: f.priority,
                          title: f.title,
                        })
                      ),
                    }),
                    usage,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "generate_section": {
          const validated = schemas.generateSection.parse(args);
          const sectionContentType = validated.contentType || "page";
          console.error(
            `[MCP] Generating section: ${validated.componentType} (contentType: ${sectionContentType})...`
          );

          if (!contentService) {
            throw new ConfigurationError(
              "OpenAI API key is required for generate_section. Set OPENAI_API_KEY environment variable."
            );
          }

          // Gather site-specific context — use filtered patterns if startsWith
          // is provided, otherwise fall back to the global startup cache.
          let sectionPatternsSource: ContentPatternAnalysis | null = null;
          if (validated.startsWith) {
            const patternRules = registry.has(sectionContentType)
              ? registry.get(sectionContentType).rules
              : PAGE_VALIDATION_RULES;
            const patternSchema = registry.has(sectionContentType)
              ? registry.get(sectionContentType).schema
              : registry.page.schema;
            console.error(
              `[MCP] generate_section: fetching filtered patterns (startsWith: ${validated.startsWith})...`
            );
            sectionPatternsSource = await analyzeContentPatterns(
              storyblokService.getContentClient(),
              patternRules,
              {
                contentType: sectionContentType,
                startsWith: validated.startsWith,
                derefSchema: patternSchema,
              }
            );
          } else {
            sectionPatternsSource = cachedPatterns;
          }

          let siteContext = "";
          if (sectionPatternsSource) {
            const relevantStats = sectionPatternsSource.subComponentCounts[
              validated.componentType
            ] as SubComponentStats | undefined;
            if (relevantStats) {
              siteContext += `\nOn this site, ${validated.componentType} sections typically have ${relevantStats.median} sub-items (range: ${relevantStats.min}-${relevantStats.max}).`;
            }
            const freq = sectionPatternsSource.componentFrequency.find(
              (c: { component: string }) =>
                c.component === validated.componentType
            );
            if (freq) {
              siteContext += `\nThis component is used ${freq.count} times across the site.`;
            }
          }

          // Build context-aware system prompt
          let systemPrompt =
            validated.system ||
            `You are an expert content writer creating a ${validated.componentType} section for a website.`;

          // Always inject placeholder image instructions so image fields are never left empty
          systemPrompt += `\n\n${PLACEHOLDER_IMAGE_INSTRUCTIONS}`;

          if (siteContext) {
            systemPrompt += `\n\nSite-specific guidance:${siteContext}`;
          }
          if (validated.previousSection) {
            systemPrompt += `\n\nThis section follows a "${validated.previousSection}" section. Ensure a smooth content transition.`;
          }
          if (validated.nextSection) {
            systemPrompt += `\n\nThis section precedes a "${validated.nextSection}" section. Set up the transition naturally.`;
          }

          // Check best practices from recipes — prefer content-type-specific match
          const recipe =
            sectionRecipes.recipes?.find(
              (r: { components: string[]; contentType?: string }) =>
                r.components.includes(validated.componentType) &&
                r.contentType === sectionContentType
            ) ||
            sectionRecipes.recipes?.find((r: { components: string[] }) =>
              r.components.includes(validated.componentType)
            );
          if (recipe?.notes) {
            systemPrompt += `\n\nBest practices: ${recipe.notes}`;
          }

          // Assemble field-level compositional guidance from patterns + recipes
          const fieldGuidance = assembleFieldGuidance({
            componentType: validated.componentType,
            patterns: sectionPatternsSource,
            recipes: sectionRecipes as SectionRecipes,
            scopeLabel: validated.startsWith || undefined,
          });
          if (fieldGuidance) {
            systemPrompt += fieldGuidance;
          }

          // Generate via the content service (full pipeline with schema auto-derivation)
          const result = await contentService.generateWithSchema({
            system: systemPrompt,
            prompt: validated.prompt,
            componentType: validated.componentType,
            contentType: sectionContentType,
          });

          // Unwrap the page-level envelope produced by processForStoryblok.
          // The pipeline always returns a page wrapper like { section: [{ component: "section", ... }] }.
          // For generate_section we need to return just the section object(s), not the wrapper.
          const entry = registry.has(sectionContentType)
            ? registry.get(sectionContentType)
            : registry.page;
          const rootField = entry.rootArrayFields[0] || "section";
          const storyblokSections = result.storyblokContent[rootField] || [];

          // Return the first section object (generate_section targets a single section)
          const sectionContent =
            Array.isArray(storyblokSections) && storyblokSections.length > 0
              ? storyblokSections[0]
              : result.storyblokContent;

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    section: sectionContent,
                    designSystemProps: result.designSystemProps,
                    componentType: validated.componentType,
                    note: "Use import_content_at_position or create_page_with_content to add this section to a story. The 'section' field contains a single Storyblok-ready section object (with component: 'section' and nested components). Collect multiple section objects into an array and pass as 'sections' to create_page_with_content.",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "generate_root_field": {
          const validated = schemas.generateRootField.parse(args);
          const rfContentType = validated.contentType || "blog-post";
          console.error(
            `[MCP] Generating root field "${validated.fieldName}" for ${rfContentType}...`
          );

          if (!contentService) {
            throw new ConfigurationError(
              "OpenAI API key is required for generate_root_field. Set OPENAI_API_KEY environment variable."
            );
          }

          // Build system prompt with sensible defaults
          let rfSystemPrompt =
            validated.system ||
            `You are an expert content writer. Generate content for the "${validated.fieldName}" field of a ${rfContentType}.`;
          rfSystemPrompt += `\n\n${PLACEHOLDER_IMAGE_INSTRUCTIONS}`;

          const rfResult = await contentService.generateRootField({
            system: rfSystemPrompt,
            prompt: validated.prompt,
            fieldName: validated.fieldName,
            contentType: rfContentType,
            model: validated.model,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    fieldName: rfResult.fieldName,
                    storyblokContent: rfResult.storyblokContent,
                    designSystemProps: rfResult.designSystemProps,
                    note: `Root field "${rfResult.fieldName}" generated for ${rfContentType}. Pass this as rootFields.${rfResult.fieldName} to create_page_with_content.`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "generate_seo": {
          const validated = schemas.generateSeo.parse(args);
          const seoContentType = validated.contentType || "page";
          console.error(
            `[MCP] Generating SEO metadata for ${seoContentType}...`
          );

          if (!contentService) {
            throw new ConfigurationError(
              "OpenAI API key is required for generate_seo. Set OPENAI_API_KEY environment variable."
            );
          }

          const seoResult = await contentService.generateSeo({
            prompt: validated.prompt,
            contentType: seoContentType,
            model: validated.model,
            system: validated.system,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    seo: seoResult.storyblokContent,
                    designSystemProps: seoResult.designSystemProps,
                    note: `SEO metadata generated for ${seoContentType}. Pass this as rootFields.seo to create_page_with_content.`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "ensure_path": {
          const validated = schemas.ensurePath.parse(args);
          const folderId = await storyblokService.ensurePath(validated.path);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Path "${validated.path}" ensured successfully`,
                    folderId,
                    path: validated.path,
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
        {
          uri: "recipes://section-recipes",
          name: "Section Recipes",
          description:
            "Curated component combinations, page templates, and anti-patterns. Use this as a guide when planning page structure and choosing section types.",
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

      case "recipes://section-recipes": {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(sectionRecipes, null, 2),
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
  // Warm pattern cache once at startup
  try {
    await warmPatternCache();
  } catch (err) {
    console.error(`[MCP] Warning: Could not warm pattern cache: ${err}`);
    console.error(
      "[MCP] Patterns will be fetched on first analyze_content_patterns call."
    );
  }

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
