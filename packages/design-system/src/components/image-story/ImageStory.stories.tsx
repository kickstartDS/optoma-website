import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { ImageStory } from "./ImageStoryComponent";
import schema from "./image-story.schema.dereffed.json";
import customProperties from "./image-story-tokens.json";

const meta: Meta = {
  title: "Components/Image Story",
  component: ImageStory,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof ImageStory>;

export const StickyImageNextToScrollingText: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 1144,
    },
  },
  args: pack({
    headline: "Why Choose Optoma?",
    sub: "Over 25 years of award-winning display innovation",
    text: `
Optoma has been at the forefront of visual display technology since 2002, delivering projectors, interactive flat panel displays, and professional signage to customers in over 150 countries.

### Brilliant Image Quality
Every Optoma display is engineered for stunning 4K UHD resolution with vibrant colours and exceptional contrast. Our DuraCore laser engine delivers up to 30,000 hours of consistent, maintenance-free projection.

### Seamless Collaboration
From wireless screen sharing with Display Share to built-in video conferencing, Optoma solutions bridge the gap between in-room and remote teams. Present from any device — no dongles or drivers required.

### Simple Remote Management
The Optoma Management Suite (OMS) gives IT teams complete control over their entire display network. Monitor status, push updates, set alerts, and broadcast announcements from a single dashboard.

### Sustainable by Design
Industry-leading 0.5W standby power consumption, intelligent brightness adjustment, and eco-friendly packaging made from 99% recyclable materials — because great technology should also be responsible.

Ready to transform your visual experience?
    `,
    largeHeadline: true,
    image: {
      src: "img/optoma/corporate-collaboration.jpg",
      aspectRatio: "unset",
      vAlign: "top",
    },
    buttons: [
      {
        label: "Request a Demo",
        url: "#",
        icon: "arrow-right",
      },
    ],
  }),
};
