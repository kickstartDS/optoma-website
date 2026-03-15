import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Stats } from "./StatsComponent";
import schema from "./stats.schema.json";
import customProperties from "./stats-tokens.json";

const meta: Meta = {
  title: "Components/Stats",
  component: Stats,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Stats>;

export const CountUpWithIcons: Story = {
  parameters: {
    viewport: {
      width: 790,
      height: 318,
    },
  },
  args: pack({
    stat: [
      { number: "25+", title: "Years of Innovation", icon: "star" },
      { number: "150+", title: "Countries Worldwide", icon: "map" },
      { number: "50M+", title: "Products Installed", icon: "person" },
    ],
  }),
};

export const CountUpWithDescription: Story = {
  parameters: {
    viewport: {
      width: 700,
      height: 278,
    },
  },
  args: pack({
    align: "left",
    stat: [
      {
        number: "0.5W",
        title: "Standby Power",
        description:
          "Industry-leading standby power consumption for energy-efficient operation across all professional display lines.",
      },
      {
        number: "30,000h",
        title: "Laser Life",
        description:
          "DuraCore laser engine delivers up to 30,000 hours of maintenance-free projection with consistent brightness.",
      },
    ],
  }),
};
