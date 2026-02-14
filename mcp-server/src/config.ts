import { z } from "zod";

/**
 * Base Zod schema for a section object.
 *
 * Not a full schema (that would duplicate the JSON Schema), but enough to
 * validate the expected envelope. Deep structural validation is handled by
 * `validateContent()` from the shared validation module.
 */
const sectionSchema = z
  .object({
    component: z.literal("section").optional(),
    type: z.literal("section").optional(),
    components: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough();

/**
 * Configuration for the Storyblok MCP Server
 */
export interface StoryblokConfig {
  apiToken: string;
  oauthToken: string;
  spaceId: string;
  openAiApiKey?: string;
  baseUrl?: string;
}

/**
 * Validate and parse configuration from environment variables
 */
export function loadConfig(): StoryblokConfig {
  const apiToken = process.env.STORYBLOK_API_TOKEN;
  const oauthToken = process.env.STORYBLOK_OAUTH_TOKEN;
  const spaceId = process.env.STORYBLOK_SPACE_ID;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const baseUrl =
    process.env.STORYBLOK_API_BASE_URL || "https://api.storyblok.com/v1";

  const errors: string[] = [];

  if (!apiToken) {
    errors.push("STORYBLOK_API_TOKEN is required");
  }
  if (!oauthToken) {
    errors.push("STORYBLOK_OAUTH_TOKEN is required");
  }
  if (!spaceId) {
    errors.push("STORYBLOK_SPACE_ID is required");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join("\n")}`);
  }

  return {
    apiToken: apiToken!,
    oauthToken: oauthToken!,
    spaceId: spaceId!,
    openAiApiKey,
    baseUrl,
  };
}

/**
 * Zod schemas for tool input validation
 */
export const schemas = {
  generateContent: z.object({
    system: z.string().describe("System prompt for the AI model"),
    prompt: z
      .string()
      .describe("User prompt describing what content to generate"),
    schema: z
      .object({
        name: z.string(),
        strict: z.boolean().optional(),
        schema: z.record(z.unknown()),
      })
      .optional()
      .describe(
        "JSON schema for structured output. Optional when componentType or sectionCount is provided."
      ),
    componentType: z
      .string()
      .optional()
      .describe(
        "Component type to generate (e.g. 'hero', 'faq'). When provided, schema is auto-derived."
      ),
    sectionCount: z
      .number()
      .optional()
      .describe("Number of sections to generate for full-page generation."),
  }),

  importContent: z.object({
    storyUid: z.string().describe("The UID of the story to update"),
    prompterUid: z
      .string()
      .describe("The UID of the prompter component to replace"),
    page: z
      .object({
        content: z.object({
          section: z.array(sectionSchema),
        }),
      })
      .describe("Page content with sections to import"),
    skipTransform: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Skip automatic content flattening for Storyblok (default: false)"
      ),
    uploadAssets: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "When true, image URLs in the content are downloaded and uploaded to Storyblok as native assets before saving. The original URLs are replaced with Storyblok CDN URLs."
      ),
    assetFolderName: z
      .string()
      .optional()
      .describe(
        "Name of the Storyblok asset folder to upload images into. Created if it does not exist. Defaults to 'AI Generated'."
      ),
    skipValidation: z
      .boolean()
      .optional()
      .default(false)
      .describe("Skip content validation against the Design System schema"),
  }),

  importContentAtPosition: z.object({
    storyUid: z
      .string()
      .describe("The UID (or numeric ID) of the story to update"),
    position: z
      .number()
      .describe(
        "Zero-based insertion index. 0 = beginning, -1 = end, any other value is clamped to bounds"
      ),
    sections: z
      .array(sectionSchema)
      .describe("Array of section objects to insert at the given position"),
    publish: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Publish the story immediately after importing (default: false)"
      ),
    skipTransform: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Skip automatic content flattening for Storyblok (default: false)"
      ),
    uploadAssets: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "When true, image URLs in the content are downloaded and uploaded to Storyblok as native assets before saving. The original URLs are replaced with Storyblok CDN URLs."
      ),
    assetFolderName: z
      .string()
      .optional()
      .describe(
        "Name of the Storyblok asset folder to upload images into. Created if it does not exist. Defaults to 'AI Generated'."
      ),
    skipValidation: z
      .boolean()
      .optional()
      .default(false)
      .describe("Skip content validation against the Design System schema"),
  }),

  createPageWithContent: z.object({
    name: z.string().describe("Display name for the page"),
    slug: z.string().describe("URL slug for the page"),
    parentId: z
      .number()
      .optional()
      .describe("Parent folder ID (for nested content)"),
    sections: z
      .array(sectionSchema)
      .describe(
        "Array of section objects to populate the page with. Missing _uid fields will be auto-generated."
      ),
    publish: z
      .boolean()
      .optional()
      .default(false)
      .describe("Publish the page immediately after creation (default: false)"),
    uploadAssets: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "When true, image URLs in the content are downloaded and uploaded to Storyblok as native assets before saving. The original URLs are replaced with Storyblok CDN URLs."
      ),
    assetFolderName: z
      .string()
      .optional()
      .describe(
        "Name of the Storyblok asset folder to upload images into. Created if it does not exist. Defaults to 'AI Generated'."
      ),
    skipValidation: z
      .boolean()
      .optional()
      .default(false)
      .describe("Skip content validation against the Design System schema"),
  }),

  listStories: z.object({
    startsWith: z.string().optional().describe("Filter stories by slug prefix"),
    contentType: z
      .string()
      .optional()
      .describe("Filter by content type (e.g., 'page', 'blog-post')"),
    page: z
      .number()
      .optional()
      .default(1)
      .describe("Page number for pagination"),
    perPage: z
      .number()
      .optional()
      .default(25)
      .describe("Number of stories per page"),
  }),

  getStory: z.object({
    identifier: z.string().describe("Story slug, ID, or UUID"),
    findBy: z
      .enum(["slug", "id", "uuid"])
      .optional()
      .default("slug")
      .describe("How to find the story"),
    version: z
      .enum(["draft", "published"])
      .optional()
      .default("published")
      .describe("Content version"),
  }),

  createStory: z.object({
    name: z.string().describe("Story name"),
    slug: z.string().describe("URL slug for the story"),
    parentId: z.number().optional().describe("Parent folder ID"),
    content: z.record(z.unknown()).describe("Story content object"),
    isFolder: z
      .boolean()
      .optional()
      .default(false)
      .describe("Create as folder"),
    skipValidation: z
      .boolean()
      .optional()
      .default(false)
      .describe("Skip content validation against the Design System schema"),
  }),

  updateStory: z.object({
    storyId: z.number().describe("Story ID to update"),
    content: z.record(z.unknown()).optional().describe("Updated content"),
    name: z.string().optional().describe("Updated name"),
    slug: z.string().optional().describe("Updated slug"),
    publish: z
      .boolean()
      .optional()
      .default(false)
      .describe("Publish after update"),
    skipValidation: z
      .boolean()
      .optional()
      .default(false)
      .describe("Skip content validation against the Design System schema"),
  }),

  deleteStory: z.object({
    storyId: z.number().describe("Story ID to delete"),
  }),

  listComponents: z.object({}),

  getComponent: z.object({
    componentName: z.string().describe("Name of the component to retrieve"),
  }),

  listAssets: z.object({
    page: z.number().optional().default(1).describe("Page number"),
    perPage: z.number().optional().default(25).describe("Assets per page"),
    search: z.string().optional().describe("Search term for filtering"),
    inFolder: z.number().optional().describe("Filter by folder ID"),
  }),

  searchContent: z.object({
    query: z.string().describe("Search query"),
    contentType: z.string().optional().describe("Filter by content type"),
  }),

  scrapeUrl: z.object({
    url: z.string().url().describe("The URL to fetch and convert to Markdown"),
    selector: z
      .string()
      .optional()
      .describe(
        "Optional CSS selector to extract a specific part of the page (e.g. 'main', 'article', '.content'). Defaults to 'main' if present, otherwise full body."
      ),
  }),
};

export type GenerateContentInput = z.infer<typeof schemas.generateContent>;
export type ImportContentInput = z.infer<typeof schemas.importContent>;
export type ImportContentAtPositionInput = z.infer<
  typeof schemas.importContentAtPosition
>;
export type CreatePageWithContentInput = z.infer<
  typeof schemas.createPageWithContent
>;
export type ListStoriesInput = z.infer<typeof schemas.listStories>;
export type GetStoryInput = z.infer<typeof schemas.getStory>;
export type CreateStoryInput = z.infer<typeof schemas.createStory>;
export type UpdateStoryInput = z.infer<typeof schemas.updateStory>;
export type DeleteStoryInput = z.infer<typeof schemas.deleteStory>;
export type ListComponentsInput = z.infer<typeof schemas.listComponents>;
export type GetComponentInput = z.infer<typeof schemas.getComponent>;
export type ListAssetsInput = z.infer<typeof schemas.listAssets>;
export type SearchContentInput = z.infer<typeof schemas.searchContent>;
export type ScrapeUrlInput = z.infer<typeof schemas.scrapeUrl>;
