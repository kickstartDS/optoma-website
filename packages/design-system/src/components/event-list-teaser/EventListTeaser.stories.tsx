import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { EventListTeaser } from "./EventListTeaserComponent";
import schema from "./event-list-teaser.schema.dereffed.json";
import customProperties from "./event-list-teaser-tokens.json";

const meta: Meta<typeof EventListTeaser> = {
  title: "Event/ Event List Teaser",
  component: EventListTeaser,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof EventListTeaser>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 1024,
      height: 524,
    },
  },
  args: pack({
    text: "Experience Optoma's latest interactive flat panel displays, laser projectors, and professional signage solutions at ISE 2026 — Europe's leading exhibition for AV and systems integration.",
    date: "04.02.2026",
    location: {
      name: "Fira de Barcelona, Gran Vía",
      address: `Av. Joan Carles I, 64<br />
08908 L'Hospitalet de Llobregat, Barcelona`,
    },
    title: "Optoma at ISE 2026",
    category: "Trade Show",
    image: {
      src: "img/optoma/professional-presenting.jpg",
      alt: "Optoma display at a trade show",
    },
    url: "#",
    ctaText: "Go to event",
  }),
};
