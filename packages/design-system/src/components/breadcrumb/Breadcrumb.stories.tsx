import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Breadcrumb } from "./BreadcrumbComponent";
import customProperties from "./breadcrumb-tokens.json";
import schema from "./breadcrumb.schema.dereffed.json";

const meta: Meta = {
  title: "Corporate/Breadcrumb",
  component: Breadcrumb,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 170,
    },
  },
  args: pack({
    pages: [
      {
        url: "#",
        label: "Home",
      },
      {
        url: "#",
        label: "Products",
      },
      {
        url: "#",
        label: "Interactive Displays",
      },
    ],
  }),
};
