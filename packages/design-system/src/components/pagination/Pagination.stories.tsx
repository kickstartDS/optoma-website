import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Pagination } from "./PaginationComponent";
import customProperties from "./pagination-tokens.json";
import schema from "./pagination.schema.dereffed.json";

const meta: Meta = {
  title: "Corporate/Pagination",
  component: Pagination,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 990,
      height: 192,
    },
  },
  args: pack({
    pages: [
      {
        url: "#page1",
      },
      {
        url: "#page2",
      },
      {
        url: "#page3",
      },
      {
        url: "#page4",
      },
      {
        url: "#page5",
      },
      {
        url: "#page6",
        active: true,
      },
      {
        url: "#page7",
      },
      {
        url: "#page8",
      },
      {
        url: "#page9",
      },
      {
        url: "#page10",
      },
      {
        url: "#page11",
      },
      {
        url: "#page12",
      },
    ],
  }),
};
