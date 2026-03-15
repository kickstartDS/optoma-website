import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { EventLatestTeaser } from "./EventLatestTeaserComponent";
import schema from "./event-latest-teaser.schema.dereffed.json";
import customProperties from "./event-latest-teaser-tokens.json";

const meta: Meta<typeof EventLatestTeaser> = {
  title: "Event/ Event Latest Teaser",
  component: EventLatestTeaser,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof EventLatestTeaser>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 790,
      height: 248,
    },
  },
  args: pack({
    date: "02/04/2026",
    title: "Optoma at ISE 2026",
    location: "Barcelona",
    url: "#",
    cta: "Go to event",
    calendar: {
      day: "04",
      month: "Feb",
    },
    ariaLabel: "Optoma at ISE 2026 on February 4, 2026 in Barcelona",
  }),
};
