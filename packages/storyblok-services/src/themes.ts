/**
 * Theme CRUD and management functions for Storyblok.
 *
 * Manages `token-theme` content type stories stored under `settings/themes/`.
 * Each theme story has:
 * - `name`: Display name
 * - `tokens`: JSON string of branding token values
 * - `css`: Compiled CSS custom properties
 *
 * Pure functions that accept a StoryblokClient (Management or Content Delivery)
 * and return results. No framework-specific code — usable from API routes,
 * MCP servers, or n8n nodes.
 */
import StoryblokClient from "storyblok-js-client";
import { StoryblokApiError } from "./types.js";
import { getStoryManagement, saveStory } from "./storyblok.js";

// ─── Types ────────────────────────────────────────────────────────────

/** Summary of a theme for list operations. */
export interface ThemeSummary {
  /** Story ID. */
  id: number;
  /** Story UUID. */
  uuid: string;
  /** URL slug (unique within settings/themes/). */
  slug: string;
  /** Display name. */
  name: string;
  /** Full slug path (e.g. "settings/themes/dark"). */
  fullSlug: string;
}

/** Full theme data including branding tokens and compiled CSS. */
export interface ThemeDetail extends ThemeSummary {
  /** JSON string of branding token values. */
  tokens: string | null;
  /** Compiled CSS custom properties. */
  css: string | null;
}

/** Result of applying or removing a theme. */
export interface ApplyThemeResult {
  /** Whether the operation succeeded. */
  success: boolean;
  /** The affected story's numeric ID. */
  storyId: number;
  /** Previous theme UUID (null if none was set). */
  previousTheme: string | null;
  /** New theme UUID (null when removing). */
  newTheme: string | null;
}

// ─── List Themes ──────────────────────────────────────────────────────

/**
 * List all `token-theme` stories under `settings/themes/`.
 *
 * Uses the Content Delivery API for fast reads.
 */
export async function listThemes(
  client: StoryblokClient,
  _spaceId?: string
): Promise<ThemeSummary[]> {
  const response = await client.get("cdn/stories", {
    starts_with: "settings/themes/",
    content_type: "token-theme",
    per_page: 100,
  });

  const stories: Record<string, any>[] = response.data.stories || [];
  return stories.map((s) => ({
    id: s.id,
    uuid: s.uuid,
    slug: s.slug,
    name: s.content?.name || s.name,
    fullSlug: s.full_slug,
  }));
}

// ─── Get Theme ────────────────────────────────────────────────────────

/**
 * Fetch a single theme by slug or UUID.
 *
 * Uses the Content Delivery API. Returns null if not found.
 */
export async function getTheme(
  client: StoryblokClient,
  slugOrUuid: string
): Promise<ThemeDetail | null> {
  // Try UUID lookup first (UUIDs contain hyphens)
  const isUuid = slugOrUuid.includes("-");

  try {
    if (isUuid) {
      const response = await client.get(`cdn/stories/${slugOrUuid}`, {
        find_by: "uuid",
      } as Record<string, unknown>);
      const story = (response.data as any).story;
      if (!story) return null;
      return storyToThemeDetail(story);
    }

    // Slug lookup — search under settings/themes/
    const response = await client.get("cdn/stories", {
      starts_with: `settings/themes/${slugOrUuid}`,
      content_type: "token-theme",
      per_page: 1,
    });
    const stories: Record<string, any>[] = (response.data as any).stories || [];
    const story = stories.find((s) => s.slug === slugOrUuid);
    if (!story) return null;
    return storyToThemeDetail(story);
  } catch {
    return null;
  }
}

// ─── Apply Theme ──────────────────────────────────────────────────────

/**
 * Set the `theme` field (UUID) on a page or settings story.
 *
 * Uses the Management API for write operations.
 *
 * @param managementClient - Management API client (oauth token).
 * @param spaceId - Storyblok space ID.
 * @param storyId - Numeric ID (or string representation) of the target story.
 * @param themeUuid - UUID of the theme to apply, or `null` to clear.
 * @param publish - Whether to publish after applying.
 */
export async function applyTheme(
  managementClient: StoryblokClient,
  spaceId: string,
  storyId: string,
  themeUuid: string | null,
  publish: boolean = false
): Promise<ApplyThemeResult> {
  // Fetch existing story to get current theme value
  const story = await getStoryManagement(managementClient, spaceId, storyId);
  const content = story.content as Record<string, unknown>;
  const previousTheme = (content.theme as string) || null;

  // Set the new theme
  content.theme = themeUuid || "";

  await saveStory(managementClient, spaceId, String(story.id), {
    content,
    publish,
  });

  return {
    success: true,
    storyId: story.id,
    previousTheme,
    newTheme: themeUuid,
  };
}

// ─── Remove Theme ─────────────────────────────────────────────────────

/**
 * Clear the `theme` field on a story (reset to default branding).
 *
 * Convenience wrapper around `applyTheme(…, null)`.
 */
export async function removeTheme(
  managementClient: StoryblokClient,
  spaceId: string,
  storyId: string,
  publish: boolean = false
): Promise<ApplyThemeResult> {
  return applyTheme(managementClient, spaceId, storyId, null, publish);
}

// ─── Preview Theme CSS ────────────────────────────────────────────────

/**
 * Resolve a theme UUID to its compiled CSS string.
 *
 * Useful for preview scenarios where the full CSS is needed
 * without fetching the complete theme detail.
 */
export async function previewThemeCSS(
  client: StoryblokClient,
  slugOrUuid: string
): Promise<string | null> {
  const theme = await getTheme(client, slugOrUuid);
  return theme?.css || null;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function storyToThemeDetail(story: Record<string, any>): ThemeDetail {
  return {
    id: story.id,
    uuid: story.uuid,
    slug: story.slug,
    name: story.content?.name || story.name,
    fullSlug: story.full_slug,
    tokens: story.content?.tokens || null,
    css: story.content?.css || null,
  };
}
