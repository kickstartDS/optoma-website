import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Slider } from "./SliderComponent";
import { TeaserCard } from "../teaser-card/TeaserCardComponent";
import schema from "./slider.schema.dereffed.json";
import customProperties from "./slider-tokens.json";

const meta: Meta = {
  title: "Layout/Slider",
  component: Slider,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
  render: (args) => (
    <Slider {...args}>
      <TeaserCard
        layout="row"
        headline="Creative Touch 5-Series"
        text="Interactive flat panel displays with built-in whiteboard, wireless sharing, and Google Classroom integration for collaborative learning."
        image="img/optoma/ifpd-creative-board.jpg"
        url="#"
        button={{
          label: "View Range",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="N-Series Professional Displays"
        text="Commercial-grade 4K UHD displays designed for 24/7 operation with integrated OMS remote management."
        image="img/optoma/professional-brand-image.jpg"
        url="#"
        button={{
          label: "View Range",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Laser Projectors"
        text="DuraCore laser engine delivering up to 30,000 hours of brilliant, maintenance-free 4K UHD projection."
        image="img/optoma/case-study-roblox.jpg"
        url="#"
        button={{
          label: "View Range",
          hidden: true,
        }}
      />
    </Slider>
  ),
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const WithArrows: Story = {
  parameters: {
    viewport: {
      width: 1024,
      height: 530,
    },
  },
  args: pack({
    gap: 15,
    arrows: true,
  }),
};

export const WithTeasedNeighbours: Story = {
  parameters: {
    viewport: {
      width: 1024,
      height: 760,
    },
  },
  args: pack({
    gap: 15,
    teaseNeighbours: true,
    arrows: true,
    nav: true,
  }),
};

export const WithNav: Story = {
  parameters: {
    viewport: {
      width: 1024,
      height: 530,
    },
  },
  args: pack({
    gap: 15,
    arrows: true,
    nav: true,
  }),
};

export const WithAutoplay: Story = {
  parameters: {
    viewport: {
      width: 1024,
      height: 530,
    },
  },
  args: pack({
    gap: 15,
    nav: true,
    arrows: true,
    autoplay: true,
  }),
};
