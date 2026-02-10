/**
 * Asset management utilities for Storyblok.
 *
 * Handles the full lifecycle of transferring external images into Storyblok:
 *
 * 1. **Discovery** — Traverse a JSON structure and collect all image URLs.
 * 2. **Download** — Fetch the image bytes from each external URL.
 * 3. **Upload** — Use Storyblok's signed upload flow to register and store assets.
 * 4. **Rewrite** — Replace original URLs in the content with Storyblok CDN URLs.
 *
 * Rate-limited to avoid hitting Storyblok API limits.
 */
import StoryblokClient from "storyblok-js-client";
import { traverse as objectTraverse } from "object-traversal";
import { StoryblokApiError } from "./types.js";

// ─── Types ────────────────────────────────────────────────────────────

/** A discovered image URL with a reference back to its location in the content tree. */
interface ImageReference {
  /** The parent object containing the image URL property. */
  parent: Record<string, any>;
  /** The property key on the parent that holds the URL. */
  key: string;
  /** The original image URL value. */
  url: string;
}

/** Result of uploading a single asset to Storyblok. */
export interface UploadedAsset {
  /** The Storyblok asset ID. */
  id: number;
  /** The Storyblok CDN URL for the uploaded asset. */
  url: string;
  /** The original source URL that was replaced. */
  originalUrl: string;
}

/** Options for the asset upload process. */
export interface UploadAssetsOptions {
  /** Storyblok space ID. */
  spaceId: string;
  /**
   * Optional asset folder ID to upload into.
   * When not provided, assets are uploaded to the root folder.
   */
  assetFolderId?: number;
  /**
   * Optional asset folder name to create or reuse.
   * When provided (and `assetFolderId` is not), a folder with this name
   * is created (or the first existing match is reused).
   */
  assetFolderName?: string;
  /**
   * Maximum number of upload requests per second.
   * @default 2
   */
  requestsPerSecond?: number;
  /**
   * Custom predicate to determine whether a string value is an image URL
   * that should be downloaded and uploaded to Storyblok.
   *
   * The default heuristic matches URLs starting with `http://` or `https://`
   * whose pathname ends with a common image extension, or URLs from known
   * AI image generators (e.g. DALL·E on `oaidalleapiprodscus.blob.core.windows.net`).
   */
  isImageUrl?: (value: string) => boolean;
}

/** Summary returned after processing all assets in a content tree. */
export interface UploadAssetsSummary {
  /** Number of unique images uploaded. */
  uploaded: number;
  /** Number of URL references rewritten (may exceed `uploaded` for duplicates). */
  rewritten: number;
  /** Details of each uploaded asset. */
  assets: UploadedAsset[];
  /** Asset folder ID used (if any). */
  assetFolderId?: number;
}

// ─── Default image URL detection ──────────────────────────────────────

/** File extensions recognized as images. */
const IMAGE_EXTENSIONS =
  /\.(jpe?g|png|gif|webp|avif|svg|bmp|tiff?|ico|heic|heif)(\?.*)?$/i;

/** Hosts known to serve AI-generated images without file extensions. */
const AI_IMAGE_HOSTS = [
  "oaidalleapiprodscus.blob.core.windows.net",
  "dalleprodsec.blob.core.windows.net",
];

/**
 * Default heuristic for detecting image URLs in content.
 *
 * Matches:
 * - Any `http(s)://` URL whose path ends with a known image extension.
 * - Any URL hosted on a known AI image generation domain.
 */
export function defaultIsImageUrl(value: string): boolean {
  if (typeof value !== "string") return false;
  if (!value.startsWith("http://") && !value.startsWith("https://"))
    return false;

  // Check for file extension
  try {
    const url = new URL(value);
    if (IMAGE_EXTENSIONS.test(url.pathname)) return true;

    // Check for AI image hosts (DALL·E etc.)
    if (AI_IMAGE_HOSTS.some((host) => url.hostname.includes(host))) return true;
  } catch {
    // Malformed URL — skip
    return false;
  }

  return false;
}

// ─── Image discovery ──────────────────────────────────────────────────

/**
 * Traverse a JSON structure and collect all values that look like image URLs.
 *
 * @param content - The object tree to scan.
 * @param isImageUrl - Predicate to identify image URLs. Defaults to {@link defaultIsImageUrl}.
 * @returns An array of references that can be used to rewrite URLs in place.
 */
export function findImageUrls(
  content: Record<string, any>,
  isImageUrl: (value: string) => boolean = defaultIsImageUrl
): ImageReference[] {
  const references: ImageReference[] = [];

  objectTraverse(content, ({ parent, key, value }) => {
    if (typeof value === "string" && parent && key && isImageUrl(value)) {
      references.push({
        parent: parent as Record<string, any>,
        key,
        url: value,
      });
    }
  });

  return references;
}

// ─── Throttle utility ─────────────────────────────────────────────────

/**
 * Minimal promise throttle that limits concurrency to `n` requests per second.
 */
function createThrottle(requestsPerSecond: number) {
  const interval = 1000 / requestsPerSecond;
  let lastCall = 0;

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const wait = Math.max(0, lastCall + interval - now);
    lastCall = now + wait;
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    return fn();
  };
}

// ─── Download ─────────────────────────────────────────────────────────

/**
 * Download an image from a URL and return it as a `Buffer` together with
 * the inferred filename and content type.
 */
async function downloadImage(
  url: string
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new StoryblokApiError(
      `Failed to download image from ${url}: ${response.status} ${response.statusText}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Derive a filename from the URL
  let filename: string;
  try {
    const parsed = new URL(url);
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || "image";

    // If the last segment has no extension, synthesize one from content-type
    if (!/\.\w+$/.test(lastSegment)) {
      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("gif")
        ? "gif"
        : contentType.includes("webp")
        ? "webp"
        : contentType.includes("svg")
        ? "svg"
        : "jpg";
      filename = `${lastSegment}.${ext}`;
    } else {
      filename = lastSegment;
    }
  } catch {
    filename = "image.jpg";
  }

  return { buffer, filename, contentType };
}

// ─── Storyblok signed upload ──────────────────────────────────────────

/**
 * Upload a buffer to Storyblok using the signed upload flow:
 *
 * 1. `POST /spaces/:id/assets/` — register the asset and get a signed S3 URL.
 * 2. `POST` the file as multipart form data to the signed URL.
 *
 * @returns The asset ID and its public Storyblok CDN URL.
 */
async function uploadToStoryblok(
  client: StoryblokClient,
  spaceId: string,
  file: { buffer: Buffer; filename: string; contentType: string },
  assetFolderId?: number
): Promise<{ id: number; url: string }> {
  // 1. Register the asset
  const registerPayload: Record<string, any> = {
    filename: file.filename,
    size: `0x0`, // Storyblok allows 0x0 for non-image or unknown dimensions
  };
  if (assetFolderId) {
    registerPayload.asset_folder_id = assetFolderId;
  }

  const registerResponse = await client.post(
    `spaces/${spaceId}/assets/`,
    registerPayload
  );

  const signedData = (registerResponse as any).data;

  // 2. Upload to the signed S3 URL
  const formData = new FormData();
  for (const [key, value] of Object.entries(signedData.fields)) {
    formData.append(key, value as string);
  }
  formData.append(
    "file",
    new Blob([file.buffer], { type: file.contentType }),
    file.filename
  );

  const uploadResponse = await fetch(signedData.post_url, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new StoryblokApiError(
      `Failed to upload asset "${file.filename}" to Storyblok S3: ` +
        `${uploadResponse.status} ${uploadResponse.statusText}`
    );
  }

  return {
    id: signedData.id,
    url: signedData.pretty_url,
  };
}

// ─── Asset folder management ──────────────────────────────────────────

/**
 * Find or create an asset folder by name.
 */
async function resolveAssetFolder(
  client: StoryblokClient,
  spaceId: string,
  folderName: string
): Promise<number> {
  // Try to find existing folder
  const foldersResponse = await client.get(`spaces/${spaceId}/asset_folders/`);
  const folders = (foldersResponse as any).data?.asset_folders || [];
  const existing = folders.find((f: { name: string }) => f.name === folderName);

  if (existing) {
    return existing.id;
  }

  // Create new folder
  const createResponse = await client.post(`spaces/${spaceId}/asset_folders/`, {
    asset_folder: { name: folderName },
  } as any);

  return (createResponse as any).data.asset_folder.id;
}

// ─── Main entry point ─────────────────────────────────────────────────

/**
 * Find all image URLs in a content tree, download them, upload them to
 * Storyblok, and rewrite the URLs in the content to point to the
 * Storyblok CDN.
 *
 * **Mutates** the `content` object in place (URLs are replaced).
 *
 * Duplicate URLs are only downloaded and uploaded once; all references
 * to the same source URL are rewritten to the same Storyblok URL.
 *
 * @param client - Storyblok Management API client.
 * @param content - The content tree to process (mutated in place).
 * @param options - Upload configuration.
 * @returns Summary of uploaded and rewritten assets.
 */
export async function uploadAndReplaceAssets(
  client: StoryblokClient,
  content: Record<string, any>,
  options: UploadAssetsOptions
): Promise<UploadAssetsSummary> {
  const {
    spaceId,
    assetFolderName,
    requestsPerSecond = 2,
    isImageUrl,
  } = options;
  let { assetFolderId } = options;

  // Resolve asset folder if a name was given but no ID
  if (!assetFolderId && assetFolderName) {
    assetFolderId = await resolveAssetFolder(client, spaceId, assetFolderName);
  }

  // 1. Discover image URLs
  const references = findImageUrls(content, isImageUrl);

  if (references.length === 0) {
    return { uploaded: 0, rewritten: 0, assets: [], assetFolderId };
  }

  // 2. Deduplicate by URL
  const uniqueUrls = [...new Set(references.map((r) => r.url))];

  // 3. Download + upload each unique URL (rate-limited)
  const throttle = createThrottle(requestsPerSecond);
  const urlMap = new Map<string, UploadedAsset>();

  for (const url of uniqueUrls) {
    const asset = await throttle(async () => {
      const file = await downloadImage(url);
      const uploaded = await uploadToStoryblok(
        client,
        spaceId,
        file,
        assetFolderId
      );
      return {
        id: uploaded.id,
        url: uploaded.url,
        originalUrl: url,
      };
    });
    urlMap.set(url, asset);
  }

  // 4. Rewrite all references
  let rewritten = 0;
  for (const ref of references) {
    const asset = urlMap.get(ref.url);
    if (asset) {
      ref.parent[ref.key] = asset.url;
      rewritten++;
    }
  }

  return {
    uploaded: urlMap.size,
    rewritten,
    assets: [...urlMap.values()],
    assetFolderId,
  };
}
