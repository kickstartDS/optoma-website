import { randomUUID } from "node:crypto";
import TurndownService from "turndown";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
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
  uploadAndReplaceAssets,
  wrapAssetUrls,
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
    uploadAssets?: boolean;
    assetFolderName?: string;
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

    // Upload external images to Storyblok (if requested)
    let assetsSummary;
    if (options.uploadAssets) {
      const wrapper = { section: sections } as Record<string, any>;
      assetsSummary = await uploadAndReplaceAssets(
        this.managementClient,
        wrapper,
        {
          spaceId: this.spaceId,
          assetFolderName: options.assetFolderName || "AI Generated",
        }
      );
    }

    // Wrap plain URL strings in asset fields into Storyblok asset objects
    for (const section of sections) {
      wrapAssetUrls(section as Record<string, any>);
    }

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
        const savedStory = await this.updateStory(storyId, {}, true);
        return assetsSummary
          ? { ...(savedStory as Record<string, any>), assetsSummary }
          : savedStory;
      }
    }

    return assetsSummary
      ? { ...(story as Record<string, any>), assetsSummary }
      : story;
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

/** Describes an image discovered during scraping. */
interface ScrapedImage {
  src: string;
  alt: string;
  /** Where the image was found: 'content', 'background', 'meta', 'picture-source'. */
  context: string;
}

/**
 * Fetch a URL and convert its HTML content to Markdown.
 *
 * The function:
 * 1. Fetches the page HTML with a browser-like User-Agent
 * 2. Parses it into a full DOM with JSDOM
 * 3. Runs @mozilla/readability to extract the main article content
 *    (falls back to a CSS-selector or <main>/<body> if Readability returns nothing)
 * 4. Converts the readable HTML to clean Markdown using Turndown
 * 5. Extracts images from <img>, <picture>/<source>, CSS background-image,
 *    lazy-loading data attributes, and Open Graph / meta tags
 * 6. Returns the title, Markdown, and a structured images array
 */
export async function scrapeUrl(options: {
  url: string;
  selector?: string;
}): Promise<{
  url: string;
  markdown: string;
  title: string;
  images: ScrapedImage[];
}> {
  // ── 1. Fetch ──────────────────────────────────────────────────────────
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

  // ── 2. Parse into DOM ─────────────────────────────────────────────────
  const dom = new JSDOM(html, { url: options.url });
  const document = dom.window.document;

  // Extract title from the DOM (more reliable than regex)
  const title = document.querySelector("title")?.textContent?.trim() ?? "";

  // ── 3. Collect images BEFORE Readability mutates the DOM ──────────────
  const images: ScrapedImage[] = [];
  const seenSrcs = new Set<string>();

  const resolveUrl = (raw: string): string => {
    try {
      return new URL(raw, options.url).href;
    } catch {
      return raw;
    }
  };

  const addImage = (src: string, alt: string, context: string) => {
    if (!src || src.startsWith("data:")) return;
    const resolved = resolveUrl(src);
    if (seenSrcs.has(resolved)) return;
    seenSrcs.add(resolved);
    images.push({ src: resolved, alt, context });
  };

  // (a) Open Graph & meta images — always available regardless of Readability
  for (const meta of document.querySelectorAll(
    'meta[property="og:image"], meta[name="twitter:image"], meta[name="twitter:image:src"]'
  )) {
    const content = meta.getAttribute("content");
    if (content) addImage(content, title, "meta");
  }

  // Helper: extract images from a DOM subtree
  const collectImagesFromElement = (root: Element | Document) => {
    // (b) <img> tags — including lazy-load data attributes
    for (const img of root.querySelectorAll("img")) {
      const alt = img.getAttribute("alt") || "";
      const src =
        img.getAttribute("src") ||
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("data-original") ||
        img.getAttribute("data-lazy-src") ||
        "";
      addImage(src, alt, "content");

      // Also check srcset for higher-res versions
      const srcset =
        img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
      const best = pickBestFromSrcset(srcset);
      if (best) addImage(best, alt, "content");
    }

    // (c) <picture> / <source> elements
    for (const source of root.querySelectorAll("picture source")) {
      const srcset = source.getAttribute("srcset") || "";
      const best = pickBestFromSrcset(srcset);
      if (best) {
        const picture = source.closest("picture");
        const alt = picture?.querySelector("img")?.getAttribute("alt") || "";
        addImage(best, alt, "picture-source");
      }
    }

    // (d) CSS background-image in inline styles
    for (const el of root.querySelectorAll("[style]")) {
      const style = el.getAttribute("style") || "";
      const bgMatches = style.matchAll(
        /background(?:-image)?\s*:[^;]*url\(\s*["']?([^"')]+)["']?\s*\)/gi
      );
      for (const m of bgMatches) {
        addImage(m[1], "", "background");
      }
    }
  };

  // Collect from the full document first (catches everything)
  collectImagesFromElement(document);

  // ── 4. Extract readable content ───────────────────────────────────────
  let contentHtml: string;

  if (options.selector) {
    // User-specified CSS selector — use the real DOM instead of regex
    const selected = document.querySelector(options.selector);
    contentHtml = selected
      ? selected.innerHTML
      : document.body?.innerHTML ?? html;
  } else {
    // Try Readability first — produces clean, article-focused content
    // Clone the document because Readability mutates it in place
    const clone = new JSDOM(html, { url: options.url });
    const reader = new Readability(clone.window.document);
    const article = reader.parse();

    if (article && article.content) {
      contentHtml = article.content;
      // Readability may extract a better title
    } else {
      // Fallback: <main>, then <body>
      const main = document.querySelector("main");
      contentHtml = main ? main.innerHTML : document.body?.innerHTML ?? html;
    }
  }

  // Also collect images specifically from the extracted content
  // (they'll deduplicate via seenSrcs)
  const contentDom = new JSDOM(contentHtml, { url: options.url });
  collectImagesFromElement(contentDom.window.document);

  // ── 5. Convert to Markdown ────────────────────────────────────────────
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

  // Remove page-level <header> and <footer> (site nav / site footer).
  // Only strip those that are direct children of <body> — semantic <header>
  // elements inside content sections (e.g. kickstartDS headline components)
  // must be preserved because they carry section headings and sub-headlines.
  turndown.addRule("removePageHeaderFooter", {
    filter: (node) => {
      const tagName = node.tagName?.toLowerCase();
      if (tagName !== "header" && tagName !== "footer") return false;
      // Only strip top-level (direct child of <body> or the Readability wrapper)
      const parentTag = node.parentNode?.nodeName?.toLowerCase();
      return parentTag === "body" || parentTag === "#document";
    },
    replacement: () => "",
  });

  // Image handling — preserve alt text, resolve relative URLs,
  // and check lazy-load data attributes
  turndown.addRule("images", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const alt = el.getAttribute("alt") || "";
      const src =
        el.getAttribute("src") ||
        el.getAttribute("data-src") ||
        el.getAttribute("data-lazy") ||
        el.getAttribute("data-original") ||
        el.getAttribute("data-lazy-src") ||
        "";
      if (!src) return "";
      return `![${alt}](${resolveUrl(src)})`;
    },
  });

  // <picture>: render the best <source> as an image in Markdown
  turndown.addRule("picture", {
    filter: (node) => {
      return (
        node.tagName?.toLowerCase() === "picture" &&
        node.querySelectorAll("source").length > 0
      );
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const img = el.querySelector("img");
      const alt = img?.getAttribute("alt") || "";

      // Try to get the best source from <source> elements
      for (const source of el.querySelectorAll("source")) {
        const srcset = source.getAttribute("srcset") || "";
        const best = pickBestFromSrcset(srcset);
        if (best) return `![${alt}](${resolveUrl(best)})`;
      }

      // Fallback to <img>
      const src =
        img?.getAttribute("src") || img?.getAttribute("data-src") || "";
      if (src) return `![${alt}](${resolveUrl(src)})`;
      return "";
    },
  });

  // Elements with background images — emit as Markdown image
  turndown.addRule("backgroundImages", {
    filter: (node) => {
      const style = node.getAttribute?.("style") || "";
      return /background(?:-image)?\s*:[^;]*url\(/i.test(style);
    },
    replacement: (content, node) => {
      const style = (node as HTMLElement).getAttribute("style") || "";
      const match = style.match(
        /background(?:-image)?\s*:[^;]*url\(\s*["']?([^"')]+)["']?\s*\)/i
      );
      const bgImage = match ? `\n\n![](${resolveUrl(match[1])})\n\n` : "";
      return bgImage + content;
    },
  });

  const markdown = turndown.turndown(contentHtml);

  // Clean up excessive blank lines
  const cleaned = markdown.replace(/\n{3,}/g, "\n\n").trim();

  return {
    url: options.url,
    title,
    markdown: cleaned,
    images,
  };
}

/**
 * Pick the highest-resolution image URL from a `srcset` attribute value.
 * Handles both width descriptors (`480w`) and pixel-density descriptors (`2x`).
 * Returns `undefined` if srcset is empty or unparseable.
 */
function pickBestFromSrcset(srcset: string): string | undefined {
  if (!srcset.trim()) return undefined;

  let bestUrl: string | undefined;
  let bestValue = 0;

  for (const candidate of srcset.split(",")) {
    const parts = candidate.trim().split(/\s+/);
    if (parts.length < 1) continue;
    const url = parts[0];
    const descriptor = parts[1] || "1x";

    let value: number;
    if (descriptor.endsWith("w")) {
      value = parseInt(descriptor, 10) || 0;
    } else if (descriptor.endsWith("x")) {
      // Treat pixel density as a much smaller number to prefer `w` descriptors
      value = parseFloat(descriptor) || 1;
    } else {
      value = 0;
    }

    if (value > bestValue || !bestUrl) {
      bestValue = value;
      bestUrl = url;
    }
  }

  return bestUrl;
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
