import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Hero } from "./HeroComponent";
import schema from "./hero.schema.dereffed.json";
import customProperties from "./hero-tokens.json";

const meta: Meta = {
  title: "Components/Hero",
  component: Hero,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Hero>;

export const TextBelowImage: Story = {
  parameters: {
    viewport: {
      width: 1024,
      height: 884,
    },
  },
  args: pack({
    headline: "Connect, Present, Collaborate",
    sub: "Corporate Display Solutions by Optoma",
    text: "From huddle spaces to large conference rooms, Optoma offers projection, interactive displays, professional displays and LED solutions to meet your needs.",
    highlightText: true,
    textbox: false,
    overlay: true,
    textPosition: "below",
    image: {
      srcMobile: "img/optoma/corporate-collaboration.jpg",
      srcTablet: "img/optoma/corporate-collaboration.jpg",
      srcDesktop: "img/optoma/corporate-collaboration.jpg",
    },
    buttons: [
      {
        label: "Explore solutions",
        icon: "arrow-down",
        url: "#",
      },
    ],
  }),
};

export const TextOnImageWithOverlay: Story = {
  parameters: {
    viewport: {
      width: 1024,
      height: 738,
    },
  },
  args: pack({
    headline: "Transform Your Visual Experience",
    text: "Optoma's professional display solutions deliver stunning visuals for corporate environments, digital signage and immersive installations.",
    textbox: false,
    colorNeutral: true,
    height: "fullImage",
    overlay: true,
    textPosition: "bottom",
    image: {
      srcMobile: "img/optoma/professional-signage.jpg",
      srcTablet: "img/optoma/professional-signage.jpg",
      srcDesktop: "img/optoma/professional-signage.jpg",
    },
    buttons: [
      {
        label: "View products",
        icon: "arrow-right",
        url: "#",
      },
    ],
  }),
};

export const TextBoxOnFullScreen: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 900,
    },
  },
  args: pack({
    headline: "Interactive Solutions for Every Space",
    sub: "Creative Touch 5-Series Interactive Displays",
    text: "Create, connect and teach with Optoma's intuitive interactive displays. Designed with educators and business professionals in mind.",
    textbox: true,
    height: "fullScreen",
    highlightText: false,
    skipButton: true,
    textPosition: "left",
    image: {
      srcMobile: "img/optoma/ifpd-creative-board.jpg",
      srcTablet: "img/optoma/ifpd-creative-board.jpg",
      srcDesktop: "img/optoma/ifpd-creative-board.jpg",
    },
    buttons: [
      {
        label: "Discover more",
        icon: "",
        url: "#",
      },
      {
        label: "Request a demo",
        icon: "",
        url: "#",
      },
    ],
  }),
};
