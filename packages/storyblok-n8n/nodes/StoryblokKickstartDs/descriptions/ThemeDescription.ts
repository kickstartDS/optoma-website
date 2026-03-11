import { INodeProperties } from "n8n-workflow";

/**
 * Parameter definitions for the "Theme" resource.
 *
 * Visible when resource = "theme".
 * Operations: list, get, apply, remove
 */

// ─── Operations ─────────────────────────────────────────────────────────

export const themeOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  options: [
    {
      name: "List Themes",
      value: "list",
      description:
        "List all available design token themes stored as token-theme stories in Storyblok",
      action: "List themes",
    },
    {
      name: "Get Theme",
      value: "get",
      description:
        "Get the full details of a theme including branding tokens and compiled CSS",
      action: "Get a theme",
    },
    {
      name: "Apply Theme",
      value: "apply",
      description:
        "Apply a design token theme to a page or settings story by setting its theme field",
      action: "Apply a theme to a story",
    },
    {
      name: "Remove Theme",
      value: "remove",
      description:
        "Remove the theme from a story, resetting it to the default branding",
      action: "Remove theme from a story",
    },
  ],
  default: "list",
  displayOptions: {
    show: {
      resource: ["theme"],
    },
  },
};

// ─── Fields ─────────────────────────────────────────────────────────────

export const themeFields: INodeProperties[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Get Theme fields
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    displayName: "Theme Slug or UUID",
    name: "themeSlugOrUuid",
    type: "string",
    default: "",
    required: true,
    description: 'The slug (e.g. "dark-mode") or UUID of the theme to retrieve',
    placeholder: "dark-mode",
    displayOptions: {
      show: {
        resource: ["theme"],
        operation: ["get"],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Apply Theme fields
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    displayName: "Story ID",
    name: "applyStoryId",
    type: "string",
    default: "",
    required: true,
    description:
      "Numeric ID of the page or settings story to apply the theme to",
    displayOptions: {
      show: {
        resource: ["theme"],
        operation: ["apply"],
      },
    },
  },
  {
    displayName: "Theme UUID",
    name: "applyThemeUuid",
    type: "string",
    default: "",
    required: true,
    description: "UUID of the theme to apply to the story",
    displayOptions: {
      show: {
        resource: ["theme"],
        operation: ["apply"],
      },
    },
  },
  {
    displayName: "Publish",
    name: "applyPublish",
    type: "boolean",
    default: false,
    description: "Whether to publish the story after applying the theme",
    displayOptions: {
      show: {
        resource: ["theme"],
        operation: ["apply"],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Remove Theme fields
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    displayName: "Story ID",
    name: "removeStoryId",
    type: "string",
    default: "",
    required: true,
    description:
      "Numeric ID of the story to remove the theme from (resets to default branding)",
    displayOptions: {
      show: {
        resource: ["theme"],
        operation: ["remove"],
      },
    },
  },
  {
    displayName: "Publish",
    name: "removePublish",
    type: "boolean",
    default: false,
    description: "Whether to publish the story after removing the theme",
    displayOptions: {
      show: {
        resource: ["theme"],
        operation: ["remove"],
      },
    },
  },
];
