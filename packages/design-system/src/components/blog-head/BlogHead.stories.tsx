import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { BlogHead } from "./BlogHeadComponent";
import schema from "./blog-head.schema.dereffed.json";
import customProperties from "./blog-head-tokens.json";

const meta: Meta<typeof BlogHead> = {
  title: "Blog/ Blog Head",
  component: BlogHead,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof BlogHead>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 844,
    },
  },
  args: pack({
    date: "06/15/2025",
    tags: [
      {
        entry: "Case Study",
      },
      {
        entry: "Education",
      },
    ],
    headline:
      "How Sussex Learning Trust Transformed Classroom Engagement with Optoma IFPDs",
    image: "img/optoma/ifpd-school1.jpg",
  }),
};
