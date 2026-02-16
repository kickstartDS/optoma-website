/**
 * Schema Registry for multi-content-type support.
 *
 * Manages dereferenced JSON Schemas for all root content types (page,
 * blog-post, blog-overview, event-detail, event-list) and provides
 * pre-built validation rules for each.
 *
 * **Design principle:** Content type knowledge comes from the schemas
 * themselves — no component names, field names, or structural assumptions
 * are hardcoded. The registry auto-derives `hasSections` and
 * `rootArrayFields` from each schema during registration.
 *
 * Pure data — no framework dependencies.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildValidationRules, type ValidationRules } from "./validate.js";

// ─── Types ────────────────────────────────────────────────────────────

/** A registered content type with its schema and pre-built rules. */
export interface ContentTypeEntry {
  /** Content type name, e.g. `"page"`, `"blog-post"`, `"event-detail"`. */
  name: string;
  /** The fully dereferenced JSON Schema for this content type. */
  schema: Record<string, any>;
  /** Pre-built validation rules derived from the schema. */
  rules: ValidationRules;
  /**
   * Whether this content type uses section-based containers (Tier 1).
   *
   * `true` when the schema's root arrays contain polymorphic `anyOf` slots
   * (e.g. `section.components`), indicating a section-based page structure.
   *
   * `false` for flat content types (Tier 2) like `event-detail` whose root
   * arrays are monomorphic (e.g. `locations`, `images`).
   */
  hasSections: boolean;
  /**
   * Names of the top-level array properties in the root schema
   * (e.g. `["section"]` for page, `["events"]` for event-list).
   */
  rootArrayFields: string[];
}

// ─── Registry ─────────────────────────────────────────────────────────

/**
 * Central registry of content type schemas.
 *
 * Usage:
 * ```ts
 * const registry = createRegistryFromDirectory(schemasDir, CONTENT_TYPES);
 * const entry = registry.get("blog-post");
 * const rules = entry.rules; // ValidationRules for blog-post
 * ```
 */
export class SchemaRegistry {
  private entries = new Map<string, ContentTypeEntry>();

  /**
   * Register a content type by name and dereferenced schema.
   *
   * Automatically builds validation rules and derives structural metadata.
   */
  register(name: string, schema: Record<string, any>): ContentTypeEntry {
    const rules = buildValidationRules(schema);
    const hasSections = detectHasSections(rules);

    const entry: ContentTypeEntry = {
      name,
      schema,
      rules,
      hasSections,
      rootArrayFields: rules.rootArrayFields,
    };

    this.entries.set(name, entry);
    return entry;
  }

  /** Get a registered content type entry. Throws if not found. */
  get(name: string): ContentTypeEntry {
    const entry = this.entries.get(name);
    if (!entry) {
      throw new Error(
        `Unknown content type: "${name}". ` +
          `Available: ${[...this.entries.keys()].join(", ")}`
      );
    }
    return entry;
  }

  /** Check whether a content type is registered. */
  has(name: string): boolean {
    return this.entries.has(name);
  }

  /** List all registered content type names. */
  listContentTypes(): string[] {
    return [...this.entries.keys()];
  }

  /** List content types that use section-based containers (Tier 1). */
  listSectionBasedTypes(): string[] {
    return [...this.entries.values()]
      .filter((e) => e.hasSections)
      .map((e) => e.name);
  }

  /** List flat content types without section containers (Tier 2). */
  listFlatTypes(): string[] {
    return [...this.entries.values()]
      .filter((e) => !e.hasSections)
      .map((e) => e.name);
  }

  /**
   * Convenience getter for the `page` content type.
   * Throws if `page` is not registered.
   */
  get page(): ContentTypeEntry {
    return this.get("page");
  }

  /**
   * Detect the content type of a Storyblok content object by inspecting
   * its `component` field and checking against registered types.
   *
   * Returns the matching `ContentTypeEntry` or `null` if the component
   * value doesn't match any registered content type.
   */
  detectContentType(content: Record<string, any>): ContentTypeEntry | null {
    const componentName = content.component || content.type;
    if (typeof componentName === "string" && this.entries.has(componentName)) {
      return this.entries.get(componentName)!;
    }
    return null;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────

/**
 * The five root content types supported by the Design System.
 *
 * This allowlist ensures we only load root-level page schemas (not
 * sub-component schemas like `hero`, `faq`, etc.).
 */
export const ROOT_CONTENT_TYPES = [
  "page",
  "blog-post",
  "blog-overview",
  "event-detail",
  "event-list",
] as const;

export type RootContentType = (typeof ROOT_CONTENT_TYPES)[number];

/**
 * Create a `SchemaRegistry` by loading dereffed schemas from a directory.
 *
 * Searches for `{name}/{name}.schema.dereffed.json` files in the given
 * base directory for each content type in the allowlist.
 *
 * @param baseDir - Path to the components directory containing per-component
 *   subdirectories (e.g. `node_modules/@kickstartds/ds-agency-premium/dist/components`).
 * @param contentTypes - Content type names to load (defaults to `ROOT_CONTENT_TYPES`).
 * @returns A populated `SchemaRegistry`.
 */
export function createRegistryFromDirectory(
  baseDir: string,
  contentTypes: readonly string[] = ROOT_CONTENT_TYPES
): SchemaRegistry {
  const registry = new SchemaRegistry();

  for (const name of contentTypes) {
    const schemaPath = join(baseDir, name, `${name}.schema.dereffed.json`);
    try {
      const raw = readFileSync(schemaPath, "utf-8");
      const schema = JSON.parse(raw);
      registry.register(name, schema);
    } catch (err: any) {
      // Schema not found is acceptable for optional content types — warn
      // but don't throw. The caller can check `registry.has(name)`.
      console.error(
        `[SchemaRegistry] Warning: Could not load schema for "${name}" ` +
          `from ${schemaPath}: ${err?.message || err}`
      );
    }
  }

  return registry;
}

/**
 * Create a `SchemaRegistry` from a directory of pre-copied schema files.
 *
 * Unlike `createRegistryFromDirectory`, this expects flat files named
 * `{name}.schema.dereffed.json` directly in `schemasDir` (no subdirectories).
 * This is the pattern used by the MCP server and n8n nodes where schemas
 * are copied into a local `schemas/` folder at build time.
 *
 * @param schemasDir - Path to the directory containing `*.schema.dereffed.json` files.
 * @param contentTypes - Content type names to load (defaults to `ROOT_CONTENT_TYPES`).
 * @returns A populated `SchemaRegistry`.
 */
export function createRegistryFromSchemaDir(
  schemasDir: string,
  contentTypes: readonly string[] = ROOT_CONTENT_TYPES
): SchemaRegistry {
  const registry = new SchemaRegistry();

  for (const name of contentTypes) {
    const schemaPath = join(schemasDir, `${name}.schema.dereffed.json`);
    try {
      const raw = readFileSync(schemaPath, "utf-8");
      const schema = JSON.parse(raw);
      registry.register(name, schema);
    } catch (err: any) {
      // Only warn — the file may not have been copied yet
      console.error(
        `[SchemaRegistry] Warning: Could not load schema for "${name}" ` +
          `from ${schemaPath}: ${err?.message || err}`
      );
    }
  }

  return registry;
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Determine whether a content type uses section-based containers.
 *
 * A content type "has sections" when at least one of its root array fields
 * defines a container slot with a polymorphic `anyOf` (i.e. a slot that
 * accepts multiple component types). This distinguishes Tier 1 types
 * (page, blog-post, blog-overview) from Tier 2 types (event-detail,
 * event-list).
 */
function detectHasSections(rules: ValidationRules): boolean {
  for (const rootField of rules.rootArrayFields) {
    // Look for container slots at the root level (e.g. "section.components")
    for (const [slotPath, allowedTypes] of rules.containerSlots) {
      const parts = slotPath.split(".");
      if (parts.length === 2 && parts[0] === rootField) {
        // A polymorphic slot with 2+ types indicates section-based structure
        if (allowedTypes.size >= 2) {
          return true;
        }
      }
    }
  }
  return false;
}
