import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { ContentNav } from "./ContentNavComponent";
import schema from "./content-nav.schema.dereffed.json";

const meta: Meta<typeof ContentNav> = {
  title: "Corporate / Content Nav",
  component: ContentNav,
  parameters: {
    jsonschema: { schema },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof ContentNav>;

export const Default: Story = {
  parameters: {
    viewport: {
      width: 640,
      height: 652,
    },
  },
  args: pack({
    image: {
      src: "img/optoma/professional-signage.jpg",
      alt: "Optoma professional display",
    },
    topic: "Product Range",
    links: [
      { label: "Interactive Flat Panels", url: "#" },
      { label: "Professional Displays", url: "#" },
      { label: "Laser Projectors", url: "#" },
      { label: "LED Displays", url: "#" },
      { label: "Collaboration Software", url: "#" },
      { label: "Management Suite (OMS)", url: "#" },
      { label: "Accessories & Mounts", url: "#" },
      { label: "Warranty & Support", url: "#" },
      { label: "Case Studies", url: "#" },
    ],
    initiallyShown: 4,
  }),
};
