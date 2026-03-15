import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Faq } from "./FaqComponent";
import schema from "./faq.schema.dereffed.json";
import customProperties from "./faq-tokens.json";

const meta: Meta = {
  title: "Components/Faq",
  component: Faq,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Faq>;

export const DropdownList: Story = {
  parameters: {
    viewport: {
      width: 820,
      height: 348,
    },
  },
  args: pack({
    questions: [
      {
        question: "What warranty do Optoma products come with?",
        answer:
          "All Optoma projectors and displays come with a comprehensive manufacturer warranty. Standard projectors include a 3-year return-to-base warranty, while our professional display range and IFPDs include an on-site warranty. Laser light sources are covered for up to 5 years or 20,000 hours, whichever comes first. Extended warranty options are available through your authorised reseller.",
      },
      {
        question: "How do I book a product demonstration?",
        answer:
          "You can request a free demonstration of any Optoma product by contacting our sales team via the website contact form or by calling our UK office. We offer both on-site demonstrations and virtual demos via our showroom in Watford, Hertfordshire.",
      },
      {
        question: "Are Optoma displays compatible with existing AV systems?",
        answer:
          "Yes. Optoma displays support a wide range of connectivity options including HDMI, USB-C, DisplayPort, and wireless casting via Display Share. Our products integrate with popular video conferencing platforms and can be managed remotely using the Optoma Management Suite (OMS).",
      },
    ],
  }),
};

export const SingleDropdown: Story = {
  parameters: {
    viewport: {
      width: 820,
      height: 216,
    },
  },
  args: pack({
    questions: [
      {
        question: "What is the Optoma Management Suite (OMS)?",
        answer:
          "The Optoma Management Suite is a cloud-based remote management platform that allows IT administrators to monitor, control, and maintain their entire fleet of Optoma displays from a single dashboard. Features include real-time device status monitoring, remote power on/off, firmware updates, alert notifications, and scheduled content broadcasting. OMS is free to use with compatible Optoma professional displays.",
      },
    ],
  }),
};
