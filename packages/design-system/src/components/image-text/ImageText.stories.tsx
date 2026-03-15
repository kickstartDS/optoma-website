import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { ImageText } from "./ImageTextComponent";
import schema from "./image-text.schema.dereffed.json";
import customProperties from "./image-text-tokens.json";

const meta: Meta = {
  title: "Components/Image Text",
  component: ImageText,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof ImageText>;

export const BesideRightLayout: Story = {
  parameters: {
    viewport: {
      width: 1240,
      height: 515,
    },
  },
  args: pack({
    text: `Optoma's Interactive Flat Panel Displays bring collaboration to life in classrooms and meeting rooms alike. With built-in whiteboard software and wireless screen sharing, the Creative Touch 5-Series empowers teams to work together — whether in the room or connecting remotely.

The **Creative Touch 5-Series** is available in **[65", 75", and 86" sizes](#)**, featuring 4K UHD resolution, multi-touch capability, and integrated cloud whiteboard for seamless collaboration.

*Designed for 24/7 operation with industry-leading 0.5W standby power consumption.*`,
    image: {
      src: "img/optoma/ifpd-creative-board.jpg",
      alt: "Optoma Creative Touch interactive flat panel display in a modern classroom",
    },
    layout: "beside-right",
  }),
};

export const AboveLayout: Story = {
  parameters: {
    viewport: {
      width: 760,
      height: 788,
    },
  },
  args: pack({
    text: `Optoma's professional display solutions are built for the demands of corporate environments. From huddle spaces to large boardrooms, our N-Series displays deliver crisp 4K visuals with integrated remote management via the Optoma Management Suite.

Featuring **Display Share** wireless casting and **[OMS remote management](#)** capabilities, Optoma professional displays simplify IT administration while enhancing the meeting room experience.

*Every display is engineered for reliability, with 24/7 operation capability and eco-friendly packaging made from 99% recyclable materials.*`,
    image: {
      src: "img/optoma/professional-collaboration.jpg",
      alt: "Optoma N-Series professional display in a corporate meeting room",
    },
    layout: "above",
  }),
};
