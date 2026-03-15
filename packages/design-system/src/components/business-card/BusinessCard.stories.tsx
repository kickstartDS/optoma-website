import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { BusinessCard } from "./BusinessCardComponent";
import schema from "./business-card.schema.dereffed.json";

const meta: Meta<typeof BusinessCard> = {
  title: "Corporate / Business Card",
  component: BusinessCard,
  parameters: {
    jsonschema: { schema },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof BusinessCard>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 650,
      height: 838,
    },
  },
  args: pack({
    centered: false,
    image: {
      src: "img/optoma/corporate-collaboration.jpg",
      alt: "Optoma corporate collaboration environment",
    },
    logo: {
      src: "logo.svg",
      alt: "Optoma Logo",
      url: "#",
    },
    topic: "Professional AV Solutions",
    address: `Optoma Europe Ltd<br />42 Caxton Way<br />Watford, WD18 8QZ`,
    avatar: {
      src: "img/placeholder/avatar-business-card-round.svg",
      alt: "Emma Richardson",
    },
    contact: [
      { icon: "phone", label: "+44 (0)1923 691 800", url: "tel:+441923691800" },
      {
        icon: "email",
        label: "emma.richardson@optoma.co.uk",
        url: "mailto:emma.richardson@optoma.co.uk",
      },
      {
        icon: "linkedin",
        label: "Emma Richardson",
        url: "#",
      },
    ],
    buttons: [{ label: "Book a Demo", url: "#" }],
  }),
};

export const Centered: Story = {
  parameters: {
    viewport: {
      width: 650,
      height: 838,
    },
  },
  args: pack({
    centered: true,
    image: {
      src: "img/optoma/corporate-collaboration.jpg",
      alt: "Optoma corporate collaboration environment",
    },
    logo: {
      src: "logo.svg",
      alt: "Optoma Logo",
      url: "#",
    },
    topic: "Professional AV Solutions",
    address: `Optoma Europe Ltd<br />42 Caxton Way<br />Watford, WD18 8QZ`,
    avatar: {
      src: "img/placeholder/avatar-business-card-round.svg",
      alt: "Emma Richardson",
    },
    contact: [
      { icon: "phone", label: "+44 (0)1923 691 800", url: "tel:+441923691800" },
      {
        icon: "email",
        label: "emma.richardson@optoma.co.uk",
        url: "mailto:emma.richardson@optoma.co.uk",
      },
      {
        icon: "linkedin",
        label: "Emma Richardson",
        url: "#",
      },
    ],
    buttons: [{ label: "Book a Demo", url: "#" }],
  }),
};

export const WithoutImage: Story = {
  parameters: {
    viewport: {
      width: 740,
      height: 438,
    },
  },
  args: pack({
    centered: false,
    logo: {
      src: "logo.svg",
      alt: "Optoma Logo",
      url: "#",
    },
    topic: "Professional AV Solutions",
    address: `Optoma Europe Ltd<br />42 Caxton Way<br />Watford, WD18 8QZ`,
    avatar: {
      src: "img/placeholder/avatar-business-card-round.svg",
      alt: "Emma Richardson",
    },
    contact: [
      { icon: "phone", label: "+44 (0)1923 691 800", url: "tel:+441923691800" },
      {
        icon: "email",
        label: "emma.richardson@optoma.co.uk",
        url: "mailto:emma.richardson@optoma.co.uk",
      },
      {
        icon: "linkedin",
        label: "Emma Richardson",
        url: "#",
      },
    ],
    buttons: [{ label: "Book a Demo", url: "#" }],
  }),
};
