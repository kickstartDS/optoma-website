import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { EventLocation } from "./EventLocationComponent";
import schema from "./event-location.schema.dereffed.json";

const meta: Meta<typeof EventLocation> = {
  title: "Event/ Event Location",
  component: EventLocation,
  parameters: {
    jsonschema: { schema },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof EventLocation>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 382,
    },
  },
  args: pack({
    locationName: "Fira de Barcelona, Gran Vía",
    address: `Av. Joan Carles I, 64<br />
  08908 L'Hospitalet de Llobregat, Barcelona`,
    dates: [
      {
        date: "04.02.2026",
        time: "09:00 – 18:00",
        label: "Register",
        url: "#",
        ariaLabel:
          "Register for ISE 2026 on 4th February 2026 from 09:00 to 18:00",
      },
      {
        date: "05.02.2026",
        time: "09:00 – 18:00",
        label: "Register",
        url: "#",
        ariaLabel:
          "Register for ISE 2026 on 5th February 2026 from 09:00 to 18:00",
      },
    ],
    links: [
      {
        url: "https://maps.google.com/?q=Fira+de+Barcelona+Gran+Via",
        label: "Open in Google Maps",
      },
      {
        url: "#",
        label: "Venue Website",
      },
    ],
  }),
};
