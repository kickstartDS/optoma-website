import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Logos } from "./LogosComponent";
import schema from "./logos.schema.dereffed.json";
import customProperties from "./logos-tokens.json";

const meta: Meta<typeof Logos> = {
  title: "Components/Logos",
  component: Logos,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Logos>;

export const CenteredWithButton: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 492,
    },
  },
  args: pack({
    logo: [
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
      {
        src: "img/optoma/logo-jpf.png",
        alt: "James Pantyfedwen Foundation",
      },
      {
        src: "img/optoma/logo-schoenefeld.png",
        alt: "Brandenburg Schönefeld Airport",
      },
    ],
    cta: {
      toggle: true,
      style: "button",
    },
  }),
};

export const LeftAlignedWithTextLink: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 420,
    },
  },
  args: pack({
    logo: [
      {
        src: "img/optoma/logo-aws-partner.png",
        alt: "AWS Partner",
      },
      {
        src: "img/optoma/logo-google-education.png",
        alt: "Google for Education",
      },
      {
        src: "img/optoma/logo-reactiv-suite.png",
        alt: "Reactiv Suite",
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
        src: "img/optoma/logo-sounds-vision.png",
        alt: "Sounds & Vision",
      },
      {
        src: "img/optoma/logo-jpf.png",
        alt: "James Pantyfedwen Foundation",
      },
      {
        src: "img/optoma/logo-birmingham.png",
        alt: "Birmingham City Council",
      },
    ],
    cta: {
      toggle: true,
    },
    align: "left",
  }),
};

export const LogoWall: Story = {
  parameters: {
    viewport: {
      width: 1080,
      height: 546,
    },
  },
  args: pack({
    logosPerRow: 4,
    logo: [
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
        src: "img/optoma/logo-schoenefeld.png",
        alt: "Brandenburg Schönefeld Airport",
      },
      {
        src: "img/optoma/logo-sounds-vision.png",
        alt: "Sounds & Vision",
      },
      {
        src: "img/optoma/logo-jpf.png",
        alt: "James Pantyfedwen Foundation",
      },
      {
        src: "img/optoma/logo-reactiv-suite.png",
        alt: "Reactiv Suite",
      },
      {
        src: "img/optoma/logo-heavym.jpg",
        alt: "HeavyM",
      },
      {
        src: "img/optoma/logo-vioso.png",
        alt: "VIOSO",
      },
      {
        src: "img/optoma/logo-google-partner.png",
        alt: "Google Partner",
      },
    ],

    cta: {
      toggle: false,
    },
  }),
};

export const LogoRow: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 248,
    },
  },
  args: pack({
    logosPerRow: 6,
    logo: [
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
        src: "img/optoma/logo-sounds-vision.png",
        alt: "Sounds & Vision",
      },
      {
        src: "img/optoma/logo-jpf.png",
        alt: "James Pantyfedwen Foundation",
      },
      {
        src: "img/optoma/logo-reactiv-suite.png",
        alt: "Reactiv Suite",
      },
      {
        src: "img/optoma/logo-birmingham.png",
        alt: "Birmingham City Council",
      },
    ],

    cta: {
      toggle: false,
    },
  }),
};
