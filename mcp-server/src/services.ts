import { randomUUID } from "node:crypto";
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
} from "@kickstartds/storyblok-services";

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
  }): Promise<unknown> {
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
    publish: boolean = false
  ): Promise<unknown> {
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
  }): Promise<unknown> {
    return importByPrompterReplacement(this.managementClient, this.spaceId, {
      storyUid: options.storyUid,
      prompterUid: options.prompterUid,
      sections: options.page.content.section,
    });
  }

  /**
   * Import content at a specific position (without a prompter).
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
  }): Promise<unknown> {
    return importAtPosition(this.managementClient, this.spaceId, {
      storyUid: options.storyUid,
      position: options.position,
      sections: options.page.content.section,
      publish: options.publish,
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
  }): Promise<unknown> {
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
