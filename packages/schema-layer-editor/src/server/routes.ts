/**
 * Express API routes for the Schema Layer Editor.
 *
 * Handles schema loading, layer loading/saving, and config retrieval.
 */

import { Router, json } from "express";
import type { Request, Response } from "express";
import { loadSchemas } from "./schema-loader.js";
import { loadLayer } from "./layer-loader.js";
import { writeLayerFiles } from "./layer-writer.js";
import {
  recordToOverrideMap,
  recordToComponentOverrides,
  componentOverridesToRecord,
} from "../app/lib/override-model.js";
import type {
  SchemaResponse,
  LayerResponse,
  SaveRequest,
  SaveResponse,
  ConfigResponse,
  ComponentOverrides,
  FieldOverride,
} from "../shared/types.js";

// ─── Config ─────────────────────────────────────────────────────────────────

export interface ServerConfig {
  schemasDir: string;
  layerDir?: string;
  namespace: string;
  baseUrl: string;
  outputDir: string;
}

// ─── State ──────────────────────────────────────────────────────────────────

let cachedSchemas: SchemaResponse | null = null;
let inMemoryOverrides: ComponentOverrides = new Map();

// ─── Route Factory ──────────────────────────────────────────────────────────

export function createRoutes(config: ServerConfig): Router {
  const router = Router();
  router.use(json({ limit: "10mb" }));

  // ── GET /api/schemas ────────────────────────────────────────────────────

  router.get("/api/schemas", (_req: Request, res: Response) => {
    try {
      if (!cachedSchemas) {
        cachedSchemas = loadSchemas(config.schemasDir);
      }
      res.json(cachedSchemas);
    } catch (err) {
      console.error("Error loading schemas:", err);
      res.status(500).json({ error: `Failed to load schemas: ${err}` });
    }
  });

  // ── GET /api/layer ──────────────────────────────────────────────────────

  router.get("/api/layer", (_req: Request, res: Response) => {
    try {
      const record = componentOverridesToRecord(inMemoryOverrides);
      const response: LayerResponse = { overrides: record };
      res.json(response);
    } catch (err) {
      console.error("Error getting layer:", err);
      res.status(500).json({ error: `Failed to get layer: ${err}` });
    }
  });

  // ── POST /api/layer ─────────────────────────────────────────────────────

  router.post("/api/layer", (req: Request, res: Response) => {
    try {
      const body = req.body as {
        overrides: Record<string, Record<string, FieldOverride>>;
      };

      if (!body.overrides) {
        res.status(400).json({ error: "Missing 'overrides' in request body" });
        return;
      }

      inMemoryOverrides = recordToComponentOverrides(body.overrides);
      const record = componentOverridesToRecord(inMemoryOverrides);
      res.json({ success: true, overrides: record });
    } catch (err) {
      console.error("Error updating layer:", err);
      res.status(500).json({ error: `Failed to update layer: ${err}` });
    }
  });

  // ── POST /api/save ──────────────────────────────────────────────────────

  router.post("/api/save", (req: Request, res: Response) => {
    try {
      const body = req.body as SaveRequest;

      const overrides = body.overrides
        ? recordToComponentOverrides(body.overrides)
        : inMemoryOverrides;
      const outputDir = body.outputDir || config.outputDir;
      const namespace = body.namespace || config.namespace;
      const baseUrl = body.baseUrl || config.baseUrl;

      const result = writeLayerFiles(overrides, outputDir, namespace, baseUrl);

      res.json(result);
    } catch (err) {
      console.error("Error saving layer:", err);
      res.status(500).json({ error: `Failed to save layer: ${err}` });
    }
  });

  // ── GET /api/config ─────────────────────────────────────────────────────

  router.get("/api/config", (_req: Request, res: Response) => {
    const response: ConfigResponse = {
      schemasDir: config.schemasDir,
      layerDir: config.layerDir,
      namespace: config.namespace,
      baseUrl: config.baseUrl,
      outputDir: config.outputDir,
    };
    res.json(response);
  });

  // ── Load initial layer if specified ─────────────────────────────────────

  if (config.layerDir) {
    const { overrides, warnings } = loadLayer(config.layerDir);
    inMemoryOverrides = overrides;
    if (warnings.length > 0) {
      console.warn("Layer loading warnings:");
      for (const w of warnings) {
        console.warn(`  - ${w}`);
      }
    }
  }

  return router;
}
