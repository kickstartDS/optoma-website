import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Text } from "./TextComponent";
import schema from "./text.schema.dereffed.json";
import customProperties from "./text-tokens.json";

const meta: Meta<typeof Text> = {
  title: "Components/Text",
  component: Text,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Text>;

export const SingleColumn: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 316,
    },
  },
  args: pack({
    layout: "singleColumn",
    text: `Optoma is a world-leading designer and manufacturer of projectors, interactive flat panel displays, and professional audio-visual solutions. For over 25 years, we have been powering collaboration, learning, and immersive experiences across more than 150 countries.

Our product portfolio includes **4K UHD laser projectors**, **[Creative Touch interactive displays](#)** for education and corporate environments, and professional LED signage for high-impact visual communication.

*From boardrooms to classrooms, Optoma delivers brilliant visuals that inspire.*`,
  }),
};

export const Centered: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 314,
    },
  },
  args: pack({
    align: "center",
    text: `Optoma's commitment to innovation drives everything we do. From DuraCore laser technology with up to 30,000 hours of maintenance-free operation, to our intelligent Optoma Management Suite for remote fleet management — we engineer solutions that perform.

Our **eco-friendly approach** includes industry-leading 0.5W standby power, intelligent brightness adjustment, and **[sustainable packaging initiatives](#)** using 99% recyclable materials.

*Connect, present, and collaborate with confidence.*`,
  }),
};

export const MultiColumn: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 298,
    },
  },
  args: pack({
    layout: "multiColumn",
    text: `Whether you're outfitting a single meeting room or deploying displays across an entire campus, Optoma provides end-to-end solutions tailored to your needs. Our dedicated pre-sales and support teams work closely with AV integrators and IT departments.

With **Display Share** wireless casting and **[Google for Education](#)** certification, Optoma interactive displays integrate seamlessly into existing workflows and infrastructure.

*Trusted by organisations worldwide, from FTSE 100 companies to primary schools.*`,
  }),
};

export const Highlight: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 380,
    },
  },
  args: pack({
    highlightText: true,
    text: `Optoma's award-winning display solutions are designed to transform how organisations communicate, collaborate, and engage. Our range spans from compact projectors for huddle spaces to large-format LED displays for immersive installations.

Every product is backed by our **industry-leading warranty**, dedicated **[technical support team](#)**, and a global network of certified AV partners ready to specify, install, and maintain your Optoma solution.

*Experience the Optoma difference — book a personalised demonstration today.*`,
  }),
};
