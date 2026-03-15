import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Mosaic } from "./MosaicComponent";
import schema from "./mosaic.schema.dereffed.json";
import customProperties from "./mosaic-tokens.json";

const meta: Meta = {
  title: "Components/Mosaic",
  component: Mosaic,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Mosaic>;

export const ColorfulTiles: Story = {
  parameters: {
    viewport: {
      width: 1010,
      height: 1480,
    },
  },
  args: pack({
    layout: "alternate",
    tile: [
      {
        backgroundColor: "#e8f4fd",
        headline: "Corporate Solutions",
        text: "Transform meeting rooms and collaboration spaces with Optoma professional displays and projection solutions.",
        image: {
          src: "img/optoma/corporate-collaboration.jpg",
        },
      },
      {
        backgroundColor: "#fff3e0",
        headline: "Education Technology",
        text: "Empower teachers and engage students with interactive flat panel displays and integrated learning tools.",
        image: {
          src: "img/optoma/ifpd-school1.jpg",
        },
      },
      {
        backgroundColor: "#e8eaf6",
        headline: "Immersive Experiences",
        text: "Create unforgettable visual experiences with large-format projection and LED display technology.",
        image: {
          src: "img/optoma/case-study-lente.jpg",
        },
      },
    ],
  }),
};

export const ColorfulTextWithImagesBeside: Story = {
  parameters: {
    viewport: {
      width: 1010,
      height: 1480,
    },
  },
  args: pack({
    layout: "textLeft",
    tile: [
      {
        textColor: "#0d47a1",
        button: {
          toggle: false,
        },
        headline: "Creative Touch 5-Series",
        text: "Interactive flat panel displays with built-in whiteboard, wireless sharing, and Google Classroom integration.",
        image: {
          src: "img/optoma/ifpd-5g3-75inch.webp",
        },
      },
      {
        textColor: "#1b5e20",
        button: {
          toggle: false,
        },
        headline: "N-Series Professional Displays",
        text: "4K UHD signage and meeting room displays with 24/7 operation, remote management via OMS, and Display Share.",
        image: {
          src: "img/optoma/professional-brand-image.jpg",
        },
      },
      {
        textColor: "#4a148c",
        button: {
          toggle: false,
        },
        headline: "Laser Projectors",
        text: "DuraCore laser engine with up to 30,000 hours of maintenance-free 4K UHD projection for any environment.",
        image: {
          src: "img/optoma/case-study-roblox.jpg",
        },
      },
    ],
  }),
};
