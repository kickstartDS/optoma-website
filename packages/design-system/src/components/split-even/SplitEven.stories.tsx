import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { SplitEven } from "./SplitEvenComponent";
import schema from "./split-even.schema.dereffed.json";
import customProperties from "./split-even-tokens.json";
import { Logos } from "../logos/LogosComponent";
import { Headline } from "../headline/HeadlineComponent";
import { Faq } from "../faq/FaqComponent";
import { TextArea } from "@kickstartds/form/lib/text-area";
import { Button } from "../button/ButtonComponent";
import { Cta } from "../cta/CtaComponent";
import { TeaserCard } from "../teaser-card/TeaserCardComponent";

const meta: Meta = {
  title: "Layout/Split Even",
  component: SplitEven,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof SplitEven>;

export const TextWithLogos: Story = {
  parameters: {
    viewport: {
      width: 1690,
      height: 530,
    },
  },
  args: pack({
    contentGutter: "small",
    verticalAlign: "center",
    contentMinWidth: "wide",
    firstComponents: (
      <>
        <Cta
          highlightText
          headline="Display solutions for every environment"
          text={`From meeting rooms to classrooms, retail to live events — Optoma provides professional-grade display technology trusted by organisations in over 150 countries.

Discover our range of interactive flat panels, laser projectors, and professional displays designed for seamless collaboration.`}
          buttons={[{ label: "Explore solutions" }]}
        />
      </>
    ),
    secondComponents: (
      <>
        <Logos
          logosPerRow={3}
          logo={[
            {
              src: "img/optoma/logo-aws-partner.png",
              alt: "AWS Partner",
            },
            {
              src: "img/optoma/logo-google-education.png",
              alt: "Google for Education",
            },
            {
              src: "img/optoma/logo-sussex-trust.png",
              alt: "Sussex Learning Trust",
            },
            {
              src: "img/optoma/logo-schindler.png",
              alt: "Schindler Group",
            },
            {
              src: "img/optoma/logo-birmingham.png",
              alt: "Birmingham City Council",
            },
            {
              src: "img/optoma/logo-sounds-vision.png",
              alt: "Sounds & Vision",
            },
          ]}
        />
      </>
    ),
  }),
};

export const FAQWithForm: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 464,
    },
  },
  args: pack({
    contentGutter: "small",
    verticalAlign: "top",
    sectionMinWidth: "medium",
    horizontalGutter: "large",
    verticalGutter: "large",
    firstComponents: (
      <>
        <Headline text={"Frequently Asked Questions"} level={"h2"} />
        <Faq
          questions={[
            {
              answer:
                "Optoma products come with a standard manufacturer warranty. Projector lamps are covered for 1 year or 1,000 hours, whichever comes first. Extended warranty options are available through your reseller.",
              question: "What warranty coverage comes with Optoma products?",
            },
            {
              answer:
                "Yes. Contact our sales team or an authorised reseller to arrange a live demonstration at your premises. We can showcase our interactive flat panels, projectors, or professional displays.",
              question: "Can I book a product demo?",
            },
            {
              answer:
                "Optoma Management Suite (OMS) is a cloud-based platform that lets you remotely monitor, manage, and update all your Optoma displays from a single dashboard — ideal for multi-site deployments.",
              question: "What is Optoma Management Suite (OMS)?",
            },
          ]}
        />
      </>
    ),
    secondComponents: (
      <>
        <Headline
          text="Still have questions?"
          level="h3"
          style="h3"
          spaceAfter="minimum"
        />
        <TextArea label="How can we help?" />
        <Button label={"Send Enquiry"} />
      </>
    ),
  }),
};

export const MainTeaserWithGrid: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 464,
    },
  },
  args: pack({
    contentGutter: "medium",
    verticalAlign: "stretch",
    sectionMinWidth: "narrow",
    horizontalGutter: "small",
    verticalGutter: "small",
    secondLayout: {
      layout: "smallTiles",
      stretchVertically: true,
      gutter: "small",
    },
    firstLayout: {
      stretchVertically: true,
      gutter: "small",
    },
    firstComponents: (
      <>
        <TeaserCard
          layout="compact"
          url={""}
          headline="Creative Touch 5-Series"
          image="img/optoma/ifpd-creative-board.jpg"
          text="Interactive flat panel displays with built-in whiteboard and Google Classroom integration."
          imageRatio="landscape"
          button={{
            label: "Learn more",
            chevron: true,
          }}
        />
      </>
    ),
    secondComponents: (
      <>
        <TeaserCard
          layout="compact"
          url={""}
          headline="N-Series Displays"
          image="img/optoma/professional-brand-image.jpg"
        />
        <TeaserCard
          layout="compact"
          url={""}
          headline="Laser Projectors"
          image="img/optoma/case-study-roblox.jpg"
        />
        <TeaserCard
          layout="compact"
          url={""}
          headline="LED Displays"
          image="img/optoma/case-study-lente.jpg"
        />
        <TeaserCard
          layout="compact"
          url={""}
          headline="Display Share"
          image="img/optoma/corporate-collaboration.jpg"
        />
        <TeaserCard
          layout="compact"
          url={""}
          headline="Management Suite"
          image="img/optoma/corporate-communication.jpg"
        />
        <TeaserCard
          layout="compact"
          url={""}
          headline="Accessories"
          image="img/optoma/professional-signage.jpg"
        />
      </>
    ),
  }),
};
