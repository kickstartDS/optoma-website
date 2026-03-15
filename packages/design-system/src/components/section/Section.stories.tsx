import { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { pack, getArgsShared } from "@kickstartds/core/lib/storybook";
import sectionStories from "@kickstartds/base/lib/section/section.stories";

import { TeaserCard } from "../teaser-card/TeaserCardComponent";
import { Section } from "./SectionComponent";
import schema from "./section.schema.dereffed.json";
import customProperties from "./section-tokens.json";

const meta: Meta = {
  ...sectionStories,
  title: "Layout/Section",
  component: Section,
  parameters: {
    jsonschema: { schema },
    cssprops: { customProperties },
  },
  ...getArgsShared(schema as JSONSchema7),
  render: (args) => (
    <Section {...args}>
      <TeaserCard
        layout="row"
        headline="Interactive Flat Panel Displays"
        text="Discover the Creative Touch 5-Series with built-in whiteboard, wireless sharing, and Google Classroom integration."
        image="img/optoma/ifpd-creative-board.jpg"
        url="#"
        button={{
          label: "View Range",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Professional Display Solutions"
        text="N-Series 4K UHD displays with 24/7 operation, remote management via OMS, and Display Share wireless casting."
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
        text="DuraCore laser engine with up to 30,000 hours of maintenance-free 4K UHD projection for any environment."
        image="img/optoma/case-study-roblox.jpg"
        url="#"
        button={{
          label: "View Range",
          hidden: true,
        }}
      />
    </Section>
  ),
};

export default meta;

type Story = StoryObj<typeof Section>;

export const DynamicLayout: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 846,
    },
  },
  args: pack({
    content: {
      mode: "flex",
    },
    headline: {
      text: "Our Product Range",
      sub: "Display solutions for every environment",
      align: "center",
    },
    buttons: [],
  }),
  render: (args) => (
    <Section {...args}>
      <TeaserCard
        layout="row"
        headline="Interactive Flat Panel Displays"
        text="Discover the Creative Touch 5-Series with built-in whiteboard, wireless sharing, and Google Classroom integration."
        image="img/optoma/ifpd-creative-board.jpg"
        url="#"
        button={{
          label: "View Range",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Professional Display Solutions"
        text="N-Series 4K UHD displays with 24/7 operation, remote management via OMS, and Display Share wireless casting."
        image="img/optoma/professional-brand-image.jpg"
        url="#"
        button={{
          label: "View Range",
          hidden: true,
        }}
      />
    </Section>
  ),
};

export const TileLayout: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 744,
    },
  },
  args: pack({
    width: "default",
    content: {
      mode: "tile",
    },
    headline: {
      text: "Solutions by Sector",
      sub: "Tailored display solutions for your industry",
      align: "center",
    },
    buttons: [],
  }),
  render: (args) => (
    <Section {...args}>
      <TeaserCard
        layout="row"
        headline="Corporate"
        text="Meeting rooms, huddle spaces, and digital signage powered by Optoma professional displays and projectors."
        image="img/optoma/corporate-huddle-spaces.jpg"
        url="#"
        button={{
          label: "Explore",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Education"
        text="Interactive flat panel displays with built-in whiteboard tools and Google Classroom integration."
        image="img/optoma/ifpd-school1.jpg"
        url="#"
        button={{
          label: "Explore",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Immersive Experiences"
        text="Large-format projection and LED displays for museums, galleries, events, and retail environments."
        image="img/optoma/case-study-lente.jpg"
        url="#"
        button={{
          label: "Explore",
          hidden: true,
        }}
      />
    </Section>
  ),
};

export const ListLayout: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 1416,
    },
  },
  args: pack({
    content: {
      mode: "list",
    },
    headline: {
      text: "Latest Case Studies",
      sub: "See how organisations are using Optoma",
      align: "center",
    },
    buttons: [],
  }),
};

export const Slider: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 816,
    },
  },
  args: pack({
    content: {
      mode: "slider",
    },
    headline: {
      text: "Key headline for this section",
      sub: "Short explanatory subheadline",
      align: "left",
    },
    buttons: [],
  }),
  render: (args) => (
    <Section {...args}>
      <TeaserCard
        layout="row"
        headline="Creative Touch 5-Series"
        text="Interactive flat panels with built-in whiteboard, annotation tools, and wireless screen sharing for collaborative learning."
        image="img/optoma/ifpd-creative-board.jpg"
        url="#"
        button={{
          label: "Learn More",
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
          label: "Learn More",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Laser Projectors"
        text="DuraCore laser engine delivering up to 30,000 hours of maintenance-free, vibrant 4K UHD projection."
        image="img/optoma/case-study-roblox.jpg"
        url="#"
        button={{
          label: "Learn More",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Sussex Learning Trust"
        text="How 15 primary schools transformed classroom engagement with Optoma Creative Touch interactive displays."
        image="img/optoma/ifpd-school1.jpg"
        url="#"
        button={{
          label: "Read Case Study",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Roblox at Gamescom"
        text="Immersive gaming experience powered by Optoma laser projectors at Europe's largest gaming event."
        image="img/optoma/case-study-roblox.jpg"
        url="#"
        button={{
          label: "Read Case Study",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Lente Art Installation"
        text="A stunning projection-mapped art installation in Birmingham using Optoma's high-brightness laser projectors."
        image="img/optoma/case-study-lente.jpg"
        url="#"
        button={{
          label: "Read Case Study",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Optoma Management Suite"
        text="Centrally monitor, manage, and control all your Optoma displays from a single cloud-based dashboard."
        image="img/optoma/corporate-communication.jpg"
        url="#"
        button={{
          label: "Learn More",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Display Share"
        text="Wireless presentation and collaboration software — share screens from any device with one click."
        image="img/optoma/corporate-collaboration.jpg"
        url="#"
        button={{
          label: "Learn More",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Southmead Primary School"
        text="Interactive displays bringing STEM subjects to life in rural primary school classrooms."
        image="img/optoma/case-study-southmead.jpg"
        url="#"
        button={{
          label: "Read Case Study",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="Schindler Group HQ"
        text="Next-generation meeting rooms powered by Optoma professional displays and Display Share wireless casting."
        image="img/optoma/corporate-communication.jpg"
        url="#"
        button={{
          label: "Read Case Study",
          hidden: true,
        }}
      />
      <TeaserCard
        layout="row"
        headline="arebyte Gallery"
        text="Immersive digital art exhibitions brought to life with high-brightness Optoma laser projectors."
        image="img/optoma/case-study-arebyte.jpg"
        url="#"
        button={{
          label: "Read Case Study",
          hidden: true,
        }}
      />
    </Section>
  ),
};

export const Inverted: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 744,
    },
  },
  args: pack({
    inverted: true,
    content: { mode: "default" },
    headline: {
      text: "Collaboration Software",
      sub: "Tools to connect your teams and spaces",
    },
    buttons: [],
  }),
};

export const AccentBackground: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 744,
    },
  },
  args: pack({
    backgroundColor: "accent",
    headline: {
      text: "Why Choose Optoma?",
      sub: "25+ years of display innovation trusted by organisations worldwide",
      align: "center",
    },
    buttons: [],
  }),
};

export const BoldBackground: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 744,
    },
  },
  args: pack({
    backgroundColor: "bold",
    headline: {
      text: "Award-Winning Technology",
      sub: "Recognised globally for innovation in visual display solutions",
      align: "center",
    },
    buttons: [],
  }),
};

export const Framed: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 888,
    },
  },
  args: pack({
    width: "wide",
    headline: {
      text: "Our Sustainability Commitment",
      sub: "Eco-friendly design with 0.5W standby power and mercury-free laser technology",
      align: "center",
    },
    style: "framed",
    buttons: [],
  }),
};

export const BackgroundImage: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 744,
    },
  },
  args: pack({
    backgroundImage: "/img/bg_dot-carpet-blue.svg",
    headline: {
      text: "Partner Programme",
      sub: "Join our network of certified resellers and integrators",
    },
    content: {
      mode: "default",
    },
    buttons: [],
  }),
};

export const WithButtons: Story = {
  parameters: {
    viewport: {
      width: 1440,
      height: 818,
    },
  },
  args: pack({
    headline: {
      text: "Explore Our Solutions",
      sub: "Find the right display technology for your environment",
      align: "center",
    },
    buttons: [
      {
        disabled: false,
        icon: "arrow-right",
        label: "View All Products",
        size: "medium",
        variant: "secondary",
      },
      {
        disabled: false,
        icon: "",
        label: "Request a Demo",
        size: "medium",
        variant: "secondary",
      },
    ],
  }),
};
