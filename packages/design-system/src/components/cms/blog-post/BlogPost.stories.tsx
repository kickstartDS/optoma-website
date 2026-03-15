import type { Meta, StoryObj } from "@storybook/react-vite";
import { JSONSchema7 } from "json-schema";
import { getArgsShared, pack } from "@kickstartds/core/lib/storybook";

import { BlogPost as BlogPostComponent } from "./BlogPostComponent";
import schema from "../blog-post.schema.dereffed.json";

const meta: Meta<typeof BlogPostComponent> = {
  component: BlogPostComponent,
  title: "Page Archetypes/Blog Post",
  parameters: {
    jsonschema: { schema },
    layout: "fullscreen",
  },
  tags: ["!manifest"],
  ...getArgsShared(schema as JSONSchema7),
};

export default meta;

type Story = StoryObj<typeof BlogPostComponent>;

export const BlogPost: Story = {
  args: pack({
    head: {
      date: "03/15/2025",
      tags: [
        {
          entry: "Case Studies",
        },
        {
          entry: "Education",
        },
      ],
      headline:
        "How Sussex Learning Trust Transformed Classroom Engagement with Optoma IFPDs",
      image: "img/optoma/ifpd-school1.jpg",
    },
    content: `
## Introduction
When **Sussex Learning Trust** set out to modernise technology across its 15 primary schools, the goal was clear: replace ageing projectors and interactive whiteboards with a solution that would genuinely transform how teachers and pupils interact in the classroom. [Learn more about Creative Touch](https://www.optoma.co.uk/ifpds)

## The Challenge
Many classrooms were still relying on projector-and-whiteboard setups installed over a decade ago. Teachers reported *poor visibility*, *unreliable touch response*, and *limited collaboration features* — all of which hindered student engagement during lessons.

## Why Optoma Creative Touch?
After evaluating displays from several manufacturers, the Trust selected the Optoma Creative Touch 5-Series for its zero-bonding technology, built-in Google EDLA certification, and seamless integration with Google Classroom — already widely used across the Trust's schools.

## The Rollout
Working with Optoma's approved reseller partner Sounds & Vision, the Trust deployed over 120 Creative Touch displays across all 15 schools during the summer break, minimising disruption to the academic calendar.

## Results
Within the first term, teachers reported a **40% increase in student engagement** during interactive lessons. The built-in Whiteboard app and wireless screen sharing via Display Share meant pupils could present work directly from their Chromebooks — fostering collaboration and confidence.

## What's Next
The Trust is now exploring Optoma Management Suite (OMS) to centrally manage firmware updates and scheduling across the entire display estate, further reducing the burden on school IT coordinators.
          `,
    aside: {
      author: {
        name: "Sarah Mitchell",
        byline: "Education Technology Specialist",
        image: {
          src: "img/people/contact-isabella.png",
          alt: "Picture of Sarah Mitchell",
          aspectRatio: "square",
        },
        twitter: "OptomaUK",
        email: "education@optoma.co.uk",
      },
      socialSharing: [
        {
          icon: "twitter",
          url: "https://twitter.com/share?text=How%20Sussex%20Learning%20Trust%20Transformed%20Classrooms%20with%20Optoma%20IFPDs&url=https://www.optoma.co.uk/blog",
          title: "Share on Twitter",
        },
        {
          icon: "linkedin",
          url: "https://www.linkedin.com/shareArticle?mini=true&url=https://www.optoma.co.uk/blog&title=Sussex%20Learning%20Trust%20Case%20Study",
          title: "Share on LinkedIn",
        },
      ],
      readingTime: "7 min read",
      date: "03/15/2025",
    },
    contact: {
      image: {
        src: "img/people/contact-john.png",
        alt: "Picture of Emma Richardson",
        fullWidth: false,
        aspectRatio: "vertical",
      },
      title: "Emma Richardson",
      subtitle: "Regional Sales Manager",
      links: [
        {
          icon: "email",
          label: "emma.richardson@optoma.co.uk",
          url: "mailto:emma.richardson@optoma.co.uk",
          newTab: false,
        },
        {
          icon: "phone",
          label: "+44 (0)1923 691 800",
          url: "tel:+441923691800",
          newTab: false,
        },
      ],
      copy: "Helping schools and organisations across the UK find the right display technology for their spaces. Get in touch to arrange a demo or discuss your requirements.",
    },
    cta: {
      headline: "Ready to Transform Your Learning Spaces?",
      sub: "See the Creative Touch 5-Series in action.",
      buttons: [
        {
          label: "Request a Demo",
          url: "#",
          icon: "person",
        },
        {
          label: "View All IFPDs",
          url: "#",
          icon: "date",
        },
      ],
      textAlign: "center",
      text: "Book a free demonstration at your school or office and experience the difference Optoma interactive displays can make.",
    },
  }),
};
