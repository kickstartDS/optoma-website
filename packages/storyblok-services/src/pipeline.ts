/**
 * High-level content generation pipeline.
 *
 * Orchestrates the full flow:
 *   User prompt → schema preparation → OpenAI generation →
 *   response post-processing → Storyblok flattening
 *
 * Consumers who want fine-grained control can call the individual
 * functions from `schema.ts`, `openai.ts`, and `transform.ts` directly.
 */
import type { OpenAI } from "openai";
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

// ─── Constants ────────────────────────────────────────────────────────

/**
 * Instructions for generating placeholder images via placehold.co.
 *
 * When no real image URLs are available (e.g. during AI content generation),
 * these instructions tell the model to produce descriptive placeholder URLs
 * so that generated pages always render visible images instead of blank areas.
 *
 * Used by: MCP server (generate_section, generate_content), n8n node (generateSection).
 */
export const PLACEHOLDER_IMAGE_INSTRUCTIONS = `
For every image field in the generated content, you MUST provide a placeholder URL using placehold.co:
- Format: https://placehold.co/1200x600?text=Dynamic+Web+Evolution
  where after the domain you specify dimensions (width x height) and a "text" query parameter
- The text should be a short, descriptive phrase for a fitting image (it doubles as alt text)
- Use "+" for spaces in the text parameter
- If the image field is called "backgroundImage" or is inside a Hero component's "image" field,
  add "transparent/999999" after the dimensions:
  e.g. https://placehold.co/1200x600/transparent/999999?text=Dynamic+Web+Evolution
- Never append any other parameters or path segments beyond what is described here
- Always fill image fields — never leave them empty or omit them
`.trim();

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
}

/** Result of the end-to-end pipeline. */
export interface GenerateAndPrepareResult extends TransformedContent {
  /** The raw JSON returned by OpenAI (before any processing). */
  rawResponse: Record<string, any>;
  /** The prepared schema that was sent to OpenAI. */
  preparedSchema: PreparedSchema;
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
  } = options;

  // 1. Prepare schema
  const preparedSchema = prepareSchemaForOpenAi(pageSchema, schemaOptions);

  // 1b. Pre-flight: abort if schema exceeds OpenAI structured-output limits
  const { warnings, enumValueCount, totalProperties } =
    preparedSchema.validation;
  if (warnings.length > 0) {
    const limitErrors = warnings.filter((w) =>
      w.includes("exceeds OpenAI limit")
    );
    if (limitErrors.length > 0) {
      throw new Error(
        `Schema exceeds OpenAI structured-output limits and would be rejected:\n` +
          limitErrors.join("\n") +
          `\n(totalProperties=${totalProperties}, enumValueCount=${enumValueCount})` +
          `\nConsider reducing the number of allowed components or using ` +
          `componentType to generate a single component at a time.`
      );
    }
  }

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

  return {
    rawResponse,
    preparedSchema,
    designSystemProps,
    storyblokContent,
  };
}
