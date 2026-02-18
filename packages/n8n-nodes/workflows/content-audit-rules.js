/**
 * n8n Code Node: Content Audit Rules
 *
 * Input:  $input.all() — expects items with the following shape:
 *   - Each item has a `json.story` (full story from MCP `get_story`)
 *   - One item has `json.assets` (full asset list from MCP `list_assets`, paginated & merged)
 *
 * The workflow preceding this node should:
 *   1. Call `list_stories` (paginated) to get all story stubs
 *   2. Loop over each story and call `get_story` to get full content
 *   3. Merge all story results + one `list_assets` result into the input
 *
 * Output: A single item with `json.auditResults` containing all findings,
 *         summary statistics, and metadata needed by the Report Code Node.
 */

// ── Configuration ──────────────────────────────────────────────────────
const STALE_MONTHS = 6;
const MIN_TEXT_LENGTH = 50;
const MAX_META_TITLE_LENGTH = 60;
const MAX_META_DESCRIPTION_LENGTH = 160;
const MIN_META_TITLE_LENGTH = 10;
const MIN_META_DESCRIPTION_LENGTH = 50;
const EXTERNAL_URL_PATTERNS = [
  "placehold.co",
  "picsum.photos",
  "unsplash.com",
  "placeholder.com",
  "via.placeholder.com",
  "dummyimage.com",
  "lorempixel.com",
];

// ── Collect inputs ─────────────────────────────────────────────────────
const allItems = $input.all();

// Separate stories from assets
const stories = [];
let allAssets = [];

for (const item of allItems) {
  if (item.json.assets) {
    allAssets = allAssets.concat(item.json.assets);
  }
  if (item.json.story) {
    stories.push(item.json.story);
  }
}

const now = new Date();
const findings = [];
const assetUrlSet = new Set(allAssets.map((a) => a.filename).filter(Boolean));

// ── Helper: Extract filename from asset (handles both string and object) ─
function getAssetFilename(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.filename) return value.filename;
  return null;
}

// ── Helper: Check if an asset is a Storyblok-hosted asset ──────────────
function isStoryblokAsset(url) {
  if (!url) return false;
  return url.includes("storyblok.com") || url.startsWith("//a.storyblok.com");
}

// ── Helper: Check if URL is a placeholder/external image ───────────────
function isExternalPlaceholder(url) {
  if (!url) return false;
  return EXTERNAL_URL_PATTERNS.some((p) => url.includes(p));
}

// ── Helper: Check if a value is an empty/null asset object ─────────────
function isEmptyAsset(value) {
  if (!value) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "object") {
    if (value.fieldtype === "asset") {
      return !value.filename || value.filename.trim() === "";
    }
  }
  return false;
}

// ── Helper: Get alt text from various field patterns ───────────────────
function getAltText(node, imageKey) {
  // Pattern 1: separate _alt field (e.g. image_alt for image_src)
  const altKey = imageKey
    .replace(/_?src$/, "_alt")
    .replace(/^image$/, "image_alt");
  if (altKey !== imageKey && node[altKey] !== undefined) {
    return node[altKey];
  }
  // Pattern 2: alt text inside asset object
  if (typeof node[imageKey] === "object" && node[imageKey]?.alt !== undefined) {
    return node[imageKey].alt;
  }
  // Pattern 3: standalone "alt" field on the same node
  if (node.alt !== undefined && imageKey === "image") {
    return node.alt;
  }
  return undefined;
}

// ── Helper: Months between two dates ──────────────────────────────────
function monthsBetween(d1, d2) {
  return (
    (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
  );
}

// ── Helper: Count total text length in a component tree ────────────────
function countTextContent(node) {
  let total = 0;
  if (!node || typeof node !== "object") return total;
  for (const [key, value] of Object.entries(node)) {
    if (key === "text" && typeof value === "string") {
      total += value.replace(/[#*_~`>\-\[\]()]/g, "").trim().length;
    } else if (Array.isArray(value)) {
      value.forEach((v) => {
        total += countTextContent(v);
      });
    } else if (typeof value === "object" && value !== null) {
      total += countTextContent(value);
    }
  }
  return total;
}

// ── Recursive content tree walker ─────────────────────────────────────
function walkContent(node, path, storySlug, storyName) {
  if (!node || typeof node !== "object") return;

  const component = node.component;

  // ── IMAGE RULES ─────────────────────────────────────────────────────

  // Known image field patterns in the component schemas
  const imageFields = [
    "image_src",
    "image_srcMobile",
    "image_srcTablet",
    "image_srcDesktop",
    "image",
    "image_src",
    "backgroundImage",
    "logo_src",
    "avatar_src",
    "cardImage",
    "src", // gallery images sub-component
  ];

  for (const field of imageFields) {
    if (node[field] !== undefined) {
      const filename = getAssetFilename(node[field]);

      // Rule: Empty image source (non-optional image fields)
      if (
        isEmptyAsset(node[field]) &&
        ["image_src", "image", "image_srcMobile"].includes(field)
      ) {
        // Only flag if the component typically requires an image
        if (
          [
            "hero",
            "image-text",
            "image-story",
            "gallery",
            "teaser-card",
          ].includes(component)
        ) {
          findings.push({
            rule: "empty-image",
            severity: "medium",
            category: "images",
            story: storySlug,
            storyName,
            path: `${path}.${field}`,
            component,
            message: `Empty image source on ${component}.${field}`,
          });
        }
      }

      // Rule: Missing alt text
      if (filename && !isEmptyAsset(node[field])) {
        const alt = getAltText(node, field);
        if (
          alt === undefined ||
          alt === null ||
          (typeof alt === "string" && alt.trim() === "")
        ) {
          findings.push({
            rule: "missing-alt-text",
            severity: "high",
            category: "images",
            story: storySlug,
            storyName,
            path: `${path}.${field}`,
            component,
            message: `Missing alt text for ${component}.${field}`,
            detail: filename?.substring(0, 80),
          });
        }
      }

      // Rule: External/placeholder image in production
      if (filename && isExternalPlaceholder(filename)) {
        findings.push({
          rule: "placeholder-image",
          severity: "high",
          category: "images",
          story: storySlug,
          storyName,
          path: `${path}.${field}`,
          component,
          message: `Placeholder/external image on ${component}.${field}`,
          detail: filename.substring(0, 80),
        });
      }

      // Rule: External non-Storyblok image (not placeholder but still external)
      if (
        filename &&
        !isStoryblokAsset(filename) &&
        !isExternalPlaceholder(filename) &&
        filename.startsWith("http")
      ) {
        findings.push({
          rule: "external-image",
          severity: "medium",
          category: "images",
          story: storySlug,
          storyName,
          path: `${path}.${field}`,
          component,
          message: `Non-Storyblok image on ${component}.${field} — should be uploaded as asset`,
          detail: filename.substring(0, 80),
        });
      }
    }
  }

  // ── CONTENT QUALITY RULES ───────────────────────────────────────────

  // Rule: Short text content on components that should have meaningful text
  if (component && node.text && typeof node.text === "string") {
    const cleanText = node.text.replace(/[#*_~`>\-\[\]()\\n<>]/g, "").trim();
    if (cleanText.length > 0 && cleanText.length < MIN_TEXT_LENGTH) {
      findings.push({
        rule: "short-text",
        severity: "low",
        category: "content",
        story: storySlug,
        storyName,
        path: `${path}.text`,
        component,
        message: `Short text (${cleanText.length} chars) on ${component}`,
        detail: cleanText.substring(0, 60) + (cleanText.length > 60 ? "…" : ""),
      });
    }
  }

  // Rule: Empty section (section with 0 components)
  if (
    component === "section" &&
    Array.isArray(node.components) &&
    node.components.length === 0
  ) {
    findings.push({
      rule: "empty-section",
      severity: "high",
      category: "content",
      story: storySlug,
      storyName,
      path: `${path}`,
      component: "section",
      message: "Section has no components",
    });
  }

  // Rule: Hero without headline
  if (component === "hero" && (!node.headline || node.headline.trim() === "")) {
    findings.push({
      rule: "hero-no-headline",
      severity: "medium",
      category: "content",
      story: storySlug,
      storyName,
      path: `${path}`,
      component: "hero",
      message: "Hero component has no headline",
    });
  }

  // Rule: CTA without buttons
  if (component === "cta") {
    const hasButtons = Array.isArray(node.buttons) && node.buttons.length > 0;
    if (!hasButtons) {
      findings.push({
        rule: "cta-no-buttons",
        severity: "medium",
        category: "content",
        story: storySlug,
        storyName,
        path: `${path}`,
        component: "cta",
        message: "CTA component has no buttons",
      });
    }
  }

  // Rule: Teaser card without link/URL
  if (component === "teaser-card") {
    const url = node.url || node.target;
    const hasUrl =
      url &&
      (typeof url === "string"
        ? url.trim() !== "" && url !== "#"
        : url.cached_url || url.url);
    const buttonHidden = node.button_hidden === true;
    if (!hasUrl && !buttonHidden) {
      findings.push({
        rule: "teaser-no-link",
        severity: "low",
        category: "content",
        story: storySlug,
        storyName,
        path: `${path}`,
        component: "teaser-card",
        message: "Teaser card has no link target",
      });
    }
  }

  // ── Recurse ─────────────────────────────────────────────────────────
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          walkContent(item, `${path}.${key}[${i}]`, storySlug, storyName);
        }
      });
    } else if (typeof value === "object" && value !== null && key !== "_uid") {
      walkContent(value, `${path}.${key}`, storySlug, storyName);
    }
  }
}

// ── Process each story ────────────────────────────────────────────────
const heroCountByStory = {};
const imageUrlsInContent = new Set();

for (const story of stories) {
  const slug = story.full_slug || story.slug;
  const name = story.name;
  const content = story.content;
  if (!content) continue;

  const contentType = content.component || "unknown";

  // ── SEO RULES ─────────────────────────────────────────────────────

  const seoArr = content.seo;
  const hasSeo = Array.isArray(seoArr) && seoArr.length > 0;
  const seo = hasSeo ? seoArr[0] : null;

  // Rule: Missing SEO block entirely
  if (!hasSeo) {
    findings.push({
      rule: "missing-seo",
      severity: "high",
      category: "seo",
      story: slug,
      storyName: name,
      path: "content.seo",
      component: contentType,
      message: "No SEO metadata configured",
    });
  } else {
    // Rule: Missing meta title
    if (!seo.title || seo.title.trim() === "") {
      findings.push({
        rule: "missing-meta-title",
        severity: "high",
        category: "seo",
        story: slug,
        storyName: name,
        path: "content.seo[0].title",
        component: "seo",
        message: "Missing meta title",
      });
    } else {
      // Rule: Meta title too long
      if (seo.title.length > MAX_META_TITLE_LENGTH) {
        findings.push({
          rule: "meta-title-too-long",
          severity: "medium",
          category: "seo",
          story: slug,
          storyName: name,
          path: "content.seo[0].title",
          component: "seo",
          message: `Meta title too long (${seo.title.length}/${MAX_META_TITLE_LENGTH} chars)`,
          detail: seo.title,
        });
      }
      // Rule: Meta title too short
      if (seo.title.length < MIN_META_TITLE_LENGTH) {
        findings.push({
          rule: "meta-title-too-short",
          severity: "low",
          category: "seo",
          story: slug,
          storyName: name,
          path: "content.seo[0].title",
          component: "seo",
          message: `Meta title too short (${seo.title.length}/${MIN_META_TITLE_LENGTH} chars)`,
          detail: seo.title,
        });
      }
    }

    // Rule: Missing meta description
    if (!seo.description || seo.description.trim() === "") {
      findings.push({
        rule: "missing-meta-description",
        severity: "high",
        category: "seo",
        story: slug,
        storyName: name,
        path: "content.seo[0].description",
        component: "seo",
        message: "Missing meta description",
      });
    } else {
      // Rule: Meta description too long
      if (seo.description.length > MAX_META_DESCRIPTION_LENGTH) {
        findings.push({
          rule: "meta-description-too-long",
          severity: "medium",
          category: "seo",
          story: slug,
          storyName: name,
          path: "content.seo[0].description",
          component: "seo",
          message: `Meta description too long (${seo.description.length}/${MAX_META_DESCRIPTION_LENGTH} chars)`,
          detail: seo.description.substring(0, 80) + "…",
        });
      }
      // Rule: Meta description too short
      if (seo.description.length < MIN_META_DESCRIPTION_LENGTH) {
        findings.push({
          rule: "meta-description-too-short",
          severity: "low",
          category: "seo",
          story: slug,
          storyName: name,
          path: "content.seo[0].description",
          component: "seo",
          message: `Meta description too short (${seo.description.length}/${MIN_META_DESCRIPTION_LENGTH} chars)`,
          detail: seo.description,
        });
      }
    }

    // Rule: Missing OG image
    const ogImage = seo.image;
    if (isEmptyAsset(ogImage)) {
      findings.push({
        rule: "missing-og-image",
        severity: "medium",
        category: "seo",
        story: slug,
        storyName: name,
        path: "content.seo[0].image",
        component: "seo",
        message: "Missing Open Graph image",
      });
    }
  }

  // ── FRESHNESS RULES ─────────────────────────────────────────────────

  // Rule: Stale content (not updated in N months)
  if (story.updated_at) {
    const updatedAt = new Date(story.updated_at);
    const months = monthsBetween(updatedAt, now);
    if (months >= STALE_MONTHS) {
      findings.push({
        rule: "stale-content",
        severity: "medium",
        category: "freshness",
        story: slug,
        storyName: name,
        path: "",
        component: contentType,
        message: `Content not updated in ${months} months (since ${
          updatedAt.toISOString().split("T")[0]
        })`,
      });
    }
  }

  // Rule: Never published
  if (!story.published_at) {
    findings.push({
      rule: "never-published",
      severity: "info",
      category: "freshness",
      story: slug,
      storyName: name,
      path: "",
      component: contentType,
      message: "Story has never been published",
    });
  }

  // Rule: Draft with unpublished changes
  if (
    story.published_at &&
    story.updated_at &&
    story.updated_at > story.published_at
  ) {
    const pubDate = new Date(story.published_at);
    const updDate = new Date(story.updated_at);
    if (updDate.getTime() - pubDate.getTime() > 60000) {
      // More than 1 minute difference
      findings.push({
        rule: "unpublished-changes",
        severity: "info",
        category: "freshness",
        story: slug,
        storyName: name,
        path: "",
        component: contentType,
        message: `Has unpublished changes (last update: ${
          updDate.toISOString().split("T")[0]
        }, last publish: ${pubDate.toISOString().split("T")[0]})`,
      });
    }
  }

  // ── STRUCTURAL RULES ───────────────────────────────────────────────

  // Rule: Duplicate heroes (multiple hero components on a page)
  if (contentType === "page" && Array.isArray(content.section)) {
    let heroCount = 0;
    for (const section of content.section) {
      if (Array.isArray(section.components)) {
        for (const comp of section.components) {
          if (comp.component === "hero") heroCount++;
        }
      }
    }
    if (heroCount > 1) {
      findings.push({
        rule: "duplicate-heroes",
        severity: "medium",
        category: "content",
        story: slug,
        storyName: name,
        path: "content.section",
        component: "page",
        message: `Page has ${heroCount} hero components (usually should be 1)`,
      });
    }
  }

  // Rule: Page with very few sections
  if (
    contentType === "page" &&
    Array.isArray(content.section) &&
    content.section.length < 2
  ) {
    findings.push({
      rule: "sparse-page",
      severity: "low",
      category: "content",
      story: slug,
      storyName: name,
      path: "content.section",
      component: "page",
      message: `Page has only ${content.section.length} section(s) — may be incomplete`,
    });
  }

  // Rule: Page overall text content is very thin
  if (contentType === "page") {
    const totalText = countTextContent(content);
    if (totalText < 200 && totalText > 0) {
      findings.push({
        rule: "thin-content",
        severity: "medium",
        category: "content",
        story: slug,
        storyName: name,
        path: "",
        component: "page",
        message: `Page has very little text content (${totalText} chars total)`,
      });
    }
  }

  // ── Walk the full content tree for component-level rules ────────────
  walkContent(content, "content", slug, name);

  // ── Collect all image URLs used in this story (for orphan detection) ─
  function collectImageUrls(node) {
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && value.includes("storyblok.com")) {
        imageUrlsInContent.add(value);
      } else if (typeof value === "object" && value !== null) {
        if (
          value.filename &&
          typeof value.filename === "string" &&
          value.filename.includes("storyblok.com")
        ) {
          imageUrlsInContent.add(value.filename);
        }
        if (key !== "_uid") collectImageUrls(value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => collectImageUrls(v));
      }
    }
  }
  collectImageUrls(content);
}

// ── ASSET RULES (cross-reference) ──────────────────────────────────────

// Rule: Orphaned assets (in library but not referenced by any story)
let orphanedAssetCount = 0;
const orphanedAssets = [];
for (const asset of allAssets) {
  if (!asset.filename) continue;
  // Normalize the asset URL for comparison
  const normalizedUrl = asset.filename;
  // Check if any story references this asset
  let referenced = false;
  for (const url of imageUrlsInContent) {
    // Compare by filename portion to handle protocol/domain variations
    const assetFile = normalizedUrl.split("/").pop();
    if (url.includes(assetFile)) {
      referenced = true;
      break;
    }
  }
  if (!referenced) {
    orphanedAssetCount++;
    orphanedAssets.push({
      filename: asset.short_filename || asset.filename.split("/").pop(),
      url: asset.filename,
      size: asset.content_length,
      uploadedAt: asset.created_at,
    });
  }
}

if (orphanedAssetCount > 0) {
  findings.push({
    rule: "orphaned-assets",
    severity: "low",
    category: "images",
    story: "(asset library)",
    storyName: "Asset Library",
    path: "",
    component: "assets",
    message: `${orphanedAssetCount} asset(s) in the library are not referenced by any story`,
    detail: orphanedAssets
      .slice(0, 10)
      .map((a) => a.filename)
      .join(", "),
  });
}

// Rule: Assets without alt text in the library
const assetsWithoutAlt = allAssets.filter(
  (a) => a.filename && (!a.alt || a.alt.trim() === "")
);
if (assetsWithoutAlt.length > 0) {
  findings.push({
    rule: "asset-library-no-alt",
    severity: "low",
    category: "images",
    story: "(asset library)",
    storyName: "Asset Library",
    path: "",
    component: "assets",
    message: `${assetsWithoutAlt.length} asset(s) in the library have no alt text`,
    detail: assetsWithoutAlt
      .slice(0, 5)
      .map((a) => a.short_filename || a.filename.split("/").pop())
      .join(", "),
  });
}

// ── Build summary statistics ──────────────────────────────────────────
const summary = {
  totalStories: stories.length,
  totalAssets: allAssets.length,
  totalFindings: findings.length,
  byCategory: {},
  bySeverity: { high: 0, medium: 0, low: 0, info: 0 },
  byRule: {},
};

for (const f of findings) {
  // By category
  summary.byCategory[f.category] = summary.byCategory[f.category] || {
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0,
  };
  summary.byCategory[f.category][f.severity]++;
  summary.byCategory[f.category].total++;

  // By severity
  summary.bySeverity[f.severity]++;

  // By rule
  summary.byRule[f.rule] = (summary.byRule[f.rule] || 0) + 1;
}

// Health score: 100 - (high × 3) - (medium × 1.5) - (low × 0.5)
summary.healthScore = Math.max(
  0,
  Math.min(
    100,
    Math.round(
      100 -
        summary.bySeverity.high * 3 -
        summary.bySeverity.medium * 1.5 -
        summary.bySeverity.low * 0.5
    )
  )
);

// ── Return results ────────────────────────────────────────────────────
return [
  {
    json: {
      auditResults: {
        generatedAt: now.toISOString(),
        config: {
          staleMonths: STALE_MONTHS,
          minTextLength: MIN_TEXT_LENGTH,
          maxMetaTitleLength: MAX_META_TITLE_LENGTH,
          maxMetaDescriptionLength: MAX_META_DESCRIPTION_LENGTH,
        },
        summary,
        findings,
        orphanedAssets: orphanedAssets.slice(0, 20), // top 20 for the report
      },
    },
  },
];
