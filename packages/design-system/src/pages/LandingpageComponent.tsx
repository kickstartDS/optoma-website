import { Header } from "../components/header/HeaderComponent";
import { headerProps } from "../components/header/Header.stories";
import { Footer } from "../components/footer/FooterComponent";
import { footerProps } from "../components/footer/Footer.stories";
import { Section } from "../components/section/SectionComponent";
import { Faq } from "../components/faq/FaqComponent";
import { TeaserCard } from "../components/teaser-card/TeaserCardComponent";
import { Testimonials } from "../components/testimonials/TestimonialsComponent";
import { Cta } from "../components/cta/CtaComponent";
import { ImageStory } from "../components/image-story/ImageStoryComponent";
import { ImageText } from "../components/image-text/ImageTextComponent";
import { Hero } from "../components/hero/HeroComponent";

const LandingPage = () => (
  <>
    <Header {...headerProps} floating />

    <Section width="full" spaceAfter="none" spaceBefore="none">
      <Hero
        buttons={[
          {
            icon: "arrow-down",
            label: "Explore solutions",
            url: "#solutions",
          },
        ]}
        headline="Transform the Way You Present, Connect and Collaborate"
        textbox
        textPosition="left"
        height="fullScreen"
        highlightText
        image={{
          indent: "none",
          src: "img/optoma/corporate-collaboration.jpg",
          srcDesktop: "img/optoma/corporate-collaboration.jpg",
          srcMobile: "img/optoma/corporate-collaboration.jpg",
          srcTablet: "img/optoma/corporate-collaboration.jpg",
        }}
        sub="Corporate Display Solutions"
        text="From small huddle spaces to large conference rooms, Optoma offers projection, interactive displays, professional displays and LED displays to meet your needs."
      />
    </Section>
    <Section
      spotlight
      id="solutions"
      headline={{
        text: "Corporate Solutions",
        sub: "Ignite Collaboration and Communication",
        switchOrder: true,
        width: "default",
        align: "center",
        textAlign: "center",
        large: true,
      }}
      width="wide"
    >
      <ImageStory
        layout="imageLeft"
        text={`
Optoma's corporate solutions create dynamic interactive spaces for increased collaboration and communication.

### 1. **Stay Connected**
Work together in real-time from any location. With webcam connectivity and Optoma's Whiteboard software, employees can join collaborative sessions remotely from separate locations.

### 2. **Huddle Spaces**
From small spaces to large conference rooms and lobbies — no matter the size or type of environment, Optoma offers solutions to meet your needs.

### 3. **Collaboration**
With a ready-to-use whiteboard and the ultra-versatile quick launch pen, users can start presenting in seconds. Share content from any device with Display Share.

### 4. **Communication**
Keep employees safe and informed using Optoma Management Suite (OMS). Broadcast videos, share photos, and send emergency messages across any display company wide.

**Ready to transform your meeting spaces?**`}
        image={{
          src: "img/optoma/corporate-stay-connected.jpg",
          alt: "Optoma corporate collaboration solution",
          vAlign: "top",
        }}
        buttons={[
          {
            label: "Request a demo",
            icon: "chevron-right",
            url: "#",
          },
        ]}
      />
    </Section>

    <Section
      style="framed"
      transition="to-accent"
      headline={{
        text: "What Our Customers Say",
        sub: "Trusted by organisations worldwide",
        textAlign: "left",
      }}
    >
      <Testimonials
        layout="slider"
        testimonial={[
          {
            image: {
              src: "/img/people/author-emily.png",
              alt: "Sarah Mitchell portrait",
            },
            name: "- Sarah Mitchell",
            quote:
              "The Creative Touch displays have completely transformed how our teachers deliver lessons. Student engagement has increased by 40% since deployment, and the built-in Google Classroom integration has been a game-changer.",
            title: "IT Director, Sussex Learning Trust",
          },
          {
            image: {
              src: "/img/people/author-john.png",
              alt: "David Chen portrait",
            },
            name: "- David Chen",
            quote:
              "Upgrading our 40+ meeting rooms to Optoma N-Series displays has streamlined hybrid collaboration across our global offices. The picture quality and ease of use exceeded our expectations.",
            title: "IT Solutions Director, Schindler Group",
          },
          {
            image: {
              src: "/img/people/author-alex.png",
              alt: "James Porter portrait",
            },
            name: "- James Porter",
            quote:
              "Optoma's laser projectors enabled us to create an immersive 360-degree art installation that captivated over 50,000 visitors. The brightness and colour accuracy were exceptional.",
            title: "Creative Director, arebyte Gallery",
          },
        ]}
      />
    </Section>

    <Section
      backgroundColor="accent"
      width="wide"
      headline={{
        text: "Featured Case Studies",
        sub: "See how organisations are transforming their spaces with Optoma",
      }}
    >
      <TeaserCard
        url="#"
        headline="Sussex Learning Trust"
        text="How 15 primary schools transformed classroom engagement with Optoma Creative Touch IFPDs"
        image="img/optoma/ifpd-school1.jpg"
        button={{
          label: "View case study",
          chevron: true,
        }}
      />
      <TeaserCard
        url="#"
        headline="Roblox at Gamescom"
        label="Immersive Experiences"
        text="Creating an immersive 360-degree gaming experience with Optoma laser projectors"
        image="img/optoma/case-study-roblox.jpg"
        button={{
          label: "View case study",
          chevron: true,
        }}
      />
      <TeaserCard
        url="#"
        headline="Schindler Group HQ"
        text="Modernising 40+ meeting rooms with N-Series professional displays for seamless hybrid collaboration"
        image="img/optoma/corporate-huddle-spaces.jpg"
        button={{
          label: "View case study",
          chevron: true,
        }}
      />
    </Section>

    <Section width="wide">
      <Cta
        headline="Speak with our team about the right display solution for your organisation"
        backgroundImage="/img/bg/bg_dot-carpet-blue.svg"
        image={{
          src: "/img/people/contact-person.png",
          padding: false,
        }}
        buttons={[
          {
            label: "Contact us",
            url: "#",
            icon: "person",
          },
          {
            label: "Request a demo",
            url: "#",
            icon: "date",
          },
        ]}
      />
    </Section>

    <Section
      headline={{
        text: "Frequently Asked Questions",
        sub: "Everything you need to know about Optoma's display solutions.",
        large: true,
        align: "left",
      }}
    >
      <Faq
        questions={[
          {
            question: "What types of displays does Optoma offer?",
            answer:
              "Optoma offers a comprehensive range of display solutions including laser projectors, interactive flat panel displays (Creative Touch), N-Series professional LCD displays, and ProScene LED displays. Each product line is designed for specific environments from classrooms and meeting rooms to large-scale installations.",
          },
          {
            question: "What is the Optoma Management Suite (OMS)?",
            answer:
              "OMS is a cloud-based platform that allows IT administrators to remotely monitor, diagnose, and control Optoma displays across a local area network or the cloud. It streamlines operations by managing firmware updates, scheduling, and broadcasting from a single dashboard — reducing the need for on-site visits.",
          },
          {
            question: "How do Optoma IFPDs integrate with Google Classroom?",
            answer:
              "Optoma's Creative Touch 5-Series displays are Google EDLA certified, providing native access to Google Classroom and the Google Play Store. Teachers can sign in with their Google account to access lessons, assignments, and collaborative tools directly on the display.",
          },
          {
            question: "What warranty and support does Optoma provide?",
            answer:
              "Optoma offers standard manufacturer warranties on all products, with optional extended warranties available on selected models. Our dedicated support team provides technical assistance via phone, email, and online resources. We also offer on-site installation and training services through our approved reseller network.",
          },
          {
            question: "Are Optoma displays energy efficient?",
            answer:
              "Yes, Optoma is committed to sustainability. Our laser projectors eliminate lamp replacements and offer up to 30,000 hours of maintenance-free operation. Our LED displays feature eco-friendly standby modes under 0.5W, and the all-in-one design reduces the number of components and power cables needed.",
          },
          {
            question: "Can I try an Optoma display before purchasing?",
            answer:
              "Absolutely. Optoma offers free product demonstrations at your premises or at our UK showroom. Contact our sales team or visit the demo booking page on our website to arrange a demonstration tailored to your specific requirements.",
          },
        ]}
      />
    </Section>

    <Section width="wide" spaceBefore="none" spaceAfter="small">
      <ImageText
        image={{
          src: "img/optoma/led-solutions.webp",
          alt: "Optoma LED display solutions in a modern environment",
        }}
        text={""}
        layout={"above"}
      />
    </Section>

    <Section
      headline={{
        text: "Software Solutions",
        sub: "Powering your displays with intelligent software",
      }}
    >
      <Faq
        questions={[
          {
            question: "What is Optoma Whiteboard?",
            answer:
              "Optoma Whiteboard is a built-in collaborative application on Creative Touch IFPDs that provides smart annotation tools, multi-user support, and cloud saving. It's designed for hybrid collaboration, allowing teams to create, share, and save interactive sessions from anywhere.",
          },
          {
            question: "How does Display Share work?",
            answer:
              "Display Share enables wireless screen mirroring from any device — laptops, tablets, and smartphones — to Optoma displays. Multiple users can connect simultaneously, making it ideal for collaborative meetings and classroom presentations without cables or adapters.",
          },
          {
            question: "Can OMS manage non-Optoma displays?",
            answer:
              "Yes, Optoma Management Suite can monitor and control compatible third-party displays alongside Optoma devices, providing a unified management platform for mixed-vendor environments.",
          },
          {
            question: "What is the Optoma Collaboration Hub?",
            answer:
              "The OC HUB enables users to upgrade existing displays with Optoma's software ecosystem, including Optoma Solutions Suite (OSS) for collaboration, content sharing, and file management, as well as OMS for remote device management.",
          },
        ]}
      />
    </Section>

    <Section width="wide">
      <Cta
        highlightText
        textAlign="center"
        headline="Ready to transform your display experience?"
        sub="From classrooms to boardrooms, Optoma has the right solution for your space."
        buttons={[
          {
            label: "Contact us",
            url: "#",
            icon: "person",
          },
          {
            label: "View all products",
            url: "#",
            icon: "date",
          },
        ]}
      />
    </Section>
    <Footer {...footerProps} />
  </>
);
export default LandingPage;
