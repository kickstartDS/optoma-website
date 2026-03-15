import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { BlogTeaser } from "./BlogTeaserComponent";
import schema from "./blog-teaser.schema.dereffed.json";
import customProperties from "./blog-teaser-tokens.json";

const meta: Meta<typeof BlogTeaser> = {
  title: "Blog/ Blog Teaser",
  component: BlogTeaser,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof BlogTeaser>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 438,
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
    teaserText:
      "Discover how Sussex Learning Trust deployed Creative Touch 5-Series interactive displays across multiple schools, resulting in improved student engagement, streamlined lesson delivery, and significant time savings for teaching staff. Learn about the implementation process, integration with Google Classroom, and the measurable impact on learning outcomes.",
    author: {
      name: "Sarah Mitchell",
      title: "Head of Digital Learning",
      image: "img/people/author-emily.png",
    },
  }),
};
