import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Features } from "./FeaturesComponent";
import schema from "./features.schema.dereffed.json";
import customProperties from "./features-tokens.json";

const meta: Meta<typeof Features> = {
  title: "Components/Features",
  component: Features,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Features>;

export const IconCentered: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 636,
    },
  },
  args: pack({
    style: "centered",
    layout: "largeTiles",
    feature: [
      {
        icon: "star",
        title: "4K UHD Resolution",
        text: "Experience stunning clarity with true 4K UHD resolution across our projectors and displays. Every detail is rendered with precision, delivering immersive visuals for presentations, education and entertainment.",
        cta: {
          url: "#",
          label: "Learn more",
        },
      },
      {
        icon: "time",
        title: "24/7 Operation",
        text: "Built for continuous use in demanding environments. Optoma's professional displays are engineered for round-the-clock operation with energy-efficient designs that optimise power savings.",
        cta: {
          url: "#",
          label: "View specs",
        },
      },
      {
        icon: "upload",
        title: "Wireless Sharing",
        text: "Share content effortlessly from any device with Display Share. Screen mirror high-quality images, videos, documents and audio from smartphones, laptops or PCs — all at the touch of a button.",
        cta: {
          url: "#",
          label: "See details",
        },
      },
      {
        icon: "login",
        title: "Remote Management",
        text: "Monitor and control all your Optoma displays remotely with the Optoma Management Suite (OMS). Diagnose issues, set alerts, and broadcast announcements from anywhere.",
        cta: {
          url: "#",
          label: "Explore OMS",
        },
      },
      {
        icon: "person",
        title: "Hybrid Collaboration",
        text: "Bridge the gap between in-office and remote teams. Optoma's video conferencing solutions and interactive displays enable seamless collaboration regardless of location.",
        cta: {
          url: "#",
          label: "Learn how",
        },
      },
      {
        icon: "map",
        title: "Eco-Friendly Design",
        text: "Industry-leading 0.5W standby power consumption, auto-off features, brightness adjustment and eco-friendly packaging made from 99% recyclable materials.",
        cta: {
          url: "#",
          label: "Sustainability",
        },
      },
    ],
  }),
};

export const StackWithButton: Story = {
  parameters: {
    viewport: {
      width: 1230,
      height: 463,
    },
  },
  args: pack({
    style: "stack",
    layout: "smallTiles",
    ctas: {
      style: "button",
    },
    feature: [
      {
        icon: "star",
        title: "DuraCore Laser",
        text: "Up to 30,000 hours of maintenance-free operation with full brightness. Optoma's DuraCore laser technology delivers reliable, long-lasting performance for professional installations.",
        cta: {
          url: "#",
          label: "Learn more",
        },
      },
      {
        icon: "time",
        title: "Quick Launch Pen",
        text: "Start presenting in seconds. Simply take the pen from the holder and the Whiteboard app launches automatically. Dual-tip design lets you switch between thin or thick strokes.",
        cta: {
          url: "#",
          label: "View details",
        },
      },
      {
        icon: "upload",
        title: "Cloud Whiteboard",
        text: "Sync with your cloud accounts to plan lessons or meetings from anywhere. Access materials from any Optoma display in your organisation via the cloud-based Whiteboard platform.",
        cta: {
          url: "#",
          label: "See features",
        },
      },
      {
        icon: "login",
        title: "Google Classroom",
        text: "Seamless integration with Google Classroom brings the benefits of paperless sharing and digital collaboration. Import lesson materials instantly to any classroom display.",
        cta: {
          url: "#",
          label: "Read more",
        },
      },
    ],
  }),
};

export const ListView: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 844,
    },
  },
  args: pack({
    style: "besideLarge",
    layout: "list",
    ctas: {
      style: "intext",
      toggle: false,
    },
    feature: [
      {
        icon: "star",
        title: "4K UHD Resolution",
        text: "Experience stunning clarity with true 4K UHD resolution across our projectors and displays. Every detail is rendered with precision, delivering immersive visuals for any application.",
        cta: {
          url: "#",
          label: "Learn more",
        },
      },
      {
        icon: "time",
        title: "24/7 Operation",
        text: "Built for continuous use in demanding environments. Optoma's professional displays are engineered for round-the-clock operation with energy-efficient designs that optimise power savings.",
        cta: {
          url: "#",
          label: "View specs",
        },
      },
      {
        icon: "upload",
        title: "Wireless Sharing",
        text: "Share content effortlessly from any device with Display Share. Screen mirror high-quality images, videos, documents and audio from smartphones, laptops or PCs.",
        cta: {
          url: "#",
          label: "See details",
        },
      },
      {
        icon: "login",
        title: "Remote Management",
        text: "Monitor and control all your Optoma displays remotely with the Optoma Management Suite (OMS). Diagnose issues, set alerts, and broadcast announcements from anywhere.",
        cta: {
          url: "#",
          label: "Explore OMS",
        },
      },
      {
        icon: "person",
        title: "Hybrid Collaboration",
        text: "Bridge the gap between in-office and remote teams. Optoma's video conferencing solutions and interactive displays enable seamless collaboration regardless of location.",
        cta: {
          url: "#",
          label: "Learn how",
        },
      },
      {
        icon: "map",
        title: "Eco-Friendly Design",
        text: "Industry-leading 0.5W standby power consumption, auto-off features, brightness adjustment and eco-friendly packaging made from 99% recyclable materials.",
        cta: {
          url: "#",
          label: "Sustainability",
        },
      },
    ],
  }),
};

export const IconBesideWithLinkInText: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 476,
    },
  },
  args: pack({
    style: "intext",
    layout: "smallTiles",
    ctas: {
      style: "intext",
    },
    feature: [
      {
        icon: "star",
        title: "4K UHD Resolution",
        text: "Experience stunning clarity with true 4K UHD resolution across our projectors and displays. Every detail is rendered with precision, delivering immersive visuals for any application.",
        cta: {
          url: "#",
          label: "Learn more",
        },
      },
      {
        icon: "time",
        title: "24/7 Operation",
        text: "Built for continuous use in demanding environments. Optoma's professional displays are engineered for round-the-clock operation with energy-efficient designs that optimise power savings.",
        cta: {
          url: "#",
          label: "View specs",
        },
      },
      {
        icon: "upload",
        title: "Wireless Sharing",
        text: "Share content effortlessly from any device with Display Share. Screen mirror high-quality images, videos, documents and audio from smartphones, laptops or PCs.",
        cta: {
          url: "#",
          label: "See details",
        },
      },
      {
        icon: "login",
        title: "Remote Management",
        text: "Monitor and control all your Optoma displays remotely with the Optoma Management Suite (OMS). Diagnose issues, set alerts, and broadcast announcements from anywhere.",
        cta: {
          url: "#",
          label: "Explore OMS",
        },
      },
      {
        icon: "person",
        title: "Hybrid Collaboration",
        text: "Bridge the gap between in-office and remote teams. Optoma's video conferencing solutions and interactive displays enable seamless collaboration regardless of location.",
        cta: {
          url: "#",
          label: "Learn how",
        },
      },
      {
        icon: "map",
        title: "Eco-Friendly Design",
        text: "Industry-leading 0.5W standby power consumption, auto-off features, brightness adjustment and eco-friendly packaging made from 99% recyclable materials.",
        cta: {
          url: "#",
          label: "Sustainability",
        },
      },
    ],
  }),
};

export const IconIntextWithLink: Story = {
  parameters: {
    viewport: {
      width: 1232,
      height: 524,
    },
  },
  args: pack({
    style: "intext",
    ctas: {
      style: "link",
    },
    feature: [
      {
        icon: "star",
        title: "4K UHD Resolution",
        text: "Experience stunning clarity with true 4K UHD resolution across our projectors and displays. Every detail is rendered with precision, delivering immersive visuals for any application.",
        cta: {
          url: "#",
          label: "Learn more",
        },
      },
      {
        icon: "time",
        title: "24/7 Operation",
        text: "Built for continuous use in demanding environments. Optoma's professional displays are engineered for round-the-clock operation with energy-efficient designs that optimise power savings.",
        cta: {
          url: "#",
          label: "View specs",
        },
      },
      {
        icon: "upload",
        title: "Wireless Sharing",
        text: "Share content effortlessly from any device with Display Share. Screen mirror high-quality images, videos, documents and audio from smartphones, laptops or PCs.",
        cta: {
          url: "#",
          label: "See details",
        },
      },
      {
        icon: "login",
        title: "Remote Management",
        text: "Monitor and control all your Optoma displays remotely with the Optoma Management Suite (OMS). Diagnose issues, set alerts, and broadcast announcements from anywhere.",
        cta: {
          url: "#",
          label: "Explore OMS",
        },
      },
      {
        icon: "person",
        title: "Hybrid Collaboration",
        text: "Bridge the gap between in-office and remote teams. Optoma's video conferencing solutions and interactive displays enable seamless collaboration regardless of location.",
        cta: {
          url: "#",
          label: "Learn how",
        },
      },
      {
        icon: "map",
        title: "Eco-Friendly Design",
        text: "Industry-leading 0.5W standby power consumption, auto-off features, brightness adjustment and eco-friendly packaging made from 99% recyclable materials.",
        cta: {
          url: "#",
          label: "Sustainability",
        },
      },
    ],
  }),
};
