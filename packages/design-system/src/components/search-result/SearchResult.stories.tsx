import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { SearchResult } from "./SearchResultComponent";
import schema from "./search-result.schema.dereffed.json";

const meta: Meta<typeof SearchResult> = {
  title: "Corporate / Search Result",
  component: SearchResult,
  parameters: {
    jsonschema: { schema },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof SearchResult>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 780,
      height: 636,
    },
  },
  args: pack({
    title: "Creative Touch 5-Series Interactive Flat Panel Displays",
    previewImage: "img/optoma/ifpd-creative-board.jpg",
    initialMatch:
      "The **Creative Touch** 5-Series brings collaboration to life with built-in whiteboard tools, wireless screen sharing, and Google Classroom integration — designed for modern classrooms and meeting rooms.",
    matches: [
      {
        title: "Features: Built-in Whiteboard",
        snippet:
          "The **Creative Touch** includes intuitive annotation and whiteboard tools accessible from any input source.",
        url: "#",
      },
      {
        title: "Specification: Display Sizes",
        snippet:
          'The **Creative Touch** 5-Series is available in 65", 75", and 86" screen sizes to suit any installation.',
        url: "#",
      },
      {
        title: "Case Study: Sussex Learning Trust",
        snippet:
          "How 15 primary schools transformed classroom engagement with Optoma **Creative Touch** interactive displays.",
        url: "#",
      },
    ],
    url: "#",
  }),
};
