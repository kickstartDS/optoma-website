import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Cta } from "./CtaComponent";
import customProperties from "./cta-tokens.json";
import schema from "./cta.schema.dereffed.json";

const meta: Meta = {
  title: "Components/Cta",
  component: Cta,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Cta>;

export const Banner: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 328,
    },
  },
  args: pack({
    headline: "Experience Optoma in Action",
    sub: "Book your personalised demonstration today",
    text: "See our interactive displays, projectors and LED solutions up close. Our team will help you find the perfect visual solution for your environment.",
    textAlign: "center",
    buttons: [
      {
        label: "Request a demo",
        url: "#",
        icon: "chevron-right",
      },
      {
        label: "Contact sales",
        url: "#",
        icon: "",
      },
    ],
  }),
};

export const Highlighted: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 390,
    },
  },
  args: pack({
    headline: "Brilliant Visuals, Sustainable Design",
    sub: "Eco-friendly technology without compromise",
    highlightText: true,
    textAlign: "center",
    text: "Optoma's energy-efficient displays deliver industry-leading 0.5W standby power consumption, eco-friendly packaging made from 99% recyclable materials, and auto-off features for total peace of mind.",
    buttons: [
      {
        label: "Learn more",
        url: "#",
        icon: "chevron-right",
      },
    ],
  }),
};

export const LeftAligned: Story = {
  parameters: {
    viewport: {
      width: 1000,
      height: 354,
    },
  },
  args: pack({
    headline: "Explore Corporate Solutions",
    sub: "From huddle spaces to boardrooms",
    text: "Optoma offers a complete range of display solutions designed for the modern workplace. Stay connected with real-time collaboration tools, wireless content sharing, and cloud-based management.",
    buttons: [
      {
        label: "View solutions",
        url: "#",
        icon: "chevron-right",
      },
    ],
  }),
};

export const ProductAdvertisement: Story = {
  parameters: {
    viewport: {
      width: 1400,
      height: 690,
    },
  },
  args: pack({
    headline: "Creative Touch 5-Series",
    sub: "Interactive displays built for collaboration",
    text: 'Available in 65", 75" and 86" sizes. Featuring built-in Whiteboard software, quick launch pen, and seamless Google Classroom integration.',
    backgroundImage: "img/bg_dot-carpet-blue.svg",
    highlightText: true,
    padding: true,
    order: {
      desktopImageLast: false,
    },
    image: {
      padding: false,
      src: "img/optoma/ifpd-5g3-75inch.webp",
      alt: "Optoma Creative Touch 5-Series 75 inch interactive display",
    },
    buttons: [
      {
        label: "View product",
        url: "#",
        icon: "chevron-right",
      },
    ],
  }),
};

export const ContactBanner: Story = {
  parameters: {
    viewport: {
      width: 1600,
      height: 628,
    },
  },
  args: pack({
    headline: "Let's Find Your Perfect Solution",
    sub: "Our display experts are ready to help",
    text: "Whether you need interactive displays for education, professional screens for corporate spaces, or LED walls for immersive installations, our team will guide you to the right solution.",
    padding: true,
    image: {
      src: "img/optoma/professional-bring-together.jpg",
      padding: false,
    },
    order: {
      desktopImageLast: false,
    },
    buttons: [
      {
        label: "Contact us",
        icon: "person",
        url: "#",
      },
      {
        label: "Book a demo",
        icon: "date",
        url: "#",
      },
    ],
  }),
};

export const SplitBanner: Story = {
  parameters: {
    viewport: {
      width: 1680,
      height: 788,
    },
  },
  args: pack({
    headline: "N-Series Professional Displays",
    sub: "Connect, present and collaborate",
    text: "Optoma's N-Series Professional Displays are perfect for lobbies, reception areas, digital signage and meeting rooms. Display information your way with built-in media player and scheduling.",
    colorNeutral: true,
    backgroundColor: "#d9e4ff",
    padding: true,
    order: {
      desktopImageLast: false,
    },
    image: {
      src: "img/optoma/professional-brand-image.jpg",
      padding: false,
    },
    buttons: [
      {
        label: "Learn more",
        icon: "",
        url: "#",
      },
    ],
  }),
};

export const AngledImage: Story = {
  parameters: {
    viewport: {
      width: 1670,
      height: 788,
    },
  },
  args: pack({
    headline: "Hybrid **Collaboration** Made Easy",
    text: `Encourage team collaboration in a hybrid work environment. Optoma's video conferencing solutions enable seamless access to content from any location, bridging the gap between in-office and remote teams.`,
    sub: "Bring people together, wherever they are",
    padding: true,
    image: {
      src: "img/optoma/professional-hybrid.jpg",
      padding: false,
    },
    order: {
      desktopImageLast: true,
    },
    buttons: [
      {
        label: "Learn more",
        icon: "",
        url: "#",
      },
    ],
  }),
};

export const ColoredBanner: Story = {
  parameters: {
    viewport: {
      width: 1350,
      height: 484,
    },
  },
  args: pack({
    headline: "Optoma Management Suite",
    text: "Monitor, manage and control all your Optoma displays remotely. Set alerts, broadcast announcements, and diagnose issues from anywhere with OMS cloud.",
    sub: "Remote display management made simple",
    highlightText: true,
    colorNeutral: true,
    backgroundColor: "#a1d5d6ff",
    padding: true,
    buttons: [
      {
        label: "Learn More",
        url: "#",
      },
      {
        label: "More Information",
        url: "#",
      },
    ],
  }),
};

export const AlignBottom: Story = {
  parameters: {
    viewport: {
      width: 1680,
      height: 905,
    },
  },
  args: pack({
    headline: "LED Display Solutions",
    text: `From seamless video walls to immersive installations, Optoma's LED displays deliver vibrant visuals with exceptional reliability for any environment. Perfect for retail, hospitality and live events.`,
    sub: "Stunning visuals at any scale",
    backgroundImage: "img/grid-bg-light.svg",
    align: "bottom",
    image: {
      src: "img/optoma/ifpd-5g3-86inch.webp",
    },
    order: {
      desktopImageLast: false,
    },
    buttons: [
      {
        label: "Learn More",
        url: "#",
      },
    ],
  }),
};
