/**
 * Generic helper functions for the Storyblok kickstartDS n8n node.
 *
 * Core Storyblok and OpenAI logic is delegated to `@kickstartds/storyblok-services`.
 * This file re-exports the shared functions and adds n8n-specific concerns
 * (credential types, preset schema loading).
 */
import {
  createStoryblokClient,
  getStoryManagement,
  importByPrompterReplacement,
  importAtPosition,
  createOpenAiClient,
  generateStructuredContent,
  type StoryblokCredentials,
  type OpenAiCredentials,
} from "@kickstartds/storyblok-services";
import type StoryblokClient from "storyblok-js-client";

// ─── Re-exports from shared library ──────────────────────────────────
// These are re-exported so the node and tests can import from one place.

export {
  createStoryblokClient as getStoryblokManagementClient,
  getStoryManagement,
  generateStructuredContent,
  type StoryblokCredentials,
  type OpenAiCredentials,
};

export { createOpenAiClient as getOpenAiClient } from "@kickstartds/storyblok-services";

// ─── n8n-facing wrappers ─────────────────────────────────────────────
// These preserve the original function signatures used by the node.

/**
 * Import content by replacing a prompter component.
 * Delegates to `@kickstartds/storyblok-services`.
 */
export async function importContentIntoStory(
  client: StoryblokClient,
  spaceId: string,
  storyUid: string,
  prompterUid: string,
  sections: Record<string, unknown>[],
  publish: boolean
): Promise<Record<string, any>> {
  return importByPrompterReplacement(client, spaceId, {
    storyUid,
    prompterUid,
    sections,
    publish,
  });
}

/**
 * Insert content at a specific position (no prompter needed).
 * Delegates to `@kickstartds/storyblok-services`.
 */
export async function insertContentAtPosition(
  client: StoryblokClient,
  spaceId: string,
  storyUid: string,
  position: number,
  sections: Record<string, unknown>[],
  publish: boolean
): Promise<Record<string, any>> {
  return importAtPosition(client, spaceId, {
    storyUid,
    position,
    sections,
    publish,
  });
}

// ─── Preset schemas ───────────────────────────────────────────────────

import heroSchema from "./schemas/hero.schema.json";
import faqSchema from "./schemas/faq.schema.json";
import testimonialsSchema from "./schemas/testimonials.schema.json";
import featuresSchema from "./schemas/features.schema.json";
import ctaSchema from "./schemas/cta.schema.json";
import textSchema from "./schemas/text.schema.json";
import blogTeaserSchema from "./schemas/blog-teaser.schema.json";
import statsSchema from "./schemas/stats.schema.json";
import imageTextSchema from "./schemas/image-text.schema.json";

export const PRESET_SCHEMAS: Record<
  string,
  { name: string; schema: Record<string, unknown> }
> = {
  hero: { name: "hero_section", schema: heroSchema },
  faq: { name: "faq_section", schema: faqSchema },
  testimonials: { name: "testimonials_section", schema: testimonialsSchema },
  features: { name: "features_section", schema: featuresSchema },
  cta: { name: "cta_section", schema: ctaSchema },
  text: { name: "text_section", schema: textSchema },
  "blog-teaser": { name: "blog_teaser", schema: blogTeaserSchema },
  stats: { name: "stats_section", schema: statsSchema },
  "image-text": { name: "image_text_section", schema: imageTextSchema },
};
