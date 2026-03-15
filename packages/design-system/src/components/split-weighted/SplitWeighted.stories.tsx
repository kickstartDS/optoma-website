import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { SplitWeighted } from "./SplitWeightedComponent";
import { Text } from "../text/TextComponent";
import schema from "./split-weighted.schema.dereffed.json";
import customProperties from "./split-weighted-tokens.json";
import { Headline } from "../headline/HeadlineComponent";
import { Contact } from "../contact/ContactComponent";
import { TeaserCard } from "../teaser-card/TeaserCardComponent";
import { Cta } from "../cta/CtaComponent";
import { ImageText } from "../image-text/ImageTextComponent";

const meta: Meta = {
  title: "Layout/Split Weighted",
  component: SplitWeighted,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof SplitWeighted>;

export const TextWithContact: Story = {
  parameters: {
    viewport: {
      width: 1630,
      height: 376,
    },
  },
  args: pack({
    verticalGutter: "large",
    asideLayout: {
      minWidth: "wide",
    },
    main: (
      <>
        <Cta
          headline="Display solutions for every environment"
          text={`From corporate meeting rooms to school classrooms, Optoma provides professional-grade display technology trusted by organisations in over 150 countries.

Discover our range of interactive flat panels, laser projectors, and professional displays designed for seamless collaboration.`}
          buttons={[{ label: "Explore solutions" }]}
        />
      </>
    ),
    aside: (
      <>
        <Contact
          title={"Emma Richardson"}
          subtitle={"Regional Sales Manager"}
          image={{
            src: "img/people/contact-isabella.png",
            aspectRatio: "wide",
          }}
          links={[
            {
              icon: "email",
              url: "mailto:emma.richardson@optoma.com",
              label: "emma.richardson@optoma.com",
              ariaLabel: "Email Emma Richardson",
            },
            {
              url: "tel:+441923691800",
              icon: "phone",
              label: "+44 (0)1923 691 800",
              ariaLabel: "Call Optoma Europe",
            },
          ]}
        />
      </>
    ),
  }),
};

export const TextWithTeaser: Story = {
  parameters: {
    viewport: {
      width: 1200,
      height: 600,
    },
  },
  args: pack({
    mainLayout: {
      gutter: "small",
      minWidth: "narrow",
    },
    asideLayout: {
      minWidth: "wide",
    },
    main: (
      <>
        <Headline
          text={"Professional Display Solutions"}
          level={"h2"}
          spaceAfter="minimum"
        />
        <Text
          highlightText
          text={`Optoma’s N-Series professional displays deliver commercial-grade 4K UHD performance designed for 24/7 operation. With integrated OMS remote management, Display Share wireless casting, and a slim bezel design, they’re ideal for digital signage, corporate communications, and public spaces.

Available in 55", 65", 75", and 86" screen sizes to suit any installation.`}
        />
      </>
    ),
    aside: (
      <TeaserCard
        layout="row"
        button={{
          chevron: false,
          hidden: false,
          label: "Read case study",
        }}
        imageRatio="landscape"
        headline="Sussex Learning Trust"
        text="Transforming classroom engagement with IFPDs"
        image="img/optoma/ifpd-school1.jpg"
        url="#"
      />
    ),
  }),
};

export const TextWithTeaserTiles: Story = {
  parameters: {
    viewport: {
      width: 1200,
      height: 600,
    },
  },
  args: pack({
    horizontalGutter: "small",
    order: {
      desktop: "asideFirst",
      mobile: "asideFirst",
    },
    mainLayout: {
      gutter: "small",
      minWidth: "narrow",
      layout: "smallTiles",
      stretchVertically: true,
    },
    asideLayout: {
      stretchVertically: true,
      minWidth: "wide",
      gutter: "small",
    },
    aside: (
      <>
        <ImageText
          text={`Optoma’s **Creative Touch 5-Series** interactive flat panel displays bring collaboration to life in any environment. With built-in annotation tools, wireless screen sharing, and seamless **[Google Classroom integration](#)**, they’re designed for modern teaching and meeting spaces.

*Available in 65", 75", and 86" screen sizes.*"`}
          image={{
            src: "img/optoma/ifpd-creative-board.jpg",
            alt: "Optoma Creative Touch interactive display in a classroom",
          }}
          layout={"above"}
        />
      </>
    ),
    main: (
      <>
        <TeaserCard
          url={""}
          headline="Corporate"
          image="img/optoma/corporate-huddle-spaces.jpg"
          imageRatio="square"
          layout="compact"
        />
        <TeaserCard
          url={""}
          headline="Education"
          image="img/optoma/ifpd-school2.jpg"
          imageRatio="square"
          layout="compact"
        />
        <TeaserCard
          url={""}
          headline="Retail & Signage"
          image="img/optoma/professional-signage.jpg"
          imageRatio="square"
          layout="compact"
        />
        <TeaserCard
          url={""}
          headline="Museums & Galleries"
          image="img/optoma/case-study-museum.jpg"
          imageRatio="square"
          layout="compact"
        />
        <TeaserCard
          url={""}
          headline="Live Events"
          image="img/optoma/case-study-commonwealth.jpg"
          imageRatio="square"
          layout="compact"
        />
        <TeaserCard
          url={""}
          headline="Hospitality"
          image="img/optoma/professional-hybrid.jpg"
          imageRatio="square"
          layout="compact"
        />
      </>
    ),
  }),
};
