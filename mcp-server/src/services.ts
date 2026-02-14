import { randomUUID } from "node:crypto";
import TurndownService from "turndown";
import { readFileSync } from "node:fs";
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
  generateStructuredContent,
  prepareSchemaForOpenAi,
  getComponentPresetSchema,
  listAvailableComponents,
  processOpenAiResponse,
  processForStoryblok,
  generateAndPrepareContent,
  buildValidationRules,
  validateSections,
  validatePageContent,
  formatValidationErrors,
  type PrepareSchemaOptions,
  type ValidationRules,
} from "@kickstartds/storyblok-services";

// Load the dereferenced page schema once at module load
const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SCHEMA: Record<string, any> = JSON.parse(
  readFileSync(
    join(__dirname, "..", "schemas", "page.schema.dereffed.json"),
    "utf-8"
  )
);

// Build validation rules from the page schema at startup
const PAGE_VALIDATION_RULES: ValidationRules =
  buildValidationRules(PAGE_SCHEMA);

/**
 * Check whether a content object has any of the root array fields defined
 * by the schema (e.g. `section`), indicating it's a page-like structure
 * that can be validated.
 */
function rules_rootMatchesSchema(content: Record<string, any>): boolean {
  return PAGE_VALIDATION_RULES.rootArrayFields.some((field) =>
    Array.isArray(content[field])
  );
}

/** Export validation rules so introspection tools can use them. */
export { PAGE_VALIDATION_RULES, PAGE_SCHEMA };

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
    this.contentClient = new StoryblokClient({
      accessToken: config.apiToken,
    });
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
   * List stories with optional filtering
   */
  async listStories(options: {
    startsWith?: string;
    contentType?: string;
    page?: number;
    perPage?: number;
  }): Promise<unknown> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      per_page: options.perPage || 25,
    };

    if (options.startsWith) {
      params.starts_with = options.startsWith;
    }

    if (options.contentType) {
      params.content_type = options.contentType;
    }

    const response = await this.contentClient.get("cdn/stories", params);
    return {
      stories: response.data.stories,
      total: response.total,
      perPage: response.perPage,
    };
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

    const path =
      findBy === "id"
        ? `cdn/stories/${identifier}`
        : findBy === "uuid"
        ? `cdn/stories/${identifier}`
        : `cdn/stories/${identifier}`;

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
   * Create a new story
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
      // Only validate content types that match known root schemas
      if (contentType === "page" || rules_rootMatchesSchema(content)) {
        const validationResult = validatePageContent(
          content,
          PAGE_VALIDATION_RULES
        );
        if (!validationResult.valid) {
          throw new Error(formatValidationErrors(validationResult.errors));
        }
      }
    }

    const story: Record<string, unknown> = {
      name: options.name,
      slug: options.slug,
      content: options.content,
      is_folder: options.isFolder || false,
    };

    if (options.parentId) {
      story.parent_id = options.parentId;
    }

    const response = await this.managementClient.post(
      `spaces/${this.spaceId}/stories/`,
      { story } as any
    );
    return (response as any).data.story;
  }

  /**
   * Update an existing story
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
      if (contentType === "page" || rules_rootMatchesSchema(content)) {
        const validationResult = validatePageContent(
          content,
          PAGE_VALIDATION_RULES
        );
        if (!validationResult.valid) {
          throw new Error(formatValidationErrors(validationResult.errors));
        }
      }
    }

    // First, get the current story
    const currentStory = (await this.getStoryManagement(storyId)) as Record<
      string,
      unknown
    >;
    const story = currentStory;

    // Merge updates
    if (updates.content) {
      story.content = updates.content;
    }
    if (updates.name) {
      story.name = updates.name;
    }
    if (updates.slug) {
      story.slug = updates.slug;
    }

    return saveStory(
      this.managementClient,
      this.spaceId,
      String(storyId),
      story as Record<string, any>,
      publish
    );
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: number): Promise<void> {
    await this.managementClient.delete(
      `spaces/${this.spaceId}/stories/${storyId}`
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
    skipTransform?: boolean;
    skipValidation?: boolean;
    uploadAssets?: boolean;
    assetFolderName?: string;
  }): Promise<unknown> {
    let sections = options.page.content.section;

    // Validate sections against the Design System schema
    if (!options.skipValidation) {
      const validationResult = validateSections(
        sections as Record<string, any>[],
        PAGE_VALIDATION_RULES
      );
      if (!validationResult.valid) {
        throw new Error(formatValidationErrors(validationResult.errors));
      }
    }

    if (!options.skipTransform) {
      const transformed = processForStoryblok({ section: sections });
      sections = transformed.section;
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
    publish?: boolean;
    skipTransform?: boolean;
    skipValidation?: boolean;
    uploadAssets?: boolean;
    assetFolderName?: string;
  }): Promise<unknown> {
    let sections = options.page.content.section;

    // Validate sections against the Design System schema
    if (!options.skipValidation) {
      const validationResult = validateSections(
        sections as Record<string, any>[],
        PAGE_VALIDATION_RULES
      );
      if (!validationResult.valid) {
        throw new Error(formatValidationErrors(validationResult.errors));
      }
    }

    if (!options.skipTransform) {
      const transformed = processForStoryblok({ section: sections });
      sections = transformed.section;
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
   * List all components in the space
   */
  async listComponents(): Promise<unknown> {
    const response = await this.managementClient.get(
      `spaces/${this.spaceId}/components/`
    );
    return response.data.components;
  }

  /**
   * Get a specific component by name
   */
  async getComponent(name: string): Promise<unknown> {
    const components = (await this.listComponents()) as Array<{ name: string }>;
    const component = components.find((c) => c.name === name);

    if (!component) {
      throw new Error(`Component "${name}" not found`);
    }

    return component;
  }

  /**
   * List assets in the space
   */
  async listAssets(options: {
    page?: number;
    perPage?: number;
    search?: string;
    inFolder?: number;
  }): Promise<unknown> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      per_page: options.perPage || 25,
    };

    if (options.search) {
      params.search = options.search;
    }

    if (options.inFolder) {
      params.in_folder = options.inFolder;
    }

    const response = await this.managementClient.get(
      `spaces/${this.spaceId}/assets/`,
      params
    );
    return response.data;
  }

  /**
   * Search content across stories
   */
  async searchContent(query: string, contentType?: string): Promise<unknown> {
    const params: Record<string, unknown> = {
      search_term: query,
      per_page: 100,
    };

    if (contentType) {
      params.content_type = contentType;
    }

    const response = await this.contentClient.get("cdn/stories", params);
    return {
      stories: response.data.stories,
      total: response.total,
    };
  }

  /**
   * Create a new page pre-populated with section content.
   *
   * This is a convenience method that:
   * 1. Auto-generates `_uid` fields for every nested component that lacks one
   * 2. Wraps the sections in a standard `page` component envelope
   * 3. Creates the story in Storyblok
   * 4. Optionally publishes it
   */
  async createPageWithContent(options: {
    name: string;
    slug: string;
    parentId?: number;
    sections: Record<string, unknown>[];
    publish?: boolean;
    skipValidation?: boolean;
  }): Promise<unknown> {
    // Validate sections against the Design System schema
    if (!options.skipValidation) {
      const validationResult = validateSections(
        options.sections as Record<string, any>[],
        PAGE_VALIDATION_RULES
      );
      if (!validationResult.valid) {
        throw new Error(formatValidationErrors(validationResult.errors));
      }
    }

    // Recursively inject _uid where missing
    const sections = options.sections.map((s) => ensureUids(s)) as Record<
      string,
      unknown
    >[];

    const content: Record<string, unknown> = {
      component: "page",
      _uid: randomUUID(),
      section: sections,
    };

    // Create the story
    const story = await this.createStory({
      name: options.name,
      slug: options.slug,
      parentId: options.parentId,
      content,
    });

    // Optionally publish
    if (options.publish) {
      const storyId = (story as Record<string, any>).id;
      if (storyId) {
        return this.updateStory(storyId, {}, true);
      }
    }

    return story;
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
   * When a `pageSchema` is provided (the dereffed Design System schema), the
   * full pipeline runs:
   *   schema prep → OpenAI call → response post-processing → Storyblok flatten
   *
   * This is the recommended method for MCP tool callers who want a simple
   * "give me content" experience without dealing with schemas.
   */
  async generateWithSchema(options: {
    system: string;
    prompt: string;
    componentType?: string;
    sectionCount?: number;
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

    const schemaOptions: PrepareSchemaOptions = {};
    if (options.sectionCount) {
      schemaOptions.sections = options.sectionCount;
    }
    if (options.componentType) {
      schemaOptions.allowedComponents = [options.componentType, "section"];
    }

    const result = await generateAndPrepareContent(this.client as any, {
      system: options.system,
      prompt: options.prompt,
      pageSchema: PAGE_SCHEMA,
      schemaOptions,
    });

    return {
      designSystemProps: result.designSystemProps,
      storyblokContent: result.storyblokContent,
      rawResponse: result.rawResponse,
    };
  }
}

// ─── Scraping ─────────────────────────────────────────────────────────

/**
 * Fetch a URL and convert its HTML content to Markdown using Turndown.
 *
 * The function:
 * 1. Fetches the page with a browser-like User-Agent
 * 2. Extracts content from the given CSS selector (default: <main>, falling back to <body>)
 * 3. Converts the HTML to clean Markdown, preserving images
 * 4. Strips scripts, styles, nav, header, footer, and SVG elements
 */
export async function scrapeUrl(options: {
  url: string;
  selector?: string;
}): Promise<{ url: string; markdown: string; title: string }> {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  // Remove noisy elements
  turndown.remove(["script", "style", "nav"] as any);

  // Remove SVG elements
  turndown.addRule("removeSvg", {
    filter: (node) => node.tagName?.toLowerCase() === "svg",
    replacement: () => "",
  });

  // Remove header and footer for cleaner content
  turndown.addRule("removeHeaderFooter", {
    filter: (node) => {
      const tagName = node.tagName?.toLowerCase();
      return tagName === "header" || tagName === "footer";
    },
    replacement: () => "",
  });

  // Better image handling — preserve alt text and resolve relative URLs
  turndown.addRule("images", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const alt = el.getAttribute("alt") || "";
      const src = el.getAttribute("src") || el.getAttribute("data-src") || "";
      if (!src) return "";

      // Resolve relative URLs to absolute
      let absoluteSrc = src;
      try {
        absoluteSrc = new URL(src, options.url).href;
      } catch {
        // keep original src if URL parsing fails
      }

      return `![${alt}](${absoluteSrc})`;
    },
  });

  // Fetch the page
  const response = await fetch(options.url, {
    headers: {
      Accept: "text/html",
      "User-Agent":
        "Mozilla/5.0 (compatible; kickstartDS-MCP/1.0; +https://www.kickstartds.com)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract content using the specified selector, or fall back to <main> then <body>
  let contentHtml: string;
  if (options.selector) {
    // For custom selectors, use a simple tag/class/id match
    const selectorRegex = buildSelectorRegex(options.selector);
    const match = html.match(selectorRegex);
    contentHtml = match ? match[1] : html;
  } else {
    // Default: try <main>, then fall back to full HTML
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    contentHtml = mainMatch ? mainMatch[1] : html;
  }

  const markdown = turndown.turndown(contentHtml);

  // Clean up excessive blank lines
  const cleaned = markdown.replace(/\n{3,}/g, "\n\n").trim();

  return {
    url: options.url,
    title,
    markdown: cleaned,
  };
}

/**
 * Build a simple regex to match common CSS selectors (tag, #id, .class).
 * This avoids pulling in a full DOM parser for the selector extraction step.
 */
function buildSelectorRegex(selector: string): RegExp {
  const trimmed = selector.trim();
  if (trimmed.startsWith("#")) {
    // ID selector
    const id = trimmed.slice(1);
    return new RegExp(
      `<[a-z][a-z0-9]*[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/[a-z][a-z0-9]*>`,
      "i"
    );
  } else if (trimmed.startsWith(".")) {
    // Class selector
    const cls = trimmed.slice(1);
    return new RegExp(
      `<[a-z][a-z0-9]*[^>]*\\bclass=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/[a-z][a-z0-9]*>`,
      "i"
    );
  } else {
    // Tag selector
    return new RegExp(`<${trimmed}[^>]*>([\\s\\S]*?)<\\/${trimmed}>`, "i");
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Recursively walk a Storyblok component tree and add a `_uid` (UUID v4)
 * to every object that has a `component` key but is missing `_uid`.
 * Arrays are traversed element-by-element.
 */
function ensureUids<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => ensureUids(item)) as unknown as T;
  }

  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // If it looks like a component block, ensure _uid
    if (obj.component && !obj._uid) {
      obj._uid = randomUUID();
    }

    // Recurse into all values
    for (const key of Object.keys(obj)) {
      obj[key] = ensureUids(obj[key]);
    }

    return obj as T;
  }

  return value;
}
