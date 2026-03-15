import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { TeaserCard } from "./TeaserCardComponent";
import schema from "./teaser-card.schema.dereffed.json";
import customProperties from "./teaser-card-tokens.json";

const meta: Meta<typeof TeaserCard> = {
  title: "Components/Teaser Card",
  component: TeaserCard,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof TeaserCard>;

export const ProductTiles: Story = {
  parameters: {
    viewport: {
      width: 650,
      height: 678,
    },
  },
  args: pack({
    headline: "Interactive Flat Panel Displays",
    text: 'Create, connect and teach with Optoma\'s Creative Touch 5-Series. Available in 65", 75" and 86" sizes with built-in Whiteboard software.',
    image: "img/optoma/ifpd-creative-board.jpg",
    url: "#",
    button: {
      label: "View products",
      hidden: true,
    },
  }),
};

export const Compact: Story = {
  parameters: {
    viewport: {
      width: 650,
      height: 678,
    },
  },
  args: pack({
    layout: "compact",
    headline: "Sussex Learning Trust Case Study",
    text: "Discover how Optoma interactive displays and visualisers are being adopted and utilised in exciting new ways across the Sussex Learning Trust schools.",
    image: "img/optoma/case-study-southmead.jpg",
    url: "#",
    button: {
      label: "Read case study",
    },
  }),
};

export const PageNavigation: Story = {
  parameters: {
    viewport: {
      width: 650,
      height: 640,
    },
  },
  args: pack({
    headline: "Corporate Solutions",
    text: "From small huddle spaces to large conference rooms and lobbies — Optoma has display solutions to meet every corporate need.",
    image: "img/optoma/corporate-stay-connected.jpg",
    imageRatio: "landscape",
    url: "#",
    button: {
      label: "Explore solutions",
    },
  }),
};

export const ShowcasePreview: Story = {
  parameters: {
    viewport: {
      width: 650,
      height: 738,
    },
  },
  args: pack({
    label: "Case Study",
    layout: "row",
    imageRatio: "wide",
    headline: "Roblox Fans at Gamescom 2025",
    text: "Optoma screens create next-level experiences for Roblox fans, delivering immersive visuals that captivated thousands of gaming enthusiasts.",
    image: "img/optoma/case-study-roblox.jpg",
    url: "#",
    button: {
      label: "Find out more",
    },
  }),
};
