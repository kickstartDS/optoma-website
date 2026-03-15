import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { VideoCurtain } from "./VideoCurtainComponent";
import schema from "./video-curtain.schema.dereffed.json";
import customProperties from "./video-curtain-tokens.json";

const meta: Meta = {
  title: "Components/Video Curtain",
  component: VideoCurtain,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof VideoCurtain>;

export const AtmosphericVideoWithOverlay: Story = {
  parameters: {
    viewport: {
      width: 1280,
      height: 800,
    },
  },
  args: pack({
    headline: "Brilliant Visuals, Limitless Possibilities",
    sub: "Award-winning projection and display technology",
    text: "From immersive installations to everyday collaboration, Optoma delivers stunning visual experiences that inspire, engage, and connect.",
    overlay: true,
    textPosition: "center",
    buttons: [
      {
        label: "Explore Solutions",
      },
    ],
    video: {
      srcMobile: "img/videos/video-720.mp4",
      srcTablet: "img/videos/video-720.mp4",
      srcDesktop: "img/videos/video-720.mp4",
    },
  }),
};

export const ColorNeutralText: Story = {
  parameters: {
    viewport: {
      width: 1280,
      height: 800,
    },
  },
  args: pack({
    headline: "Transform Your Meeting Rooms",
    sub: "Professional displays built for modern workplaces",
    text: "Optoma's N-Series professional displays combine 4K clarity with smart management tools, creating meeting spaces that drive productivity and collaboration.",
    textPosition: "corner",
    colorNeutral: true,
    highlightText: true,
    overlay: true,
    buttons: [
      {
        label: "View Products",
      },
    ],
    video: {
      srcMobile: "img/videos/video-agency.mp4",
      srcTablet: "img/videos/video-agency.mp4",
      srcDesktop: "img/videos/video-agency.mp4",
    },
  }),
};

export const ColorNeutralVideo: Story = {
  parameters: {
    viewport: {
      width: 1280,
      height: 800,
    },
  },
  args: pack({
    headline: "Interactive Learning, Reimagined",
    sub: "Creative Touch 5-Series for education",
    text: "Engage students with intuitive touch technology, built-in whiteboard tools, and seamless Google Classroom integration — all on a stunning 4K display.",
    textPosition: "center",
    highlightText: true,
    overlay: true,
    buttons: [
      {
        label: "Discover More",
      },
    ],
    video: {
      srcMobile: "img/videos/handshake-bw.mp4",
      srcTablet: "img/videos/handshake-bw.mp4",
      srcDesktop: "img/videos/handshake-bw.mp4",
    },
  }),
};
