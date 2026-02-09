# @kickstartds/storyblok-services

Shared Storyblok CMS, OpenAI content generation, and Design System schema services for the kickstartDS starter project.

This package provides pure, framework-agnostic functions consumed by three different runtimes:

| Consumer                                            | Module format | Description                                                               |
| --------------------------------------------------- | ------------- | ------------------------------------------------------------------------- |
| [MCP Server](../../mcp-server/)                     | ESM           | Model Context Protocol server for AI assistants (stdio + Streamable HTTP) |
| [n8n Nodes](../../n8n-nodes-storyblok-kickstartds/) | CJS           | n8n community nodes for workflow automation                               |
| [Next.js API Routes](../../pages/api/)              | ESM (bundled) | REST endpoints for the Storyblok starter site                             |

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

### Schema Preparation

Transforms kickstartDS Design System JSON Schemas into a format compatible with OpenAI's structured output (`response_format: json_schema`). Handles 13 transformation passes including `const` → discriminator replacement, unsupported keyword removal, and strict-mode enforcement.

```typescript
import {
  prepareSchemaForOpenAi,
  getComponentPresetSchema,
  listAvailableComponents,
  getSchemaName,
  SUPPORTED_COMPONENTS,
  SUB_COMPONENT_MAP,
  UNSUPPORTED_KEYWORDS,
  DEFAULT_PROPERTIES_TO_DROP,
} from "@kickstartds/storyblok-services";
```

| Export                                                | Description                                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `prepareSchemaForOpenAi(pageSchema, options?)`        | Takes a dereffed page schema + options (`{ sections?, allowedComponents?, propertiesToDrop? }`) and returns an OpenAI-ready schema envelope |
| `getComponentPresetSchema(pageSchema, componentName)` | Returns a single-component OpenAI-ready schema (replaces hand-written JSON presets)                                                         |
| `listAvailableComponents()`                           | Returns the list of supported component names                                                                                               |
| `getSchemaName()`                                     | Returns the schema name string for the OpenAI envelope                                                                                      |
| `SUPPORTED_COMPONENTS`                                | Array of component type names the pipeline supports                                                                                         |
| `SUB_COMPONENT_MAP`                                   | Map of parent component type → sub-component array key (e.g. `downloads` → `download`)                                                      |
| `UNSUPPORTED_KEYWORDS`                                | JSON Schema keywords stripped for OpenAI compatibility                                                                                      |
| `DEFAULT_PROPERTIES_TO_DROP`                          | Properties removed by default (icons, layout props, etc.)                                                                                   |

### Content Transformation

Handles two directions of transformation between OpenAI output, Design System props, and Storyblok content:

```typescript
import {
  processOpenAiResponse,
  processForStoryblok,
  flattenNestedObjects,
  unflattenNestedObjects,
} from "@kickstartds/storyblok-services";
```

| Function                                                         | Description                                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `processOpenAiResponse(response, schemaMap?, defaults?, merge?)` | Reverses `type__X` → `type: X` mangling, merges component defaults. Returns Design System–shaped props              |
| `processForStoryblok(page)`                                      | Flattens nested objects to `key_subKey`, sets `type` → `component`, adds `aiDraft: true`. Returns Storyblok content |
| `flattenNestedObjects(obj)`                                      | Utility: flattens one level of nested objects using `_` separator                                                   |
| `unflattenNestedObjects(obj)`                                    | Reverse utility: `key_subKey` → `{ key: { subKey } }`                                                               |

### Pipeline (High-Level Orchestrator)

End-to-end content generation pipeline for consumers who don't need fine-grained control:

```typescript
import { generateAndPrepareContent } from "@kickstartds/storyblok-services";
```

| Function                                     | Description                                                                                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateAndPrepareContent(client, options)` | User prompt → schema preparation → OpenAI generation → response post-processing → Storyblok flattening. Returns `{ designSystemProps, storyblokContent, rawResponse, preparedSchema }` |

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
  // Core types
  StoryblokCredentials,
  OpenAiCredentials,
  GenerateContentOptions,
  ImportByPrompterOptions,
  ImportAtPositionOptions,
  PageContent,
  // Schema types
  PrepareSchemaOptions,
  OpenAiSchemaEnvelope,
  SchemaValidation,
  PreparedSchema,
  // Transform types
  TransformedContent,
  // Pipeline types
  GenerateAndPrepareOptions,
  GenerateAndPrepareResult,
} from "@kickstartds/storyblok-services";
```

## File Structure

```
shared/storyblok-services/
├── package.json           # @kickstartds/storyblok-services v1.0.0
├── tsconfig.json          # Type-checking config
├── tsconfig.esm.json      # ESM build → dist/esm/
├── tsconfig.cjs.json      # CJS build → dist/cjs/
├── jest.config.js
├── README.md
├── src/
│   ├── index.ts           # Barrel export
│   ├── types.ts           # Types & error classes
│   ├── storyblok.ts       # Storyblok API functions
│   ├── openai.ts          # OpenAI API functions
│   ├── schema.ts          # Schema preparation for OpenAI structured output
│   ├── transform.ts       # Content transformation (OpenAI ↔ DS ↔ Storyblok)
│   └── pipeline.ts        # High-level orchestrator
└── test/
    ├── storyblok.test.ts  # 15 tests
    └── openai.test.ts     # 6 tests
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

| Package                | Version   | Purpose                                               |
| ---------------------- | --------- | ----------------------------------------------------- |
| `openai`               | `^6.18.0` | OpenAI API client                                     |
| `storyblok-js-client`  | `^7.2.3`  | Storyblok Management API client                       |
| `json-schema-traverse` | `^1.0.0`  | Traverses JSON Schema trees for transformation passes |
| `object-traversal`     | `^1.0.1`  | Deep object traversal for content post-processing     |

## Cross-Module Type Note

Sub-packages with their own `node_modules` (MCP server, n8n nodes) may install separate copies of `openai` and `storyblok-js-client`. Because `OpenAI` and `StoryblokClient` use private properties, TypeScript treats the duplicate declarations as incompatible types. This requires `as any` casts when passing clients to shared library functions — specifically in `mcp-server/src/services.ts` (for the OpenAI client) and in the n8n test files (for mock clients). The n8n production code in `GenericFunctions.ts` does not need casts. The Next.js API routes also do **not** need casts because the bundler resolves all imports through the root `node_modules`.

## License

MIT OR Apache-2.0
