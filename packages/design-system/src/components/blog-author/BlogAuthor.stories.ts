import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { BlogAuthor } from "./BlogAuthorComponent";
import schema from "./blog-author.schema.dereffed.json";

const meta: Meta<typeof BlogAuthor> = {
  title: "Blog/ Blog Author",
  component: BlogAuthor,
  parameters: {
    jsonschema: { schema },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof BlogAuthor>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 390,
      height: 436,
    },
  },
  args: pack({
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
  }),
};
