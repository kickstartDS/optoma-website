/**
 * Server-side rendering pipeline for kickstartDS components.
 *
 * Uses `renderToStaticMarkup` from `react-dom/server` to render actual
 * kickstartDS Design System React components to clean HTML strings.
 * The output is identical to what the website produces — same DOM
 * structure, same CSS class names, same `data-*` attributes.
 *
 * This pipeline does NOT require a browser or Puppeteer. The kickstartDS
 * components are pure functional React components with no browser API
 * dependencies. `DsaProviders` supplies rendering-time context (theme
 * providers, component context overrides) without needing a DOM.
 *
 * The rendered HTML is passed to ext-apps UI resources as `renderedHtml`
 * in `structuredContent`, where the host's sandboxed iframe inserts it
 * into the DOM and applies the inlined CSS.
 *
 * @see PRD Section 6.3 — Server-Side Rendering with renderToStaticMarkup
 */

import React, { type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ── kickstartDS component imports ──────────────────────────────────

import DsaProviders from "@kickstartds/ds-agency-premium/providers";
import { Section } from "@kickstartds/ds-agency-premium/section";
import { Hero } from "@kickstartds/ds-agency-premium/hero";
import { CtaContextDefault } from "@kickstartds/ds-agency-premium/cta";
import { FaqContextDefault } from "@kickstartds/ds-agency-premium/faq";
import { FeaturesContextDefault } from "@kickstartds/ds-agency-premium/features";
import { TestimonialsContextDefault } from "@kickstartds/ds-agency-premium/testimonials";
import { StatsContextDefault } from "@kickstartds/ds-agency-premium/stats";
import { Gallery } from "@kickstartds/ds-agency-premium/gallery";
import { TextContextDefault } from "@kickstartds/ds-agency-premium/text";
import { ImageTextContextDefault } from "@kickstartds/ds-agency-premium/image-text";
import { Logos } from "@kickstartds/ds-agency-premium/logos";
import { DividerContextDefault } from "@kickstartds/ds-agency-premium/divider";
import { Contact } from "@kickstartds/ds-agency-premium/contact";
import { Mosaic } from "@kickstartds/ds-agency-premium/mosaic";
import { VideoCurtainContextDefault } from "@kickstartds/ds-agency-premium/video-curtain";
import { ImageStory } from "@kickstartds/ds-agency-premium/image-story";

// ── Component registry ─────────────────────────────────────────────

/**
 * Maps Storyblok/Design System component names to their React components.
 *
 * Uses the same component selection as the website's `components` map
 * in `packages/website/components/index.tsx`, but without Next.js
 * dynamic imports or Storyblok editability wrappers.
 *
 * Components that are sub-components (feature, stat, testimonial, etc.)
 * are NOT included here — they are rendered as children by their parent
 * container components (features, stats, testimonials).
 */
const COMPONENT_MAP: Record<string, ComponentType<any>> = {
  hero: Hero,
  cta: CtaContextDefault,
  faq: FaqContextDefault,
  features: FeaturesContextDefault,
  testimonials: TestimonialsContextDefault,
  stats: StatsContextDefault,
  gallery: Gallery,
  text: TextContextDefault,
  "image-text": ImageTextContextDefault,
  logos: Logos,
  divider: DividerContextDefault,
  contact: Contact,
  mosaic: Mosaic,
  "video-curtain": VideoCurtainContextDefault,
  "image-story": ImageStory,
};

// ── Render functions ───────────────────────────────────────────────

/**
 * Render a single section's inner component to static HTML.
 *
 * Takes a Design System component data object (with `component` discriminator)
 * and renders it using the actual kickstartDS React component, wrapped in
 * `DsaProviders` for context and `Section` for section-level layout.
 *
 * @param componentData - The component data object (e.g. `{ component: "hero", headline: "...", ... }`)
 * @returns Clean HTML string without React hydration markers, or null if the component type is unknown
 */
export function renderComponentToHtml(
  componentData: Record<string, any>
): string | null {
  const { component, type, _uid, ...props } = componentData;
  const Component = COMPONENT_MAP[component];

  if (!Component) {
    console.error(
      `[render] Unknown component type: "${component}". Available: ${Object.keys(
        COMPONENT_MAP
      ).join(", ")}`
    );
    return null;
  }

  try {
    const html = renderToStaticMarkup(
      <DsaProviders>
        <Component {...props} />
      </DsaProviders>
    );
    return html;
  } catch (err) {
    console.error(`[render] Failed to render component "${component}":`, err);
    return null;
  }
}

/**
 * Render a complete section (Section wrapper + inner component) to static HTML.
 *
 * A "section" in the Design System is a `Section` component that wraps
 * one or more child components. The section data is expected to have the
 * Storyblok format where `component: "section"` and the inner components
 * are nested in a `components` array.
 *
 * @param sectionData - The section data object with `component: "section"` and nested `components`
 * @returns Clean HTML string, or null on failure
 */
export function renderSectionToHtml(
  sectionData: Record<string, any>
): string | null {
  const { component, components, _uid, type, ...sectionProps } = sectionData;

  // If this isn't a section wrapper, render the component directly
  if (component !== "section") {
    return renderComponentToHtml(sectionData);
  }

  try {
    // Render each child component inside the Section wrapper
    const childElements = (components || []).map(
      (child: Record<string, any>, index: number) => {
        const {
          component: childComponent,
          type: childType,
          _uid: childUid,
          ...childProps
        } = child;
        const ChildComponent = COMPONENT_MAP[childComponent];

        if (!ChildComponent) {
          return (
            <div key={childUid || index} data-component={childComponent}>
              {`[Unknown component: ${childComponent}]`}
            </div>
          );
        }

        return <ChildComponent key={childUid || index} {...childProps} />;
      }
    );

    const html = renderToStaticMarkup(
      <DsaProviders>
        <Section {...sectionProps}>{childElements}</Section>
      </DsaProviders>
    );
    return html;
  } catch (err) {
    console.error(`[render] Failed to render section:`, err);
    return null;
  }
}

/**
 * Render multiple sections to HTML and return them as an array.
 *
 * Used for full-page preview rendering. Each section is rendered
 * independently and returned with its component type and HTML.
 *
 * @param sections - Array of section data objects
 * @returns Array of rendered sections with componentType and renderedHtml
 */
export function renderPageSectionsToHtml(
  sections: Record<string, any>[]
): Array<{
  componentType: string;
  renderedHtml: string | null;
  index: number;
}> {
  return sections.map((section, index) => {
    // Extract the primary component type for labeling
    const componentType =
      section.component === "section"
        ? section.components?.[0]?.component || "section"
        : section.component || "unknown";

    return {
      componentType,
      renderedHtml: renderSectionToHtml(section),
      index,
    };
  });
}

/**
 * Get the list of supported component types for rendering.
 */
export function getSupportedComponentTypes(): string[] {
  return Object.keys(COMPONENT_MAP);
}
