/**
 * High-level content generation pipeline.
 *
 * Orchestrates the full flow:
 *   User prompt → schema preparation → OpenAI generation →
 *   response post-processing → Storyblok flattening →
 *   (optional) asset upload to Storyblok
 *
 * Consumers who want fine-grained control can call the individual
 * functions from `schema.ts`, `openai.ts`, `transform.ts`, and
 * `assets.ts` directly.
 */
import type { OpenAI } from "openai";
import type StoryblokClient from "storyblok-js-client";
import { generateStructuredContent } from "./openai.js";
import {
  prepareSchemaForOpenAi,
  type PrepareSchemaOptions,
  type PreparedSchema,
} from "./schema.js";
import {
  processOpenAiResponse,
  processForStoryblok,
  type TransformedContent,
} from "./transform.js";
import {
  uploadAndReplaceAssets,
  type UploadAssetsOptions,
  type UploadAssetsSummary,
} from "./assets.js";

// ─── Types ────────────────────────────────────────────────────────────

/** Options for the end-to-end generation pipeline. */
export interface GenerateAndPrepareOptions {
  /** System prompt guiding the AI persona. */
  system: string;
  /** User prompt describing what to generate. */
  prompt: string;
  /** The fully dereferenced page JSON Schema. */
  pageSchema: Record<string, any>;
  /** Schema preparation options (section count, component filter, etc.). */
  schemaOptions?: PrepareSchemaOptions;
  /** OpenAI model identifier. @default "gpt-4o-2024-08-06" */
  model?: string;
  /**
   * Optional function to derive default prop values from a JSON Schema.
   * When provided, defaults are merged into the AI response.
   * Signature matches `defaultObjectForSchema` from `@kickstartds/cambria`.
   */
  defaultObjectForSchema?: (schema: object) => Record<string, any>;
  /**
   * Optional deep-merge function.
   * When provided, used for merging defaults into generated content.
   */
  deepMerge?: (a: any, b: any) => any;
  /**
   * When provided, images in the generated content are downloaded from
   * their source URLs and uploaded to Storyblok as native assets.
   * The original URLs are replaced with Storyblok CDN URLs.
   *
   * Requires a Storyblok Management API client and the `spaceId`.
   * Additional options (folder, rate-limit, custom URL detection) can
   * be specified via `uploadAssets`.
   */
  uploadAssets?: {
    /** Storyblok Management API client (must have write access). */
    storyblokClient: StoryblokClient;
  } & UploadAssetsOptions;
}

/** Result of the end-to-end pipeline. */
export interface GenerateAndPrepareResult extends TransformedContent {
  /** The raw JSON returned by OpenAI (before any processing). */
  rawResponse: Record<string, any>;
  /** The prepared schema that was sent to OpenAI. */
  preparedSchema: PreparedSchema;
  /**
   * Summary of assets uploaded to Storyblok.
   * Only present when `uploadAssets` was enabled.
   */
  assetsSummary?: UploadAssetsSummary;
}

// ─── Pipeline ─────────────────────────────────────────────────────────

/**
 * End-to-end content generation pipeline.
 *
 * 1. Prepares the page schema for OpenAI
 * 2. Calls OpenAI to generate content
 * 3. Post-processes the response back to DS shape
 * 4. Flattens for Storyblok import
 *
 * @returns Both Design System–shaped props and Storyblok-ready content.
 */
export async function generateAndPrepareContent(
  client: OpenAI,
  options: GenerateAndPrepareOptions
): Promise<GenerateAndPrepareResult> {
  const {
    system,
    prompt,
    pageSchema,
    schemaOptions,
    model,
    defaultObjectForSchema,
    deepMerge,
    uploadAssets,
  } = options;

  // 1. Prepare schema
  const preparedSchema = prepareSchemaForOpenAi(pageSchema, schemaOptions);

  // 2. Generate via OpenAI
  const rawResponse = await generateStructuredContent(client as any, {
    system,
    prompt,
    schema: preparedSchema.envelope,
    model,
  });

  // 3. Post-process response → DS props
  const designSystemProps = processOpenAiResponse(
    rawResponse,
    preparedSchema.schemaMap,
    defaultObjectForSchema,
    deepMerge
  );

  // 4. Flatten for Storyblok
  const storyblokContent = processForStoryblok(designSystemProps);

  // 5. (Optional) Upload images to Storyblok and rewrite URLs
  let assetsSummary: UploadAssetsSummary | undefined;
  if (uploadAssets) {
    const { storyblokClient, ...assetOptions } = uploadAssets;

    // Upload assets found in storyblokContent (the version that goes to the CMS)
    assetsSummary = await uploadAndReplaceAssets(
      storyblokClient,
      storyblokContent,
      assetOptions
    );

    // Also rewrite the same URLs in designSystemProps so both stay in sync
    if (assetsSummary.assets.length > 0) {
      const urlMapping = new Map(
        assetsSummary.assets.map((a) => [a.originalUrl, a.url])
      );
      rewriteUrls(designSystemProps, urlMapping);
    }
  }

  return {
    rawResponse,
    preparedSchema,
    designSystemProps,
    storyblokContent,
    assetsSummary,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────

import { traverse as objectTraverse } from "object-traversal";

/**
 * Rewrite string values in an object tree using a URL mapping.
 * Used to keep designSystemProps in sync after storyblokContent URLs are replaced.
 */
function rewriteUrls(
  obj: Record<string, any>,
  urlMapping: Map<string, string>
): void {
  objectTraverse(obj, ({ parent, key, value }) => {
    if (typeof value === "string" && parent && key && urlMapping.has(value)) {
      (parent as Record<string, any>)[key] = urlMapping.get(value)!;
    }
  });
}
