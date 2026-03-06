import fs from "fs/promises";
import { BRANDING_JSON_FILE } from "./constants.js";
import type { FlatConfigEntry } from "./types.js";

/**
 * Build schema descriptions for branding-token.json fields to guide theme generation.
 */
export function getBrandingSchemaDescription(): Record<string, string> {
  return {
    "color.primary":
      "Main brand color (hex). Extract the dominant brand/accent color from the image.",
    "color.primary-inverted":
      "Primary color for dark/inverted backgrounds (hex). Often the same as primary or a lighter tint.",
    "color.background":
      "Main background color (hex). Usually white or a very light neutral.",
    "color.background-inverted":
      "Dark/inverted background color (hex). Usually a very dark shade of the primary or a dark neutral.",
    "color.foreground": "Main text color (hex). Usually very dark, near-black.",
    "color.foreground-inverted":
      "Text color on dark backgrounds (hex). Usually white or near-white.",
    "color.link":
      "Link color (hex). Often matches or is close to the primary color.",
    "color.link-inverted":
      "Link color on dark backgrounds (hex). A lighter/brighter variant of the link color.",
    "color.positive": "Success/positive semantic color (hex, typically green).",
    "color.positive-inverted": "Success color for dark backgrounds (hex).",
    "color.informative":
      "Informational semantic color (hex, typically blue/cyan).",
    "color.informative-inverted":
      "Informational color for dark backgrounds (hex).",
    "color.notice":
      "Warning/notice semantic color (hex, typically orange/yellow).",
    "color.notice-inverted": "Warning color for dark backgrounds (hex).",
    "color.negative": "Error/negative semantic color (hex, typically red).",
    "color.negative-inverted": "Error color for dark backgrounds (hex).",
    "font.display.family":
      "Display/heading font family CSS stack. Identify the heading typeface style (serif, sans-serif, slab, geometric, etc.).",
    "font.copy.family":
      "Body/copy font family CSS stack. Identify the body text typeface style.",
    "font.interface.family":
      "UI/interface font family CSS stack. Often the same as copy.",
    "font.mono.family": "Monospace font family CSS stack.",
    "font.display.font-size":
      "Base font size for display text in px (number, typically 16-20).",
    "font.display.line-height":
      "Line height for display text (number, typically 1.1-1.3).",
    "font.display.scale-ratio":
      "Type scale ratio for display headings (number, e.g. 1.25 for Major Third, 1.333 for Perfect Fourth).",
    "font.copy.font-size":
      "Base font size for body text in px (number, typically 16-18).",
    "font.copy.line-height":
      "Line height for body text (number, typically 1.4-1.6).",
    "spacing.base":
      "Base spacing unit in px (number, typically 8-16). Determines overall density.",
    "spacing.scale-ratio":
      "Spacing scale ratio (number, typically 1.25-1.5). Controls spacing progression.",
    "border-radius":
      "Default border radius as CSS value (e.g. '8px', '4px', '0px'). Rounded vs sharp corners.",
  };
}

/**
 * Read the JSON branding configuration.
 */
export async function readBrandingJson(): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(BRANDING_JSON_FILE, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Failed to read branding JSON: ${(error as Error).message}`
    );
  }
}

/**
 * Write the JSON branding configuration.
 */
export async function writeBrandingJson(
  config: Record<string, unknown>
): Promise<void> {
  try {
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(BRANDING_JSON_FILE, content, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to write branding JSON: ${(error as Error).message}`
    );
  }
}

/**
 * Get a nested value from an object using dot notation path.
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path
    .split(".")
    .reduce(
      (current, key) =>
        current !== null && current !== undefined
          ? (current as Record<string, unknown>)[key]
          : undefined,
      obj as unknown
    );
}

/**
 * Set a nested value in an object using dot notation path.
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in (current as Record<string, unknown>))) {
      (current as Record<string, unknown>)[key] = {};
    }
    return (current as Record<string, unknown>)[key];
  }, obj as unknown) as Record<string, unknown>;
  target[lastKey] = value;
}

/**
 * Flatten JSON object to dot notation paths.
 */
export function flattenJsonConfig(
  obj: Record<string, unknown>,
  prefix: string = ""
): FlatConfigEntry[] {
  const results: FlatConfigEntry[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      results.push(
        ...flattenJsonConfig(value as Record<string, unknown>, path)
      );
    } else {
      results.push({
        path,
        value: value as string | number | boolean,
        type: typeof value,
      });
    }
  }
  return results;
}

/**
 * Get a human-readable description for factor tokens.
 */
export function getFactorDescription(tokenName: string): string {
  const descriptions: Record<string, string> = {
    "duration-factor": "Multiplier for animation/transition durations",
    "border-radius-factor": "Multiplier for border radius values",
    "box-shadow-blur-factor": "Multiplier for box shadow blur radius",
    "box-shadow-opacity-factor": "Multiplier for box shadow opacity",
    "box-shadow-spread-factor": "Multiplier for box shadow spread radius",
    "spacing-factor": "Multiplier for spacing values",
    "scale-ratio": "Base ratio for typographic/spacing scales",
    "bp-factor": "Breakpoint factor for responsive scaling",
    "bp-ratio": "Breakpoint ratio for responsive calculations",
  };

  for (const [key, desc] of Object.entries(descriptions)) {
    if (tokenName.toLowerCase().includes(key.toLowerCase())) {
      return desc;
    }
  }
  return "Factor/ratio token for calculations";
}
