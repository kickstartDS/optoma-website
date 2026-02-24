/**
 * Shared helpers for /api/prompter/* routes.
 *
 * Centralizes CORS middleware, environment validation, client creation,
 * and schema registry initialization so individual routes stay small.
 */
import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import { dirname, resolve } from "path";
import {
  createOpenAiClient,
  createStoryblokClient,
  createContentClient,
  createRegistryFromDirectory,
  ServiceError,
  type SchemaRegistry,
} from "@kickstartds/storyblok-services";

// ─── CORS ─────────────────────────────────────────────────────────────

const corsGet = Cors({ methods: ["GET"], origin: "*" });
const corsPost = Cors({ methods: ["POST"], origin: "*" });

export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export function corsGET(req: NextApiRequest, res: NextApiResponse) {
  return runMiddleware(req, res, corsGet);
}

export function corsPOST(req: NextApiRequest, res: NextApiResponse) {
  return runMiddleware(req, res, corsPost);
}

// ─── Environment helpers ──────────────────────────────────────────────

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

// ─── Client factories ─────────────────────────────────────────────────

export function getOpenAiClient() {
  const apiKey = requireEnv("NEXT_OPENAI_API_KEY");
  return createOpenAiClient({ apiKey });
}

export function getStoryblokManagementClient() {
  const spaceId = requireEnv("NEXT_STORYBLOK_SPACE_ID");
  const oauthToken = requireEnv("NEXT_STORYBLOK_OAUTH_TOKEN");
  return {
    client: createStoryblokClient({ spaceId, apiToken: "", oauthToken }),
    spaceId,
  };
}

export function getStoryblokContentClient() {
  const apiToken = requireEnv("NEXT_STORYBLOK_API_TOKEN");
  const spaceId = requireEnv("NEXT_STORYBLOK_SPACE_ID");
  return {
    client: createContentClient({ spaceId, apiToken }),
    spaceId,
  };
}

// ─── Schema Registry (lazy singleton) ─────────────────────────────────

let _registry: SchemaRegistry | null = null;

/**
 * Get or create the schema registry from the Design System package.
 *
 * Uses `createRegistryFromDirectory` which loads
 * `{name}/{name}.schema.dereffed.json` from the DS components directory.
 * Cached as a module-level singleton.
 */
export function getRegistry(): SchemaRegistry {
  if (!_registry) {
    const dsPackageJson = require.resolve(
      "@kickstartds/ds-agency-premium/package.json"
    );
    const componentsDir = resolve(dirname(dsPackageJson), "dist", "components");
    _registry = createRegistryFromDirectory(componentsDir);
  }
  return _registry;
}

// ─── Error handling ───────────────────────────────────────────────────

export function handleError(res: NextApiResponse, err: unknown) {
  if (err instanceof ServiceError) {
    console.error(`ServiceError [${err.code}]: ${err.message}`);
    return res.status(500).json({ error: err.message, code: err.code });
  }
  if (err instanceof Error) {
    // Missing env var or validation error
    if (err.message.startsWith("Missing environment variable")) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
