/**
 * Content transformation utilities.
 *
 * Handles two directions of transformation:
 *
 * 1. **OpenAI → Design System** (`processOpenAiResponse`):
 *    Reverses the `type__X` discriminator mangling, restores `type` fields,
 *    and merges component defaults from the original schemas.
 *
 * 2. **Design System → Storyblok** (`processForStoryblok`):
 *    Flattens nested objects into Storyblok's `key_subKey` convention,
 *    adds `component` fields, and marks sections as AI drafts.
 *
 * Pure functions — no framework dependencies.
 */
import { traverse as objectTraverse } from "object-traversal";

// ─── Types ────────────────────────────────────────────────────────────

/** Result of processing an OpenAI response into both DS and Storyblok shapes. */
export interface TransformedContent {
  /** Design-System-shaped props (nested objects, `type` fields). */
  designSystemProps: Record<string, any>;
  /** Storyblok-shaped props (flat `key_subKey`, `component` fields). */
  storyblokContent: Record<string, any>;
}

// ─── OpenAI → Design System ──────────────────────────────────────────

/**
 * Post-process raw OpenAI structured output back into kickstartDS
 * Design System component props.
 *
 * This reverses the transformations applied by `prepareSchemaForOpenAi`:
 * - `type__hero` → `type: "hero"`
 * - Merges default values from the original component schemas
 *
 * @param response - Raw parsed JSON from OpenAI.
 * @param schemaMap - Map of component type → original schema. Produced by
 *   `prepareSchemaForOpenAi().schemaMap`. When provided, default values are
 *   merged into the response.
 * @param defaultObjectForSchema - Optional function to derive defaults from
 *   a JSON Schema object. When omitted, default merging is skipped.
 *   Signature: `(schema: object) => Record<string, any>`.
 * @param deepMerge - Optional deep-merge function. When omitted, a simple
 *   shallow fallback is used.
 *   Signature: `(a: object, b: object) => object`.
 * @returns A new object with Design System–shaped props.
 */
export function processOpenAiResponse(
  response: Record<string, any>,
  schemaMap?: Record<string, Record<string, any>>,
  defaultObjectForSchema?: (schema: object) => Record<string, any>,
  deepMerge?: (a: any, b: any) => any
): Record<string, any> {
  const result = structuredClone(response);

  objectTraverse(
    result,
    ({ value }) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const typePropKey = Object.keys(value).find((key) =>
          key.startsWith("type__")
        );

        if (typePropKey) {
          const type = typePropKey.split("type__")[1];

          delete value[typePropKey];
          value.type = type;

          // Merge defaults from the original component schema
          if (schemaMap && schemaMap[type] && defaultObjectForSchema) {
            const schema = schemaMap[type];
            const defaults = defaultObjectForSchema(schema);

            if (defaults && typeof defaults === "object") {
              const merge = deepMerge || shallowMerge;

              for (const prop of Object.keys(defaults)) {
                if (value[prop] !== undefined) {
                  // If the value is an object (not array), deep-merge
                  if (
                    typeof value[prop] === "object" &&
                    !Array.isArray(value[prop]) &&
                    typeof defaults[prop] === "object" &&
                    !Array.isArray(defaults[prop])
                  ) {
                    value[prop] = merge(value[prop], defaults[prop]);
                  }
                  // Otherwise keep the generated value
                } else {
                  value[prop] = defaults[prop];
                }
              }
            }
          }
        }
      }
    },
    { traversalType: "breadth-first" }
  );

  return result;
}

// ─── Design System → Storyblok ───────────────────────────────────────

/**
 * Transform Design System–shaped page props into the flat structure
 * that Storyblok expects.
 *
 * - Nested objects are flattened: `{ image: { src, alt } }` → `{ image_src, image_alt }`
 * - `type` (DS discriminator) is moved to `component` (Storyblok discriminator)
 * - Each section gets `aiDraft: true` and `component: "section"`
 *
 * After this transform every component node carries `component` as its
 * identity field — the DS `type` field is removed so it cannot collide
 * with user-facing `type` props in Storyblok (e.g. CTA variant).
 *
 * @param page - Design System page props (with nested objects and `type` fields).
 * @returns A new object with Storyblok-compatible flat props.
 */
export function processForStoryblok(
  page: Record<string, any>
): Record<string, any> {
  const result = structuredClone(page);

  objectTraverse(
    result,
    ({ value }) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        value.type
      ) {
        value.component = value.type;
        delete value.type;
        flattenNestedObjects(value);
      }
    },
    { traversalType: "breadth-first" }
  );

  // Section-level annotations
  for (const section of result.section || []) {
    section.aiDraft = true;
    section.component = "section";
    delete section.type;
    flattenNestedObjects(section);
  }

  // Final safety pass: strip `type` from any node that already has
  // `component` set — Storyblok content must never carry both.
  objectTraverse(
    result,
    ({ value }) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        value.component &&
        value.type !== undefined
      ) {
        delete value.type;
      }
    },
    { traversalType: "breadth-first" }
  );

  return result;
}

// ─── Flatten / Unflatten utilities ────────────────────────────────────

/**
 * Flatten one level of nested objects using `_` as separator.
 *
 * Transforms `{ image: { src: "x", alt: "y" } }` into
 * `{ image_src: "x", image_alt: "y" }`.
 *
 * Objects that have a `type` or `component` property are left intact
 * (they are component blocks, not nested plain objects).
 *
 * **Mutates** the input object in place.
 */
export function flattenNestedObjects(value: Record<string, any>): void {
  for (const prop of Object.keys(value)) {
    const child = value[prop];
    if (
      child &&
      typeof child === "object" &&
      !Array.isArray(child) &&
      !child.type &&
      !child.component
    ) {
      for (const nestedProp of Object.keys(child)) {
        value[`${prop}_${nestedProp}`] = structuredClone(child[nestedProp]);
      }
      delete value[prop];
    }
  }
}

/**
 * Reverse of `flattenNestedObjects`.
 *
 * Transforms `{ image_src: "x", image_alt: "y" }` into
 * `{ image: { src: "x", alt: "y" } }`.
 *
 * Keys starting with `_` (e.g. `_uid`, `_editable`) are preserved as-is.
 */
export function unflattenNestedObjects(
  blok: Record<string, any>
): Record<string, any> {
  return Object.entries(blok).reduce((a, [k, v]) => {
    if (k.startsWith("_")) {
      a[k] = v;
      return a;
    }

    k.split("_").reduce((r: any, e: string, i: number, arr: string[]) => {
      return r[e] || (r[e] = arr[i + 1] ? {} : v);
    }, a);

    return a;
  }, {} as Record<string, any>);
}

// ─── Internal helpers ─────────────────────────────────────────────────

/** Simple shallow merge fallback when deepmerge is not provided. */
function shallowMerge(a: any, b: any): any {
  if (
    typeof a === "object" &&
    !Array.isArray(a) &&
    typeof b === "object" &&
    !Array.isArray(b)
  ) {
    return { ...b, ...a };
  }
  return a;
}
