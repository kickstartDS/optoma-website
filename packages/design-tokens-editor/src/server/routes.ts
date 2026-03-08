/**
 * Express API routes for the Design Tokens Editor.
 *
 * Provides CRUD operations for token presets via Storyblok Management API.
 * Maintains the same /api/tokens/ interface that the frontend expects.
 */

import { Router, json } from "express";
import type { Request, Response } from "express";
import {
  listThemes,
  getTheme,
  createTheme,
  updateTheme,
  deleteTheme,
  type StoryblokConfig,
} from "./storyblok.js";

export function createRoutes(config: StoryblokConfig): Router {
  const router = Router();
  router.use(json({ limit: "2mb" }));

  // ── GET /api/tokens/ — List all theme names ──────────────────────────

  router.get("/api/tokens/", async (_req: Request, res: Response) => {
    try {
      const names = await listThemes(config);
      res.json(names);
    } catch (err) {
      console.error("Error listing themes:", err);
      res
        .status(500)
        .json(err instanceof Error ? err.message : "Internal Server Error");
    }
  });

  // ── GET /api/tokens/:name — Get a single theme ──────────────────────

  router.get("/api/tokens/:name", async (req: Request, res: Response) => {
    try {
      const data = await getTheme(config, req.params.name);
      if (data === null) {
        res.status(404).json("Not Found");
        return;
      }
      // Return the stored tokens JSON — parse it so the client gets an object
      try {
        res.json(JSON.parse(data));
      } catch {
        res.send(data);
      }
    } catch (err) {
      console.error("Error fetching theme:", err);
      res
        .status(500)
        .json(err instanceof Error ? err.message : "Internal Server Error");
    }
  });

  // ── POST /api/tokens/:name — Create a new theme ─────────────────────

  router.post("/api/tokens/:name", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object") {
        res.status(422).json("Missing or Invalid Data");
        return;
      }

      const tokensJson = JSON.stringify(body);

      // Compute CSS from tokens — import dynamically since it's an ESM module
      let css = "";
      try {
        const { tokensToCss } = await import(
          "@kickstartds/design-system/tokens/tokensToCss.mjs"
        );
        css = tokensToCss(body);
      } catch (e) {
        console.warn("Could not compute CSS from tokens:", e);
      }

      const created = await createTheme(
        config,
        req.params.name,
        tokensJson,
        css
      );
      if (!created) {
        res.status(409).json("Token name already exists");
        return;
      }

      res.status(201).json(body);
    } catch (err) {
      console.error("Error creating theme:", err);
      res
        .status(500)
        .json(err instanceof Error ? err.message : "Internal Server Error");
    }
  });

  // ── PUT /api/tokens/:name — Update an existing theme ─────────────────

  router.put("/api/tokens/:name", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object") {
        res.status(422).json("Missing or Invalid Data");
        return;
      }

      const tokensJson = JSON.stringify(body);

      // Compute CSS from tokens
      let css = "";
      try {
        const { tokensToCss } = await import(
          "@kickstartds/design-system/tokens/tokensToCss.mjs"
        );
        css = tokensToCss(body);
      } catch (e) {
        console.warn("Could not compute CSS from tokens:", e);
      }

      const updated = await updateTheme(
        config,
        req.params.name,
        tokensJson,
        css
      );
      if (!updated) {
        // If the theme doesn't exist yet, create it (PUT is idempotent)
        await createTheme(config, req.params.name, tokensJson, css);
      }

      res.status(200).json(body);
    } catch (err) {
      console.error("Error updating theme:", err);
      res
        .status(500)
        .json(err instanceof Error ? err.message : "Internal Server Error");
    }
  });

  // ── DELETE /api/tokens/:name — Delete a theme ────────────────────────

  router.delete("/api/tokens/:name", async (req: Request, res: Response) => {
    try {
      await deleteTheme(config, req.params.name);
      res.status(200).json("OK");
    } catch (err) {
      console.error("Error deleting theme:", err);
      res
        .status(500)
        .json(err instanceof Error ? err.message : "Internal Server Error");
    }
  });

  // ── GET /api/health — Health check ───────────────────────────────────

  router.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  return router;
}
