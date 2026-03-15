import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { BlogAside } from "./BlogAsideComponent";
import schema from "./blog-aside.schema.dereffed.json";
import customProperties from "./blog-aside-tokens.json";

const meta: Meta<typeof BlogAside> = {
  title: "Blog/ Blog Aside",
  component: BlogAside,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof BlogAside>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 390,
      height: 494,
    },
  },
  args: pack({
    author: {
      name: "Sarah Mitchell",
      image: {
        src: "img/people/author-emily.png",
        aspectRatio: "square",
      },
      links: [
        {
          icon: "twitter",
          label: "@OptomaUK",
        },
        {
          icon: "email",
          label: "education@optoma.co.uk",
        },
      ],
    },
    socialSharing: [
      {
        icon: "twitter",
        href: "https://twitter.com/share?text=Sussex%20Learning%20Trust%20Case%20Study&url=https://www.optoma.co.uk/case-studies",
        title: "Share on Twitter",
      },
      {
        icon: "linkedin",
        href: "https://www.linkedin.com/shareArticle?mini=true&url=https://www.optoma.co.uk/case-studies&title=Sussex%20Learning%20Trust%20Case%20Study",
        title: "Share on LinkedIn",
      },
    ],
    readingTime: "7 min read",
    date: "03/15/2025",
  }),
};
