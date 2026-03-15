import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Search as SearchComponent } from "./SearchComponent";
import schema from "../event-list.schema.dereffed.json";

const meta: Meta<typeof SearchComponent> = {
  component: SearchComponent,
  title: "Page Archetypes/Search",
  parameters: {
    jsonschema: { schema },
    layout: "fullscreen",
  },
  tags: ["!manifest"],
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof SearchComponent>;

export const Search: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 850,
    },
  },
  args: pack({
    headline: {
      text: "Search",
      level: "h1",
      style: "h1",
    },
    searchFilter: {
      title: "Search Filters",
      categories: [
        {
          title: "Products",
          url: "#",
          amount: 10,
        },
        {
          title: "Case Studies",
          url: "#",
          amount: 5,
        },
        {
          title: "Support",
          url: "#",
          amount: 2,
        },
      ],
    },
    searchResults: [
      {
        title: "Creative Touch 5-Series Interactive Flat Panel Displays",
        previewImage: "img/optoma/ifpd-creative-board.jpg",
        initialMatch:
          "The **Creative Touch** 5-Series brings collaboration to life with built-in whiteboard tools, wireless screen sharing, and Google Classroom integration.",
        matches: [
          {
            title: "Specifications",
            snippet:
              'The **Creative Touch** 5-Series is available in 65", 75", and 86" screen sizes.',
            url: "#",
          },
          {
            title: "Features",
            snippet:
              "Built-in annotation tools and wireless casting make the **Creative Touch** ideal for classrooms.",
            url: "#",
          },
        ],
        url: "#",
      },
      {
        title: "N-Series Professional Displays",
        previewImage: "img/optoma/professional-brand-image.jpg",
        initialMatch:
          "The **N-Series** delivers commercial-grade 4K UHD performance designed for 24/7 operation with integrated OMS remote management.",
        url: "#",
      },
      {
        title: "How Sussex Learning Trust Transformed Classroom Engagement",
        matches: [
          {
            title: "The Challenge",
            snippet:
              "Sussex Learning Trust needed to modernise **interactive** displays across 15 primary schools.",
            url: "#",
          },
          {
            title: "The Solution",
            snippet:
              "Optoma **Creative Touch** displays were deployed with Google Classroom integration.",
            url: "#",
          },
          {
            title: "The Results",
            snippet:
              "Teacher satisfaction with **interactive** teaching tools increased by 85% across the trust.",
            url: "#",
          },
        ],
        url: "#",
      },
      {
        title: "Optoma Management Suite (OMS)",
        previewImage: "img/optoma/corporate-communication.jpg",
        initialMatch:
          "Centrally monitor, manage, and control all your Optoma displays from a single cloud-based **management** dashboard.",
        matches: [
          {
            title: "Remote Updates",
            snippet:
              "Push firmware updates and configuration changes to all devices via the **management** console.",
            url: "#",
          },
          {
            title: "Device Monitoring",
            snippet:
              "Real-time status monitoring and alerting through the **management** dashboard.",
            url: "#",
          },
        ],
        url: "#",
      },
    ],
  }),
};
