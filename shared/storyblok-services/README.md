# @kickstartds/storyblok-services

Shared Storyblok CMS and OpenAI content generation services for the kickstartDS starter project.

This package provides pure, framework-agnostic functions consumed by three different runtimes:

| Consumer                                            | Module format | Description                                     |
| --------------------------------------------------- | ------------- | ----------------------------------------------- |
| [MCP Server](../../mcp-server/)                     | ESM           | Model Context Protocol server for AI assistants |
| [n8n Nodes](../../n8n-nodes-storyblok-kickstartds/) | CJS           | n8n community nodes for workflow automation     |
| [Next.js API Routes](../../pages/api/)              | ESM (bundled) | REST endpoints for the Storyblok starter site   |

## API

### Storyblok

```typescript
import {
  createStoryblokClient,
  getStoryManagement,
  saveStory,
  importByPrompterReplacement,
  importAtPosition,
} from "@kickstartds/storyblok-services";
```

| Function                                                | Description                                    |
| ------------------------------------------------------- | ---------------------------------------------- |
| `createStoryblokClient(credentials)`                    | Create a Storyblok Management API client       |
| `getStoryManagement(client, spaceId, storyId)`          | Fetch a story (including drafts)               |
| `saveStory(client, spaceId, storyId, story, publish?)`  | Save/publish a story                           |
| `importByPrompterReplacement(client, spaceId, options)` | Replace a prompter component with new sections |
| `importAtPosition(client, spaceId, options)`            | Insert sections at a specific position         |

### OpenAI

```typescript
import {
  createOpenAiClient,
  generateStructuredContent,
} from "@kickstartds/storyblok-services";
```

| Function                                     | Description                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| `createOpenAiClient(credentials)`            | Create an OpenAI client                                                     |
| `generateStructuredContent(client, options)` | Generate JSON content via structured output (JSON Schema `response_format`) |

### Error Classes

| Class                    | Code                       | Description                                         |
| ------------------------ | -------------------------- | --------------------------------------------------- |
| `ServiceError`           | —                          | Base error class with `code` and `details`          |
| `StoryblokApiError`      | `STORYBLOK_API_ERROR`      | Storyblok API call failures                         |
| `PrompterNotFoundError`  | `PROMPTER_NOT_FOUND`       | Prompter UID not in story (includes available UIDs) |
| `OpenAiApiError`         | `OPENAI_API_ERROR`         | OpenAI API call failures                            |
| `ContentGenerationError` | `CONTENT_GENERATION_ERROR` | Empty or invalid AI responses                       |

### Types

```typescript
import type {
  StoryblokCredentials,
  OpenAiCredentials,
  GenerateContentOptions,
  ImportByPrompterOptions,
  ImportAtPositionOptions,
  PageContent,
} from "@kickstartds/storyblok-services";
```

## Build

The package produces dual ESM + CJS output to serve all consumers:

```bash
npm run build        # Build both formats
npm run build:esm    # ESM only → dist/esm/
npm run build:cjs    # CJS only → dist/cjs/
npm run typecheck    # Type-check without emitting
npm test             # Run 21 unit tests
```

## Dependencies

| Package               | Version   | Purpose                         |
| --------------------- | --------- | ------------------------------- |
| `openai`              | `^6.18.0` | OpenAI API client               |
| `storyblok-js-client` | `^7.2.3`  | Storyblok Management API client |

## Cross-Module Type Note

Sub-packages with their own `node_modules` (MCP server, n8n nodes) may install separate copies of `openai` and `storyblok-js-client`. Because `OpenAI` and `StoryblokClient` use private properties, TypeScript treats the duplicate declarations as incompatible types. This requires `as any` casts when passing clients to shared library functions — specifically in `mcp-server/src/services.ts` (for the OpenAI client) and in the n8n test files (for mock clients). The n8n production code in `GenericFunctions.ts` does not need casts. The Next.js API routes also do **not** need casts because the bundler resolves all imports through the root `node_modules`.

## License

MIT OR Apache-2.0
