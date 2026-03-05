/**
 * Load dereferenced schemas from disk, classify into content types vs components,
 * and build the content hierarchy.
 *
 * Scans a directory recursively for `*.schema.dereffed.json` files,
 * classifies them using the ROOT_CONTENT_TYPES allowlist, and produces
 * the full schema response for the client.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename, resolve } from "path";
import {
  parseComponent,
  parseContentType,
  isContentType,
} from "../app/lib/schema-tree.js";
import type {
  ContentTypeInfo,
  ComponentNode,
  ContentTypeName,
  SchemaResponse,
} from "../shared/types.js";

// ─── Schema Discovery ───────────────────────────────────────────────────────

interface RawSchema {
  name: string;
  schema: Record<string, unknown>;
  filePath: string;
}

/**
 * Recursively find all `*.schema.dereffed.json` files in a directory.
 */
function findDereffedSchemas(dir: string): RawSchema[] {
  const results: RawSchema[] = [];
  const resolvedDir = resolve(dir);

  function walk(currentDir: string) {
    let entries: string[];
    try {
      entries = readdirSync(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".schema.dereffed.json")) {
        try {
          const raw = readFileSync(fullPath, "utf-8");
          const schema = JSON.parse(raw);
          // Extract component name from filename: "hero.schema.dereffed.json" → "hero"
          const name = basename(entry, ".schema.dereffed.json");
          results.push({ name, schema, filePath: fullPath });
        } catch (err) {
          console.warn(
            `Warning: Could not parse schema at ${fullPath}: ${err}`
          );
        }
      }
    }
  }

  walk(resolvedDir);
  return results;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Load all schemas from a directory and classify them.
 *
 * @param schemasDir - Path to directory containing `*.schema.dereffed.json` files
 * @returns Classified schema response with content types and components
 */
export function loadSchemas(schemasDir: string): SchemaResponse {
  const rawSchemas = findDereffedSchemas(schemasDir);

  const contentTypes: ContentTypeInfo[] = [];
  const components: ComponentNode[] = [];
  const componentMap = new Map<string, ComponentNode>();

  // First pass: classify and parse
  for (const { name, schema } of rawSchemas) {
    if (isContentType(name)) {
      const ctInfo = parseContentType(name as ContentTypeName, schema as any);
      contentTypes.push(ctInfo);
    } else {
      const component = parseComponent(name, schema as any);
      components.push(component);
      componentMap.set(name, component);
    }
  }

  // Sort content types in the canonical order
  const typeOrder = [
    "page",
    "blog-post",
    "blog-overview",
    "settings",
    "event-detail",
    "event-list",
    "search",
  ];
  contentTypes.sort(
    (a, b) => typeOrder.indexOf(a.name) - typeOrder.indexOf(b.name)
  );

  // Sort components alphabetically
  components.sort((a, b) => a.name.localeCompare(b.name));

  console.log(
    `Loaded ${contentTypes.length} content types and ${components.length} components from ${schemasDir}`
  );

  return { contentTypes, components };
}
