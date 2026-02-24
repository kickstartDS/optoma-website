import {
  FC,
  HTMLAttributes,
  forwardRef,
  useEffect,
} from "react";
import { ThreeDots } from "react-loader-spinner";

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
import PrompterModeToggle from "./prompter-mode-toggle/PrompterModeToggle";
import PrompterComponentPicker from "./prompter-component-picker/PrompterComponentPicker";
import PrompterPlanReview from "./prompter-plan-review/PrompterPlanReview";
import PrompterProgress from "./prompter-progress/PrompterProgress";
import PrompterWarnings from "./prompter-warnings/PrompterWarnings";
import { usePrompter, GeneratedSection } from "./usePrompter";
import { PrompterProps } from "./PrompterProps";

// ─── Component map for preview rendering ──────────────────────────────

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

// ─── Preview renderer ─────────────────────────────────────────────────

/**
 * Renders a single generated section using Design System props.
 * The designSystemProps from generateSectionContent() are in DS format,
 * wrapped in a section envelope: { section: [{ components: [...], ...sectionProps }] }
 */
const SectionPreview: FC<{
  generated: GeneratedSection;
  index: number;
  onRegenerate?: (index: number) => void;
  isRegenerating?: boolean;
}> = ({ generated, index, onRegenerate, isRegenerating }) => {
  const dsProps = generated.designSystemProps;

  // The section may be at dsProps.section[0] (page envelope) or dsProps directly
  const sectionArray = dsProps?.section || (dsProps ? [dsProps] : []);

  if (!sectionArray.length || isRegenerating) {
    return (
      <div className="prompter-section-preview prompter-section-preview--loading">
        <ThreeDots
          height="20"
          width="50"
          radius="9"
          color="var(--prompter-color)"
          ariaLabel="regenerating"
          visible={true}
        />
      </div>
    );
  }

  return (
    <div className="prompter-section-preview">
      {onRegenerate && (
        <button
          className="prompter-section-preview__regenerate"
          onClick={() => onRegenerate(index)}
          title="Regenerate this section"
          type="button"
        >
          ↻ Regenerate
        </button>
      )}
      {sectionArray.map((section: any, sIdx: number) => {
        const { components, ...sectionProps } = section;
        return (
          <Section key={sIdx} {...sectionProps}>
            {components?.map((component: any, cIdx: number) => {
              const type = component.type;
              if (!type || !isComponentMapKey(type)) {
                console.warn("Unknown component type in preview:", type);
                return null;
              }
              const Component = componentMap[type];
              return <Component key={cIdx} {...component} />;
            })}
          </Section>
        );
      })}
    </div>
  );
};

/**
 * Renders all generated sections with "AI Draft" badge.
 */
const PagePreview: FC<{
  sections: GeneratedSection[];
  onRegenerate?: (index: number) => void;
}> = ({ sections, onRegenerate }) => {
  return (
    <>
      {sections.map((gen, index) => (
        <SectionPreview
          key={`${gen.componentType}-${index}`}
          generated={gen}
          index={index}
          onRegenerate={onRegenerate}
          isRegenerating={
            Object.keys(gen.designSystemProps || {}).length === 0
          }
        />
      ))}
    </>
  );
};

// ─── Prompt textarea ──────────────────────────────────────────────────

const PromptTextarea: FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, disabled }) => (
  <textarea
    className="prompter-prompt-textarea"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    rows={3}
  />
);

// ─── Main Prompter Component ──────────────────────────────────────────

export const PrompterComponent = forwardRef<
  HTMLDivElement,
  PrompterProps & HTMLAttributes<HTMLDivElement>
>(
  (
    {
      sections: _sections,
      includeStory = true,
      useIdea = true,
      relatedStories = [],
      userPrompt = "",
      systemPrompt,
      ...props
    },
    ref
  ) => {
    const prompter = usePrompter({
      defaultMode: "section",
      includeStory,
      useIdea,
      userPrompt,
      systemPrompt,
      relatedStories,
    });

    // Detect the prompter UID once mounted
    useEffect(() => {
      prompter.detectPrompterUid();
    }, [prompter.detectPrompterUid]);

    const {
      mode,
      step,
      prompt,
      error,
      ideas,
      selectedIdea,
      componentTypes,
      plan,
      generatedSections,
      currentSectionIndex,
      totalSections,
      warnings,
      canGenerate,
      canPlan,
      canStartPageGeneration,
      canImport,
      setMode,
      setPrompt,
      setSelectedIdea,
      addComponentType,
      removeComponentType,
      moveComponentType,
      planPage,
      updatePlanSection,
      removePlanSection,
      movePlanSection,
      generate,
      regenerateSection,
      importSections,
      discard,
      prompterRef,
    } = prompter;

    const isConfiguring = step === "configure";
    const isPlanning = step === "planning";
    const isPlanReview = step === "plan-review";
    const isGenerating = step === "generating";
    const isPreview = step === "preview";
    const isImporting = step === "importing";
    const isSubmitted = step === "submitted";
    const isError = step === "error";

    // ── Headlines based on step ──────────────────────────────────────
    const getHeadline = (): string => {
      if (isSubmitted) return "Your new content has been saved";
      if (isImporting) return "Saving content…";
      if (isPreview) return "Review generated content";
      if (isGenerating) return "Generating content…";
      if (isPlanReview) return "Review the planned structure";
      if (isPlanning) return "Planning your page…";
      if (isError) return "Something went wrong";
      return "Prompter — create a content draft, fast, on-brand, seamlessly integrated.";
    };

    return (
      <div className="prompter" {...props} ref={ref}>
        <div ref={prompterRef}>
          <PrompterSection headline={getHeadline()}>
            {/* ── Step 1: Configure ──────────────────────────────── */}
            {isConfiguring && (
              <>
                {/* Mode toggle */}
                <PrompterModeToggle mode={mode} onModeChange={setMode} />

                {/* Idea picker (optional) */}
                {useIdea && ideas.length > 0 && (
                  <PrompterSectionInput>
                    {!selectedIdea && (
                      <PrompterSelectField
                        value={selectedIdea}
                        onChange={(e: any) => setSelectedIdea(e.target.value)}
                        options={[
                          {
                            label: "Select an idea…",
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
                    {selectedIdea && (
                      <PrompterSelectionDisplay
                        idea={
                          ideas.find((i) => i.id === selectedIdea)?.name || ""
                        }
                        text=""
                      />
                    )}
                  </PrompterSectionInput>
                )}

                {/* Prompt / intent textarea */}
                <PromptTextarea
                  value={prompt}
                  onChange={setPrompt}
                  placeholder={
                    mode === "section"
                      ? "Describe the content you want to generate…"
                      : "Describe the page you want to create (e.g. 'product landing page for our new API')…"
                  }
                />

                {/* Section mode: component type picker */}
                {mode === "section" && (
                  <PrompterComponentPicker
                    selectedTypes={componentTypes}
                    onAdd={addComponentType}
                    onRemove={removeComponentType}
                    onMove={moveComponentType}
                  />
                )}

                {/* Action buttons */}
                <div className="prompter-section__button-row">
                  {mode === "section" && (
                    <PrompterButton
                      label="Generate"
                      icon="wand"
                      disabled={!canGenerate}
                      onClick={generate}
                    />
                  )}
                  {mode === "page" && (
                    <PrompterButton
                      label="Plan Content"
                      icon="wand"
                      disabled={!canPlan}
                      onClick={planPage}
                    />
                  )}
                </div>
              </>
            )}

            {/* ── Planning (page mode loading) ───────────────────── */}
            {isPlanning && (
              <ThreeDots
                height="30"
                width="80"
                radius="9"
                color="var(--prompter-color)"
                ariaLabel="planning"
                wrapperClass="prompter-loading-indicator"
                visible={true}
              />
            )}

            {/* ── Plan review (page mode) ────────────────────────── */}
            {isPlanReview && plan?.sections && (
              <>
                <PrompterPlanReview
                  sections={plan.sections}
                  reasoning={plan.reasoning}
                  onRemove={removePlanSection}
                  onMove={movePlanSection}
                  onUpdateIntent={(index, intent) =>
                    updatePlanSection(index, { intent })
                  }
                  onGenerate={generate}
                />
                <div className="prompter-section__button-row">
                  <PrompterButton
                    variant="secondary"
                    label="Back"
                    onClick={discard}
                  />
                  <PrompterButton
                    label="Generate All"
                    icon="wand"
                    disabled={!canStartPageGeneration}
                    onClick={generate}
                  />
                </div>
              </>
            )}

            {/* ── Generating (progress bar) ──────────────────────── */}
            {isGenerating && (
              <>
                <PrompterProgress
                  current={currentSectionIndex}
                  total={totalSections}
                  currentType={
                    mode === "page"
                      ? plan?.sections?.[currentSectionIndex]?.componentType
                      : componentTypes[currentSectionIndex]
                  }
                />
                <ThreeDots
                  height="30"
                  width="80"
                  radius="9"
                  color="var(--prompter-color)"
                  ariaLabel="generating"
                  wrapperClass="prompter-loading-indicator"
                  visible={true}
                />
              </>
            )}

            {/* ── Preview: save / discard controls ───────────────── */}
            {isPreview && (
              <>
                {warnings.length > 0 && (
                  <PrompterWarnings warnings={warnings} />
                )}
                <div className="prompter-section__button-row">
                  <PrompterButton
                    variant="secondary"
                    label="Discard Content"
                    onClick={discard}
                  />
                  <PrompterButton
                    label="Save Content"
                    icon="save"
                    disabled={!canImport}
                    onClick={importSections}
                  />
                </div>
              </>
            )}

            {/* ── Importing ──────────────────────────────────────── */}
            {isImporting && (
              <ThreeDots
                height="30"
                width="80"
                radius="9"
                color="var(--prompter-color)"
                ariaLabel="importing"
                wrapperClass="prompter-loading-indicator"
                visible={true}
              />
            )}

            {/* ── Submitted ──────────────────────────────────────── */}
            {isSubmitted && (
              <>
                <PrompterSubmittedText text="To avoid overwriting your new content, please reload the page now." />
                <PrompterButton
                  icon="reload"
                  label="Reload page"
                  onClick={() => window.location.reload()}
                />
              </>
            )}

            {/* ── Error ──────────────────────────────────────────── */}
            {isError && error && (
              <>
                <div className="prompter-error">
                  <strong>Error:</strong> {error}
                </div>
                <PrompterButton
                  variant="secondary"
                  label="Try Again"
                  onClick={discard}
                />
              </>
            )}
          </PrompterSection>
        </div>

        {/* ── Generated content preview ────────────────────────────── */}
        {(isPreview || isGenerating) && generatedSections.length > 0 && (
          <div className="prompter__generated-content">
            <PrompterBadge label="AI Draft" state="unsaved" />
            <PagePreview
              sections={generatedSections}
              onRegenerate={isPreview ? regenerateSection : undefined}
            />
          </div>
        )}

        {/* ── Story JSON debug panel ───────────────────────────────── */}
        {prompter.story && (
          <details className="prompter__story">
            <summary>Story JSON</summary>
            <pre className="prompter__story-code">
              <code>{JSON.stringify(prompter.story, null, 2)}</code>
            </pre>
          </details>
        )}
      </div>
    );
  }
);

PrompterComponent.displayName = "Prompter Component";
