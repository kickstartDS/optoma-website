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
  ListStoriesOptions,
  CreateStoryOptions,
  CreatePageWithContentOptions,
  UpdateStoryOptions,
  ListAssetsOptions,
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

// ─── Schema preparation ──────────────────────────────────────────────
export {
  prepareSchemaForOpenAi,
  getComponentPresetSchema,
  listAvailableComponents,
  getSchemaName,
  UNSUPPORTED_KEYWORDS,
  DEFAULT_PROPERTIES_TO_DROP,
  SUPPORTED_COMPONENTS,
  SUB_COMPONENT_MAP,
} from "./schema.js";
export type {
  PrepareSchemaOptions,
  OpenAiSchemaEnvelope,
  SchemaValidation,
  PreparedSchema,
} from "./schema.js";

// ─── Content transformation ──────────────────────────────────────────
export {
  processOpenAiResponse,
  processForStoryblok,
  flattenNestedObjects,
  unflattenNestedObjects,
} from "./transform.js";
export type { TransformedContent } from "./transform.js";

// ─── Asset management ────────────────────────────────────────────────
export {
  uploadAndReplaceAssets,
  findImageUrls,
  defaultIsImageUrl,
  stripStoryblokImageService,
  createAssetObject,
  wrapAssetUrls,
} from "./assets.js";
export type {
  UploadAssetsOptions,
  UploadAssetsSummary,
  UploadedAsset,
} from "./assets.js";

// ─── Pipeline (high-level orchestrator) ──────────────────────────────
export {
  generateAndPrepareContent,
  PLACEHOLDER_IMAGE_INSTRUCTIONS,
} from "./pipeline.js";
export type {
  GenerateAndPrepareOptions,
  GenerateAndPrepareResult,
} from "./pipeline.js";

// ─── Schema validation ──────────────────────────────────────────────
export {
  buildValidationRules,
  validateContent,
  validateSections,
  validatePageContent,
  formatValidationErrors,
  checkCompositionalQuality,
} from "./validate.js";
export type {
  ValidationRules,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidateContentOptions,
  ContainerSlot,
} from "./validate.js";

// ─── Schema Registry ────────────────────────────────────────────────
export {
  SchemaRegistry,
  createRegistryFromDirectory,
  createRegistryFromSchemaDir,
  ROOT_CONTENT_TYPES,
} from "./registry.js";
export type { ContentTypeEntry, RootContentType } from "./registry.js";

// ─── Story CRUD & search ────────────────────────────────────────────
export {
  createContentClient,
  listStories,
  searchStories,
  findBySlug,
  createStory,
  createPageWithContent,
  updateStory,
  deleteStory,
  ensurePath,
  ensureUids,
} from "./stories.js";

// ─── Component & asset introspection ────────────────────────────────
export { listComponents, getComponent, listAssets } from "./components.js";

// ─── URL scraping ───────────────────────────────────────────────────
export { scrapeUrl, pickBestFromSrcset } from "./scrape.js";
export type {
  ScrapedImage,
  ScrapeUrlOptions,
  ScrapeUrlResult,
} from "./scrape.js";

// ─── Content pattern analysis ───────────────────────────────────────
export { analyzeContentPatterns } from "./patterns.js";
export type {
  ContentPatternAnalysis,
  SubComponentStats,
  AnalyzeContentPatternsOptions,
} from "./patterns.js";
