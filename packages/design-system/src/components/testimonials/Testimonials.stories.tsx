import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Testimonials } from "./TestimonialsComponent";
import schema from "./testimonials.schema.dereffed.json";
import customProperties from "./testimonials-tokens.json";

const meta: Meta<typeof Testimonials> = {
  title: "Components/Testimonials",
  component: Testimonials,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Testimonials>;

export const Simple: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 409,
    },
  },
  args: pack({
    testimonial: [
      {
        quote: `The Creative Touch 5-Series has completely transformed how our teachers deliver lessons. Students are more engaged than ever, and the built-in whiteboard tools save us hours of preparation time.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of Sarah Mitchell",
        },
        name: "Sarah Mitchell",
        title: "Head of Digital Learning, Sussex Learning Trust",
      },
    ],
  }),
};

export const WithTitle: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 409,
    },
  },
  args: pack({
    testimonial: [
      {
        quote: `We deployed Optoma N-Series displays across our entire office network. The remote management via OMS has been a game-changer — our IT team can monitor and update every screen from a single dashboard.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of David Chen",
        },
        name: "David Chen",
        title: "IT Director, Schindler Group",
      },
    ],
  }),
};

export const ListLayout: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 996,
    },
  },
  args: pack({
    layout: "list",
    testimonial: [
      {
        quote: `The 4K UHD laser projectors from Optoma have elevated our training centre to a new level. The image quality is outstanding even in bright ambient light, and the DuraCore laser engine means virtually zero maintenance.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of Sarah Mitchell",
        },
        name: "Sarah Mitchell",
        title: "Head of Digital Learning, Sussex Learning Trust",
        rating: 5,
      },
      {
        quote: `We chose Optoma for our boardrooms because of the seamless wireless sharing. Guests can present from any device within seconds — no dongles, no drivers, no delays.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of David Chen",
        },
        name: "David Chen",
        title: "IT Director, Schindler Group",
        rating: 4,
      },
      {
        quote: `Optoma's LED displays delivered exactly the impact we needed for our immersive art installation. The colour accuracy and brightness were perfect for the gallery environment.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of James Porter",
        },
        name: "James Porter",
        title: "Creative Director, arebyte Gallery",
        rating: 5,
      },
    ],
  }),
};

export const SliderLayout: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 450,
    },
  },
  args: pack({
    testimonial: [
      {
        quote: `The Creative Touch 5-Series has completely transformed how our teachers deliver lessons. Students are more engaged than ever, and the built-in whiteboard tools save us hours of preparation time.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of Sarah Mitchell",
        },
        name: "Sarah Mitchell",
        title: "Head of Digital Learning, Sussex Learning Trust",
      },
      {
        quote: `We chose Optoma for our boardrooms because of the seamless wireless sharing. Guests can present from any device within seconds — no dongles, no drivers, no delays.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of David Chen",
        },
        name: "David Chen",
        title: "IT Director, Schindler Group",
      },
      {
        quote: `Optoma's LED displays delivered exactly the impact we needed for our immersive art installation. The colour accuracy and brightness were perfect for the gallery environment.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of James Porter",
        },
        name: "James Porter",
        title: "Creative Director, arebyte Gallery",
      },
    ],
  }),
};

export const WithRating: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 450,
    },
  },
  args: pack({
    testimonial: [
      {
        quote: `The Creative Touch 5-Series has completely transformed how our teachers deliver lessons. Students are more engaged than ever, and the built-in whiteboard tools save us hours of preparation time.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of Sarah Mitchell",
        },
        name: "Sarah Mitchell",
        title: "Head of Digital Learning, Sussex Learning Trust",
        rating: 5,
      },
      {
        quote: `We chose Optoma for our boardrooms because of the seamless wireless sharing. Guests can present from any device within seconds — no dongles, no drivers, no delays.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of David Chen",
        },
        name: "David Chen",
        title: "IT Director, Schindler Group",
        rating: 4,
      },
      {
        quote: `Optoma's LED displays delivered exactly the impact we needed for our immersive art installation. The colour accuracy and brightness were perfect for the gallery environment.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of James Porter",
        },
        name: "James Porter",
        title: "Creative Director, arebyte Gallery",
        rating: 5,
      },
    ],
  }),
};

export const AlternatingLayout: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 996,
    },
  },
  args: pack({
    layout: "alternating",
    testimonial: [
      {
        quote: `The Creative Touch 5-Series has completely transformed how our teachers deliver lessons. Students are more engaged than ever, and the built-in whiteboard tools save us hours of preparation time.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of Sarah Mitchell",
        },
        name: "Sarah Mitchell",
        title: "Head of Digital Learning, Sussex Learning Trust",
      },
      {
        quote: `We chose Optoma for our boardrooms because of the seamless wireless sharing. Guests can present from any device within seconds — no dongles, no drivers, no delays.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of David Chen",
        },
        name: "David Chen",
        title: "IT Director, Schindler Group",
      },
      {
        quote: `Optoma's LED displays delivered exactly the impact we needed for our immersive art installation. The colour accuracy and brightness were perfect for the gallery environment.`,
        image: {
          src: "img/placeholder/avatar-round.svg",
          alt: "Headshot of James Porter",
        },
        name: "James Porter",
        title: "Creative Director, arebyte Gallery",
      },
    ],
  }),
};
