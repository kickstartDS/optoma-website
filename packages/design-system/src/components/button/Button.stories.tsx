import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";

import { Button } from "./ButtonComponent";
import schema from "./button.schema.dereffed.json";
import customProperties from "./button-tokens.json";

const meta: Meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof Button>;

export const PrimaryButton: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 200,
    },
  },
  args: pack({
    label: "Request a Demo",
    variant: "primary",
  }),
};

export const SecondaryButton: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 200,
    },
  },
  args: pack({
    label: "View All Products",
    variant: "secondary",
  }),
};

export const TertiaryButton: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 200,
    },
  },
  args: pack({
    label: "Learn More",
    variant: "tertiary",
  }),
};

export const PrimaryDisabledButton: Story = {
  parameters: {
    viewport: {
      width: 770,
      height: 200,
    },
  },
  args: pack({
    label: "Out of Stock",
    variant: "primary",
    disabled: true,
  }),
};
