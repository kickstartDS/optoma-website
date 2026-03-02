/**
 * Capability negotiation for MCP Apps (ext-apps) extension.
 *
 * Checks whether the connected client supports the MCP Apps extension
 * (ui:// resources rendered in sandboxed iframes). When the client
 * advertises ext-apps support, the server conditionally registers:
 * - ui:// resources for previews (section, page, plan review)
 * - App-only tools (approve, reject, modify — hidden from the LLM)
 * - Tool-UI linkage via `_meta.ui.resourceUri` on generation tools
 *
 * @see https://github.com/modelcontextprotocol/ext-apps
 */

import {
  getUiCapability,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

// ── Constants ──────────────────────────────────────────────────────

/** URI prefix for all kickstartDS UI resources */
export const UI_URI_PREFIX = "ui://kds";

/** Section preview resource URI — stateless single-section preview */
export const SECTION_PREVIEW_URI = `${UI_URI_PREFIX}/section-preview`;

/** Page builder resource URI — final assembly with reorder/remove/save */
export const PAGE_BUILDER_URI = `${UI_URI_PREFIX}/page-builder`;

/** Plan review resource URI */
export const PLAN_REVIEW_URI = `${UI_URI_PREFIX}/plan-review`;

// Re-export for convenience
export { RESOURCE_MIME_TYPE };

// ── Capability detection ───────────────────────────────────────────

/**
 * Check whether the connected MCP client supports ext-apps UI resources.
 *
 * Reads client capabilities from the underlying Server after the
 * `initialize` handshake completes. Returns `true` when the client
 * advertises `io.modelcontextprotocol/ui` with the MCP App MIME type.
 */
export function clientSupportsExtApps(server: Server): boolean {
  try {
    const clientCaps = server.getClientCapabilities();
    const uiCap = getUiCapability(clientCaps as any);
    return !!uiCap?.mimeTypes?.includes(RESOURCE_MIME_TYPE);
  } catch {
    // If capabilities haven't been negotiated yet, assume no support
    return false;
  }
}
