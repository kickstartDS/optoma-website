/**
 * Shared types for Storyblok services.
 *
 * These types are intentionally kept minimal and dependency-free so they can
 * be used across Next.js API routes, MCP servers, and n8n community nodes
 * without pulling in framework-specific dependencies.
 */

// ─── Credentials / Config ─────────────────────────────────────────────

/**
 * Credentials required to interact with the Storyblok Management API.
 */
export interface StoryblokCredentials {
  /** Storyblok space ID (numeric string). */
  spaceId: string;
  /** Content Delivery API preview token (for read operations). */
  apiToken?: string;
  /** Management API OAuth token (for write operations). */
  oauthToken: string;
}

/**
 * Credentials required to interact with the OpenAI API.
 */
export interface OpenAiCredentials {
  /** OpenAI API key starting with `sk-`. */
  apiKey: string;
}

// ─── Content structures ───────────────────────────────────────────────

/**
 * Minimal representation of a Storyblok story's page content.
 * Used as input for import operations.
 */
export interface PageContent {
  content: {
    section: Record<string, unknown>[];
  };
}

/**
 * Options for generating structured content via OpenAI.
 */
export interface GenerateContentOptions {
  /** System prompt guiding the AI's persona and behaviour. */
  system: string;
  /** User prompt describing what to generate. */
  prompt: string;
  /** JSON Schema definition for structured output. */
  schema: {
    name: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
  /**
   * OpenAI model identifier.
   * @default "gpt-4o-2024-08-06"
   */
  model?: string;
}

/**
 * Options for importing content by replacing a prompter component.
 */
export interface ImportByPrompterOptions {
  /** Numeric story ID or UID. */
  storyUid: string;
  /** The `_uid` of the prompter component to replace. */
  prompterUid: string;
  /** Section objects to insert in place of the prompter. */
  sections: Record<string, unknown>[];
  /** Whether to publish the story immediately. @default false */
  publish?: boolean;
  /**
   * When `true`, image URLs in the sections are downloaded and uploaded
   * to Storyblok as native assets before the story is saved.
   * @default false
   */
  uploadAssets?: boolean;
  /**
   * Name of the Storyblok asset folder to upload images into.
   * Created if it doesn't exist. @default "AI Generated"
   */
  assetFolderName?: string;
}

/**
 * Options for importing content at a specific position.
 */
export interface ImportAtPositionOptions {
  /** Numeric story ID or UID. */
  storyUid: string;
  /**
   * Zero-based insertion index.
   * - `0` inserts at the beginning.
   * - `-1` appends at the end.
   * - Any other value is clamped to `[0, section.length]`.
   */
  position: number;
  /** Section objects to insert. */
  sections: Record<string, unknown>[];
  /** Whether to publish the story immediately. @default false */
  publish?: boolean;
  /**
   * When `true`, image URLs in the sections are downloaded and uploaded
   * to Storyblok as native assets before the story is saved.
   * @default false
   */
  uploadAssets?: boolean;
  /**
   * Name of the Storyblok asset folder to upload images into.
   * Created if it doesn't exist. @default "AI Generated"
   */
  assetFolderName?: string;
}

// ─── Error types ──────────────────────────────────────────────────────

/**
 * Base error for all service-layer errors.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class StoryblokApiError extends ServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "STORYBLOK_API_ERROR", details);
    this.name = "StoryblokApiError";
  }
}

export class OpenAiApiError extends ServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "OPENAI_API_ERROR", details);
    this.name = "OpenAiApiError";
  }
}

export class PrompterNotFoundError extends ServiceError {
  constructor(
    prompterUid: string,
    availableUids: string[],
    details?: Record<string, unknown>
  ) {
    super(
      `Prompter component with UID "${prompterUid}" not found in story. ` +
        `Available section UIDs: ${availableUids.join(", ")}`,
      "PROMPTER_NOT_FOUND",
      { ...details, prompterUid, availableUids }
    );
    this.name = "PrompterNotFoundError";
  }
}

export class ContentGenerationError extends ServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "CONTENT_GENERATION_ERROR", details);
    this.name = "ContentGenerationError";
  }
}
