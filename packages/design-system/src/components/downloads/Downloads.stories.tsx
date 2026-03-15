import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Downloads } from "./DownloadsComponent";
import customProperties from "./downloads-tokens.json";
import schema from "./downloads.schema.dereffed.json";

const meta: Meta = {
  title: "Corporate/Downloads",
  component: Downloads,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Downloads>;

export const TechnicalDetailsOnly: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 416,
    },
  },
  args: pack({
    download: [
      {
        name: "Creative Touch 5-Series Datasheet",
        format: "PDF",
        size: "4.8 MB",
        previewImage: "img/optoma/ifpd-5g3-75inch.webp",
        url: "#",
      },
      {
        name: "N-Series Professional Display Guide",
        previewImage: "img/optoma/professional-brand-image.jpg",
        format: "PDF",
        size: "3.2 MB",
        url: "#",
      },
      {
        name: "OMS Quick Start Guide",
        format: "PDF",
        size: "1.5 MB",
        url: "#",
      },
      {
        name: "Warranty Terms & Conditions",
        format: "PDF",
        size: "280 KB",
        url: "#",
      },
    ],
  }),
};

export const DescriptionOnly: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 460,
    },
  },
  args: pack({
    download: [
      {
        name: "Creative Touch 5-Series Brochure",
        description:
          "Complete overview of the Creative Touch 5-Series interactive flat panel displays, including specifications, features, and educational use cases.",
        previewImage: "img/optoma/ifpd-creative-board.jpg",
      },
      {
        name: "Optoma Corporate Solutions Guide",
        description:
          "Detailed guide to Optoma's professional display and projection solutions for meeting rooms, huddle spaces, and large venues.",
        previewImage: "img/optoma/corporate-collaboration.jpg",
      },
      {
        name: "Display Share User Manual",
        description:
          "Step-by-step guide to setting up and using Display Share wireless screen sharing across your organisation.",
        previewImage: "img/optoma/professional-hybrid.jpg",
      },
      {
        name: "Sustainability Report",
        description:
          "Optoma's commitment to sustainability, including eco-friendly packaging, energy efficiency, and responsible manufacturing practices.",
        previewImage: "img/optoma/corporate-communication.jpg",
      },
    ],
  }),
};

export const Complete: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 516,
    },
  },
  args: pack({
    download: [
      {
        name: "Creative Touch 5-Series Datasheet",
        format: "PDF",
        size: "4.8 MB",
        description:
          'Full technical specifications, feature details, and comparison chart for 65", 75", and 86" models.',
        previewImage: "img/optoma/ifpd-5g3-75inch.webp",
      },
      {
        name: "Optoma Corporate Solutions Guide",
        description:
          "End-to-end guide for planning and deploying Optoma displays in corporate environments.",
        previewImage: "img/optoma/corporate-collaboration.jpg",
        format: "PDF",
        size: "6.1 MB",
      },
      {
        name: "OMS Quick Start Guide",
        description:
          "Get started with the Optoma Management Suite in minutes. Covers device registration, dashboard setup, and alert configuration.",
        format: "PDF",
        size: "1.5 MB",
      },
      {
        name: "Warranty Terms & Conditions",
        description:
          "Comprehensive warranty policy for all Optoma product lines, including extended warranty options.",
        format: "PDF",
        size: "280 KB",
      },
    ],
  }),
};

export const Mixed: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 460,
    },
  },
  args: pack({
    download: [
      {
        name: "N-Series Specification Sheet",
        format: "PDF",
        size: "3.4 MB",
        description:
          "Detailed specifications for the N-Series professional display range, including brightness, connectivity, and dimensions.",
        previewImage: "img/optoma/professional-brand-image.jpg",
      },
      {
        name: "Display Share Setup Guide",
        format: "PDF",
        size: "1.2 MB",
        previewImage: "img/optoma/professional-hybrid.jpg",
      },
      {
        name: "Optoma Education Brochure",
        previewImage: "img/optoma/ifpd-creative-board.jpg",
      },
      {
        name: "Firmware Update Notes",
        description:
          "Release notes for the latest firmware update, including bug fixes and new features.",
      },
    ],
  }),
};
