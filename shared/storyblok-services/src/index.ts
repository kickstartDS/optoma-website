/**
 * @kickstartds/storyblok-services
 *
 * Shared Storyblok CMS and OpenAI content generation services.
 * Used by: Next.js API routes, MCP server, n8n community nodes.
 */

// ─── Types & errors ───────────────────────────────────────────────────
export type {
  StoryblokCredentials,
  OpenAiCredentials,
  PageContent,
  GenerateContentOptions,
  ImportByPrompterOptions,
  ImportAtPositionOptions,
} from "./types.js";

export {
  ServiceError,
  StoryblokApiError,
  OpenAiApiError,
  PrompterNotFoundError,
  ContentGenerationError,
} from "./types.js";

// ─── Storyblok services ──────────────────────────────────────────────
export {
  createStoryblokClient,
  getStoryManagement,
  saveStory,
  importByPrompterReplacement,
  importAtPosition,
} from "./storyblok.js";

// ─── OpenAI services ─────────────────────────────────────────────────
export { createOpenAiClient, generateStructuredContent } from "./openai.js";
