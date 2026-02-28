/**
 * Host-theme-to-kickstartDS CSS variable bridge.
 *
 * Maps host CSS variables (from `HostContext.styles.variables`) to
 * kickstartDS branding and semantic tokens. This allows preview
 * templates to inherit the host application's color scheme, ensuring
 * the preview blends visually into the AI client's UI.
 *
 * The mapping follows the three-layer token architecture:
 * 1. Host variables → kickstartDS branding tokens (--ks-brand-*)
 * 2. kickstartDS branding → semantic tokens (--ks-*)
 * 3. Semantic → component tokens (--dsa-*) [handled by DS CSS]
 *
 * @see PRD Section 3.2 — Theming CSS variable bridge
 */

// ── Theme bridge CSS ───────────────────────────────────────────────

/**
 * CSS that maps host-provided CSS variables to kickstartDS design tokens.
 *
 * Host variables follow the naming convention documented in the ext-apps
 * specification (HostContext.styles.variables). Each mapping provides a
 * sensible fallback so previews look correct even without host theming.
 */
export const THEME_BRIDGE_CSS = `
/* ─── Host → kickstartDS Token Bridge ───────────────────────────── */
/* Maps standardized McpUiStyleVariableKey CSS variables (SEP-1865) */
/* to kickstartDS design tokens. Host-provided values (via          */
/* applyHostStyleVariables) override these fallbacks automatically. */

:root {
  /* Primary brand color — use ring-primary (accent) or background-info */
  --ks-brand-primary: var(--color-ring-primary, var(--color-background-info, #4e63e0));

  /* Background colors */
  --ks-background-color-default: var(--color-background-primary, #ffffff);
  --ks-background-color-bold: var(--color-background-secondary, #f5f5f5);
  --ks-background-color-accent: var(--color-background-info, #4e63e0);

  /* Foreground / text colors */
  --ks-foreground-color-default: var(--color-text-primary, #171717);
  --ks-foreground-color-muted: var(--color-text-secondary, #6b7280);
  --ks-foreground-color-inverted: var(--color-text-inverse, #ffffff);

  /* Typography */
  --ks-font-display-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  --ks-font-copy-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  --ks-font-interface-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  --ks-font-mono-family: var(--font-mono, ui-monospace, monospace);

  /* Border colors */
  --ks-border-color-default: var(--color-border-primary, #e5e7eb);
  --ks-border-color-bold: var(--color-border-secondary, #d1d5db);

  /* Interactive colors */
  --ks-link-color: var(--color-text-info, #4e63e0);
  --ks-link-color-hover: var(--color-text-info, #3b4fd6);

  /* Border radius */
  --ks-border-radius-default: var(--border-radius-md, 4px);
  --ks-border-radius-card: var(--border-radius-lg, 8px);

  /* Shadows */
  --ks-shadow-card: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1));
}
`;

/**
 * Minimal reset + preview chrome CSS.
 *
 * Applied to all preview templates to ensure consistent rendering.
 * Does NOT import the full kickstartDS CSS — that's handled separately
 * via inlined component CSS.
 */
export const PREVIEW_CHROME_CSS = `
/* ─── Preview Chrome ────────────────────────────────────────────── */

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: var(--ks-background-color-default, #ffffff);
  color: var(--ks-foreground-color-default, #171717);
  font-family: var(--ks-font-copy-family, system-ui, sans-serif);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Preview container */
.kds-preview {
  width: 100%;
  overflow-x: hidden;
}

.kds-preview--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--ks-foreground-color-muted, #6b7280);
  font-style: italic;
}

/* Action bar (approve/reject/modify buttons) */
.kds-preview-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--ks-background-color-bold, #f5f5f5);
  border-top: 1px solid var(--ks-border-color-default, #e5e7eb);
  flex-wrap: wrap;
}

.kds-preview-actions button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--ks-border-color-default, #e5e7eb);
  border-radius: var(--ks-border-radius-default, 4px);
  background: var(--ks-background-color-default, #ffffff);
  color: var(--ks-foreground-color-default, #171717);
  font-family: var(--ks-font-interface-family, system-ui, sans-serif);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.kds-preview-actions button:hover {
  background: var(--ks-background-color-bold, #f5f5f5);
  border-color: var(--ks-border-color-bold, #d1d5db);
}

.kds-preview-actions button.primary {
  background: var(--ks-background-color-accent, #4e63e0);
  color: var(--ks-foreground-color-inverted, #ffffff);
  border-color: transparent;
}

.kds-preview-actions button.primary:hover {
  opacity: 0.9;
}

.kds-preview-actions button.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.kds-preview-actions button.danger:hover {
  background: #fef2f2;
}

/* Plan review list styles */
.kds-plan-list {
  list-style: none;
  margin: 0;
  padding: 16px;
  counter-reset: plan-step;
}

.kds-plan-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--ks-background-color-default, #ffffff);
  border: 1px solid var(--ks-border-color-default, #e5e7eb);
  border-radius: var(--ks-border-radius-card, 8px);
  counter-increment: plan-step;
  cursor: grab;
  transition: box-shadow 0.15s ease;
}

.kds-plan-item:hover {
  box-shadow: var(--ks-shadow-card, 0 4px 6px -1px rgba(0,0,0,0.1));
}

.kds-plan-item::before {
  content: counter(plan-step);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ks-background-color-accent, #4e63e0);
  color: var(--ks-foreground-color-inverted, #ffffff);
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.kds-plan-item__content {
  flex: 1;
}

.kds-plan-item__type {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.kds-plan-item__description {
  font-size: 13px;
  color: var(--ks-foreground-color-muted, #6b7280);
}

.kds-plan-item__drag-handle {
  color: var(--ks-foreground-color-muted, #6b7280);
  cursor: grab;
  user-select: none;
  font-size: 16px;
}

/* Section counter badge for page preview */
.kds-section-badge {
  position: relative;
}

.kds-section-badge::before {
  content: attr(data-section-label);
  position: absolute;
  top: 0;
  right: 0;
  padding: 2px 8px;
  background: var(--ks-background-color-accent, #4e63e0);
  color: var(--ks-foreground-color-inverted, #ffffff);
  font-size: 11px;
  font-weight: 600;
  border-radius: 0 0 0 var(--ks-border-radius-default, 4px);
  z-index: 10;
  opacity: 0.85;
}
`;
