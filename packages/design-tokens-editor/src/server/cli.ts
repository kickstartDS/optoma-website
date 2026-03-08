/**
 * CLI entry point for the Design Tokens Editor server.
 *
 * Usage:
 *   node dist/server/cli.js
 *
 * Environment variables:
 *   STORYBLOK_OAUTH_TOKEN — OAuth token for Storyblok Management API
 *   STORYBLOK_SPACE_ID    — Storyblok space ID
 *   PORT                  — Server port (default: 4200)
 */

import { startServer } from "./index.js";
import type { StoryblokConfig } from "./storyblok.js";

const oauthToken = process.env.STORYBLOK_OAUTH_TOKEN;
const spaceId = process.env.STORYBLOK_SPACE_ID;

if (!oauthToken) {
  console.error("Missing STORYBLOK_OAUTH_TOKEN environment variable");
  process.exit(1);
}

if (!spaceId) {
  console.error("Missing STORYBLOK_SPACE_ID environment variable");
  process.exit(1);
}

const port = parseInt(process.env.PORT || "4200", 10);

const config: StoryblokConfig = { oauthToken, spaceId };

startServer(config, port);
