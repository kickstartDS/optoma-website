import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
  NodeOperationError,
} from "n8n-workflow";

import { generateContentFields } from "./descriptions/GenerateContentDescription";
import { importContentFields } from "./descriptions/ImportContentDescription";
import {
  getStoryblokManagementClient,
  getOpenAiClient,
  generateStructuredContent,
  generateAndPrepareContent,
  processForStoryblok,
  importContentIntoStory,
  insertContentAtPosition,
  PRESET_SCHEMAS,
  StoryblokCredentials,
  OpenAiCredentials,
  registry,
} from "./GenericFunctions";

// Backward-compatible alias via registry
const PAGE_SCHEMA: Record<string, any> = registry.page.schema;

export class StoryblokKickstartDs implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Storyblok kickstartDS",
    name: "storyblokKickstartDs",
    icon: "file:storyblokKickstartDs.svg",
    group: ["transform"],
    version: 1,
    subtitle:
      '={{$parameter["operation"] === "generate" ? "Generate Content" : "Import Content"}}',
    description:
      "Generate AI-powered content and import it into Storyblok stories using kickstartDS Design System components",
    defaults: {
      name: "Storyblok kickstartDS",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "storyblokApi",
        required: true,
      },
      {
        name: "openAiApi",
        required: true,
        displayOptions: {
          show: {
            operation: ["generate"],
          },
        },
      },
    ],
    properties: [
      // ── Resource ──────────────────────────────────────────────
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "AI Content",
            value: "aiContent",
            description:
              "Generate and import AI-powered content for kickstartDS components",
          },
        ],
        default: "aiContent",
      },

      // ── Operation ─────────────────────────────────────────────
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Generate",
            value: "generate",
            description:
              "Generate structured content using OpenAI GPT-4 and a JSON Schema",
            action: "Generate structured content via OpenAI",
          },
          {
            name: "Import",
            value: "import",
            description:
              "Import generated content into a Storyblok story by replacing a prompter component",
            action: "Import content into a Storyblok story",
          },
        ],
        default: "generate",
        displayOptions: {
          show: {
            resource: ["aiContent"],
          },
        },
      },

      // ── Spread operation-specific fields ──────────────────────
      ...generateContentFields,
      ...importContentFields,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const operation = this.getNodeParameter("operation", 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === "generate") {
          const result = await executeGenerate.call(this, i);
          returnData.push({ json: result as IDataObject });
        } else if (operation === "import") {
          const result = await executeImport.call(this, i);
          returnData.push({ json: result as IDataObject });
        } else {
          throw new NodeOperationError(
            this.getNode(),
            `Unknown operation: ${operation}`,
            { itemIndex: i }
          );
        }
      } catch (error) {
        if (this.continueOnFail()) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          returnData.push({
            json: { error: errorMessage },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}

// ─── Generate Content execution ───────────────────────────────────────

async function executeGenerate(
  this: IExecuteFunctions,
  itemIndex: number
): Promise<Record<string, unknown>> {
  // 1. Gather credentials
  const openAiCredentials = (await this.getCredentials(
    "openAiApi",
    itemIndex
  )) as unknown as OpenAiCredentials;

  const client = getOpenAiClient(openAiCredentials);

  // 2. Gather parameters
  const system = this.getNodeParameter("system", itemIndex) as string;
  const prompt = this.getNodeParameter("prompt", itemIndex) as string;
  const schemaMode = this.getNodeParameter("schemaMode", itemIndex) as string;
  const model = this.getNodeParameter("model", itemIndex) as string;

  // 3. Auto mode — uses shared library's full pipeline
  if (schemaMode === "auto") {
    const componentType = this.getNodeParameter(
      "autoComponentType",
      itemIndex,
      ""
    ) as string;
    const sectionCount = this.getNodeParameter(
      "autoSectionCount",
      itemIndex,
      1
    ) as number;

    try {
      const result = await generateAndPrepareContent(client, {
        system,
        prompt,
        pageSchema: PAGE_SCHEMA,
        schemaOptions: {
          ...(componentType
            ? { allowedComponents: [componentType, "section"] }
            : {}),
          ...(sectionCount ? { sections: sectionCount } : {}),
        },
        model,
      });

      return {
        generatedContent: result.storyblokContent,
        designSystemProps: result.designSystemProps,
        rawResponse: result.rawResponse,
        _meta: {
          model,
          schemaMode: "auto",
          componentType: componentType || "full-page",
          sectionCount,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new NodeApiError(this.getNode(), { message } as any, {
        message: `Auto schema generation failed: ${message}`,
        itemIndex,
      });
    }
  }

  // 4. Resolve schema (preset or custom mode)
  let schema: {
    name: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };

  if (schemaMode === "preset") {
    const presetKey = this.getNodeParameter(
      "presetSchema",
      itemIndex
    ) as string;
    const preset = PRESET_SCHEMAS[presetKey];
    if (!preset) {
      throw new NodeOperationError(
        this.getNode(),
        `Unknown preset schema: "${presetKey}". Available: ${Object.keys(
          PRESET_SCHEMAS
        ).join(", ")}`,
        { itemIndex }
      );
    }
    schema = { name: preset.name, strict: true, schema: preset.schema };
  } else {
    const customSchemaName = this.getNodeParameter(
      "customSchemaName",
      itemIndex
    ) as string;
    const customSchemaRaw = this.getNodeParameter(
      "customSchema",
      itemIndex
    ) as string;

    let parsedSchema: Record<string, unknown>;
    try {
      parsedSchema =
        typeof customSchemaRaw === "string"
          ? JSON.parse(customSchemaRaw)
          : (customSchemaRaw as Record<string, unknown>);
    } catch (parseError) {
      throw new NodeOperationError(
        this.getNode(),
        "Invalid JSON in custom schema field. Please provide a valid JSON Schema.",
        { itemIndex }
      );
    }

    schema = { name: customSchemaName, strict: true, schema: parsedSchema };
  }

  // 5. Call OpenAI
  try {
    const result = await generateStructuredContent(client, {
      system,
      prompt,
      schema,
      model,
    });

    return {
      generatedContent: result,
      _meta: {
        model,
        schemaMode,
        schemaName: schema.name,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new NodeApiError(this.getNode(), { message } as any, {
      message: `OpenAI content generation failed: ${message}`,
      itemIndex,
    });
  }
}

// ─── Import Content execution ─────────────────────────────────────────

async function executeImport(
  this: IExecuteFunctions,
  itemIndex: number
): Promise<Record<string, unknown>> {
  // 1. Gather credentials
  const storyblokCredentials = (await this.getCredentials(
    "storyblokApi",
    itemIndex
  )) as unknown as StoryblokCredentials;

  const client = getStoryblokManagementClient(storyblokCredentials);
  const spaceId = storyblokCredentials.spaceId;

  // 2. Gather parameters
  const storyUid = this.getNodeParameter("storyUid", itemIndex) as string;
  const placementMode = this.getNodeParameter(
    "placementMode",
    itemIndex
  ) as string;
  const publish = this.getNodeParameter("publish", itemIndex, false) as boolean;

  const pageRaw = this.getNodeParameter("page", itemIndex) as string | object;

  // 3. Parse page content
  let page: { content: { section: Record<string, unknown>[] } };
  try {
    const parsed = typeof pageRaw === "string" ? JSON.parse(pageRaw) : pageRaw;

    // Support both { content: { section: [...] } } and direct array
    if (Array.isArray(parsed)) {
      page = { content: { section: parsed } };
    } else if (parsed?.content?.section) {
      page = parsed as typeof page;
    } else if (parsed?.generatedContent) {
      // Direct output from the Generate Content operation — wrap it
      const content = parsed.generatedContent;
      if (Array.isArray(content)) {
        page = { content: { section: content } };
      } else {
        page = { content: { section: [content] } };
      }
    } else {
      // Treat the entire object as a single section
      page = { content: { section: [parsed] } };
    }
  } catch (parseError) {
    throw new NodeOperationError(
      this.getNode(),
      "Invalid JSON in Page Content field. Expected an object with { content: { section: [...] } }.",
      { itemIndex }
    );
  }

  if (!page.content.section || page.content.section.length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      "Page content has no sections to import. Provide at least one section object.",
      { itemIndex }
    );
  }

  // 3b. Auto-flatten for Storyblok unless content was generated in auto mode
  const skipTransform = this.getNodeParameter(
    "skipTransform",
    itemIndex,
    false
  ) as boolean;

  if (!skipTransform) {
    const flattened = processForStoryblok(page);
    page = flattened as typeof page;
  }

  // 4. Import into Storyblok
  try {
    let updatedStory: Record<string, any>;
    let placementDetail: string;

    if (placementMode === "position") {
      // ── Position-based insertion (no prompter needed) ───────────
      const insertPosition = this.getNodeParameter(
        "insertPosition",
        itemIndex
      ) as string;

      let positionIndex: number;
      if (insertPosition === "beginning") {
        positionIndex = 0;
      } else if (insertPosition === "end") {
        positionIndex = -1; // sentinel handled by insertContentAtPosition
      } else {
        // "index"
        positionIndex = this.getNodeParameter(
          "insertIndex",
          itemIndex,
          0
        ) as number;
      }

      updatedStory = await insertContentAtPosition(
        client,
        spaceId,
        storyUid,
        positionIndex,
        page.content.section,
        publish
      );

      placementDetail =
        insertPosition === "end"
          ? "appended at end"
          : insertPosition === "beginning"
          ? "inserted at beginning"
          : `inserted at index ${positionIndex}`;
    } else {
      // ── Prompter replacement (original behaviour) ──────────────
      const prompterUid = this.getNodeParameter(
        "prompterUid",
        itemIndex
      ) as string;

      updatedStory = await importContentIntoStory(
        client,
        spaceId,
        storyUid,
        prompterUid,
        page.content.section,
        publish
      );

      placementDetail = `replaced prompter ${prompterUid}`;
    }

    return {
      success: true,
      message: publish
        ? "Content imported and published successfully"
        : "Content imported as draft successfully",
      story: updatedStory,
      _meta: {
        storyUid,
        placementMode,
        placementDetail,
        sectionsImported: page.content.section.length,
        published: publish,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new NodeApiError(this.getNode(), { message } as any, {
      message: `Storyblok import failed: ${message}`,
      itemIndex,
    });
  }
}
