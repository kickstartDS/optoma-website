/**
 * HTML preview templates for ext-apps UI resources.
 *
 * Each template is a self-contained HTML5 document that:
 * 1. Imports the ext-apps SDK via ESM CDN
 * 2. Initializes via `ui/initialize` handshake
 * 3. Receives tool data via `ui/notifications/tool-result`
 * 4. Renders kickstartDS component HTML with inlined design tokens
 * 5. Calls app-only tools via `tools/call` through the host
 *
 * Templates use the ext-apps SDK from the `app-with-deps` subpath which
 * bundles all dependencies for iframe usage (no import maps needed).
 *
 * @see PRD Section 6.2 — UI Resource Templates
 */

import { THEME_BRIDGE_CSS, PREVIEW_CHROME_CSS } from "./theme-bridge.js";
import { KDS_GLOBAL_CSS } from "./tokens.generated.js";

// ── Shared HTML helpers ────────────────────────────────────────────

const SHARED_HEAD = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${KDS_GLOBAL_CSS}
      ${THEME_BRIDGE_CSS}
      ${PREVIEW_CHROME_CSS}
    </style>
`;

/**
 * The ext-apps SDK script block. Uses the CDN-served bundle with all
 * dependencies included, so no import map is needed in the iframe.
 */
const EXT_APPS_SDK_SCRIPT = `https://unpkg.com/@modelcontextprotocol/ext-apps@1/dist/src/app-with-deps.js`;

// ── Section Preview Template ───────────────────────────────────────

/**
 * Section preview template — renders a single generated section.
 *
 * Shown inline in the chat when `generate_section` or `generate_content`
 * completes. Displays the pre-rendered HTML from `renderToStaticMarkup`
 * and provides approve/reject/modify action buttons.
 *
 * Lifecycle (per ext-apps spec):
 * 1. App.connect() → ui/initialize handshake
 * 2. ontoolinput → complete tool arguments (loading state)
 * 3. ontoolinputpartial → streaming partial args (progressive rendering)
 * 4. ontoolresult → final tool result with renderedHtml
 * 5. ontoolcancelled → tool execution was cancelled
 * 6. onteardown → host is unmounting the UI
 *
 * Display mode: `inline` (default)
 */
export const SECTION_PREVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    ${SHARED_HEAD}
    <title>Section Preview</title>
</head>
<body>
    <div id="preview-container" class="kds-preview kds-preview--loading">
        Waiting for section data…
    </div>
    <div id="actions" class="kds-preview-actions" style="display: none;">
        <button id="btn-approve" class="primary">✅ Approve</button>
        <button id="btn-modify">✏️ Modify</button>
        <button id="btn-reject" class="danger">❌ Reject</button>
    </div>

    <script type="module">
        import { App, applyDocumentTheme, applyHostStyleVariables, applyHostFonts } from "${EXT_APPS_SDK_SCRIPT}";

        const app = new App({ name: "kds-section-preview", version: "1.0.0" });
        let currentData = null;

        // Apply host styling (theme, CSS variables, fonts)
        function applyHostStyles(ctx) {
            if (ctx.theme) applyDocumentTheme(ctx.theme);
            if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
            if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
        }

        // Handle complete tool input — show loading state with component type
        app.ontoolinput = (params) => {
            const container = document.getElementById("preview-container");
            const args = params?.arguments;
            if (args?.componentType) {
                container.className = "kds-preview kds-preview--loading";
                container.textContent = "Generating " + args.componentType + " section…";
            }
        };

        // Handle streaming partial tool arguments (progressive rendering).
        // The host streams the LLM's tool call arguments as they're generated.
        app.ontoolinputpartial = (partial) => {
            const container = document.getElementById("preview-container");
            const args = partial?.arguments;
            if (args?.componentType) {
                container.className = "kds-preview kds-preview--loading";
                container.textContent = "Generating " + args.componentType + " section…";
            }
        };

        // Handle tool result — server sends pre-rendered HTML via structuredContent
        app.ontoolresult = (result) => {
            currentData = result?.structuredContent || result;
            const container = document.getElementById("preview-container");
            const actions = document.getElementById("actions");

            if (currentData?.renderedHtml) {
                container.className = "kds-preview";
                container.innerHTML = currentData.renderedHtml;
                actions.style.display = "flex";
            } else {
                container.className = "kds-preview";
                container.innerHTML = "<p>No preview available for this section.</p>";
            }
        };

        // Handle tool cancellation
        app.ontoolcancelled = (params) => {
            const container = document.getElementById("preview-container");
            container.className = "kds-preview";
            container.innerHTML = "<p>Generation cancelled" + (params?.reason ? ": " + params.reason : "") + "</p>";
        };

        // Handle teardown — host is unmounting the UI
        app.onteardown = async () => {
            return {};
        };

        // Respond to host theme/style changes
        app.onhostcontextchanged = (ctx) => {
            applyHostStyles(ctx);
        };

        // Action buttons call app-only tools via callServerTool
        document.getElementById("btn-approve").addEventListener("click", async () => {
            if (currentData) {
                await app.callServerTool({ name: "approve_section", arguments: { section: currentData } });
            }
        });

        document.getElementById("btn-modify").addEventListener("click", async () => {
            if (currentData) {
                await app.callServerTool({ name: "modify_section", arguments: { section: currentData } });
            }
        });

        document.getElementById("btn-reject").addEventListener("click", async () => {
            await app.callServerTool({ name: "reject_section", arguments: { reason: "User rejected section" } });
        });

        // Connect to the host, then apply initial host styles
        await app.connect();
        const hostCtx = app.getHostContext();
        if (hostCtx) applyHostStyles(hostCtx);
    </script>
</body>
</html>`;

// ── Page Preview Template ──────────────────────────────────────────

/**
 * Page preview template — renders a full page with multiple sections.
 *
 * Shown when a complete page has been generated (multiple sections
 * stacked vertically). Each section is labeled with a numbered badge.
 * Supports fullscreen display mode for better page overview.
 *
 * Display mode: `inline`, supports fullscreen toggle
 */
export const PAGE_PREVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    ${SHARED_HEAD}
    <title>Page Preview</title>
</head>
<body>
    <div id="preview-container" class="kds-preview kds-preview--loading">
        Waiting for page data…
    </div>
    <div id="actions" class="kds-preview-actions" style="display: none;">
        <button id="btn-approve" class="primary">✅ Approve Page</button>
        <button id="btn-modify">✏️ Modify</button>
        <button id="btn-reject" class="danger">❌ Reject</button>
        <button id="btn-fullscreen">🔍 Fullscreen</button>
    </div>

    <script type="module">
        import { App, applyDocumentTheme, applyHostStyleVariables, applyHostFonts } from "${EXT_APPS_SDK_SCRIPT}";

        const app = new App(
            { name: "kds-page-preview", version: "1.0.0" },
            { availableDisplayModes: ["inline", "fullscreen"] }
        );
        let currentData = null;
        let currentDisplayMode = "inline";

        // Apply host styling (theme, CSS variables, fonts)
        function applyHostStyles(ctx) {
            if (ctx.theme) applyDocumentTheme(ctx.theme);
            if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
            if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
        }

        // Handle complete tool input — show loading state
        app.ontoolinput = (params) => {
            const container = document.getElementById("preview-container");
            container.className = "kds-preview kds-preview--loading";
            container.textContent = "Generating page preview…";
        };

        app.ontoolresult = (result) => {
            currentData = result?.structuredContent || result;
            const container = document.getElementById("preview-container");
            const actions = document.getElementById("actions");

            const sections = currentData?.renderedSections || currentData?.sections;
            if (sections && Array.isArray(sections)) {
                container.className = "kds-preview";
                container.innerHTML = sections
                    .map((section, i) => {
                        const label = section.componentType
                            ? (i + 1) + ". " + section.componentType
                            : "Section " + (i + 1);
                        const html = section.renderedHtml || "<p>No preview</p>";
                        return '<div class="kds-section-badge" data-section-label="' + label + '">' + html + '</div>';
                    })
                    .join("");
                actions.style.display = "flex";
            } else if (currentData?.renderedHtml) {
                container.className = "kds-preview";
                container.innerHTML = currentData.renderedHtml;
                actions.style.display = "flex";
            } else {
                container.className = "kds-preview";
                container.innerHTML = "<p>No preview available.</p>";
            }
        };

        // Handle tool cancellation
        app.ontoolcancelled = (params) => {
            const container = document.getElementById("preview-container");
            container.className = "kds-preview";
            container.innerHTML = "<p>Generation cancelled" + (params?.reason ? ": " + params.reason : "") + "</p>";
        };

        // Handle teardown
        app.onteardown = async () => {
            return {};
        };

        // Respond to host context changes (theme, display mode, styles)
        app.onhostcontextchanged = (ctx) => {
            applyHostStyles(ctx);
            if (ctx.displayMode) {
                currentDisplayMode = ctx.displayMode;
                document.body.classList.toggle("fullscreen", ctx.displayMode === "fullscreen");
            }
            // Show/hide fullscreen button based on host support
            if (ctx.availableDisplayModes) {
                const fsBtn = document.getElementById("btn-fullscreen");
                fsBtn.style.display = ctx.availableDisplayModes.includes("fullscreen") ? "inline-flex" : "none";
            }
        };

        document.getElementById("btn-approve").addEventListener("click", async () => {
            if (currentData) {
                await app.callServerTool({ name: "approve_section", arguments: { section: currentData } });
            }
        });

        document.getElementById("btn-modify").addEventListener("click", async () => {
            if (currentData) {
                await app.callServerTool({ name: "modify_section", arguments: { section: currentData } });
            }
        });

        document.getElementById("btn-reject").addEventListener("click", async () => {
            await app.callServerTool({ name: "reject_section", arguments: { reason: "User rejected page" } });
        });

        document.getElementById("btn-fullscreen").addEventListener("click", async () => {
            const newMode = currentDisplayMode === "fullscreen" ? "inline" : "fullscreen";
            try {
                const result = await app.requestDisplayMode({ mode: newMode });
                currentDisplayMode = result.mode;
                document.body.classList.toggle("fullscreen", result.mode === "fullscreen");
            } catch {
                // Display mode not supported by this host
            }
        });

        // Connect to the host, then apply initial host styles
        await app.connect();
        const hostCtx = app.getHostContext();
        if (hostCtx) {
            applyHostStyles(hostCtx);
            if (hostCtx.displayMode) {
                currentDisplayMode = hostCtx.displayMode;
                document.body.classList.toggle("fullscreen", hostCtx.displayMode === "fullscreen");
            }
            if (hostCtx.availableDisplayModes) {
                const fsBtn = document.getElementById("btn-fullscreen");
                fsBtn.style.display = hostCtx.availableDisplayModes.includes("fullscreen") ? "inline-flex" : "none";
            }
        }
    </script>
</body>
</html>`;

// ── Plan Review Template ───────────────────────────────────────────

/**
 * Plan review template — displays the planned section sequence.
 *
 * Shown after `plan_page` completes. Renders each planned section as
 * a card in a vertical list. Supports drag-to-reorder and provides
 * approve/reject buttons for the overall plan.
 *
 * Display mode: `inline`
 */
export const PLAN_REVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    ${SHARED_HEAD}
    <title>Plan Review</title>
    <style>
        .kds-plan-item.dragging {
            opacity: 0.5;
            border-style: dashed;
        }
        .kds-plan-item.drag-over {
            border-color: var(--color-ring-primary, var(--ks-background-color-accent, #4e63e0));
            border-width: 2px;
        }
    </style>
</head>
<body>
    <div id="preview-container" class="kds-preview kds-preview--loading">
        Waiting for plan data…
    </div>
    <div id="actions" class="kds-preview-actions" style="display: none;">
        <button id="btn-approve" class="primary">✅ Approve Plan</button>
        <button id="btn-reject" class="danger">❌ Reject</button>
    </div>

    <script type="module">
        import { App, applyDocumentTheme, applyHostStyleVariables, applyHostFonts } from "${EXT_APPS_SDK_SCRIPT}";

        const app = new App({ name: "kds-plan-review", version: "1.0.0" });
        let currentPlan = null;

        // Apply host styling (theme, CSS variables, fonts)
        function applyHostStyles(ctx) {
            if (ctx.theme) applyDocumentTheme(ctx.theme);
            if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
            if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
        }

        function renderPlan(plan) {
            if (!plan || !plan.length) return "<p>No plan available.</p>";

            const items = plan.map((step) => {
                const type = step.componentType || step.type || "unknown";
                const desc = step.description || step.prompt || "";
                return '<li class="kds-plan-item" draggable="true" data-type="' + type + '">'
                    + '<span class="kds-plan-item__drag-handle">⠿</span>'
                    + '<div class="kds-plan-item__content">'
                    + '<div class="kds-plan-item__type">' + type + '</div>'
                    + (desc ? '<div class="kds-plan-item__description">' + desc + '</div>' : '')
                    + '</div>'
                    + '</li>';
            }).join("");

            return '<ol class="kds-plan-list">' + items + '</ol>';
        }

        function getCurrentOrder() {
            const items = document.querySelectorAll(".kds-plan-item");
            return Array.from(items).map(item => item.getAttribute("data-type"));
        }

        // Drag-and-drop reorder
        function setupDragAndDrop() {
            const list = document.querySelector(".kds-plan-list");
            if (!list) return;

            let dragItem = null;

            list.addEventListener("dragstart", (e) => {
                dragItem = e.target.closest(".kds-plan-item");
                if (dragItem) dragItem.classList.add("dragging");
            });

            list.addEventListener("dragend", (e) => {
                const item = e.target.closest(".kds-plan-item");
                if (item) item.classList.remove("dragging");
                document.querySelectorAll(".kds-plan-item").forEach(el =>
                    el.classList.remove("drag-over")
                );

                // Send reorder to server via callServerTool
                const newOrder = getCurrentOrder();
                app.callServerTool({ name: "reorder_plan", arguments: { order: newOrder } });
            });

            list.addEventListener("dragover", (e) => {
                e.preventDefault();
                const target = e.target.closest(".kds-plan-item");
                if (target && target !== dragItem) {
                    document.querySelectorAll(".kds-plan-item").forEach(el =>
                        el.classList.remove("drag-over")
                    );
                    target.classList.add("drag-over");

                    const rect = target.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        list.insertBefore(dragItem, target);
                    } else {
                        list.insertBefore(dragItem, target.nextSibling);
                    }
                }
            });
        }

        // Handle complete tool input — show loading state
        app.ontoolinput = (params) => {
            const container = document.getElementById("preview-container");
            container.className = "kds-preview kds-preview--loading";
            container.textContent = "Planning page structure…";
        };

        app.ontoolresult = (result) => {
            const sc = result?.structuredContent || result;
            currentPlan = sc?.plan || sc?.sections || sc;
            const container = document.getElementById("preview-container");
            const actions = document.getElementById("actions");

            if (Array.isArray(currentPlan) && currentPlan.length > 0) {
                container.className = "kds-preview";
                container.innerHTML = renderPlan(currentPlan);
                actions.style.display = "flex";
                setupDragAndDrop();
            } else {
                container.className = "kds-preview";
                container.innerHTML = "<p>No plan data received.</p>";
            }
        };

        // Handle tool cancellation
        app.ontoolcancelled = (params) => {
            const container = document.getElementById("preview-container");
            container.className = "kds-preview";
            container.innerHTML = "<p>Planning cancelled" + (params?.reason ? ": " + params.reason : "") + "</p>";
        };

        // Handle teardown
        app.onteardown = async () => {
            return {};
        };

        // Respond to host theme/style changes
        app.onhostcontextchanged = (ctx) => {
            applyHostStyles(ctx);
        };

        document.getElementById("btn-approve").addEventListener("click", async () => {
            const order = getCurrentOrder();
            await app.callServerTool({ name: "approve_plan", arguments: { order } });
        });

        document.getElementById("btn-reject").addEventListener("click", async () => {
            await app.callServerTool({ name: "reject_section", arguments: { reason: "User rejected plan" } });
        });

        // Connect to the host, then apply initial host styles
        await app.connect();
        const hostCtx = app.getHostContext();
        if (hostCtx) applyHostStyles(hostCtx);
    </script>
</body>
</html>`;
