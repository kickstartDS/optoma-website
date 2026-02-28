/**
 * App-only tools for ext-apps UI interaction.
 *
 * These tools have `visibility: ["app"]` — they are callable only from
 * the UI iframe via `app.callTool()`, and are hidden from the LLM.
 * They provide the interactive approve/reject/modify workflow that
 * complements the visual previews.
 *
 * Tools:
 * - approve_section — User approves a generated section
 * - reject_section  — User rejects a section (with optional reason)
 * - modify_section  — User wants to modify a section
 * - approve_plan    — User approves a planned section sequence
 * - reorder_plan    — User reordered sections via drag-and-drop
 *
 * @see PRD Section 3.2 — App-Only Tools
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

// ── Zod schemas for app-only tool inputs ───────────────────────────

const SectionInputSchema = {
  section: z.record(z.unknown()).describe("The section data from the preview"),
};

const RejectInputSchema = {
  reason: z.string().optional().describe("Optional reason for rejection"),
};

const OrderInputSchema = {
  order: z.array(z.string()).describe("Ordered list of component type names"),
};

// ── Registration ───────────────────────────────────────────────────

/**
 * Register all app-only tools on the McpServer.
 *
 * These tools are only visible to the ext-apps UI (not the LLM).
 * They use `registerAppTool()` from the ext-apps SDK which normalizes
 * the `_meta.ui.visibility` metadata.
 */
export function registerAppOnlyTools(server: McpServer): void {
  // ── approve_section ────────────────────────────────────────────

  registerAppTool(
    server,
    "approve_section",
    {
      title: "Approve Section",
      description:
        "Approve a generated section. Called from the section preview UI when the user clicks the approve button.",
      inputSchema: SectionInputSchema,
      _meta: {
        ui: { visibility: ["app"] },
      },
    },
    async ({ section }) => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              action: "approved",
              section,
              message: "Section approved by user",
            }),
          },
        ],
      };
    }
  );

  // ── reject_section ─────────────────────────────────────────────

  registerAppTool(
    server,
    "reject_section",
    {
      title: "Reject Section",
      description:
        "Reject a generated section. Called from the preview UI when the user clicks reject.",
      inputSchema: RejectInputSchema,
      _meta: {
        ui: { visibility: ["app"] },
      },
    },
    async ({ reason }) => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              action: "rejected",
              reason: reason || "User rejected the section",
              message:
                "Section rejected. The model should ask for feedback and regenerate.",
            }),
          },
        ],
      };
    }
  );

  // ── modify_section ─────────────────────────────────────────────

  registerAppTool(
    server,
    "modify_section",
    {
      title: "Modify Section",
      description:
        "Request modifications to a generated section. Called from the preview UI when the user wants changes.",
      inputSchema: SectionInputSchema,
      _meta: {
        ui: { visibility: ["app"] },
      },
    },
    async ({ section }) => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              action: "modify",
              section,
              message:
                "User wants to modify this section. Ask what changes they'd like.",
            }),
          },
        ],
      };
    }
  );

  // ── approve_plan ───────────────────────────────────────────────

  registerAppTool(
    server,
    "approve_plan",
    {
      title: "Approve Plan",
      description:
        "Approve a page plan (section sequence). Called from the plan review UI.",
      inputSchema: OrderInputSchema,
      _meta: {
        ui: { visibility: ["app"] },
      },
    },
    async ({ order }) => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              action: "plan_approved",
              order,
              message:
                "Plan approved by user. Proceed with generating each section in the approved order.",
            }),
          },
        ],
      };
    }
  );

  // ── reorder_plan ───────────────────────────────────────────────

  registerAppTool(
    server,
    "reorder_plan",
    {
      title: "Reorder Plan",
      description:
        "Update the section order after the user reorders via drag-and-drop in the plan review UI.",
      inputSchema: OrderInputSchema,
      _meta: {
        ui: { visibility: ["app"] },
      },
    },
    async ({ order }) => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              action: "plan_reordered",
              order,
              message: "Plan reordered by user. New section order applied.",
            }),
          },
        ],
      };
    }
  );
}
