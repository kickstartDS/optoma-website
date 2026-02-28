/**
 * UI resource registration for ext-apps previews.
 *
 * Registers three `ui://` resources that serve HTML preview templates:
 * - `ui://kds/section-preview` — Single section preview
 * - `ui://kds/page-preview`    — Full page (multi-section) preview
 * - `ui://kds/plan-review`     — Section sequence planner with drag-to-reorder
 *
 * These resources are only registered when the connected client
 * supports ext-apps (detected via capability negotiation).
 *
 * Uses `registerAppResource()` from the ext-apps SDK which automatically
 * sets the `text/html;profile=mcp-app` MIME type.
 *
 * @see PRD Section 4.6 — Register ui:// resources
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource } from "@modelcontextprotocol/ext-apps/server";

import {
  SECTION_PREVIEW_URI,
  PAGE_PREVIEW_URI,
  PLAN_REVIEW_URI,
} from "./capability.js";
import {
  SECTION_PREVIEW_HTML,
  PAGE_PREVIEW_HTML,
  PLAN_REVIEW_HTML,
} from "./templates.js";

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
export function registerUiResources(server: McpServer): void {
  // ── Section Preview ────────────────────────────────────────────

  registerAppResource(
    server,
    "Section Preview",
    SECTION_PREVIEW_URI,
    {
      description:
        "Interactive preview of a single generated section. Displays pre-rendered kickstartDS component HTML with approve/reject/modify actions.",
      _meta: {
        ui: {
          // Future: add CSP for Storyblok CDN images
          // csp: { resourceDomains: ["https://a.storyblok.com"] },
        },
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: SECTION_PREVIEW_HTML,
        },
      ],
    })
  );

  // ── Page Preview ───────────────────────────────────────────────

  registerAppResource(
    server,
    "Page Preview",
    PAGE_PREVIEW_URI,
    {
      description:
        "Full page preview with multiple sections stacked vertically. Each section is labeled with a numbered badge. Supports fullscreen display mode.",
      _meta: {
        ui: {
          // Future: add CSP for Storyblok CDN images
          // csp: { resourceDomains: ["https://a.storyblok.com"] },
        },
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: PAGE_PREVIEW_HTML,
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
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: PLAN_REVIEW_HTML,
        },
      ],
    })
  );
}
