import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { EventDetail as EventDetailComponent } from "./EventDetailComponent";
import schema from "../event-detail.schema.dereffed.json";

const meta: Meta<typeof EventDetailComponent> = {
  component: EventDetailComponent,
  title: "Page Archetypes/Event Detail",
  parameters: {
    jsonschema: { schema },
    layout: "fullscreen",
  },
  tags: ["!manifest"],
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof EventDetailComponent>;

export const EventDetail: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 850,
    },
  },
  args: pack({
    title: "Optoma at ISE 2026",
    categories: [{ label: "Trade Show" }, { label: "Product Launch" }],
    intro:
      "Visit Optoma at ISE 2026, Europe's leading AV and systems integration exhibition. Experience our latest interactive displays, laser projectors, and professional signage solutions first-hand.",
    locations: [
      {
        displayMode: "compact",
        locationName: `Fira de Barcelona, Gran Vía`,
        address: `Av. Joan Carles I, 64<br />
      08908 L'Hospitalet de Llobregat, Barcelona`,
        links: [
          {
            url: "#",
            label: "Open in Google Maps",
          },
        ],
        dates: [
          {
            date: "2026-02-04",
            time: "09:00 – 18:00",
            label: "Register",
            url: "#",
            ariaLabel:
              "Register for ISE 2026 on 4th February 2026 from 09:00 to 18:00",
          },
          {
            date: "2026-02-05",
            time: "09:00 – 18:00",
            label: "Register",
            url: "#",
            ariaLabel:
              "Register for ISE 2026 on 5th February 2026 from 09:00 to 18:00",
          },
          {
            date: "2026-02-06",
            time: "09:00 – 17:00",
            label: "Register",
            url: "#",
            ariaLabel:
              "Register for ISE 2026 on 6th February 2026 from 09:00 to 17:00",
          },
        ],
      },
      {
        displayMode: "compact",
        locationName: `ExCeL London`,
        address: `Royal Victoria Dock<br />
      London E16 1XL`,
        dates: [
          {
            date: "2026-01-22",
            time: "09:30 – 17:30",
            label: "Register",
            url: "#",
            ariaLabel:
              "Register for BETT Show 2026 on 22nd January 2026 from 09:30 to 17:30",
          },
          {
            date: "2026-01-23",
            time: "09:30 – 17:30",
            label: "Register",
            url: "#",
            ariaLabel:
              "Register for BETT Show 2026 on 23rd January 2026 from 09:30 to 17:30",
          },
        ],
        links: [
          {
            url: "#",
            label: "Open in Google Maps",
          },
          {
            url: "#",
            label: "Venue Website",
          },
        ],
      },
    ],
    description: `
Join Optoma at ISE 2026 to discover our latest innovations in visual display technology. From interactive flat panels to laser projectors, see how our solutions are transforming workspaces and learning environments.

**Highlights:**
- Live demonstrations of the Creative Touch 5-Series IFPDs
- N-Series professional display showcase with OMS remote management
- DuraCore laser projector experience zone
- Expert-led workshops on AV integration and classroom technology
  `,
    images: [
      {
        alt: "Optoma interactive display demonstration",
        caption: "Creative Touch 5-Series in action",
        src: "img/optoma/ifpd-creative-board.jpg",
      },
      {
        alt: "Professional displays in a corporate setting",
        caption: "N-Series professional signage",
        src: "img/optoma/professional-signage.jpg",
      },
      {
        src: "img/optoma/corporate-collaboration.jpg",
        caption: "Collaboration solutions showcase",
        alt: "Optoma collaboration technology",
      },
      {
        src: "img/optoma/case-study-roblox.jpg",
        caption: "Immersive projection experience",
        alt: "Laser projection demonstration",
      },
    ],
    download: [
      {
        name: "Creative Touch 5-Series Datasheet",
        format: "PDF",
        size: "2.5 MB",
        previewImage: "img/optoma/ifpd-5g3-65inch.webp",
        url: "#",
      },
      {
        name: "N-Series Product Brochure",
        previewImage: "img/optoma/professional-brand-image.jpg",
        format: "PDF",
        size: "3.2 MB",
        url: "#",
      },
      {
        name: "Corporate Solutions Guide",
        format: "PDF",
        size: "1.8 MB",
        url: "#",
      },
      {
        name: "Education Solutions Guide",
        format: "PDF",
        size: "2.1 MB",
        url: "#",
      },
    ],
    button: {
      label: "See All Events",
      url: "/#",
    },
  }),
};
