/**
 * Content pattern analysis for Storyblok spaces.
 *
 * Analyzes published stories to extract structural patterns —
 * component frequency, section sequences, sub-component item counts,
 * and page archetypes. Used for AI-guided content generation to
 * produce site-consistent content.
 *
 * Pure functions — no framework dependencies beyond `storyblok-js-client`.
 */

import type StoryblokClient from "storyblok-js-client";
import { listStories } from "./stories.js";
import type { ValidationRules } from "./validate.js";

// ─── Types ────────────────────────────────────────────────────────────

interface ComponentFrequency {
  component: string;
  count: number;
  percentage: number;
}

interface SequenceBigram {
  from: string;
  to: string;
  count: number;
}

interface SectionComposition {
  components: string[];
  count: number;
}

export interface SubComponentStats {
  median: number;
  min: number;
  max: number;
  samples: number;
}

interface PageArchetype {
  pattern: string[];
  count: number;
  exampleSlug: string;
}

export interface ContentPatternAnalysis {
  totalStoriesAnalyzed: number;
  componentFrequency: ComponentFrequency[];
  commonSequences: SequenceBigram[];
  sectionCompositions: SectionComposition[];
  subComponentCounts: Record<string, SubComponentStats>;
  pageArchetypes: PageArchetype[];
  unusedComponents: string[];
}

export interface AnalyzeContentPatternsOptions {
  contentType?: string;
  startsWith?: string;
}

// ─── Main function ────────────────────────────────────────────────────

/**
 * Analyzes published stories to extract structural patterns.
 *
 * Iterates all published stories (paginated) and computes:
 * - Component frequency (how often each section component appears)
 * - Common section sequences (which sections tend to follow others)
 * - Section compositions (which components are grouped together)
 * - Sub-component item counts (e.g. median number of FAQ items)
 * - Page archetypes (recurring full-page patterns)
 * - Unused components (components defined in schema but never used)
 *
 * @param client - Content Delivery API client
 * @param validationRules - Schema-derived validation rules (provides rootArrayFields, subComponentMap, allKnownComponents)
 * @param options - Optional contentType and startsWith filters
 */
export async function analyzeContentPatterns(
  client: StoryblokClient,
  validationRules: ValidationRules,
  options: AnalyzeContentPatternsOptions = {}
): Promise<ContentPatternAnalysis> {
  // ── 1. Fetch all stories with pagination ─────────────────────────
  const allStories: Record<string, any>[] = [];
  let page = 1;
  const perPage = 100;
  let total = Infinity;

  while (allStories.length < total) {
    const result = await listStories(client, {
      page,
      perPage,
      contentType: options.contentType || "page",
      startsWith: options.startsWith,
    });

    allStories.push(...result.stories);
    total = result.total;
    page++;

    if (result.stories.length === 0) break;
  }

  // ── 2. Extract section structures ────────────────────────────────
  const componentCounts = new Map<string, number>();
  const sequenceCounts = new Map<string, number>();
  const compositionCounts = new Map<
    string,
    { components: string[]; count: number }
  >();
  const subItemCounts = new Map<string, number[]>();
  const pagePatterns = new Map<
    string,
    { pattern: string[]; count: number; exampleSlug: string }
  >();

  const rootFields = validationRules.rootArrayFields;

  for (const story of allStories) {
    const allSectionTypes: string[][] = [];

    for (const rootField of rootFields) {
      const items: Record<string, any>[] = story.content?.[rootField] || [];
      if (items.length === 0) continue;

      for (const item of items) {
        const components: Record<string, any>[] = item.components || [];
        const componentTypes: string[] = [];

        if (components.length === 0) {
          const type = item.component || item.type;
          if (typeof type === "string") {
            componentTypes.push(type);
            componentCounts.set(type, (componentCounts.get(type) || 0) + 1);
          }
        }

        for (const comp of components) {
          const type = comp.component || comp.type;
          if (typeof type === "string") {
            componentTypes.push(type);
            componentCounts.set(type, (componentCounts.get(type) || 0) + 1);

            // Track sub-component item counts
            for (const [parentType, childKey] of Object.entries(
              validationRules.subComponentMap
            )) {
              if (type === parentType && Array.isArray(comp[childKey])) {
                const key = `${parentType}.${childKey}`;
                const existing = subItemCounts.get(key) || [];
                existing.push(comp[childKey].length);
                subItemCounts.set(key, existing);
              }
            }
          }
        }

        allSectionTypes.push(componentTypes);

        if (componentTypes.length > 0) {
          const compositionKey = componentTypes.join(",");
          const existing = compositionCounts.get(compositionKey);
          if (existing) {
            existing.count++;
          } else {
            compositionCounts.set(compositionKey, {
              components: [...componentTypes],
              count: 1,
            });
          }
        }
      }
    }

    // Track section transition sequences
    const flatTypes = allSectionTypes.map(
      (types) => types.join("+") || "(empty)"
    );
    for (let i = 0; i < flatTypes.length - 1; i++) {
      const key = `${flatTypes[i]}→${flatTypes[i + 1]}`;
      sequenceCounts.set(key, (sequenceCounts.get(key) || 0) + 1);
    }

    // Track full-page patterns
    const pagePattern = flatTypes.filter((t) => t !== "(empty)");
    if (pagePattern.length > 0) {
      const patternKey = pagePattern.join(" | ");
      const existing = pagePatterns.get(patternKey);
      if (existing) {
        existing.count++;
      } else {
        pagePatterns.set(patternKey, {
          pattern: pagePattern,
          count: 1,
          exampleSlug: story.full_slug || story.slug || "",
        });
      }
    }
  }

  // ── 3. Compute statistics ────────────────────────────────────────
  const componentFrequency: ComponentFrequency[] = [
    ...componentCounts.entries(),
  ]
    .map(([component, count]) => ({
      component,
      count,
      percentage:
        allStories.length > 0
          ? Math.round((count / allStories.length) * 100)
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const commonSequences: SequenceBigram[] = [...sequenceCounts.entries()]
    .map(([key, count]) => {
      const [from, to] = key.split("→");
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const sectionCompositions: SectionComposition[] = [
    ...compositionCounts.values(),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const subComponentCountsResult: Record<string, SubComponentStats> = {};
  for (const [key, values] of subItemCounts) {
    if (values.length === 0) continue;
    const sorted = [...values].sort((a, b) => a - b);
    subComponentCountsResult[key] = {
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      samples: sorted.length,
    };
  }

  const pageArchetypes: PageArchetype[] = [...pagePatterns.values()]
    .filter((p) => p.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const usedComponents = new Set(componentCounts.keys());
  const unusedComponents = [...validationRules.allKnownComponents]
    .filter((c) => !usedComponents.has(c))
    .sort();

  return {
    totalStoriesAnalyzed: allStories.length,
    componentFrequency,
    commonSequences,
    sectionCompositions,
    subComponentCounts: subComponentCountsResult,
    pageArchetypes,
    unusedComponents,
  };
}
