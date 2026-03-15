import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Gallery } from "./GalleryComponent";
import schema from "./gallery.schema.dereffed.json";
import customProperties from "./gallery-tokens.json";

const meta: Meta<typeof Gallery> = {
  title: "Components/Gallery",
  component: Gallery,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Gallery>;

export const SmallSquaresWithLightbox: Story = {
  parameters: {
    viewport: {
      width: 1100,
      height: 702,
    },
  },
  args: pack({
    aspectRatio: "square",
    layout: "smallTiles",
    lightbox: true,
    images: [
      {
        src: "img/optoma/case-study-roblox.jpg",
        caption: "Roblox Fans at Gamescom 2025",
        alt: "Optoma projectors at the Roblox Gamescom exhibition",
      },
      {
        src: "img/optoma/case-study-golf.jpg",
        caption: "Charley Hull Golf Experience",
        alt: "Optoma projection used in golf simulation experience",
      },
      {
        src: "img/optoma/case-study-lente.jpg",
        caption: "Lente Art Installation, Birmingham",
        alt: "Optoma projectors powering the Lente art installation",
      },
      {
        src: "img/optoma/case-study-southmead.jpg",
        caption: "Southmead Primary School",
        alt: "Optoma interactive display in a primary school classroom",
      },
      {
        src: "img/optoma/case-study-museum.jpg",
        caption: "Museum Installation",
        alt: "Optoma projection in a museum exhibition space",
      },
      {
        src: "img/optoma/case-study-holographic.jpg",
        caption: "Holographic Display Experience",
        alt: "Optoma holographic projection display",
      },
      {
        src: "img/optoma/case-study-arebyte.jpg",
        caption: "arebyte Gallery, London",
        alt: "Optoma displays at the arebyte digital art gallery",
      },
    ],
  }),
};

export const LargeLandscapeTiles: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 724,
    },
  },
  args: pack({
    layout: "largeTiles",
    aspectRatio: "landscape",
    images: [
      {
        src: "img/optoma/corporate-collaboration.jpg",
        caption: "Corporate Collaboration Space",
        alt: "Optoma display in a modern corporate collaboration area",
      },
      {
        src: "img/optoma/professional-presenting.jpg",
        caption: "Professional Presentation",
        alt: "Presenter using Optoma professional display",
      },
      {
        src: "img/optoma/ifpd-creative-board.jpg",
        caption: "Creative Touch Interactive Display",
        alt: "Optoma Creative Touch being used for interactive collaboration",
      },
      {
        src: "img/optoma/corporate-huddle-spaces.jpg",
        caption: "Huddle Space Solution",
        alt: "Optoma display in a compact huddle space",
      },
      {
        src: "img/optoma/professional-hybrid.jpg",
        caption: "Hybrid Meeting Room",
        alt: "Optoma display powering a hybrid meeting setup",
      },
      {
        src: "img/optoma/corporate-communication.jpg",
        caption: "Digital Communication Hub",
        alt: "Optoma display used for internal communications",
      },
    ],
  }),
};

export const FreeAspectRatio: Story = {
  parameters: {
    viewport: {
      width: 1040,
      height: 818,
    },
  },
  args: pack({
    layout: "smallTiles",
    lightbox: true,
    images: [
      {
        src: "img/optoma/ifpd-school1.jpg",
        caption: "Interactive Learning",
        alt: "Students using Optoma interactive display in classroom",
      },
      {
        src: "img/optoma/professional-signage.jpg",
        caption: "Digital Signage",
        alt: "Optoma professional display used for digital signage",
      },
      {
        src: "img/optoma/case-study-commonwealth.jpg",
        caption: "Commonwealth Games",
        alt: "Optoma projection at the Commonwealth Games",
      },
      {
        src: "img/optoma/corporate-stay-connected.jpg",
        caption: "Stay Connected",
        alt: "Remote collaboration with Optoma display solutions",
      },
      {
        src: "img/optoma/ifpd-school2.jpg",
        caption: "Modern Classroom",
        alt: "Optoma IFPD in a modern school environment",
      },
      {
        src: "img/optoma/professional-brand-image.jpg",
        caption: "Brand Showcase",
        alt: "Optoma N-Series display showcasing brand content",
      },
      {
        src: "img/optoma/case-study-roblox.jpg",
        caption: "Immersive Gaming",
        alt: "Optoma projection at Roblox Gamescom event",
      },
    ],
  }),
};

export const StackLandscape: Story = {
  parameters: {
    viewport: {
      width: 846,
      height: 1512,
    },
  },
  args: pack({
    aspectRatio: "landscape",
    images: [
      {
        src: "img/optoma/professional-bring-together.jpg",
        caption: "Bringing Teams Together",
        alt: "Optoma professional display in a team meeting",
      },
      {
        src: "img/optoma/ifpd-connect-anywhere.jpg",
        caption: "Connect from Anywhere",
        alt: "Optoma IFPD with remote collaboration features",
      },
      {
        src: "img/optoma/corporate-collaboration.jpg",
        caption: "Seamless Collaboration",
        alt: "Optoma display enabling corporate collaboration",
      },
    ],
    layout: "stack",
  }),
};
