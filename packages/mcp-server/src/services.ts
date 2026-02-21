import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import StoryblokClient from "storyblok-js-client";
import { OpenAI } from "openai";
import { StoryblokConfig } from "./config.js";
import {
  createStoryblokClient,
  getStoryManagement as sharedGetStoryManagement,
  saveStory,
  importByPrompterReplacement,
  importAtPosition,
  uploadAndReplaceAssets,
  wrapAssetUrls,
  normalizeAssetFieldNames,
  generateStructuredContent,
  prepareSchemaForOpenAi,
  getComponentPresetSchema,
  getRootFieldSchema,
  listAvailableComponents,
  processOpenAiResponse,
  processForStoryblok,
  generateAndPrepareContent,
  generateRootFieldContent,
  generateSeoContent,
  buildValidationRules,
  validateSections,
  validatePageContent,
  formatValidationErrors,
  checkCompositionalQuality,
  createRegistryFromSchemaDir,
  SchemaRegistry,
  // Shared CRUD + introspection + scraping functions
  listStories as sharedListStories,
  searchStories as sharedSearchStories,
  findBySlug as sharedFindBySlug,
  createStory as sharedCreateStory,
  createPageWithContent as sharedCreatePageWithContent,
  updateStory as sharedUpdateStory,
  deleteStory as sharedDeleteStory,
  ensurePath as sharedEnsurePath,
  ensureUids as sharedEnsureUids,
  stripEmptyAssetFields,
  createContentClient,
  listComponents as sharedListComponents,
  getComponent as sharedGetComponent,
  listAssets as sharedListAssets,
  scrapeUrl as sharedScrapeUrl,
  analyzeContentPatterns as sharedAnalyzeContentPatterns,
  assembleFieldGuidance,
  type PrepareSchemaOptions,
  type ValidationRules,
  type ValidationWarning,
  type ContentTypeEntry,
  type RootFieldMeta,
  type ContentPatternAnalysis,
  type SubComponentStats,
  type AnalyzeContentPatternsOptions,
  type SectionRecipes,
} from "@kickstartds/storyblok-services";

// Load all content type schemas via the registry
const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, "..", "schemas");
const registry: SchemaRegistry = createRegistryFromSchemaDir(schemasDir);

// Backward-compatible aliases — existing code can keep referencing these
const PAGE_SCHEMA: Record<string, any> = registry.page.schema;
const PAGE_VALIDATION_RULES: ValidationRules = registry.page.rules;

/**
 * Check whether a content object has any of the root array fields defined
 * by its schema, indicating it can be structurally validated.
 *
 * First tries to detect the content type from the `component` field and
 * look up matching rules from the registry. Falls back to page rules.
 */
function rules_rootMatchesSchema(content: Record<string, any>): boolean {
  const entry = registry.detectContentType(content);
  const rules = entry ? entry.rules : PAGE_VALIDATION_RULES;
  return rules.rootArrayFields.some((field) => Array.isArray(content[field]));
}

/**
 * Get the appropriate validation rules for a content object.
 * Detects the content type from the registry; falls back to page rules.
 */
function getValidationRulesForContent(
  content: Record<string, any>
): ValidationRules {
  const entry = registry.detectContentType(content);
  return entry ? entry.rules : PAGE_VALIDATION_RULES;
}

/** Export validation rules and registry so introspection tools can use them. */
export {
  PAGE_VALIDATION_RULES,
  PAGE_SCHEMA,
  registry,
  checkCompositionalQuality,
};
export type { ValidationWarning, ContentTypeEntry, RootFieldMeta };
export { PLACEHOLDER_IMAGE_INSTRUCTIONS } from "@kickstartds/storyblok-services";
export { stripEmptyAssetFields };

// ─── Content Pattern Analysis ─────────────────────────────────────────
// Re-exported from shared library. The function signature now takes a
// content API client instead of a StoryblokService instance.
export { sharedAnalyzeContentPatterns as analyzeContentPatterns };
export { assembleFieldGuidance };
export type { ContentPatternAnalysis, SubComponentStats, SectionRecipes };

/**
 * Wrapper class for Storyblok API operations.
 *
 * Core import/generation logic is delegated to `@kickstartds/storyblok-services`.
 * MCP-specific methods (CRUD stories, components, assets, search) remain here.
 */
export class StoryblokService {
  private managementClient: StoryblokClient;
  private contentClient: StoryblokClient;
  private spaceId: string;

  constructor(config: StoryblokConfig) {
    this.spaceId = config.spaceId;

    // Management API client via shared library
    this.managementClient = createStoryblokClient({
      spaceId: config.spaceId,
      oauthToken: config.oauthToken,
    });

    // Content Delivery API client (for read operations)
    this.contentClient = createContentClient({
      spaceId: config.spaceId,
      apiToken: config.apiToken,
    });
  }

  /** Expose the content API client for shared functions that need it. */
  getContentClient(): StoryblokClient {
    return this.contentClient;
  }

  /**
   * Fetch ideas from the Storyblok space
   */
  async getIdeas(): Promise<unknown> {
    const response = await this.managementClient.get(
      `spaces/${this.spaceId}/ideas/`
    );
    return response.data;
  }

  /**
   * List stories with optional filtering.
   * Delegates to shared `listStories()`.
   */
  async listStories(options: {
    startsWith?: string;
    contentType?: string;
    page?: number;
    perPage?: number;
    excludeContent?: boolean;
  }): Promise<unknown> {
    return sharedListStories(this.contentClient, options);
  }

  /**
   * Get a single story by slug, ID, or UUID
   */
  async getStory(
    identifier: string,
    findBy: "slug" | "id" | "uuid" = "slug",
    version: "draft" | "published" = "published"
  ): Promise<unknown> {
    const params: Record<string, unknown> = {
      version,
    };

    if (findBy === "uuid") {
      params.find_by = "uuid";
    }

    const path = `cdn/stories/${identifier}`;

    const response = await this.contentClient.get(path, params);
    return response.data.story;
  }

  /**
   * Get a story via the management API (includes drafts).
   * Delegates to `@kickstartds/storyblok-services`.
   */
  async getStoryManagement(storyId: number | string): Promise<unknown> {
    return sharedGetStoryManagement(
      this.managementClient,
      this.spaceId,
      String(storyId)
    );
  }

  /**
   * Create a new story.
   * Delegates to shared `createStory()` with local validation.
   */
  async createStory(options: {
    name: string;
    slug: string;
    parentId?: number;
    content: Record<string, unknown>;
    isFolder?: boolean;
    skipValidation?: boolean;
  }): Promise<unknown> {
    // Validate content against the Design System schema if applicable
    if (!options.skipValidation && !options.isFolder) {
      const content = options.content as Record<string, any>;
      const contentType = content.component || content.type;
      if (registry.has(contentType) || rules_rootMatchesSchema(content)) {
        const rules = getValidationRulesForContent(content);
        const validationResult = validatePageContent(content, rules);
        if (!validationResult.valid) {
          throw new Error(formatValidationErrors(validationResult.errors));
        }
      }
    }

    return sharedCreateStory(this.managementClient, this.spaceId, {
      name: options.name,
      slug: options.slug,
      parentId: options.parentId,
      content: options.content,
      isFolder: options.isFolder,
      skipValidation: true, // already validated above
    });
  }

  /**
   * Update an existing story.
   * Delegates to shared `updateStory()` with local validation.
   */
  async updateStory(
    storyId: number,
    updates: {
      content?: Record<string, unknown>;
      name?: string;
      slug?: string;
    },
    publish: boolean = false,
    skipValidation: boolean = false
  ): Promise<unknown> {
    // Validate updated content against the Design System schema if applicable
    if (!skipValidation && updates.content) {
      const content = updates.content as Record<string, any>;
      const contentType = content.component || content.type;
      if (registry.has(contentType) || rules_rootMatchesSchema(content)) {
        const rules = getValidationRulesForContent(content);
        const validationResult = validatePageContent(content, rules);
        if (!validationResult.valid) {
          throw new Error(formatValidationErrors(validationResult.errors));
        }
      }
    }

    return sharedUpdateStory(
      this.managementClient,
      this.spaceId,
      String(storyId),
      {
        content: updates.content,
        name: updates.name,
        slug: updates.slug,
        publish,
        skipValidation: true, // already validated above
      }
    );
  }

  /**
   * Delete a story.
   * Delegates to shared `deleteStory()`.
   */
  async deleteStory(storyId: number): Promise<void> {
    await sharedDeleteStory(
      this.managementClient,
      this.spaceId,
      String(storyId)
    );
  }

  /**
   * Import content by replacing a prompter component with generated sections.
   * Automatically transforms content for Storyblok compatibility unless skipped.
   * Delegates to `@kickstartds/storyblok-services`.
   */
  async importContent(options: {
    storyUid: string;
    prompterUid: string;
    page: {
      content: {
        section: Record<string, unknown>[];
      };
    };
    contentType?: string;
    skipTransform?: boolean;
    skipValidation?: boolean;
    uploadAssets?: boolean;
    assetFolderName?: string;
  }): Promise<unknown> {
    const entry = options.contentType
      ? registry.get(options.contentType)
      : registry.page;
    const rootArrayField = entry.rootArrayFields[0] || "section";
    let sections = options.page.content.section;

    // Normalize wrongly-flattened asset field names before validation
    if (entry.rules.flatAssetFields?.size) {
      normalizeAssetFieldNames(
        sections as Record<string, any>[],
        entry.rules.flatAssetFields
      );
    }

    // Validate sections against the Design System schema
    if (!options.skipValidation) {
      const validationResult = validateSections(
        sections as Record<string, any>[],
        entry.rules
      );
      if (!validationResult.valid) {
        throw new Error(formatValidationErrors(validationResult.errors));
      }
    }

    if (!options.skipTransform) {
      const transformed = processForStoryblok(
        { [rootArrayField]: sections },
        entry.rules.flatAssetFields
      );
      sections = transformed[rootArrayField];
    }
    return importByPrompterReplacement(this.managementClient, this.spaceId, {
      storyUid: options.storyUid,
      prompterUid: options.prompterUid,
      sections,
      uploadAssets: options.uploadAssets,
      assetFolderName: options.assetFolderName,
    });
  }

  /**
   * Import content at a specific position (without a prompter).
   * Automatically transforms content for Storyblok compatibility unless skipped.
   * Delegates to `@kickstartds/storyblok-services`.
   */
  async importContentAtPosition(options: {
    storyUid: string;
    position: number;
    page: {
      content: {
        section: Record<string, unknown>[];
      };
    };
    contentType?: string;
    targetField?: string;
    publish?: boolean;
    skipTransform?: boolean;
    skipValidation?: boolean;
    uploadAssets?: boolean;
    assetFolderName?: string;
  }): Promise<unknown> {
    const entry = options.contentType
      ? registry.get(options.contentType)
      : registry.page;
    const rootArrayField =
      options.targetField || entry.rootArrayFields[0] || "section";
    let sections = options.page.content.section;

    // Normalize wrongly-flattened asset field names before validation
    if (entry.rules.flatAssetFields?.size) {
      normalizeAssetFieldNames(
        sections as Record<string, any>[],
        entry.rules.flatAssetFields
      );
    }

    // Validate sections against the Design System schema
    if (!options.skipValidation) {
      const validationResult = validateSections(
        sections as Record<string, any>[],
        entry.rules
      );
      if (!validationResult.valid) {
        throw new Error(formatValidationErrors(validationResult.errors));
      }
    }

    if (!options.skipTransform) {
      const transformed = processForStoryblok(
        { [rootArrayField]: sections },
        entry.rules.flatAssetFields
      );
      sections = transformed[rootArrayField];
    }
    return importAtPosition(this.managementClient, this.spaceId, {
      storyUid: options.storyUid,
      position: options.position,
      sections,
      publish: options.publish,
      uploadAssets: options.uploadAssets,
      assetFolderName: options.assetFolderName,
    });
  }

  /**
   * List all components in the space.
   * Delegates to shared `listComponents()`.
   */
  async listComponents(): Promise<unknown> {
    return sharedListComponents(this.managementClient, this.spaceId);
  }

  /**
   * Get a specific component by name.
   * Delegates to shared `getComponent()`.
   */
  async getComponent(name: string): Promise<unknown> {
    return sharedGetComponent(this.managementClient, this.spaceId, name);
  }

  /**
   * List assets in the space.
   * Delegates to shared `listAssets()`.
   */
  async listAssets(options: {
    page?: number;
    perPage?: number;
    search?: string;
    inFolder?: number;
  }): Promise<unknown> {
    return sharedListAssets(this.managementClient, this.spaceId, options);
  }

  /**
   * Search content across stories.
   * Delegates to shared `searchStories()`.
   */
  async searchContent(query: string, contentType?: string): Promise<unknown> {
    return sharedSearchStories(this.contentClient, query, contentType);
  }

  /**
   * Create a new page pre-populated with section content.
   *
   * This is a convenience method that:
   * 1. Auto-generates `_uid` fields for every nested component that lacks one
   * 2. Wraps the sections in a standard component envelope (dynamic by content type)
   * 3. Creates the story in Storyblok
   * 4. Optionally publishes it
   */
  async createPageWithContent(options: {
    name: string;
    slug: string;
    parentId?: number;
    sections: Record<string, unknown>[];
    contentType?: string;
    rootFields?: Record<string, unknown>;
    publish?: boolean;
    skipValidation?: boolean;
    uploadAssets?: boolean;
    assetFolderName?: string;
  }): Promise<unknown> {
    const entry = options.contentType
      ? registry.get(options.contentType)
      : registry.page;
    const componentName = entry.name;
    const rootArrayField = entry.rootArrayFields[0] || "section";

    return sharedCreatePageWithContent(this.managementClient, this.spaceId, {
      ...options,
      validationRules: entry.rules,
      componentName,
      rootArrayField,
    });
  }

  /**
   * Find a folder (or story) by its full slug path.
   * Delegates to shared `findBySlug()`.
   */
  async findBySlug(fullSlug: string): Promise<Record<string, any> | null> {
    return sharedFindBySlug(this.contentClient, fullSlug);
  }

  /**
   * Ensure a full folder path exists, creating missing intermediate folders.
   * Delegates to shared `ensurePath()`.
   */
  async ensurePath(folderPath: string): Promise<number> {
    return sharedEnsurePath(
      this.managementClient,
      this.contentClient,
      this.spaceId,
      folderPath
    );
  }
}

/**
 * Service for AI content generation using OpenAI.
 * Delegates to `@kickstartds/storyblok-services`.
 */
export class ContentGenerationService {
  private client: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Generate content using OpenAI with structured output.
   * Delegates to `@kickstartds/storyblok-services`.
   */
  async generateContent(options: {
    system: string;
    prompt: string;
    schema: {
      name: string;
      strict?: boolean;
      schema: Record<string, unknown>;
    };
  }): Promise<unknown> {
    if (!this.client) {
      throw new Error(
        "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
      );
    }

    return generateStructuredContent(this.client as any, options);
  }

  /**
   * Generate content with automatic schema preparation and response processing.
   *
   * When a content type is specified, the corresponding schema is looked up
   * from the registry. The full pipeline runs:
   *   schema prep → OpenAI call → response post-processing → Storyblok flatten
   */
  async generateWithSchema(options: {
    system: string;
    prompt: string;
    componentType?: string;
    sectionCount?: number;
    contentType?: string;
  }): Promise<{
    designSystemProps: Record<string, any>;
    storyblokContent: Record<string, any>;
    rawResponse: Record<string, any>;
  }> {
    if (!this.client) {
      throw new Error(
        "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
      );
    }

    const entry = options.contentType
      ? registry.get(options.contentType)
      : registry.page;
    const schema = entry.schema;

    const schemaOptions: PrepareSchemaOptions = {
      validationRules: entry.rules,
      contentType: entry.name,
    };
    if (options.sectionCount) {
      schemaOptions.sections = options.sectionCount;
    }
    if (options.componentType) {
      schemaOptions.allowedComponents = [options.componentType, "section"];
    }

    const result = await generateAndPrepareContent(this.client as any, {
      system: options.system,
      prompt: options.prompt,
      pageSchema: schema,
      schemaOptions,
      flatAssetFields: entry.rules.flatAssetFields,
    });

    return {
      designSystemProps: result.designSystemProps,
      storyblokContent: result.storyblokContent,
      rawResponse: result.rawResponse,
    };
  }

  /**
   * Generate content for a single root-level field on a content type.
   *
   * Used for non-section root fields like `head`, `aside`, `cta` on blog-post.
   * Delegates to `@kickstartds/storyblok-services`.
   */
  async generateRootField(options: {
    system: string;
    prompt: string;
    fieldName: string;
    contentType?: string;
    model?: string;
  }): Promise<{
    rawResponse: Record<string, any>;
    designSystemProps: Record<string, any>;
    storyblokContent: Record<string, any>;
    fieldName: string;
  }> {
    if (!this.client) {
      throw new Error(
        "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
      );
    }

    const entry = options.contentType
      ? registry.get(options.contentType)
      : registry.page;

    return generateRootFieldContent(this.client as any, {
      system: options.system,
      prompt: options.prompt,
      contentTypeSchema: entry.schema,
      fieldName: options.fieldName,
      contentType: entry.name,
      model: options.model,
    });
  }

  /**
   * Generate SEO metadata for a content type.
   *
   * Delegates to `@kickstartds/storyblok-services`.
   */
  async generateSeo(options: {
    prompt: string;
    contentType?: string;
    model?: string;
    system?: string;
  }): Promise<{
    rawResponse: Record<string, any>;
    designSystemProps: Record<string, any>;
    storyblokContent: Record<string, any>;
  }> {
    if (!this.client) {
      throw new Error(
        "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
      );
    }

    const entry = options.contentType
      ? registry.get(options.contentType)
      : registry.page;

    return generateSeoContent(this.client as any, {
      prompt: options.prompt,
      contentTypeSchema: entry.schema,
      contentType: entry.name,
      model: options.model,
      system: options.system,
    });
  }
}

// ─── Scraping ─────────────────────────────────────────────────────────

// Re-export from shared library for backward compatibility
export const scrapeUrl = sharedScrapeUrl;

// ─── Helpers ──────────────────────────────────────────────────────────

// Re-export from shared library for backward compatibility
export const ensureUids = sharedEnsureUids;
