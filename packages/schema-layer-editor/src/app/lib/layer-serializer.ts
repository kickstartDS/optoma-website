/**
 * Convert override model → JSON Schema layer files (client-side preview).
 *
 * Serializes the path-based override map into the nested JSON Schema structure
 * expected by the CMS layer convention. See PRD §8 for serialization rules.
 */

import type { FieldOverride, OverrideMap } from "../../shared/types.js";
import { hasOverride } from "./override-model.js";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LayerSchemaFile {
  $schema: string;
  $id: string;
  type: "object";
  allOf: [LayerOverrideObject, LayerRefObject];
  additionalProperties: false;
}

interface LayerOverrideObject {
  type: "object";
  properties: Record<string, LayerProperty>;
  additionalProperties: false;
}

interface LayerRefObject {
  $ref: string;
}

interface LayerProperty {
  "x-cms-hidden"?: boolean;
  title?: string;
  description?: string;
  "x-cms-order"?: number;
  properties?: Record<string, LayerProperty>;
  items?: {
    properties?: Record<string, LayerProperty>;
    anyOf?: Array<{ title: string }>;
    oneOf?: Array<{ title: string }>;
  };
  anyOf?: Array<{ title: string }>;
  oneOf?: Array<{ title: string }>;
}

// ─── Serialization ──────────────────────────────────────────────────────────

/**
 * Group flat path-based overrides into a nested property tree.
 *
 * Converts paths like:
 *   "image.srcMobile" → { image: { properties: { srcMobile: {...} } } }
 *   "buttons[].label" → { buttons: { items: { properties: { label: {...} } } } }
 */
function buildNestedProperties(
  overrides: OverrideMap
): Record<string, LayerProperty> {
  const root: Record<string, LayerProperty> = {};

  for (const [path, override] of overrides) {
    if (!hasOverride(override)) continue;

    const segments = parsePath(path);
    ensurePath(root, segments, override);
  }

  return root;
}

/**
 * Parse a dot-separated path with optional [] markers into segments.
 *
 * "image.srcMobile"   → ["image", "srcMobile"]
 * "buttons[].label"   → ["buttons", "[]", "label"]
 * "headline"          → ["headline"]
 */
function parsePath(path: string): string[] {
  const segments: string[] = [];
  for (const part of path.split(".")) {
    if (part.endsWith("[]")) {
      segments.push(part.slice(0, -2));
      segments.push("[]");
    } else {
      segments.push(part);
    }
  }
  return segments;
}

/**
 * Walk/create the nested property structure for a given path, setting the
 * override on the final leaf.
 */
function ensurePath(
  root: Record<string, LayerProperty>,
  segments: string[],
  override: FieldOverride
): void {
  let current = root;
  let i = 0;

  while (i < segments.length) {
    const segment = segments[i];

    // Check if next segment is [] (array items)
    if (i + 1 < segments.length && segments[i + 1] === "[]") {
      // This is an array field — ensure it exists
      if (!current[segment]) {
        current[segment] = {};
      }
      const arrayField = current[segment];

      // Ensure items.properties exists
      if (!arrayField.items) {
        arrayField.items = { properties: {} };
      }
      if (!arrayField.items.properties) {
        arrayField.items.properties = {};
      }

      // If this is the second-to-last "real" segment and [] is the marker,
      // continue into items.properties
      current = arrayField.items.properties;
      i += 2; // Skip both the field name and []
      continue;
    }

    // Last segment — this is where we set the override
    if (i === segments.length - 1) {
      if (!current[segment]) {
        current[segment] = {};
      }
      // If override has allowedComponents and this is an array-like field,
      // ensure items exists so applyOverride can place anyOf inside it
      if (override.allowedComponents && !current[segment].items) {
        current[segment].items = {};
      }
      applyOverride(current[segment], override);
      return;
    }

    // Intermediate object segment — ensure properties exists
    if (!current[segment]) {
      current[segment] = {};
    }
    if (!current[segment].properties) {
      current[segment].properties = {};
    }
    current = current[segment].properties!;
    i++;
  }
}

/**
 * Apply override values to a layer property object.
 */
function applyOverride(property: LayerProperty, override: FieldOverride): void {
  if (override.hidden !== undefined) {
    property["x-cms-hidden"] = override.hidden;
  }
  if (override.title !== undefined) {
    property.title = override.title;
  }
  if (override.description !== undefined) {
    property.description = override.description;
  }
  if (override.order !== undefined) {
    property["x-cms-order"] = override.order;
  }
  if (override.allowedComponents !== undefined) {
    const anyOfValue = override.allowedComponents.map((name) => ({
      title: name,
    }));
    // If this field already has items (array), put anyOf inside items
    if (property.items) {
      property.items.anyOf = anyOfValue;
    } else {
      // Direct polymorphic field (non-array)
      property.anyOf = anyOfValue;
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a complete layer schema file for a component.
 *
 * @param componentName - Component name (e.g. "hero")
 * @param overrides - Path-based override map for this component
 * @param namespace - Layer namespace (e.g. "visibility")
 * @param baseUrl - Base URL for $id generation
 * @param baseSchemaUrl - Base URL for $ref to the base Design System schema
 * @returns The JSON Schema layer file object, or null if no overrides
 */
export function serializeLayerFile(
  componentName: string,
  overrides: OverrideMap,
  namespace: string,
  baseUrl?: string,
  baseSchemaUrl: string = "http://schema.mydesignsystem.com"
): LayerSchemaFile | null {
  // Only include fields with actual overrides
  const properties = buildNestedProperties(overrides);

  if (Object.keys(properties).length === 0) {
    return null;
  }

  const resolvedBaseUrl = baseUrl || `http://${namespace}.mydesignsystem.com`;

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: `${resolvedBaseUrl}/${componentName}.schema.json`,
    type: "object",
    allOf: [
      {
        type: "object",
        properties,
        additionalProperties: false,
      },
      {
        $ref: `${baseSchemaUrl}/${componentName}.schema.json`,
      },
    ],
    additionalProperties: false,
  };
}

/**
 * Generate all layer files for all components with overrides.
 *
 * @returns Map of filename → file content
 */
export function serializeAllLayerFiles(
  allOverrides: Map<string, OverrideMap>,
  namespace: string,
  baseUrl?: string,
  baseSchemaUrl?: string
): Map<string, LayerSchemaFile> {
  const files = new Map<string, LayerSchemaFile>();

  for (const [componentName, overrides] of allOverrides) {
    const file = serializeLayerFile(
      componentName,
      overrides,
      namespace,
      baseUrl,
      baseSchemaUrl
    );
    if (file) {
      files.set(`${componentName}.schema.json`, file);
    }
  }

  return files;
}
