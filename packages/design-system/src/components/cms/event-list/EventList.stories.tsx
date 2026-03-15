import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { EventList as EventListComponent } from "./EventListComponent";
import schema from "../event-list.schema.dereffed.json";

const meta: Meta<typeof EventListComponent> = {
  component: EventListComponent,
  title: "Page Archetypes/Event List",
  parameters: {
    jsonschema: { schema },
    layout: "fullscreen",
  },
  tags: ["!manifest"],
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof EventListComponent>;

export const EventList: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 850,
    },
  },
  args: pack({
    filter: {
      categories: {
        categoryCheckboxes: [
          "All",
          "Trade Shows",
          "Product Launches",
          "Webinars",
          "Training",
          "Workshops",
        ],
      },
    },
    events: [
      {
        category: "Trade Show",
        tags: ["Trade Shows", "Product Launches"],
        title: "Optoma at ISE 2026",
        date: "WED, FEB 04",
        text: "Visit Optoma at ISE 2026, Europe's leading AV and systems integration exhibition. Experience our latest interactive displays, laser projectors, and professional signage solutions.",
        time: "09:00 – 18:00",
        location: {
          name: "Fira de Barcelona, Gran Vía",
          address: `Av. Joan Carles I, 64<br/>
08908 L'Hospitalet de Llobregat, Barcelona`,
        },
        image: {
          alt: "Optoma display at ISE trade show",
          src: "img/optoma/professional-presenting.jpg",
        },
        cta: "View details",
        url: "#",
      },
      {
        category: "Trade Show",
        tags: ["Trade Shows", "Training"],
        title: "BETT Show 2026",
        date: "THU, JAN 22",
        text: "See how Optoma's Creative Touch interactive flat panels are transforming classroom engagement. Live demos, educator workshops, and hands-on sessions at the UK's leading education technology event.",
        time: "09:30 – 17:30",
        location: {
          name: "ExCeL London",
          address: `Royal Victoria Dock<br/>
London E16 1XL`,
        },
        image: {
          alt: "Optoma interactive display in classroom",
          src: "img/optoma/ifpd-school1.jpg",
        },
        cta: "View details",
        url: "#",
      },
      {
        category: "Webinar",
        tags: ["Webinars", "Training"],
        title: "Creative Touch Webinar: Hybrid Learning Best Practices",
        date: "SUN, MAR 15",
        text: "Join our product specialists for a live webinar exploring best practices for hybrid learning environments. Learn how to maximise engagement with Optoma's Creative Touch IFPDs and Display Share software.",
        time: "14:00 – 15:30",
        location: {
          name: "Online",
          address: `Virtual Event`,
        },
        image: {
          alt: "Optoma Creative Touch display",
          src: "img/optoma/ifpd-creative-board.jpg",
        },
        cta: "Register now",
        url: "#",
      },
    ],
  }),
};
