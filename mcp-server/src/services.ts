import StoryblokClient from "storyblok-js-client";
import { OpenAI } from "openai";
import { StoryblokConfig } from "./config.js";

/**
 * Wrapper class for Storyblok API operations
 */
export class StoryblokService {
  private managementClient: StoryblokClient;
  private contentClient: StoryblokClient;
  private spaceId: string;

  constructor(config: StoryblokConfig) {
    this.spaceId = config.spaceId;

    // Management API client (for write operations)
    this.managementClient = new StoryblokClient({
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
   * Get a story via the management API (includes drafts)
   */
  async getStoryManagement(storyId: number | string): Promise<unknown> {
    const response = await this.managementClient.get(
      `spaces/${this.spaceId}/stories/${storyId}`
    );
    return response.data.story;
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
      { story }
    );
    return response.data.story;
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
    const currentStory = await this.getStoryManagement(storyId);
    const story = currentStory as Record<string, unknown>;

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

    const response = await this.managementClient.put(
      `spaces/${this.spaceId}/stories/${storyId}`,
      {
        story,
        publish: publish ? 1 : 0,
      }
    );
    return response.data.story;
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
   * Import content by replacing a prompter component with generated sections
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
    // Get the current story
    const storyResponse = await this.managementClient.get(
      `spaces/${this.spaceId}/stories/${options.storyUid}`
    );
    const story = storyResponse.data.story;

    // Find the prompter component and replace it with the new sections
    const prompterIndex = story.content.section?.findIndex(
      (section: Record<string, unknown>) => section._uid === options.prompterUid
    );

    if (prompterIndex === undefined || prompterIndex === -1) {
      throw new Error(
        `Prompter component with UID ${options.prompterUid} not found`
      );
    }

    // Replace the prompter with the new sections
    story.content.section.splice(
      prompterIndex,
      1,
      ...options.page.content.section
    );

    // Update the story (save as draft)
    const response = await this.managementClient.put(
      `spaces/${this.spaceId}/stories/${options.storyUid}`,
      {
        story,
        publish: 0,
      }
    );

    return response.data.story;
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
}

/**
 * Service for AI content generation using OpenAI
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
   * Generate content using OpenAI with structured output
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

    const result = await this.client.chat.completions.create({
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: options.schema,
      },
      model: "gpt-4o-2024-08-06",
    });

    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    return JSON.parse(content);
  }
}
