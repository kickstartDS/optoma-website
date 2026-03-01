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
import { KDS_COMPONENT_CSS } from "./components-css.generated.js";

// ── Shared HTML helpers ────────────────────────────────────────────

const SHARED_HEAD = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${KDS_GLOBAL_CSS}
      ${KDS_COMPONENT_CSS}
      ${THEME_BRIDGE_CSS}
      ${PREVIEW_CHROME_CSS}
    </style>
`;

/**
 * The ext-apps SDK script block. Uses the CDN-served bundle with all
 * dependencies included, so no import map is needed in the iframe.
 */
const EXT_APPS_SDK_SCRIPT = `https://unpkg.com/@modelcontextprotocol/ext-apps@1/dist/src/app-with-deps.js`;

// ── Page Builder Template ──────────────────────────────────────────

/**
 * Unified page builder template — replaces section-preview and page-preview.
 *
 * Handles both single-section (standalone generate_section) and multi-section
 * (accumulated page building) workflows in one template. Automatically
 * transitions from single to multi mode when sections accumulate.
 *
 * State persistence: sessionStorage (with fallback to in-memory when
 * unavailable). State is also seeded via structuredContent so iframe
 * recreation across tool calls can reconstruct accumulated sections.
 *
 * ontoolresult routing:
 * - generate_section → append pending section
 * - create_page_with_content → show save confirmation
 * - get_story → load existing page (edit mode)
 *
 * Display mode: inline (Phase 4 adds fullscreen)
 *
 * @see PRD Section 5 — Builder UI Layout
 */
export const PAGE_BUILDER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    ${SHARED_HEAD}
    <title>Page Builder</title>
</head>
<body>
    <div id="builder-header" class="kds-builder-header" style="display: none;">
        <div class="kds-builder-header__title">
            <span id="header-title">Page Builder</span>
        </div>
        <div class="kds-builder-header__actions">
            <span id="header-count" class="kds-builder-header__count"></span>
            <button id="btn-fullscreen" class="kds-builder-header__fullscreen" style="display: none;" title="Toggle fullscreen">⛶</button>
        </div>
    </div>
    <div id="preview-container" class="kds-preview kds-preview--loading">
        Waiting for section data…
    </div>
    <div id="actions" class="kds-preview-actions" style="display: none;">
        <button id="btn-approve" class="primary">✅ Approve</button>
        <button id="btn-modify">✏️ Modify</button>
        <button id="btn-reject" class="danger">❌ Reject</button>
    </div>
    <div id="save-bar" class="kds-builder-save-bar" style="display: none;">
        <span id="save-status"></span>
        <button id="btn-save">💾 Save to Storyblok</button>
    </div>

    <script type="module">
        import { App, applyDocumentTheme, applyHostStyleVariables, applyHostFonts } from "${EXT_APPS_SDK_SCRIPT}";

        const app = new App(
            { name: "kds-page-builder", version: "1.0.0" },
            { availableDisplayModes: ["inline", "fullscreen"] }
        );
        let currentDisplayMode = "inline";

        // ── Session storage helpers (with sandbox guard) ─────────────
        const STORAGE_KEY = "kds-builder-state";
        function storageAvailable() {
            try { sessionStorage.setItem("__test", "1"); sessionStorage.removeItem("__test"); return true; }
            catch { return false; }
        }
        const useStorage = storageAvailable();
        function saveState(state) {
            if (useStorage) try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
        }
        function loadState() {
            if (useStorage) try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch {}
            return null;
        }

        // ── Builder state ────────────────────────────────────────────
        let state = loadState() || {
            mode: "empty",
            sections: [],
            sourceStory: null,
            rootFields: {},
            saved: false,
            saveResult: null,
        };

        let nextSectionId = state.sections.length + 1;

        // ── Host styling ─────────────────────────────────────────────
        function applyHostStyles(ctx) {
            if (ctx.theme) applyDocumentTheme(ctx.theme);
            if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
            if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
        }

        function applyContainerDimensions(ctx) {
            if (!ctx?.containerDimensions) return;
            const dims = ctx.containerDimensions;
            const html = document.documentElement;
            if ('width' in dims) {
                html.style.width = '100vw';
                document.body.style.minWidth = '0';
            } else if ('maxWidth' in dims && dims.maxWidth) {
                html.style.maxWidth = dims.maxWidth + 'px';
            }
            if ('height' in dims) {
                html.style.height = '100vh';
            } else if ('maxHeight' in dims && dims.maxHeight) {
                html.style.maxHeight = dims.maxHeight + 'px';
            }
        }

        // ── Render functions ─────────────────────────────────────────

        function getCommittedSections() {
            return state.sections.filter(s => s.status !== "removed");
        }

        function renderBuilder() {
            const container = document.getElementById("preview-container");
            const actions = document.getElementById("actions");
            const header = document.getElementById("builder-header");
            const saveBar = document.getElementById("save-bar");

            // If saved, show the save result
            if (state.saved && state.saveResult) {
                showSaveResult(state.saveResult);
                return;
            }

            const active = getCommittedSections();
            const pendingSections = state.sections.filter(s => s.status === "pending");

            // No sections yet — loading state
            if (active.length === 0 && pendingSections.length === 0) {
                container.className = "kds-preview kds-preview--loading";
                container.textContent = "Waiting for section data…";
                actions.style.display = "none";
                header.style.display = "none";
                saveBar.style.display = "none";
                return;
            }

            // Single section mode: only 1 section total and it's pending
            if (state.sections.length === 1 && pendingSections.length === 1) {
                renderSingleMode(pendingSections[0]);
                return;
            }

            // Multi-section mode
            renderMultiMode();
        }

        function renderSingleMode(section) {
            const container = document.getElementById("preview-container");
            const actions = document.getElementById("actions");
            const header = document.getElementById("builder-header");
            const saveBar = document.getElementById("save-bar");

            header.style.display = "none";
            saveBar.style.display = "none";

            container.className = "kds-preview";
            if (section.renderedHtml) {
                container.innerHTML = section.renderedHtml;
            } else {
                container.innerHTML = "<p>No preview available for this section.</p>";
            }

            actions.style.display = "flex";
            actions.innerHTML =
                '<button id="btn-approve" class="primary">✅ Approve</button>'
                + '<button id="btn-modify">✏️ Modify</button>'
                + '<button id="btn-reject" class="danger">❌ Reject</button>';
            wireSingleActions(section);
        }

        function renderMultiMode() {
            const container = document.getElementById("preview-container");
            const actions = document.getElementById("actions");
            const header = document.getElementById("builder-header");
            const saveBar = document.getElementById("save-bar");

            // Show header
            const active = getCommittedSections();
            const isEdit = state.mode === "edit-page";

            header.style.display = "flex";
            if (isEdit) {
                header.classList.add("kds-builder-header--edit");
            } else {
                header.classList.remove("kds-builder-header--edit");
            }
            document.getElementById("header-title").textContent =
                isEdit ? ("Editing: " + (state.sourceStory?.name || "Page")) : "Page Builder";
            document.getElementById("header-count").textContent =
                active.length + " section" + (active.length !== 1 ? "s" : "");

            // Wire fullscreen button
            const fsBtn = document.getElementById("btn-fullscreen");
            if (fsBtn) {
                fsBtn.style.display = "inline-flex";
                fsBtn.onclick = toggleFullscreen;
            }

            // Hide single-mode actions
            actions.style.display = "none";

            // Render all sections
            container.className = "kds-preview";
            let html = "";
            let visibleIndex = 0;

            for (const section of state.sections) {
                if (section.status === "removed") continue;
                visibleIndex++;

                const isPending = section.status === "pending";
                const label = (visibleIndex) + ". " + (section.componentType || "section");

                html += '<div class="kds-builder-section'
                    + (isPending ? ' kds-builder-section--pending' : '')
                    + '" data-section-id="' + section.id + '">';

                // Section badge
                html += '<div class="kds-section-badge" data-section-label="' + label + '">';
                if (isPending) {
                    html += '<div class="kds-builder-section__badge">NEW</div>';
                }
                html += (section.renderedHtml || '<p>No preview</p>');
                html += '</div>';

                // Per-section controls
                if (isPending) {
                    html += '<div class="kds-builder-pending-actions">'
                        + '<button class="primary" onclick="window.__builderAction(\\'keep\\', \\'' + section.id + '\\')">✓ Keep</button>'
                        + '<button class="danger" onclick="window.__builderAction(\\'discard\\', \\'' + section.id + '\\')">✕ Discard</button>'
                        + '</div>';
                } else {
                    html += '<div class="kds-builder-section__controls">'
                        + '<button class="move" onclick="window.__builderAction(\\'moveUp\\', \\'' + section.id + '\\')" title="Move up">↑</button>'
                        + '<button class="move" onclick="window.__builderAction(\\'moveDown\\', \\'' + section.id + '\\')" title="Move down">↓</button>'
                        + '<button class="danger" onclick="window.__builderAction(\\'remove\\', \\'' + section.id + '\\')" title="Remove">✕</button>'
                        + '</div>';
                }

                html += '</div>';
            }

            container.innerHTML = html;

            // Show save bar when there are 2+ committed sections
            const committed = state.sections.filter(s => s.status === "committed");
            if (committed.length >= 2) {
                saveBar.style.display = "flex";
                document.getElementById("save-status").textContent =
                    committed.length + " section" + (committed.length !== 1 ? "s" : "") + " ready";
                wireSaveButton();
            } else {
                saveBar.style.display = "none";
            }

            // Scroll to the latest pending section
            const pendingEl = container.querySelector(".kds-builder-section--pending");
            if (pendingEl) {
                pendingEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }

            saveState(state);
        }

        function showSaveResult(data) {
            const container = document.getElementById("preview-container");
            const actions = document.getElementById("actions");
            const header = document.getElementById("builder-header");
            const saveBar = document.getElementById("save-bar");

            header.style.display = "none";
            actions.style.display = "none";
            saveBar.style.display = "none";

            const emoji = data.wasPublished ? '🌍' : '📄';
            const status = data.wasPublished ? 'Published' : 'Draft';

            container.className = "kds-preview";
            container.innerHTML = '<div class="kds-write-result">'
                + '<div class="kds-write-result__icon">' + emoji + '</div>'
                + '<div class="kds-write-result__title">' + (data.message || 'Page created') + '</div>'
                + '<div class="kds-write-result__meta">'
                + '<span>' + status + '</span>'
                + (data.storyName ? ' · <strong>' + data.storyName + '</strong>' : '')
                + (data.sectionCount > 0 ? ' · ' + data.sectionCount + ' section' + (data.sectionCount !== 1 ? 's' : '') : '')
                + '</div>'
                + (data.storySlug ? '<div class="kds-write-result__slug">/' + data.storySlug + '</div>' : '')
                + (data.warnings && data.warnings.length > 0
                    ? '<div class="kds-write-result__warnings">'
                        + data.warnings.map(w => '<div class="kds-write-result__warning">⚠️ ' + w.message + '</div>').join('')
                        + '</div>'
                    : '')
                + '</div>';
        }

        // ── Section management ───────────────────────────────────────

        function addPendingSection(data) {
            const section = {
                id: "s" + (nextSectionId++),
                componentType: data.componentType || "section",
                renderedHtml: data.renderedHtml || null,
                sectionData: data.sectionData || data,
                status: "pending",
                origin: "generated",
            };
            state.sections.push(section);
            if (state.mode === "empty") state.mode = "new-page";
            saveState(state);
            renderBuilder();
        }

        function loadExistingPage(data) {
            const story = data.story;
            const sections = data.sections || [];
            state.mode = "edit-page";
            state.sourceStory = {
                uid: story.uid || story.uuid,
                name: story.name,
                slug: story.slug || story.full_slug,
                storyId: story.id,
            };
            state.sections = sections.map((s, i) => ({
                id: "s" + (nextSectionId++),
                componentType: s.componentType || "section",
                renderedHtml: s.renderedHtml || null,
                sectionData: s.sectionData || s,
                status: "committed",
                origin: "existing",
            }));
            state.saved = false;
            state.saveResult = null;
            saveState(state);
            renderBuilder();
        }

        // ── Builder actions (called from onclick) ────────────────────

        window.__builderAction = async function(action, sectionId) {
            const idx = state.sections.findIndex(s => s.id === sectionId);
            if (idx === -1) return;

            if (action === "keep") {
                state.sections[idx].status = "committed";
                saveState(state);
                renderBuilder();
            } else if (action === "discard") {
                state.sections.splice(idx, 1);
                if (state.sections.length === 0) state.mode = "empty";
                saveState(state);
                renderBuilder();
            } else if (action === "remove") {
                // Use the remove_section app tool
                try {
                    await app.callServerTool({
                        name: "remove_section",
                        arguments: { index: idx, sectionId: sectionId },
                    });
                } catch {}
                state.sections.splice(idx, 1);
                if (state.sections.length === 0) state.mode = "empty";
                saveState(state);
                renderBuilder();
                try {
                    await app.sendMessage({
                        role: "user",
                        content: [{ type: "text", text: "Removed section " + (idx + 1) }],
                    });
                } catch {}
            } else if (action === "moveUp") {
                if (idx > 0) {
                    const visible = state.sections.filter(s => s.status !== "removed");
                    const visIdx = visible.indexOf(state.sections[idx]);
                    if (visIdx > 0) {
                        // Swap in the main array
                        const prevVisible = visible[visIdx - 1];
                        const prevIdx = state.sections.indexOf(prevVisible);
                        [state.sections[prevIdx], state.sections[idx]] = [state.sections[idx], state.sections[prevIdx]];
                        try {
                            await app.callServerTool({
                                name: "move_section",
                                arguments: { fromIndex: visIdx, toIndex: visIdx - 1 },
                            });
                        } catch {}
                        saveState(state);
                        renderBuilder();
                    }
                }
            } else if (action === "moveDown") {
                const visible = state.sections.filter(s => s.status !== "removed");
                const visIdx = visible.indexOf(state.sections[idx]);
                if (visIdx < visible.length - 1) {
                    const nextVisible = visible[visIdx + 1];
                    const nextIdx = state.sections.indexOf(nextVisible);
                    [state.sections[idx], state.sections[nextIdx]] = [state.sections[nextIdx], state.sections[idx]];
                    try {
                        await app.callServerTool({
                            name: "move_section",
                            arguments: { fromIndex: visIdx, toIndex: visIdx + 1 },
                        });
                    } catch {}
                    saveState(state);
                    renderBuilder();
                }
            }
        };

        // ── Single-mode action wiring ────────────────────────────────

        function wireSingleActions(section) {
            document.getElementById("btn-approve").addEventListener("click", async () => {
                const actions = document.getElementById("actions");
                const buttons = actions.querySelectorAll("button");
                buttons.forEach(b => b.disabled = true);
                try {
                    await app.callServerTool({
                        name: "approve_section",
                        arguments: { section: section.sectionData },
                    });
                    // Mark as committed
                    section.status = "committed";
                    saveState(state);
                    actions.classList.add("submitted");
                    actions.innerHTML = '<span class="kds-action-status success">✅ Section approved</span>';
                    try {
                        await app.sendMessage({
                            role: "user",
                            content: [{ type: "text", text: "approve_section: Section approved" }],
                        });
                    } catch {}
                } catch (err) {
                    buttons.forEach(b => b.disabled = false);
                    const errSpan = document.createElement("span");
                    errSpan.className = "kds-action-status error";
                    errSpan.textContent = "⚠️ " + (err.message || "Action failed");
                    actions.prepend(errSpan);
                    setTimeout(() => errSpan.remove(), 4000);
                }
            });

            document.getElementById("btn-modify").addEventListener("click", async () => {
                const actions = document.getElementById("actions");
                const buttons = actions.querySelectorAll("button");
                buttons.forEach(b => b.disabled = true);
                try {
                    await app.callServerTool({
                        name: "modify_section",
                        arguments: { section: section.sectionData },
                    });
                    actions.classList.add("submitted");
                    actions.innerHTML = '<span class="kds-action-status success">✏️ Modification requested — describe your changes in the chat</span>';
                    try {
                        await app.sendMessage({
                            role: "user",
                            content: [{ type: "text", text: "modify_section: Modification requested" }],
                        });
                    } catch {}
                } catch (err) {
                    buttons.forEach(b => b.disabled = false);
                    const errSpan = document.createElement("span");
                    errSpan.className = "kds-action-status error";
                    errSpan.textContent = "⚠️ " + (err.message || "Action failed");
                    actions.prepend(errSpan);
                    setTimeout(() => errSpan.remove(), 4000);
                }
            });

            document.getElementById("btn-reject").addEventListener("click", async () => {
                const actions = document.getElementById("actions");
                const buttons = actions.querySelectorAll("button");
                buttons.forEach(b => b.disabled = true);
                try {
                    await app.callServerTool({
                        name: "reject_section",
                        arguments: { reason: "User rejected section" },
                    });
                    // Remove the section
                    state.sections = [];
                    state.mode = "empty";
                    saveState(state);
                    actions.classList.add("submitted");
                    actions.innerHTML = '<span class="kds-action-status success">❌ Section rejected</span>';
                    try {
                        await app.sendMessage({
                            role: "user",
                            content: [{ type: "text", text: "reject_section: Section rejected" }],
                        });
                    } catch {}
                } catch (err) {
                    buttons.forEach(b => b.disabled = false);
                    const errSpan = document.createElement("span");
                    errSpan.className = "kds-action-status error";
                    errSpan.textContent = "⚠️ " + (err.message || "Action failed");
                    actions.prepend(errSpan);
                    setTimeout(() => errSpan.remove(), 4000);
                }
            });
        }

        // ── Save button wiring ───────────────────────────────────────

        function wireSaveButton() {
            const btn = document.getElementById("btn-save");
            // Remove old listener by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener("click", async () => {
                newBtn.disabled = true;
                newBtn.textContent = "Saving…";
                const committed = state.sections.filter(s => s.status === "committed");
                const sectionData = committed.map(s => s.sectionData);
                const isEdit = state.mode === "edit-page";
                try {
                    await app.callServerTool({
                        name: "save_page",
                        arguments: {
                            mode: isEdit ? "update" : "create",
                            sections: sectionData,
                            storyUid: isEdit ? state.sourceStory?.uid : undefined,
                            rootFields: Object.keys(state.rootFields).length > 0 ? state.rootFields : undefined,
                        },
                    });
                    state.saved = true;
                    state.saveResult = {
                        success: true,
                        message: isEdit ? "Page updated" : "Page created",
                        storyName: state.sourceStory?.name || "New Page",
                        storySlug: state.sourceStory?.slug || "",
                        sectionCount: committed.length,
                        wasPublished: false,
                    };
                    saveState(state);
                    renderBuilder();
                    try {
                        await app.sendMessage({
                            role: "user",
                            content: [{ type: "text", text: "save_page: " + (isEdit ? "Page updated" : "Page created") + " with " + committed.length + " sections" }],
                        });
                    } catch {}
                } catch (err) {
                    newBtn.disabled = false;
                    newBtn.textContent = "💾 Save to Storyblok";
                    const saveBar = document.getElementById("save-bar");
                    const errSpan = document.createElement("span");
                    errSpan.className = "kds-action-status error";
                    errSpan.textContent = "⚠️ " + (err.message || "Save failed");
                    saveBar.prepend(errSpan);
                    setTimeout(() => errSpan.remove(), 5000);
                }
            });
        }

        // ── Tool lifecycle handlers ──────────────────────────────────

        app.ontoolinput = (params) => {
            const container = document.getElementById("preview-container");
            const args = params?.arguments;
            if (args?.componentType) {
                // Only show loading if this is the first/only section
                if (state.sections.length === 0) {
                    container.className = "kds-preview kds-preview--loading";
                    container.textContent = "Generating " + args.componentType + " section…";
                }
            }
        };

        app.ontoolinputpartial = (partial) => {
            const container = document.getElementById("preview-container");
            const args = partial?.arguments;
            if (args?.componentType && state.sections.length === 0) {
                container.className = "kds-preview kds-preview--loading";
                container.textContent = "Generating " + args.componentType + " section…";
            }
        };

        app.ontoolresult = (result) => {
            const data = result?.structuredContent || result;

            if (data?.renderedHtml && data?.componentType && data?.sectionData) {
                // generate_section result → add pending section
                addPendingSection(data);
            } else if (data?.story && data?.sections && Array.isArray(data.sections)) {
                // get_story result → load existing page
                loadExistingPage(data);
            } else if (data?.renderedSections && Array.isArray(data.renderedSections)) {
                // create_page_with_content result with rendered sections → show save confirmation
                state.saved = true;
                state.saveResult = {
                    success: true,
                    message: data.message || "Page created",
                    storyName: data.storyName || "",
                    storySlug: data.storySlug || "",
                    sectionCount: data.sectionCount || data.renderedSections.length,
                    wasPublished: data.wasPublished || false,
                    warnings: data.warnings,
                };
                saveState(state);
                showSaveResult(state.saveResult);
            } else if (data?.success && data?.message) {
                // Generic write result
                state.saved = true;
                state.saveResult = data;
                saveState(state);
                showSaveResult(data);
            } else if (data?.renderedHtml) {
                // Fallback: single section without componentType
                addPendingSection({ componentType: "section", renderedHtml: data.renderedHtml, sectionData: data });
            } else {
                // Unknown — show as-is
                const container = document.getElementById("preview-container");
                container.className = "kds-preview";
                container.innerHTML = "<p>No preview available.</p>";
            }
        };

        app.ontoolcancelled = (params) => {
            const container = document.getElementById("preview-container");
            // Only reset to cancelled if nothing is accumulated yet
            if (state.sections.length === 0) {
                container.className = "kds-preview";
                container.innerHTML = "<p>Generation cancelled" + (params?.reason ? ": " + params.reason : "") + "</p>";
            }
        };

        app.onteardown = async () => {
            return {};
        };

        app.onhostcontextchanged = (ctx) => {
            applyHostStyles(ctx);
            applyContainerDimensions(ctx);
            if (ctx.displayMode) {
                currentDisplayMode = ctx.displayMode;
                document.body.classList.toggle("fullscreen", ctx.displayMode === "fullscreen");
            }
        };

        async function toggleFullscreen() {
            const newMode = currentDisplayMode === "fullscreen" ? "inline" : "fullscreen";
            try {
                const result = await app.requestDisplayMode({ mode: newMode });
                currentDisplayMode = result.mode;
                document.body.classList.toggle("fullscreen", result.mode === "fullscreen");
            } catch {
                // Display mode not supported by this host
            }
        }

        // ── Connect with timeout ─────────────────────────────────────
        try {
            const connectTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Connection timed out")), 10000)
            );
            await Promise.race([app.connect(), connectTimeout]);
            const hostCtx = app.getHostContext();
            if (hostCtx) {
                applyHostStyles(hostCtx);
                applyContainerDimensions(hostCtx);
            }
            // Render any restored state
            renderBuilder();
        } catch (err) {
            const container = document.getElementById("preview-container");
            container.className = "kds-preview";
            container.innerHTML = '<div class="kds-connection-error">'
                + '<div class="kds-connection-error__icon">⚠️</div>'
                + '<div class="kds-connection-error__title">Could not connect to host</div>'
                + '<div class="kds-connection-error__detail">' + (err.message || "Unknown error") + '</div>'
                + '</div>';
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
                const type = step.componentType || step.fieldName || step.type || "unknown";
                const desc = step.intent || step.description || step.prompt || "";
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
            // PagePlan has { sections?: [], fields?: [], reasoning } — unwrap the array
            const planObj = sc?.plan || sc;
            currentPlan = planObj?.sections || planObj?.fields || (Array.isArray(planObj) ? planObj : null);
            const container = document.getElementById("preview-container");
            const actions = document.getElementById("actions");

            if (Array.isArray(currentPlan) && currentPlan.length > 0) {
                container.className = "kds-preview";
                // Show reasoning if available
                const reasoning = planObj?.reasoning;
                const reasoningHtml = reasoning
                    ? '<div class="kds-plan-reasoning">' + reasoning + '</div>'
                    : '';
                container.innerHTML = reasoningHtml + renderPlan(currentPlan);
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

        // Apply container dimensions from host context (per ext-apps spec)
        function applyContainerDimensions(ctx) {
            if (!ctx?.containerDimensions) return;
            const dims = ctx.containerDimensions;
            const html = document.documentElement;

            if ('width' in dims) {
                html.style.width = '100vw';
                document.body.style.minWidth = '0';
            } else if ('maxWidth' in dims && dims.maxWidth) {
                html.style.maxWidth = dims.maxWidth + 'px';
            }

            if ('height' in dims) {
                html.style.height = '100vh';
            } else if ('maxHeight' in dims && dims.maxHeight) {
                html.style.maxHeight = dims.maxHeight + 'px';
            }
        }

        // Respond to host theme/style changes
        app.onhostcontextchanged = (ctx) => {
            applyHostStyles(ctx);
            applyContainerDimensions(ctx);
        };

        // Helper: run an action with loading/success/error feedback
        async function runAction(actionName, toolCall, successMsg) {
            const actions = document.getElementById("actions");
            const buttons = actions.querySelectorAll("button");
            buttons.forEach(b => b.disabled = true);
            try {
                await app.callServerTool(toolCall);
                actions.classList.add("submitted");
                actions.innerHTML = '<span class="kds-action-status success">✅ ' + successMsg + '</span>';
                try {
                    await app.sendMessage({
                        role: "user",
                        content: [{ type: "text", text: actionName + ": " + successMsg }],
                    });
                } catch { /* sendMessage not supported by host */ }
            } catch (err) {
                console.error("Action failed:", err);
                buttons.forEach(b => b.disabled = false);
                const errSpan = document.createElement("span");
                errSpan.className = "kds-action-status error";
                errSpan.textContent = "⚠️ " + (err.message || "Action failed");
                actions.prepend(errSpan);
                setTimeout(() => errSpan.remove(), 4000);
            }
        }

        document.getElementById("btn-approve").addEventListener("click", () => {
            const order = getCurrentOrder();
            runAction("approve_plan",
                { name: "approve_plan", arguments: { order } },
                "Plan approved — proceeding with generation");
        });

        document.getElementById("btn-reject").addEventListener("click", () => {
            runAction("reject_section",
                { name: "reject_section", arguments: { reason: "User rejected plan" } },
                "Plan rejected");
        });

        // Connect to the host with timeout
        try {
            const connectTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Connection timed out")), 10000)
            );
            await Promise.race([app.connect(), connectTimeout]);
            const hostCtx = app.getHostContext();
            if (hostCtx) {
                applyHostStyles(hostCtx);
                applyContainerDimensions(hostCtx);
            }
        } catch (err) {
            const container = document.getElementById("preview-container");
            container.className = "kds-preview";
            container.innerHTML = '<div class="kds-connection-error">'
                + '<div class="kds-connection-error__icon">⚠️</div>'
                + '<div class="kds-connection-error__title">Could not connect to host</div>'
                + '<div class="kds-connection-error__detail">' + (err.message || "Unknown error") + '</div>'
                + '</div>';
        }
    </script>
</body>
</html>`;
