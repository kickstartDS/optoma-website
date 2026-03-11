/**
 * MCP Prompt definitions for the design-tokens server.
 *
 * Each prompt exposes a guided workflow as a discoverable slash command
 * in AI clients. Prompts return a sequence of PromptMessage objects that
 * instruct the LLM on the workflow steps and tools to use.
 */

/** A single prompt argument definition (matches MCP PromptArgument). */
export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
}

/** A prompt definition with its metadata and argument list. */
export interface PromptDefinition {
  name: string;
  description: string;
  arguments: PromptArgument[];
}

/** A prompt message (matches MCP PromptMessage). */
export interface PromptMessage {
  role: "user" | "assistant";
  content: {
    type: "text";
    text: string;
  };
}

// ── Prompt definitions ─────────────────────────────────────────────

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  {
    name: "audit-tokens",
    description:
      "Audit the design token system for quality issues — missing references, " +
      "orphaned tokens, naming inconsistencies, and governance rule violations. " +
      "Uses get_token_stats, search_tokens, and audit_tokens tools.",
    arguments: [
      {
        name: "scope",
        description:
          "Scope of the audit: 'all' (default), 'branding', 'component', or a specific component name",
        required: false,
      },
    ],
  },
  {
    name: "update-branding",
    description:
      "Guided workflow to update branding tokens (colors, fonts, spacing factors). " +
      "Reviews current values, makes changes via update_branding_token, and validates " +
      "the impact with get_branding_color_palette.",
    arguments: [
      {
        name: "intent",
        description:
          "What you want to change (e.g., 'update primary color to blue', 'increase base font size')",
        required: true,
      },
    ],
  },
  {
    name: "explore-component-tokens",
    description:
      "Explore the design tokens for a specific component — values, references, " +
      "customization points, and theming guidance. Lists the component's token " +
      "file and analyzes the token hierarchy.",
    arguments: [
      {
        name: "component",
        description:
          "Component name to explore (e.g., 'button', 'hero', 'section')",
        required: true,
      },
    ],
  },
];

// ── Message generators ─────────────────────────────────────────────

/**
 * Generate prompt messages for a given prompt name and arguments.
 */
export function getPromptMessages(
  name: string,
  args: Record<string, string>
): { description: string; messages: PromptMessage[] } {
  switch (name) {
    case "audit-tokens":
      return getAuditTokensMessages(args);
    case "update-branding":
      return getUpdateBrandingMessages(args);
    case "explore-component-tokens":
      return getExploreComponentTokensMessages(args);
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

function getAuditTokensMessages(args: Record<string, string>): {
  description: string;
  messages: PromptMessage[];
} {
  const scope = args.scope || "all";
  return {
    description: `Audit the design token system (scope: ${scope})`,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Audit the design token system with scope: ${scope}. Check for quality issues, naming inconsistencies, and governance violations.`,
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `I'll audit the design token system (scope: ${scope}). Here's my plan:

1. **Get token overview** — Call \`get_token_stats\` to understand the token landscape
2. **Run audit** — Call \`audit_tokens\` to check governance rules and detect issues
3. **Analyze results** — Review naming consistency, orphaned references, and missing tokens
4. **Report** — Provide a structured report with findings and recommendations

Let me start by getting the token statistics.`,
        },
      },
    ],
  };
}

function getUpdateBrandingMessages(args: Record<string, string>): {
  description: string;
  messages: PromptMessage[];
} {
  const intent = args.intent || "update branding tokens";
  return {
    description: `Update branding tokens: ${intent}`,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `I want to ${intent}. Guide me through updating the branding tokens safely.`,
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `I'll help you ${intent}. Here's the workflow:

1. **Review current values** — Call \`get_branding_color_palette\` and \`list_tokens\` (file: "branding") to see current branding token values
2. **Identify tokens to change** — Based on your intent, find the specific branding tokens
3. **Preview impact** — Use \`search_tokens\` to find all tokens that reference the ones being changed
4. **Make changes** — Use \`update_branding_token\` to update each token value
5. **Validate** — Re-check the color palette and downstream tokens to confirm the changes look correct

Let me start by reviewing the current branding tokens.`,
        },
      },
    ],
  };
}

function getExploreComponentTokensMessages(args: Record<string, string>): {
  description: string;
  messages: PromptMessage[];
} {
  const component = args.component || "button";
  return {
    description: `Explore ${component} component tokens`,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Show me the design tokens for the ${component} component and explain how to customize it.`,
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `I'll explore the ${component} component tokens. Here's my plan:

1. **List component tokens** — Call \`get_component_tokens\` for "${component}" to see all tokens
2. **Analyze structure** — Review the token naming (elements, variants, states, properties)
3. **Trace references** — Use \`search_tokens\` to find which semantic/branding tokens are referenced
4. **Theming guidance** — Explain which tokens to customize for common theming scenarios

Let me start by fetching the ${component} component's tokens.`,
        },
      },
    ],
  };
}
