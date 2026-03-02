/**
 * UI resource registration for ext-apps previews.
 *
 * Registers two `ui://` resources that serve HTML preview templates:
 * - `ui://kds/page-builder`  — Unified page builder (single + multi section)
 * - `ui://kds/plan-review`   — Section sequence planner with drag-to-reorder
 *
 * These resources are only registered when the connected client
 * supports ext-apps (detected via capability negotiation).
 *
 * Uses `registerAppResource()` from the ext-apps SDK which automatically
 * sets the `text/html;profile=mcp-app` MIME type.
 *
 * @see PRD Section 6.1 — Resource Registration
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource } from "@modelcontextprotocol/ext-apps/server";

import {
  PAGE_BUILDER_URI,
  PLAN_REVIEW_URI,
  RESOURCE_MIME_TYPE,
} from "./capability.js";
import { PAGE_BUILDER_HTML, PLAN_REVIEW_HTML } from "./templates.js";

// ── Registration ───────────────────────────────────────────────────

/**
 * Register all ext-apps UI resources on the McpServer.
 *
 * Each resource serves a self-contained HTML document that the host
 * renders in a sandboxed iframe. The HTML includes:
 * - The ext-apps client SDK for host communication
 * - kickstartDS theme bridge CSS variables
 * - Preview chrome (action buttons, loading states)
 *
 * CSP is restrictive by default (no external connections needed).
 * When Storyblok CDN images are added, `resourceDomains` will be
 * extended to include `https://a.storyblok.com`.
 */
/** Shared CSP metadata — ext-apps SDK is loaded from unpkg.com */
const SHARED_UI_META = {
  ui: {
    csp: {
      resourceDomains: [
        "https://unpkg.com", // ext-apps SDK (app-with-deps.js)
        "https://a.storyblok.com", // Storyblok CDN assets
        "https://img2.storyblok.com", // Storyblok image service (resized/optimized)
        "https://placehold.co", // Placeholder images in AI-generated content
        "https://fonts.googleapis.com", // Google Fonts CSS stylesheets
        "https://fonts.gstatic.com", // Google Fonts font files (woff2)
      ],
    },
    prefersBorder: true,
  },
};

export function registerUiResources(server: McpServer): void {
  // ── Page Builder ───────────────────────────────────────────────

  registerAppResource(
    server,
    "Page Builder",
    PAGE_BUILDER_URI,
    {
      description:
        "Unified page builder that accumulates sections across multiple generate_section calls. Supports single-section preview, multi-section page assembly, and editing existing pages. Provides approve/reject/modify, remove, reorder, and save actions.",
      _meta: SHARED_UI_META,
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: RESOURCE_MIME_TYPE,
          text: PAGE_BUILDER_HTML,
          _meta: SHARED_UI_META,
        },
      ],
    })
  );

  // ── Plan Review ────────────────────────────────────────────────

  registerAppResource(
    server,
    "Plan Review",
    PLAN_REVIEW_URI,
    {
      description:
        "Interactive plan review showing the planned section sequence. Supports drag-to-reorder and approve/reject actions for the overall page plan.",
      _meta: SHARED_UI_META,
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: RESOURCE_MIME_TYPE,
          text: PLAN_REVIEW_HTML,
          _meta: SHARED_UI_META,
        },
      ],
    })
  );
}
