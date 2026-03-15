import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { EventLatest } from "./EventLatestComponent";
import schema from "./event-latest.schema.dereffed.json";
import customProperties from "./event-latest-tokens.json";

const meta: Meta<typeof EventLatest> = {
  title: "Event/ Event Latest",
  component: EventLatest,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof EventLatest>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 790,
      height: 580,
    },
  },
  args: pack({
    events: [
      {
        date: "02/04/2026",
        title: "ISE 2026",
        location: "Barcelona",
        url: "#",
        cta: "Go to event",
        calendar: {
          day: "04",
          month: "Feb",
        },
        ariaLabel: "ISE 2026 on February 4, 2026 in Barcelona",
      },
      {
        date: "01/22/2026",
        title: "BETT Show 2026",
        location: "London",
        url: "#",
        cta: "Go to event",
        calendar: {
          day: "22",
          month: "Jan",
        },
        ariaLabel: "BETT Show 2026 on January 22, 2026 in London",
      },
      {
        date: "06/10/2026",
        title: "InfoComm 2026",
        location: "Orlando",
        url: "#",
        cta: "Go to event",
        calendar: {
          day: "10",
          month: "Jun",
        },
        ariaLabel: "InfoComm 2026 on June 10, 2026 in Orlando",
      },
      {
        date: "03/15/2026",
        title: "Creative Touch Webinar",
        location: "Online",
        url: "#",
        cta: "Go to event",
        calendar: {
          day: "15",
          month: "Mar",
        },
        ariaLabel: "Creative Touch Webinar on March 15, 2026 remote and online",
      },
    ],
  }),
};
