import type { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { getArgsShared, pack } from "@kickstartds/core/lib/storybook";

import { BlogOverview as BlogOverviewComponent } from "./BlogOverviewComponent";
import schema from "../blog-overview.schema.dereffed.json";

const meta: Meta<typeof BlogOverviewComponent> = {
  component: BlogOverviewComponent,
  title: "Page Archetypes/Blog Overview",
  parameters: {
    jsonschema: { schema },
    layout: "fullscreen",
  },
  tags: ["!manifest"],
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof BlogOverviewComponent>;

export const BlogOverview: Story = {
  args: pack({
    latest: {
      date: "03/15/2025",
      tags: [
        {
          entry: "Case Studies",
        },
        {
          entry: "Education",
        },
        {
          entry: "IFPDs",
        },
      ],
      headline:
        "How Sussex Learning Trust Transformed Classroom Engagement with Optoma IFPDs",
      teaserText:
        "Discover how Sussex Learning Trust deployed Optoma Creative Touch interactive flat panel displays across 15 primary schools, replacing outdated projectors and whiteboards to create dynamic, collaborative learning environments that boosted student engagement by 40%.",
      image: "img/optoma/ifpd-school1.jpg",
      link: { url: "#", label: "Read more" },
      readingTime: "7 min read",
      author: {
        name: "Sarah Mitchell",
        title: "Education Technology Specialist",
        image: "img/people/author-alex.png",
      },
    },
    list: [
      {
        date: "02/28/2025",
        tags: [
          {
            entry: "Case Studies",
          },
        ],
        headline: "Roblox Takes Gamescom by Storm with Optoma Laser Projectors",
        teaserText:
          "How Roblox created an immersive 360-degree gaming experience at Gamescom using Optoma's high-brightness laser projectors, drawing thousands of visitors to their stand.",
        image: "img/optoma/case-study-roblox.jpg",
        link: { url: "#", label: "Read more" },
        readingTime: "5 min read",
        author: {
          name: "James Porter",
          title: "Events & Experiences Manager",
          image: "img/people/author-alex.png",
        },
      },
      {
        date: "02/10/2025",
        tags: [
          {
            entry: "Products",
          },
        ],
        headline:
          "Introducing the Creative Touch 5-Series: Next-Generation IFPDs",
        teaserText:
          "Optoma's new Creative Touch 5-Series interactive flat panel displays bring zero-bonding technology, built-in Google EDLA certification, and enhanced collaboration tools to classrooms and meeting rooms.",
        image: "img/optoma/ifpd-creative-board.jpg",
        link: { url: "#", label: "Read more" },
        readingTime: "4 min read",
        author: {
          name: "Laura Jennings",
          title: "Solutions Architect",
          image: "img/people/author-emily.png",
        },
      },
      {
        date: "01/22/2025",
        tags: [
          {
            entry: "Case Studies",
          },
        ],
        headline:
          "Lente: How Optoma Projectors Brought Birmingham's Art Installation to Life",
        teaserText:
          "Artist Davy Evans used Optoma laser projectors to create 'Lente', a mesmerising large-scale projection mapping installation in Birmingham that captivated over 50,000 visitors.",
        image: "img/optoma/case-study-lente.jpg",
        link: { url: "#", label: "Read more" },
        readingTime: "6 min read",
        author: {
          name: "Sarah Mitchell",
          title: "Education Technology Specialist",
          image: "img/people/author-alex.png",
        },
      },
    ],
    more: [
      {
        date: "01/08/2025",
        tags: [
          {
            entry: "Corporate",
          },
        ],
        headline:
          "Schindler Group HQ Upgrades Meeting Rooms with Optoma N-Series",
        teaserText:
          "Schindler's European headquarters modernised 40+ meeting rooms with Optoma N-Series professional displays, enabling seamless hybrid collaboration across global offices.",
        image: "img/optoma/corporate-collaboration.jpg",
        link: { url: "#", label: "Read more" },
        readingTime: "5 min read",
        author: {
          name: "David Chen",
          title: "IT Solutions Consultant",
          image: "img/people/author-alex.png",
        },
      },
      {
        date: "12/18/2024",
        tags: [
          {
            entry: "Technology",
          },
        ],
        headline: "Why Optoma Management Suite Is a Game-Changer for IT Teams",
        teaserText:
          "With remote device monitoring, scheduling, and firmware updates across your entire display fleet, Optoma Management Suite (OMS) gives IT administrators unprecedented control and efficiency.",
        image: "img/optoma/corporate-stay-connected.jpg",
        link: { url: "#", label: "Read more" },
        readingTime: "4 min read",
        author: {
          name: "Michael Torres",
          title: "Technical Support Engineer",
          image: "img/people/author-emily.png",
        },
      },
    ],
    cta: {
      headline: "Get in touch",
      sub: "Speak with our team about the right display solution for your organisation",
      highlightText: false,
      colorNeutral: false,
      fullWidth: true,
      buttons: [
        {
          label: "Contact us",
          icon: "person",
          url: "#",
        },
        {
          label: "Request a demo",
          icon: "date",
          url: "#",
        },
      ],
      image: {
        padding: false,
        src: "img/people/contact-person.png",
      },
      order: {
        mobileImageLast: false,
        desktopImageLast: false,
      },
      textAlign: "left",
      contentAlign: "center",
      text: "From interactive displays to laser projectors, we'll help you find the perfect solution for your space.",
      width: "wide",
    },
  }),
};
