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
import { ThreeDots } from "react-loader-spinner";
import { traverse as objectTraverse } from "object-traversal";
import { ISbStoryData, getStoryblokApi } from "@storyblok/react";
import { defaultObjectForSchema } from "@kickstartds/cambria";
import merge from "deepmerge";

import { fetchStory, initStoryblok } from "@/helpers/storyblok";
import { unflatten } from "@/helpers/unflatten";

import {
  prepareSchemaForOpenAi,
  processOpenAiResponse,
  processForStoryblok,
} from "@kickstartds/storyblok-services";

import pageSchema from "@kickstartds/ds-agency-premium/page/page.schema.dereffed.json";

import { Section } from "@kickstartds/ds-agency-premium/section";
import { SplitEven } from "@kickstartds/ds-agency-premium/split-even";
import { SplitWeighted } from "@kickstartds/ds-agency-premium/split-weighted";

import { BlogTeaser } from "@kickstartds/ds-agency-premium/blog-teaser";
import { BusinessCard } from "@kickstartds/ds-agency-premium/business-card";
import { Contact } from "@kickstartds/ds-agency-premium/contact";
import { ContentNav } from "@kickstartds/ds-agency-premium/content-nav";
import { Cta } from "@kickstartds/ds-agency-premium/cta";
import { Divider } from "@kickstartds/ds-agency-premium/divider";
import { Downloads } from "@kickstartds/ds-agency-premium/downloads";
import { Faq } from "@kickstartds/ds-agency-premium/faq";
import { Features } from "@kickstartds/ds-agency-premium/features";
import { Gallery } from "@kickstartds/ds-agency-premium/gallery";
import { Headline } from "@kickstartds/ds-agency-premium/headline";
import { Hero } from "@kickstartds/ds-agency-premium/hero";
import { ImageStory } from "@kickstartds/ds-agency-premium/image-story";
import { ImageText } from "@kickstartds/ds-agency-premium/image-text";
import { Logos } from "@kickstartds/ds-agency-premium/logos";
import { Mosaic } from "@kickstartds/ds-agency-premium/mosaic";
import { PageProps } from "@kickstartds/ds-agency-premium/page";
import { Slider } from "@kickstartds/ds-agency-premium/slider";
import { Stats } from "@kickstartds/ds-agency-premium/stats";
import { TeaserCard } from "@kickstartds/ds-agency-premium/teaser-card";
import { Testimonials } from "@kickstartds/ds-agency-premium/testimonials";
import { Text } from "@kickstartds/ds-agency-premium/text";
import { VideoCurtain } from "@kickstartds/ds-agency-premium/video-curtain";

import { InfoTable } from "../info-table/InfoTableComponent";

import PrompterBadge from "./prompter-badge/PrompterBadge";
import PrompterButton from "./prompter-button/PrompterButton";
import PrompterSection from "./prompter-section/PrompterSection";
import PrompterSectionInput from "./prompter-section-input/PrompterSectionInput";
import PrompterSelectionDisplay from "./prompter-selection-display/PrompterSelectionDisplay";
import PrompterSubmittedText from "./prompter-submitted-text/PrompterSubmittedText";
import { PrompterSelectField } from "./prompter-select-field/PrompterSelectField";
import { PrompterProps } from "./PrompterProps";

type Idea = {
  id: string;
  name: string;
};

const componentMap = {
  "blog-teaser": BlogTeaser,
  "business-card": BusinessCard,
  contact: Contact,
  "content-nav": ContentNav,
  cta: Cta,
  divider: Divider,
  downloads: Downloads,
  faq: Faq,
  features: Features,
  gallery: Gallery,
  headline: Headline,
  hero: Hero,
  "image-story": ImageStory,
  "image-text": ImageText,
  "info-table": InfoTable,
  logos: Logos,
  mosaic: Mosaic,
  slider: Slider,
  "split-even": SplitEven,
  "split-weighted": SplitWeighted,
  stats: Stats,
  "teaser-card": TeaserCard,
  testimonials: Testimonials,
  text: Text,
  "video-curtain": VideoCurtain,
} as const;

type ComponentMapKeys = keyof typeof componentMap;

function isComponentMapKey(key: string): key is ComponentMapKeys {
  return key in componentMap;
}

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

    const { schema, schemaMap } = useMemo(() => {
      const prepared = prepareSchemaForOpenAi(pageSchema, {
        sections,
      });

      if (prepared.validation.warnings.length > 0) {
        console.log("Schema warnings:", prepared.validation.warnings);
      }

      return {
        schema: prepared.envelope,
        schemaMap: prepared.schemaMap,
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
      let prompt = `Task: ${userPrompt}.\n`;

      if (useIdea) {
        const ideaContent: string[] = [];
        const idea = ideas.find((object) => object.id === ideaId);

        if (idea) {
          objectTraverse(idea, ({ value }) => {
            if (value && value.type && value.type === "text" && value.text)
              ideaContent.push(value.text);
          });
        }
        prompt += `\n((Idea)):\n${ideaContent.join(" ")}\n`;
      }
      if (story) prompt += `\n((Story)):\n${JSON.stringify(story.content)}\n`;
      if (relatedStories && relatedStories.length > 0) {
        relatedStories.forEach((relatedStory) => {
          prompt += `\n((Related Story)):\n${JSON.stringify(
            processStory(relatedStory)
          )}\n`;
        });
      }

      return prompt;
    };

    useEffect(() => {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/ideas`)
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
        const token = process.env.NEXT_PUBLIC_STORYBLOK_API_TOKEN;
        if (!token) {
          console.error("Missing NEXT_PUBLIC_STORYBLOK_API_TOKEN env var");
          return;
        }
        initStoryblok(token);
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
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/content`, {
        method: "POST",
        body: JSON.stringify({
          system: systemPrompt,
          prompt,
          schema,
        }),
      })
        .then((response) => {
          response.json().then((json) => {
            console.log("Prompter raw response", response, json);
            const pageProps = processOpenAiResponse(
              JSON.parse(json.content),
              schemaMap,
              defaultObjectForSchema,
              merge
            );
            setGeneratedContent(pageProps);

            const storyblokProps = processForStoryblok(
              structuredClone(pageProps)
            );
            setStoryblokContent(storyblokProps);

            console.log("Prompter response", json, pageProps, storyblokProps);

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

      console.log("Submitting story", storyblokContent);

      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/import`, {
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
              ? "Prompter — create a content draft, fast, on-brand, seamlessly integrated."
              : "Your new content has been saved"
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
                            label: "Select an idea...",
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
              <PrompterSubmittedText text="To avoid overwriting your new content, please reload the page now." />
              <PrompterButton icon="reload" label="Reload page" />
            </>
          )}
        </PrompterSection>

        {generatedContent && !submitted && (
          <div className="prompter__generated-content">
            <PrompterBadge label="AI Draft" state="unsaved" />
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
// - relatedStories initially, after import into Storyblok, is set to `blocks`, but should be `references`
// - aiDraft not rendered in frontend
