/**
 * Storyblok Management API client for token theme CRUD operations.
 *
 * Stores token themes as Storyblok stories under settings/themes/ folder.
 * Each theme is a story using the "token-theme" content type with fields:
 * - name: Display name
 * - tokens: JSON string of branding token values
 * - css: Compiled CSS custom properties
 */

const STORYBLOK_API_BASE = "https://mapi.storyblok.com/v1";

interface StoryblokStory {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content: {
    component: string;
    name?: string;
    tokens?: string;
    css?: string;
    [key: string]: unknown;
  };
}

interface StoryblokListResponse {
  stories: StoryblokStory[];
}

interface StoryblokSingleResponse {
  story: StoryblokStory;
}

export interface StoryblokConfig {
  oauthToken: string;
  spaceId: string;
}

function headers(config: StoryblokConfig): Record<string, string> {
  return {
    Authorization: config.oauthToken,
    "Content-Type": "application/json",
  };
}

/**
 * Ensure the settings/themes/ folder exists, creating it if necessary.
 * Returns the folder's story ID.
 */
async function ensureThemesFolder(config: StoryblokConfig): Promise<number> {
  const url = `${STORYBLOK_API_BASE}/spaces/${config.spaceId}/stories?starts_with=settings/themes&is_folder=true`;
  const res = await fetch(url, { headers: headers(config) });

  if (!res.ok) {
    throw new Error(`Failed to check themes folder: ${res.status}`);
  }

  const data = (await res.json()) as StoryblokListResponse;
  const themesFolder = data.stories.find(
    (s) => s.slug === "themes" || s.full_slug === "settings/themes"
  );

  if (themesFolder) {
    return themesFolder.id;
  }

  // Find settings folder first
  const settingsRes = await fetch(
    `${STORYBLOK_API_BASE}/spaces/${config.spaceId}/stories?slug=settings&is_folder=true`,
    { headers: headers(config) }
  );

  if (!settingsRes.ok) {
    throw new Error(`Failed to check settings folder: ${settingsRes.status}`);
  }

  const settingsData = (await settingsRes.json()) as StoryblokListResponse;
  const settingsFolder = settingsData.stories.find(
    (s) => s.slug === "settings"
  );

  if (!settingsFolder) {
    throw new Error(
      "Settings folder not found in Storyblok. Please create it first."
    );
  }

  // Create themes folder under settings
  const createRes = await fetch(
    `${STORYBLOK_API_BASE}/spaces/${config.spaceId}/stories`,
    {
      method: "POST",
      headers: headers(config),
      body: JSON.stringify({
        story: {
          name: "Themes",
          slug: "themes",
          parent_id: settingsFolder.id,
          is_folder: true,
        },
      }),
    }
  );

  if (!createRes.ok) {
    throw new Error(`Failed to create themes folder: ${createRes.status}`);
  }

  const created = (await createRes.json()) as StoryblokSingleResponse;
  return created.story.id;
}

/** List all token theme names. */
export async function listThemes(config: StoryblokConfig): Promise<string[]> {
  const url = `${STORYBLOK_API_BASE}/spaces/${config.spaceId}/stories?starts_with=settings/themes/&content_type=token-theme&per_page=100`;
  const res = await fetch(url, { headers: headers(config) });

  if (!res.ok) {
    throw new Error(`Failed to list themes: ${res.status}`);
  }

  const data = (await res.json()) as StoryblokListResponse;
  return data.stories.map((s) => s.slug);
}

/** Get a single token theme by slug. Returns the tokens JSON string or null. */
export async function getTheme(
  config: StoryblokConfig,
  slug: string
): Promise<string | null> {
  const url = `${STORYBLOK_API_BASE}/spaces/${
    config.spaceId
  }/stories?starts_with=settings/themes/${encodeURIComponent(
    slug
  )}&content_type=token-theme`;
  const res = await fetch(url, { headers: headers(config) });

  if (!res.ok) {
    throw new Error(`Failed to fetch theme: ${res.status}`);
  }

  const data = (await res.json()) as StoryblokListResponse;
  const story = data.stories.find((s) => s.slug === slug);

  if (!story) return null;

  // Return the tokens field content as parsed JSON (it's stored as a JSON string)
  return story.content.tokens || null;
}

/** Create a new token theme. Returns true if created, false if already exists. */
export async function createTheme(
  config: StoryblokConfig,
  slug: string,
  tokens: string,
  css: string
): Promise<boolean> {
  // Check if it already exists
  const existing = await getTheme(config, slug);
  if (existing !== null) return false;

  const folderId = await ensureThemesFolder(config);

  const res = await fetch(
    `${STORYBLOK_API_BASE}/spaces/${config.spaceId}/stories`,
    {
      method: "POST",
      headers: headers(config),
      body: JSON.stringify({
        story: {
          name: slug,
          slug,
          parent_id: folderId,
          content: {
            component: "token-theme",
            name: slug,
            tokens,
            css,
          },
        },
        publish: 1,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create theme: ${res.status} — ${body}`);
  }

  return true;
}

/** Update an existing token theme. Returns true if updated, false if not found. */
export async function updateTheme(
  config: StoryblokConfig,
  slug: string,
  tokens: string,
  css: string
): Promise<boolean> {
  // Find the story by slug
  const url = `${STORYBLOK_API_BASE}/spaces/${
    config.spaceId
  }/stories?starts_with=settings/themes/${encodeURIComponent(
    slug
  )}&content_type=token-theme`;
  const res = await fetch(url, { headers: headers(config) });

  if (!res.ok) {
    throw new Error(`Failed to fetch theme for update: ${res.status}`);
  }

  const data = (await res.json()) as StoryblokListResponse;
  const story = data.stories.find((s) => s.slug === slug);

  if (!story) return false;

  const updateRes = await fetch(
    `${STORYBLOK_API_BASE}/spaces/${config.spaceId}/stories/${story.id}`,
    {
      method: "PUT",
      headers: headers(config),
      body: JSON.stringify({
        story: {
          content: {
            component: "token-theme",
            name: slug,
            tokens,
            css,
          },
        },
        publish: 1,
      }),
    }
  );

  if (!updateRes.ok) {
    const body = await updateRes.text();
    throw new Error(`Failed to update theme: ${updateRes.status} — ${body}`);
  }

  return true;
}

/** Delete a token theme by slug. */
export async function deleteTheme(
  config: StoryblokConfig,
  slug: string
): Promise<boolean> {
  // Find the story by slug
  const url = `${STORYBLOK_API_BASE}/spaces/${
    config.spaceId
  }/stories?starts_with=settings/themes/${encodeURIComponent(
    slug
  )}&content_type=token-theme`;
  const res = await fetch(url, { headers: headers(config) });

  if (!res.ok) {
    throw new Error(`Failed to fetch theme for deletion: ${res.status}`);
  }

  const data = (await res.json()) as StoryblokListResponse;
  const story = data.stories.find((s) => s.slug === slug);

  if (!story) return false;

  const deleteRes = await fetch(
    `${STORYBLOK_API_BASE}/spaces/${config.spaceId}/stories/${story.id}`,
    {
      method: "DELETE",
      headers: headers(config),
    }
  );

  if (!deleteRes.ok) {
    throw new Error(`Failed to delete theme: ${deleteRes.status}`);
  }

  return true;
}
