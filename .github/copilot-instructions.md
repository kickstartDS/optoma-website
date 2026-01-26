# Copilot Instructions for kickstartDS Storyblok Starter

## Project Overview

This is a **Next.js 13** website using **Storyblok** as headless CMS, powered by **kickstartDS** design system components (`@kickstartds/ds-agency-premium`). It generates static pages with ISR and supports live preview editing in Storyblok's Visual Editor.

## Architecture

### Data Flow

```
Storyblok CMS → storyblok.ts (fetch/transform) → unflatten() → React Components
```

- **Storyblok stores flattened props** (e.g., `image_src`, `image_alt`) which get transformed via `unflatten()` in [helpers/unflatten.ts](helpers/unflatten.ts) into nested objects (`{ image: { src, alt } }`)
- **Story processing** in [helpers/storyblok.ts](helpers/storyblok.ts#L70-L200) handles asset URLs, link resolution, and global references

### Component Registration Pattern

All Storyblok components are registered in [components/index.tsx](components/index.tsx):

```tsx
export const components = {
  page: editablePage,
  section: editable(Section, "components"), // "components" = nested bloks key
  hero: editable(Hero),
  // ...
};
```

The `editable()` HOC wraps kickstartDS components with `storyblokEditable()` for Visual Editor support.

### Page Types

- **page**: Standard pages ([components/Page.tsx](components/Page.tsx))
- **blog-post**: Blog articles ([components/BlogPost.tsx](components/BlogPost.tsx))
- **blog-overview**: Blog listing
- **event-list**, **event-detail**: Events
- **search**: Site search with Pagefind

### Provider Hierarchy

App providers in [pages/\_app.tsx](pages/_app.tsx#L108-L175):

```
LanguageProvider → BlurHashProvider → DsaProviders → ComponentProviders → ImageSizeProviders → ImageRatioProviders
```

[components/ComponentProviders.tsx](components/ComponentProviders.tsx) provides custom implementations for `Picture`, `Link`, and various kickstartDS contexts.

## Key Conventions

### Component Customization

Override kickstartDS components via React Context:

```tsx
// In ComponentProviders.tsx
<PictureContext.Provider value={CustomPicture} {...props} />
```

### Local Component Extensions

Custom components live in `components/{name}/`:

- [components/prompter/](components/prompter/) - AI content generation
- [components/info-table/](components/info-table/) - Custom info table
- [components/headline/](components/headline/) - Extended headline

### TypeScript Types

- **Generated types**: [types/components-schema.d.ts](types/components-schema.d.ts) from Storyblok schema
- Regenerate with: `npm run generate-content-types`

## Design Tokens

### Token Architecture (3 layers)

1. **Branding** (`--ks-brand-*`): Core values in [token/branding-token.css](token/branding-token.css)
2. **Semantic** (`--ks-*`): Purpose-based tokens in `token/*.scss`
3. **Component** (`--dsa-*`): Component-specific customizations

### Token Commands

```bash
npm run extract-tokens   # Extract component tokens
```

## Developer Workflows

### Local Development

```bash
npm run build            # Full build (required before dev)
npm run dev              # Start dev server with SSL proxy on :3010
```

Set Storyblok Visual Editor preview URL to `https://localhost:3010/api/preview/`

### CMS Sync Commands

```bash
npm run push-components              # Push cms/components.123456.json to Storyblok
npm run pull-content-schema          # Pull schema from Storyblok → types/
npm run create-storyblok-config      # Regenerate CMS config from JSON schemas
npm run generate-content-types       # Pull + generate TypeScript types
```

### Build Pipeline

```bash
npm run build  # Runs: build-tokens → extract-tokens → blurhashes → bundle-static-assets → next build → sitemap → pagefind
```

## Environment Variables

Required in `.env.local`:

- `NEXT_STORYBLOK_API_TOKEN` - Preview API token
- `NEXT_STORYBLOK_OAUTH_TOKEN` - Management API token
- `NEXT_STORYBLOK_SPACE_ID` - Space ID (without #)

## Important Files

- [cms/components.123456.json](cms/components.123456.json) - Storyblok component definitions
- [cms/presets.123456.json](cms/presets.123456.json) - Component presets
- [helpers/storyblok.ts](helpers/storyblok.ts) - Storyblok API utilities and story transformations
- [scripts/prepareProject.js](scripts/prepareProject.js) - Project initialization script (should never be run by Copilot)

## Common Patterns

### Adding a New Component to Storyblok

Always consult specialized MCP servers for the Design System for this:

1. Design System Component Builder MCP - for instructions on creating components
2. Design System Design Tokens MCP - for design token extraction and lookup

Steps:

1. Create component locally in `components/`
2. Add to `components` map in [components/index.tsx](components/index.tsx)
3. Update `components/section/section.schema.json` to include new component in the `anyOf` clause of the `components` field
4. Update `package.json` to also include the new component schema in the `create-storyblok-config` script
5. Run `npm run create-storyblok-config` to update CMS schema
6. Inside `cms/components.123456.json` remove everything except the new component definition
7. Run `npm run push-components` to sync with Storyblok
8. Run `npm run generate-content-types` to update TypeScript types

Important:

- Never create or use React state, always write indpendent, pure components, implementing client behaviour using vanilla JavaScript. See the Design System Component Builder MCP for more details.
- Always keep inside the already existing token definitions when adding styles to components, don't try to adopt the shown styling ever. Consult the Design System Design Tokens MCP for more details.
- Always check for existing Design System components before creating new ones, or using native HTML controls. E.g. use `Button` from kickstartDS instead of native `<button>`, the same for form fields. If in question, ask the Design System Storybook MCP.
- In the JSON Schema and prop naming, never use unspecific terms like `items`, prefer more specific names, or prefix with the component name, e.g. `timelineItems` for a Timeline component.
- CSS / SCSS should not be imported in created components, but instead be added to `index.scss` for global inclusion.

### Handling Nested Bloks

Use second argument in `editable()` for components with nested content:

```tsx
section: editable(Section, "components"),  // "components" is the blok field name
slider: editable(Slider, "components"),
```
