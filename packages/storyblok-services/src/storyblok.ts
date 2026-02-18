/**
 * Storyblok API service functions.
 *
 * Pure functions that accept a StoryblokClient and return results.
 * No framework-specific code — usable from API routes, MCP servers, or n8n nodes.
 */
import StoryblokClient from "storyblok-js-client";
import type {
  StoryblokCredentials,
  ImportByPrompterOptions,
  ImportAtPositionOptions,
} from "./types.js";
import { StoryblokApiError, PrompterNotFoundError } from "./types.js";
import { uploadAndReplaceAssets, wrapAssetUrls } from "./assets.js";

// ─── Client factory ───────────────────────────────────────────────────

/**
 * Create a Storyblok Management API client.
 */
export function createStoryblokClient(
  credentials: StoryblokCredentials
): StoryblokClient {
  return new StoryblokClient({
    oauthToken: credentials.oauthToken,
    rateLimit: 1,
  });
}

// ─── Story operations ─────────────────────────────────────────────────

/**
 * Fetch a story via the Management API (includes drafts).
 */
export async function getStoryManagement(
  client: StoryblokClient,
  spaceId: string,
  storyId: string
): Promise<Record<string, any>> {
  try {
    const response = await client.get(`spaces/${spaceId}/stories/${storyId}`);
    return (response as any).data.story;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new StoryblokApiError(`Failed to fetch story ${storyId}: ${message}`);
  }
}

/**
 * Save (update) a story via the Management API.
 *
 * @param publish - If true the story is published; otherwise saved as draft.
 */
export async function saveStory(
  client: StoryblokClient,
  spaceId: string,
  storyId: string,
  story: Record<string, any>,
  publish: boolean = false
): Promise<Record<string, any>> {
  try {
    const response = await client.put(`spaces/${spaceId}/stories/${storyId}`, {
      story: story as any,
      publish: publish ? 1 : 0,
    });
    return (response as any).data.story;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new StoryblokApiError(`Failed to save story ${storyId}: ${message}`);
  }
}

// ─── Content import ───────────────────────────────────────────────────

/**
 * Import content into a Storyblok story by **replacing a prompter component**
 * with new section content.
 *
 * @returns The updated story object.
 * @throws {PrompterNotFoundError} when the prompter UID is not in the story.
 * @throws {StoryblokApiError} when the story has no section array.
 */
export async function importByPrompterReplacement(
  client: StoryblokClient,
  spaceId: string,
  options: ImportByPrompterOptions
): Promise<Record<string, any>> {
  const {
    storyUid,
    prompterUid,
    sections,
    publish = false,
    uploadAssets = false,
    assetFolderName,
  } = options;

  // 1. Fetch the current story
  const story = await getStoryManagement(client, spaceId, storyUid);

  // 2. Locate the prompter component by UID
  const sectionArray: Record<string, unknown>[] | undefined =
    story.content?.section;

  if (!sectionArray || !Array.isArray(sectionArray)) {
    throw new StoryblokApiError(
      `Story ${storyUid} does not have a "section" array in its content.`
    );
  }

  const prompterIndex = sectionArray.findIndex(
    (s: Record<string, unknown>) => s._uid === prompterUid
  );

  if (prompterIndex === -1) {
    const availableUids = sectionArray.map((s) => `${s.component}:${s._uid}`);
    throw new PrompterNotFoundError(prompterUid, availableUids);
  }

  // 3. Upload external images to Storyblok (if requested)
  let assetsSummary;
  if (uploadAssets) {
    const wrapper = { section: sections } as Record<string, any>;
    assetsSummary = await uploadAndReplaceAssets(client, wrapper, {
      spaceId,
      assetFolderName: assetFolderName || "AI Generated",
    });
  }

  // 4. Wrap plain URL strings in asset fields into Storyblok asset objects
  for (const section of sections) {
    wrapAssetUrls(section as Record<string, any>);
  }

  // 5. Replace the prompter with the new sections
  sectionArray.splice(prompterIndex, 1, ...sections);

  // 6. Save the story
  const savedStory = await saveStory(client, spaceId, storyUid, story, publish);

  return assetsSummary ? { ...savedStory, assetsSummary } : savedStory;
}

/**
 * Import content into a Storyblok story by **inserting at a specific position**
 * without removing existing content.
 *
 * @param options.position - `0` = beginning, `-1` = end, or a specific index (clamped to bounds).
 * @returns The updated story object.
 */
export async function importAtPosition(
  client: StoryblokClient,
  spaceId: string,
  options: ImportAtPositionOptions
): Promise<Record<string, any>> {
  const {
    storyUid,
    position,
    sections,
    publish = false,
    uploadAssets = false,
    assetFolderName,
  } = options;

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

  // 3. Upload external images to Storyblok (if requested)
  let assetsSummary;
  if (uploadAssets) {
    const wrapper = { section: sections } as Record<string, any>;
    assetsSummary = await uploadAndReplaceAssets(client, wrapper, {
      spaceId,
      assetFolderName: assetFolderName || "AI Generated",
    });
  }

  // 4. Wrap plain URL strings in asset fields into Storyblok asset objects
  for (const section of sections) {
    wrapAssetUrls(section as Record<string, any>);
  }

  // 5. Clamp position to valid range
  const insertAt =
    position < 0
      ? Math.max(0, sectionArray.length + 1 + position) // -1 → end
      : Math.min(position, sectionArray.length); // cap at length

  // 6. Insert sections (no deletion)
  sectionArray.splice(insertAt, 0, ...sections);

  // 7. Save the story
  const savedStory = await saveStory(client, spaceId, storyUid, story, publish);

  return assetsSummary ? { ...savedStory, assetsSummary } : savedStory;
}
