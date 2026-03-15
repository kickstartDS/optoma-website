# Storybook Theming Mismatch Analysis

## Problem

The Storybook **manager chrome** (sidebar, toolbar, panels) shows a different theme than the **preview canvas** (rendered components). The preview displays the correct project branding, but the chrome uses stale default kickstartDS values.

## Root Cause

Two completely separate token pipelines feed each layer, and they have diverged.

### Manager / Chrome Pipeline

1. **Source**: `src/token/dictionary/*.json` (Style Dictionary format)
2. **Build step**: `build-tokens` (`kickstartDS tokens compile`) → generates `src/token/tokens.js`
3. **Consumed by**: `.storybook/themes.ts` imports static JS constants from `tokens.js`
4. **Values**: Original kickstartDS defaults — **never updated** when the project branding was customized

### Preview / Components Pipeline

1. **Source**: `src/token/branding-tokens.json` (W3C DTCG format)
2. **Build step**: `branding-tokens` (`node scripts/buildBrandingTokens.mjs`) → generates `src/token/branding-tokens.css`
3. **Consumed by**: Component SCSS references `--ks-brand-*` CSS custom properties at runtime
4. **Values**: Actual project branding — **correctly customized**

### Value Comparison

| Token             | Manager (tokens.js)          | Preview (branding-tokens.css)   |
| ----------------- | ---------------------------- | ------------------------------- |
| Primary color     | `#3065c0` (blue)             | `#007e6f` (teal)                |
| Foreground        | `#06081f`                    | `#151515`                       |
| Font (interface)  | `system-ui, -apple-system, …` (system stack) | `Inter`            |

## Data Flow Diagram

```
src/token/dictionary/*.json                src/token/branding-tokens.json
  (Style Dictionary format)                   (W3C DTCG format)
         │                                           │
    build-tokens                              branding-tokens
  (kickstartDS tokens compile)            (node scripts/buildBrandingTokens.mjs)
         │                                           │
         ▼                                           ▼
  src/token/tokens.js                      src/token/branding-tokens.css
  (ES6 named exports)                     (CSS custom properties --ks-brand-*)
         │                                           │
         ▼                                           ▼
  .storybook/themes.ts                    Component SCSS (runtime cascade)
  → create({ colorPrimary: ... })         → var(--ks-brand-color-primary)
         │                                           │
         ▼                                           ▼
  Storybook Manager Chrome                Storybook Preview Canvas
  (sidebar, toolbar, panels)              (rendered components)
  ─────────────────────────               ────────────────────────
  Blue theme (#3065c0)                    Teal theme (#007e6f) ✅
```

## Key Files

- `src/token/dictionary/color.json` — Style Dictionary color source (stale defaults)
- `src/token/tokens.js` — Generated JS token exports (consumed by themes.ts)
- `src/token/branding-tokens.json` — W3C DTCG branding source (correct project values)
- `src/token/branding-tokens.css` — Generated CSS custom properties (correct)
- `.storybook/themes.ts` — Storybook chrome theme definition (reads stale tokens.js)
- `.storybook/manager.tsx` — Applies theme to manager chrome
- `.storybook/preview.tsx` — Preview decorator (components use CSS vars from branding-tokens.css)
- `sd.config.cjs` — Style Dictionary config (produces tokens.js)
- `scripts/buildBrandingTokens.mjs` — Branding token CSS generator

## Possible Fixes

### Option A: Sync dictionary tokens from branding tokens

Update `src/token/dictionary/*.json` to match the values in `src/token/branding-tokens.json`, so both pipelines produce consistent output. This would require either a manual update or an automated sync script.

**Pros**: No code changes to themes.ts or Storybook config.
**Cons**: Two sources of truth remain; drift can recur.

### Option B: Generate themes.ts from branding tokens directly

Rewrite `.storybook/themes.ts` to import and parse `branding-tokens.json` (or `branding-tokens.css`) instead of `tokens.js`. The `tokensToCss.mjs` script already knows how to convert DTCG JSON to hex values — a similar utility could produce the JS values needed by `create()`.

**Pros**: Single source of truth (branding-tokens.json drives both layers).
**Cons**: Requires a build step or runtime parsing for the manager theme; the Style Dictionary pipeline still exists for other consumers so dictionary tokens may still need updating for non-Storybook uses.

### Option C: Build tokens.js from branding-tokens.json

Add a step that derives the Style Dictionary `dictionary/*.json` files from the W3C DTCG `branding-tokens.json`, making the DTCG file the sole source of truth. Then `build-tokens` produces a `tokens.js` that matches.

**Pros**: Unifies the source of truth; all downstream consumers (Storybook, components, website) stay in sync automatically.
**Cons**: Requires building the DTCG → Style Dictionary format converter.
