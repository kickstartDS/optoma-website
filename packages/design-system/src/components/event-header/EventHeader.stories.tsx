import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { EventHeader } from "./EventHeaderComponent";
import schema from "./event-header.schema.dereffed.json";

const meta: Meta<typeof EventHeader> = {
  title: "Event/ Event Header",
  component: EventHeader,
  parameters: {
    jsonschema: { schema },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof EventHeader>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 314,
    },
  },
  args: pack({
    title: "Optoma at ISE 2026",
    categories: [{ label: "Trade Show" }, { label: "Product Launch" }],
    intro:
      "Visit Optoma at ISE 2026, Europe's leading AV and systems integration exhibition. Experience our latest interactive displays, laser projectors, and professional signage solutions first-hand.",
  }),
};
