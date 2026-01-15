// @ts-nocheck
import {
  FC,
  HTMLAttributes,
  MouseEventHandler,
  PropsWithChildren,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { traverse as objectTraverse } from "object-traversal";
import { defaultObjectForSchema } from "@kickstartds/cambria";
import { PrompterSelectField } from "./prompter-select-field/PrompterSelectField";
import { JSONSchema } from "json-schema-typed/draft-07";
import schemaTraverse from "json-schema-traverse";
import merge from "deepmerge";
import { ThreeDots } from "react-loader-spinner";

import { Section } from "@kickstartds/ds-agency-premium/section";
import { Faq } from "@kickstartds/ds-agency-premium/faq";

import { PageProps } from "@kickstartds/ds-agency-premium/page";
import { Contact } from "@kickstartds/ds-agency-premium/contact";
import { Cta } from "@kickstartds/ds-agency-premium/cta";
import { Features } from "@kickstartds/ds-agency-premium/features";
import { Stats } from "@kickstartds/ds-agency-premium/stats";
import { TeaserCard } from "@kickstartds/ds-agency-premium/teaser-card";
import { Testimonials } from "@kickstartds/ds-agency-premium/testimonials";
import { Text } from "@kickstartds/ds-agency-premium/text";
import { Hero } from "@kickstartds/ds-agency-premium/hero";

import pageSchema from "@kickstartds/ds-agency-premium/page/page.schema.dereffed.json";
import { PrompterProps } from "./PrompterProps";
import { ISbStoryData, getStoryblokApi } from "@storyblok/react";
import { fetchStory, initStoryblok } from "@/helpers/storyblok";
import { unflatten } from "@/helpers/unflatten";
import { SectionProps } from "../section/SectionProps";
import PrompterBadge from "./prompter-badge/PrompterBadge";
import PrompterButton from "./prompter-button/PrompterButton";
import PrompterSection from "./prompter-section/PrompterSection";
import PrompterSectionInput from "./prompter-section-input/PrompterSectionInput";
import PrompterSelectionDisplay from "./prompter-selection-display/PrompterSelectionDisplay";
import PrompterSubmittedText from "./prompter-submitted-text/PrompterSubmittedText";

type Idea = {
  id: string;
  name: string;
};

function getSchemaName(schemaId: string): string {
  return (schemaId && schemaId.split("/").pop()?.split(".").shift()) || "";
}

const unsupportedKeywords = [
  "format",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "examples",
  "default",
  "$id",
  "$schema",
];

const propertiesToDrop = [
  "backgroundColor",
  "spotlight",
  "headerSpacing",
  "switchOrder",
  "align",
  "textAlign",
  "colorNeutral",
  "target",
  "contentAlign",
  "textColor",
  "highlightText",
  "fullWidth",
  "padding",
  "mobileImageLast",
  "desktopImageLast",
  "overlay",
  "indent",
  "imageRatio",
  "image",
  "width",
  "inverted",
  "spaceBefore",
  "spaceAfter",
  "height",
];

const components = [
  "page",
  "section",
  "contact",
  "cta",
  "faq",
  "features",
  // "gallery",
  "stats",
  "teaser-card",
  "testimonials",
  "text",
  // "image-story",
  // "image-text",
  // "logos",
  "hero",
  // "mosaic",
  // "slider",
  // "video-curtain",
];

const subComponentMap = {
  faq: "questions",
  features: "feature",
  // gallery: Gallery,
  stats: "stat",
  testimonials: "testimonial",
  // logos: Logos,
  // mosaic: Mosaic,
  // slider: Slider,
  // "video-curtain": VideoCurtain,
} as const;

type SubComponentMapKeys = keyof typeof subComponentMap;

function isSubComponentMapKey(key: string): key is SubComponentMapKeys {
  return key in subComponentMap;
}

const componentMap = {
  contact: Contact,
  cta: Cta,
  faq: Faq,
  features: Features,
  // gallery: Gallery,
  stats: Stats,
  "teaser-card": TeaserCard,
  testimonials: Testimonials,
  text: Text,
  // "image-story": ImageStory,
  // "image-text": ImageText,
  // logos: Logos,
  hero: Hero,
  // mosaic: Mosaic,
  // slider: Slider,
  // "video-curtain": VideoCurtain,
} as const;

type ComponentMapKeys = keyof typeof componentMap;

function isComponentMapKey(key: string): key is ComponentMapKeys {
  return key in componentMap;
}

const schemaMap = {
  page: {},
  section: {},
  contact: {},
  cta: {},
  faq: {},
  questions: {},
  feature: {},
  features: {},
  // gallery: {},
  stat: {},
  stats: {},
  "teaser-card": {},
  testimonial: {},
  testimonials: {},
  text: {},
  // "image-story": {},
  // "image-text": {},
  // logos: {},
  hero: {},
  // mosaic: {},
  // slider: {},
  // "video-curtain": {},
} as const;

type SchemaMapKeys = keyof typeof schemaMap;

function isSchemaMapKey(key: string): key is SchemaMapKeys {
  return key in schemaMap;
}

// TODO type this, might involve pre-processing the schema to generate types in filesystem using `json-schema-to-typescript`
const processResponse = (response: Record<string, any>): PageProps => {
  objectTraverse(
    response,
    ({ value }) => {
      if (typeof value === "object" && !Array.isArray(value)) {
        const typePropKey = Object.keys(value).find((key) =>
          key.startsWith("type__")
        );

        if (typePropKey) {
          const type = typePropKey.split("type__")[1];
          if (!isSchemaMapKey(type)) throw new Error(`Unknown type: ${type}`);
          const schema = schemaMap[type];

          if (schema) {
            const defaults = defaultObjectForSchema(
              schema as JSONSchema.Object
            ) as Record<string, any>;

            delete value[typePropKey];
            value.type = type;
            value.component = type;

            for (const prop of Object.keys(defaults)) {
              value[prop] = value[prop]
                ? typeof value[prop] === "object" && !Array.isArray(value[prop])
                  ? merge(value[prop], defaults[prop])
                  : value[prop]
                : defaults[prop];
            }
          }
        }
      }
    },
    { traversalType: "breadth-first" }
  );

  return response as PageProps;
};

/*

Compare flatten to this one from Starter `prepareProject.js`:

      traverse(preset.preset, ({ parent, key, value }) => {
        if (typeof value === "object" && isNaN(key) && !Array.isArray(value)) {
          for (const [propKey, propValue] of Object.entries(value)) {
            parent[`${key}_${propKey}`] = propValue;
          }
          delete parent[key];
        }
      });

*/

const processPage = (page: PageProps): Record<string, any> => {
  objectTraverse(
    page,
    ({ value }) => {
      if (typeof value === "object" && value.type) {
        value.component = value.type;

        for (const prop of Object.keys(value)) {
          if (
            !value[prop].type &&
            typeof value[prop] === "object" &&
            !Array.isArray(value[prop])
          ) {
            for (const nestedProp of Object.keys(value[prop])) {
              value[`${prop}_${nestedProp}`] = structuredClone(
                value[prop][nestedProp]
              );
            }
            delete value[prop];
          }
        }
      }
    },
    { traversalType: "breadth-first" }
  );

  for (const section of page.section || []) {
    (section as SectionProps).aiDraft = true;
  }

  return page as Record<string, any>;
};

// TODO handle `type` in props, currently just gets passed through
const Page: FC<PropsWithChildren<PageProps>> = ({ section }) => {
  return (
    <>
      {section?.map((section, index) => {
        const { components, ...props } = section;
        return (
          <Section key={index} {...props}>
            {components?.map((component, index) => {
              const type = component.type;
              if (!isComponentMapKey(type))
                throw new Error(`Unknown component type: ${type}`);
              const Component = componentMap[type];
              return <Component key={index} {...component} />;
            })}
          </Section>
        );
      })}
    </>
  );
};

const storyblokKeys = ["_uid", "_editable", "component"];
const processStory = (story: ISbStoryData): Record<string, any> => {
  const page = structuredClone(story);

  objectTraverse(
    page,
    ({ value, parent, key }) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        if (parent && key !== undefined) {
          parent[key] = unflatten(value);
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item)
          ) {
            value[index] = unflatten(item);
          }
        });
      }
    },
    { traversalType: "depth-first" }
  );

  objectTraverse(
    page,
    ({ key, value, parent }) => {
      if (key === "type" && parent && typeof value === "string") {
        parent[`type__${value}`] = value;
        delete parent[key];
      }
    },
    { traversalType: "depth-first" }
  );

  objectTraverse(page, ({ key, parent }) => {
    if (key && storyblokKeys.includes(key) && parent) {
      delete parent[key];
    }
  });
  console.log("Processed page", page);
  return page;
};

export const PrompterComponent = forwardRef<
  HTMLDivElement,
  PrompterProps & HTMLAttributes<HTMLDivElement>
>(
  (
    {
      sections,
      includeStory = true,
      useIdea = true,
      relatedStories = [],
      userPrompt,
      systemPrompt,
      ...props
    },
    ref
  ) => {
    const [generatedContent, setGeneratedContent] =
      useState<Record<string, any>>(null);
    const [storyblokContent, setStoryblokContent] =
      useState<Record<string, any>>(null);

    const schema = useMemo(() => {
      const allProperties: Set<string> = new Set();
      let maxDepth = 0;

      const collectSchemas: schemaTraverse.Callback = (schema) => {
        if (
          schema.properties &&
          schema.properties.type &&
          schema.properties.type.const
        ) {
          schemaMap[schema.properties.type.const] = structuredClone(schema);
        }
      };

      const addTypeConsts: schemaTraverse.Callback = (schema) => {
        if (schema && schema.anyOf) {
          schema.anyOf.forEach((component) => {
            if (component.$id) {
              const componentName = getSchemaName(component.$id);
              if (
                components.includes(componentName) &&
                !component.properties.type
              ) {
                component.properties.type = {
                  const: componentName,
                };
              }
            }
          });
        }
      };

      const filterComponents: schemaTraverse.Callback = (schema) => {
        if (schema && schema.anyOf) {
          schema.anyOf = schema.anyOf.filter((component) => {
            return (
              component.properties.type &&
              component.properties.type.const &&
              components.includes(component.properties.type.const)
            );
          });
        }
      };

      const deleteConsts: schemaTraverse.Callback = (
        schema,
        jsonPtr,
        _rootSchema,
        _parentJsonPtr,
        parentKeyword,
        parentSchema
      ) => {
        if (schema.const && parentKeyword === "properties") {
          const propName = jsonPtr.split("/").pop();

          if (propName === "type") {
            const type = { properties: {} };
            type.properties[`type__${schema.const}`] = {
              type: "string",
              title: "Type of component",
              description: `A field always being set to the value '${schema.const}'`,
            };
            parentSchema.properties = {
              ...type.properties,
              ...parentSchema.properties,
            };
          }

          delete parentSchema.properties[propName];
        }
      };

      const removeImageFormatProperties: schemaTraverse.Callback = (
        schema,
        _jsonPtr,
        _rootSchema,
        _parentJsonPtr,
        _parentKeyword,
        parentSchema,
        keyIndex
      ) => {
        if (
          (schema.format === "image" || schema.format === "video") &&
          keyIndex &&
          parentSchema &&
          parentSchema.properties &&
          parentSchema.properties[keyIndex]
        ) {
          delete schema.format;
          // delete parentSchema.properties[keyIndex];
        }
      };

      const removeIconProperties: schemaTraverse.Callback = (
        _schema,
        _jsonPtr,
        _rootSchema,
        _parentJsonPtr,
        _parentKeyword,
        parentSchema,
        keyIndex
      ) => {
        if (
          keyIndex === "icon" &&
          parentSchema &&
          parentSchema.properties &&
          parentSchema.properties[keyIndex]
        ) {
          delete parentSchema.properties[keyIndex];
        }
      };

      const removeUnsupportedProperties: schemaTraverse.Callback = (
        _schema,
        _jsonPtr,
        _rootSchema,
        _parentJsonPtr,
        _parentKeyword,
        parentSchema,
        keyIndex
      ) => {
        if (
          keyIndex &&
          typeof keyIndex === "string" &&
          propertiesToDrop.includes(keyIndex) &&
          parentSchema &&
          parentSchema.properties &&
          parentSchema.properties[keyIndex]
        ) {
          delete parentSchema.properties[keyIndex];
        }
      };

      const removeUnsupportedKeywords: schemaTraverse.Callback = (schema) => {
        for (const key of unsupportedKeywords) {
          if (schema.hasOwnProperty(key)) delete schema[key];
        }
      };

      const removeEmptyObjects: schemaTraverse.Callback = (
        schema,
        _jsonPtr,
        _rootSchema,
        _parentJsonPtr,
        _parentKeyword,
        parentSchema,
        keyIndex
      ) => {
        if (
          schema.type === "object" &&
          !Object.keys(schema.properties).length &&
          keyIndex &&
          parentSchema &&
          parentSchema.properties &&
          parentSchema.properties[keyIndex]
        ) {
          delete parentSchema.properties[keyIndex];
        }
      };

      const denyAdditionalProperties: schemaTraverse.Callback = (schema) => {
        if (schema.type === "object") {
          schema.additionalProperties = false;
        }
      };

      const makeRequired: schemaTraverse.Callback = (schema) => {
        if (schema.type === "object") {
          schema.required = Object.keys(schema.properties);
        }
      };

      const collectProperties: schemaTraverse.Callback = (
        _schema,
        jsonPtr,
        _rootSchema,
        _parentJsonPtr,
        parentKeyword
      ) => {
        if (
          jsonPtr &&
          parentKeyword === "properties" &&
          !allProperties.has(jsonPtr)
        ) {
          allProperties.add(jsonPtr);
        }
      };

      const countDepth: schemaTraverse.Callback = (_schema, jsonPtr) => {
        maxDepth = Math.max(jsonPtr.split("/properties/").length, maxDepth);
        if (jsonPtr.split("/properties/").length > 6) {
          console.log("Max depth exceeded:", jsonPtr);
        }
      };

      schemaTraverse(pageSchema, collectSchemas);
      const clonedSchema = structuredClone(pageSchema);

      delete clonedSchema.properties.header;
      delete clonedSchema.properties.footer;
      delete clonedSchema.properties.section.items.properties.content; // TODO check this, could possibly be improved by better Prompter guidance for those types of values

      clonedSchema.properties.section.minItems = sections;
      clonedSchema.properties.section.maxItems = sections;

      for (const componentSchema of clonedSchema.properties.section.items
        .properties.components.items.anyOf) {
        const componentName = getSchemaName(componentSchema.$id);
        const arrayKey = subComponentMap[componentName];
        if (Object.keys(subComponentMap).includes(componentName)) {
          componentSchema.properties[arrayKey].items.properties.type = {
            const: arrayKey,
          };
        }
      }

      [
        addTypeConsts,
        filterComponents,
        deleteConsts,
        removeImageFormatProperties,
        removeIconProperties,
        removeUnsupportedProperties,
        removeUnsupportedKeywords,
        removeEmptyObjects,
        denyAdditionalProperties,
        makeRequired,
        collectProperties,
        countDepth,
      ].forEach((fn) => {
        schemaTraverse(clonedSchema, fn);
      });

      if (allProperties.size > 100) {
        console.log(
          "Need to reduce properties (<100 allowed), got:",
          allProperties.size,
          allProperties
        );
      }

      return {
        name: "page_response",
        strict: true,
        schema: clonedSchema,
      };
    }, [sections]);

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [idea, setIdea] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [storyUid, setStoryUid] = useState<string>();
    const [story, setStory] = useState<ISbStoryData>();

    const ideaSelectRef = useRef(null);

    const createPrompt = (ideaId: string, story?: ISbStoryData) => {
      let prompt = `Aufgabe: ${userPrompt}.\n`;

      if (useIdea) {
        const ideaContent: string[] = [];
        const idea = ideas.find((object) => object.id === ideaId);

        if (idea) {
          objectTraverse(idea, ({ value }) => {
            if (value && value.type && value.type === "text" && value.text)
              ideaContent.push(value.text);
          });
        }
        prompt += `\n((Idee)):\n${ideaContent.join(" ")}\n`;
      }
      if (story) prompt += `\n((Story)):\n${JSON.stringify(story.content)}\n`;
      if (relatedStories && relatedStories.length > 0) {
        relatedStories.forEach((relatedStory) => {
          prompt += `\n((Ähnliche Story)):\n${JSON.stringify(
            processStory(relatedStory)
          )}\n`;
        });
      }

      return prompt;
    };

    useEffect(() => {
      fetch("https://www.ruhmesmeile.com/api/ideas")
        .then((response) => {
          response.json().then((json) => {
            setIdeas(json.response.data.ideas);
          });
        })
        .catch((error) => console.error(error));
    }, []);

    useEffect(() => {
      const blok = document.querySelector("[data-blok-c]");
      const blokMetaString = blok?.getAttribute("data-blok-c");
      if (!blokMetaString)
        throw new Error("Could not find blok meta for prompter");

      const { id } = JSON.parse(blokMetaString);
      setStoryUid(id);
    }, []);

    useEffect(() => {
      if (storyUid) {
        // TODO remove credential
        initStoryblok("tiiyPe4tqKDSQEdBa9qtRwtt");
        const storyblokApi = getStoryblokApi();
        fetchStory(storyUid, false, storyblokApi)
          .then((response) => {
            setStory(processStory(response.data.story));
          })
          .catch((error) => console.error(error));
      }
    }, [storyUid]);

    const handleGenerate = async () => {
      const prompt = createPrompt(idea, includeStory ? story : undefined);
      console.log(
        "PROMPT",
        prompt,
        systemPrompt,
        schema,
        includeStory,
        story,
        storyUid
      );
      setLoading(true);
      fetch("https://www.ruhmesmeile.com/api/content", {
        method: "POST",
        body: JSON.stringify({
          system: systemPrompt,
          prompt,
          schema,
        }),
      })
        .then((response) => {
          response.json().then((json) => {
            const pageProps = processResponse(JSON.parse(json.content));
            setGeneratedContent(pageProps);

            const storyblokProps = processPage(structuredClone(pageProps));
            setStoryblokContent(storyblokProps);

            setLoading(false);
          });
        })
        .catch((error) => console.error(error));
    };

    const submitStory: MouseEventHandler<HTMLButtonElement> = async (ev) => {
      const blok = (ev.target as Element).closest("[data-blok-c]");
      const blokMetaString = blok?.getAttribute("data-blok-c");
      if (!blokMetaString)
        throw new Error("Could not find blok meta for prompter");

      const { uid: prompterUid } = JSON.parse(blokMetaString);

      fetch("https://www.ruhmesmeile.com/api/import", {
        method: "POST",
        body: JSON.stringify({
          storyUid,
          prompterUid,
          page: {
            name: "Import",
            is_folder: false,
            content: storyblokContent,
            published: true,
            real_path: "/import",
            unpublished_changes: false,
            slug: "import",
            full_slug: "import",
            position: 0,
          },
        }),
      })
        .then((response) => {
          response.json().then(() => {
            setSubmitted(true);
          });
        })
        .catch((error) => console.error(error));
    };

    return (
      <div className="prompter" {...props} ref={ref}>
        <PrompterSection
          headline={
            !submitted
              ? "Prompter - erstelle jetzt einen Content-Draft, schnell, markentreu, nahtlos eingefügt."
              : "Dein neuer Content wurde gespeichert"
          }
          text={!submitted ? "" : undefined}
        >
          {((!loading && !submitted && !idea && ideas && ideas.length > 0) ||
            (idea && !loading && !generatedContent)) && (
            <>
              {useIdea && (
                <PrompterSectionInput>
                  {!loading &&
                    !submitted &&
                    !idea &&
                    ideas &&
                    ideas.length > 0 && (
                      <PrompterSelectField
                        ref={ideaSelectRef}
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        options={[
                          {
                            label: "Idee wählen...",
                            value: "",
                            disabled: true,
                          },
                          ...ideas.map((idea) => ({
                            value: idea.id,
                            label: idea.name,
                            disabled: false,
                          })),
                        ]}
                      />
                    )}
                  {idea && !loading && !generatedContent && (
                    <>
                      <PrompterSelectionDisplay
                        idea={`${
                          ideas.find((object) => object.id === idea)?.name
                        }`}
                      />
                    </>
                  )}
                </PrompterSectionInput>
              )}
              {!submitted && !loading && !generatedContent && (
                <PrompterButton
                  spacingTop={!useIdea}
                  disabled={useIdea && !idea}
                  label="Generate Content"
                  icon="wand"
                  onClick={handleGenerate}
                />
              )}
            </>
          )}
          {storyblokContent && !submitted && (
            <div className="prompter-section__button-row">
              <PrompterButton variant="secondary" label="Discard Content" />
              <PrompterButton
                label="Save Content"
                icon="save"
                onClick={submitStory}
              />
            </div>
          )}
          {loading && (
            <ThreeDots
              style={{ margin: "auto", alignSelf: "center" }}
              height="30"
              width="80"
              radius="9"
              color="var(--prompter-color)"
              ariaLabel="three-dots-loading"
              wrapperClass="prompter-loading-indicator"
              visible={true}
            />
          )}
          {submitted && (
            <>
              <PrompterSubmittedText
                text="Um deinen neuen Content nicht zu überschreiben, musst Du die
                  Seite jetzt neu laden."
              />
              <PrompterButton icon="reload" label="Jetzt neu laden" />
            </>
          )}
        </PrompterSection>

        {generatedContent && !submitted && (
          <div className="prompter__generated-content">
            <PrompterBadge label="KI Draft" state="unsaved" />
            <Page
              {...generatedContent}
              seo={{
                title:
                  "TODO remove this, only added to satisfy typings for now",
              }}
            />
          </div>
        )}
        {story && (
          <details className="prompter__story">
            <summary>Story JSON</summary>

            <pre className="prompter__story-code">
              <code>{JSON.stringify(story, null, 2)}</code>
            </pre>
          </details>
        )}
        {/* {storyblokContent && (
        <Section width="full" spaceAfter="small" spaceBefore="none">
          <Html
            style={{ background: "white" }}
            html={`<pre><code>${JSON.stringify(
              storyblokContent,
              null,
              2
            )}</code></pre>`}
          />
        </Section>
      )} */}
      </div>
    );
  }
);
PrompterComponent.displayName = "Prompter Component";

// TODO:
//
// - add hints for removed fields to description, if applicable (e.g. `format: markdown` -> "this typically can include markdown formatting", `default` -> "..., typically set to 'value'")
// - collect used / removed fields, to clean up stories from API to use for additional context
// - merge result back to defaults of component
