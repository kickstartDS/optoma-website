import { IExecuteFunctions, NodeApiError } from "n8n-workflow";
import StoryblokClient from "storyblok-js-client";
import { OpenAI } from "openai";

// ─── Storyblok helpers ────────────────────────────────────────────────

export interface StoryblokCredentials {
  spaceId: string;
  apiToken: string;
  oauthToken: string;
}

/**
 * Build a Storyblok Management API client from n8n credentials.
 */
export function getStoryblokManagementClient(
  credentials: StoryblokCredentials
): StoryblokClient {
  return new StoryblokClient({ oauthToken: credentials.oauthToken });
}

/**
 * Fetch a story via the Management API (includes drafts).
 */
export async function getStoryManagement(
  client: StoryblokClient,
  spaceId: string,
  storyId: string
): Promise<Record<string, any>> {
  const response = await client.get(`spaces/${spaceId}/stories/${storyId}`);
  return (response as any).data.story;
}

/**
 * Import content into a Storyblok story by replacing a prompter component
 * with new section content.
 *
 * Mirrors the logic in mcp-server/src/services.ts → StoryblokService.importContent
 */
export async function importContentIntoStory(
  client: StoryblokClient,
  spaceId: string,
  storyUid: string,
  prompterUid: string,
  sections: Record<string, unknown>[],
  publish: boolean
): Promise<Record<string, any>> {
  // 1. Fetch the current story
  const story = await getStoryManagement(client, spaceId, storyUid);

  // 2. Locate the prompter component by UID
  const sectionArray: Record<string, unknown>[] | undefined =
    story.content?.section;

  if (!sectionArray || !Array.isArray(sectionArray)) {
    throw new Error(
      `Story ${storyUid} does not have a "section" array in its content.`
    );
  }

  const prompterIndex = sectionArray.findIndex(
    (s: Record<string, unknown>) => s._uid === prompterUid
  );

  if (prompterIndex === -1) {
    const availableUids = sectionArray
      .map((s) => `${s.component}:${s._uid}`)
      .join(", ");
    throw new Error(
      `Prompter component with UID "${prompterUid}" not found in story. ` +
        `Available section UIDs: ${availableUids}`
    );
  }

  // 3. Replace the prompter with the new sections
  sectionArray.splice(prompterIndex, 1, ...sections);

  // 4. Save the story
  const response = await client.put(`spaces/${spaceId}/stories/${storyUid}`, {
    story: story as any,
    publish: publish ? 1 : 0,
  });

  return (response as any).data.story;
}

/**
 * Insert content into a Storyblok story at a specific position
 * (without requiring a prompter component).
 *
 * @param position - 0-based index where sections are inserted.
 *   Use -1 or "end" semantics to append at the end.
 */
export async function insertContentAtPosition(
  client: StoryblokClient,
  spaceId: string,
  storyUid: string,
  position: number,
  sections: Record<string, unknown>[],
  publish: boolean
): Promise<Record<string, any>> {
  // 1. Fetch the current story
  const story = await getStoryManagement(client, spaceId, storyUid);

  // 2. Ensure section array exists
  if (!story.content) {
    story.content = { component: "page" };
  }
  if (!Array.isArray(story.content.section)) {
    story.content.section = [];
  }

  const sectionArray: Record<string, unknown>[] = story.content.section;

  // 3. Clamp position to valid range
  const insertAt =
    position < 0
      ? Math.max(0, sectionArray.length + 1 + position) // -1 → end
      : Math.min(position, sectionArray.length); // cap at length

  // 4. Insert sections (no deletion)
  sectionArray.splice(insertAt, 0, ...sections);

  // 5. Save the story
  const response = await client.put(`spaces/${spaceId}/stories/${storyUid}`, {
    story: story as any,
    publish: publish ? 1 : 0,
  });

  return (response as any).data.story;
}

// ─── OpenAI helpers ───────────────────────────────────────────────────

export interface OpenAiCredentials {
  apiKey: string;
}

/**
 * Build an OpenAI client from n8n credentials.
 */
export function getOpenAiClient(credentials: OpenAiCredentials): OpenAI {
  return new OpenAI({ apiKey: credentials.apiKey });
}

/**
 * Generate structured content via OpenAI with JSON‑schema response_format.
 *
 * Mirrors mcp-server/src/services.ts → ContentGenerationService.generateContent
 */
export async function generateStructuredContent(
  client: OpenAI,
  options: {
    system: string;
    prompt: string;
    schema: {
      name: string;
      strict?: boolean;
      schema: Record<string, unknown>;
    };
    model: string;
  }
): Promise<Record<string, unknown>> {
  const result = await client.chat.completions.create({
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: options.schema,
    },
    model: options.model,
  });

  const content = result.choices[0]?.message?.content;

  if (!content) {
    throw new Error(
      "OpenAI returned an empty response – no content generated."
    );
  }

  return JSON.parse(content);
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
