import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Contact } from "./ContactComponent";
import schema from "./contact.schema.dereffed.json";
import customProperties from "./contact-tokens.json";

const meta: Meta = {
  title: "Components/Contact",
  component: Contact,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Contact>;

export const WideImage: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 276,
    },
  },
  args: pack({
    title: "Emma Richardson",
    subtitle: "Regional Sales Manager, UK & Ireland",
    image: {
      src: "img/placeholder/avatar-wide.svg",
      aspectRatio: "wide",
    },
    links: [
      {
        icon: "email",
        url: "mailto:emma.richardson@optoma.co.uk",
        label: "emma.richardson@optoma.co.uk",
        ariaLabel: "Email Emma Richardson",
      },
      {
        url: "#",
        icon: "linkedin",
        label: "Emma.Richardson",
        ariaLabel: "Emma Richardson on LinkedIn",
      },
    ],
  }),
};

export const CircularAvatar: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 332,
    },
  },
  args: pack({
    title: "Emma Richardson",
    subtitle: "Regional Sales Manager, UK & Ireland",
    image: {
      src: "img/placeholder/avatar-round.svg",
    },
    copy: "Helping organisations find the right Optoma display and projection solutions for their unique requirements",
    links: [
      {
        icon: "email",
        url: "mailto:emma.richardson@optoma.co.uk",
        label: "emma.richardson@optoma.co.uk",
        ariaLabel: "Email Emma Richardson",
      },
      {
        url: "#",
        icon: "linkedin",
        label: "Emma.Richardson",
        ariaLabel: "Emma Richardson on LinkedIn",
      },
    ],
  }),
};

export const VerticalImageWithParagraph: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 376,
    },
  },
  args: pack({
    title: "Michael Torres",
    subtitle: "Technical Support Engineer",
    image: {
      src: "img/placeholder/avatar-portrait.svg",
      aspectRatio: "vertical",
    },
    copy: "Dedicated to providing expert technical guidance for Optoma projectors, interactive displays, and professional signage solutions across the EMEA region",
    links: [
      {
        icon: "phone",
        url: "tel:+441onal",
        label: "+44 (0)1onal",
        ariaLabel: "Call Michael Torres",
      },
      {
        url: "#",
        icon: "linkedin",
        label: "Michael.Torres",
        ariaLabel: "Michael Torres on LinkedIn",
      },
    ],
  }),
};

export const FullImageWidth: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 360,
    },
  },
  args: pack({
    title: "Laura Jennings",
    subtitle: "Solutions Architect, Corporate AV",
    image: {
      src: "img/placeholder/avatar-square.svg",
      aspectRatio: "wide",
      fullWidth: true,
    },
    copy: "Designing bespoke Optoma display ecosystems for enterprise meeting rooms, lobbies, and collaboration spaces.",
    links: [
      {
        url: "mailto:laura.jennings@optoma.co.uk",
        icon: "email",
        label: "laura.jennings@optoma.co.uk",
        newTab: false,
        ariaLabel: "Email Laura Jennings",
      },
    ],
  }),
};
