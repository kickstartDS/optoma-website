import { Header } from "../components/header/HeaderComponent";
import { headerProps } from "../components/header/Header.stories";
import { Footer } from "../components/footer/FooterComponent";
import { footerProps } from "../components/footer/Footer.stories";
import { Section } from "../components/section/SectionComponent";
import { TeaserCard } from "../components/teaser-card/TeaserCardComponent";
import { Testimonials } from "../components/testimonials/TestimonialsComponent";
import { Cta } from "../components/cta/CtaComponent";
import { Hero } from "../components/hero/HeroComponent";
import { Mosaic } from "../components/mosaic/MosaicComponent";
import { Text } from "../components/text/TextComponent";

const Showcase = () => (
  <>
    <Header {...headerProps} floating />
    <Section width="full" spaceAfter="small" spaceBefore="none">
      <Hero
        height="fullImage"
        overlay
        image={{
          srcMobile: "img/optoma/case-study-southmead.jpg",
          alt: "Sussex Learning Trust classroom with Optoma interactive flat panel displays",
        }}
        textPosition="below"
        highlightText
        headline="Transforming Education at Sussex Learning Trust with Interactive Flat Panel Displays"
        sub="How Optoma IFPDs Replaced Outdated Projectors to Deliver Engaging, Future-Ready Learning Across 15 Schools"
      />
    </Section>
    <Section spaceBefore="small" width="full">
      <Hero
        height="fullImage"
        image={{
          srcMobile: "img/optoma/ifpd-creative-board.jpg",
        }}
      />
    </Section>
    <Section
      headline={{
        text: "The Challenge:",
        sub: "Modernising Classroom Technology Across a Multi-Academy Trust",
        width: "default",
        textAlign: "center",
        align: "left",
      }}
      spaceBefore="none"
      spaceAfter="small"
    >
      <Text
        align="center"
        highlightText
        text="Sussex Learning Trust, a multi-academy trust overseeing 15 primary and secondary schools across East Sussex, needed to replace ageing projector-based setups with modern interactive displays. Teachers required reliable, intuitive technology that would enhance student engagement without demanding extensive technical training."
      />
    </Section>
    <Section width="full">
      <Mosaic
        layout="alternate"
        tile={[
          {
            headline: "The Solution:",
            sub: "Optoma Creative Touch 5-Series IFPDs",
            text: "Optoma partnered with Sussex Learning Trust to deploy over 200 Creative Touch 5-Series interactive flat panel displays across all 15 schools. The 65-inch, 75-inch and 86-inch panels were selected for their high brightness, responsive touch technology and seamless integration with Google Classroom, the trust's chosen platform.",
            image: {
              src: "img/optoma/ifpd-5g3-75inch.webp",
            },
          },
          {
            headline: "Seamless Integration:",
            sub: "Google Classroom and wireless connectivity",
            text: "Each classroom was equipped with wireless screen-sharing capability, enabling teachers and students to present from any device without cables. The built-in Android platform provided instant access to educational apps, while the zero-air-gap bonded screen delivered an accurate, pen-on-paper writing experience that teachers and students adopted immediately.",
            image: {
              src: "img/optoma/ifpd-google-classroom.jpg",
            },
          },
        ]}
      />
    </Section>

    <Section
      headline={{
        text: "**The Results:**",
        textAlign: "center",
      }}
    >
      <Text
        text={`
The rollout of Optoma IFPDs transformed the learning environment at Sussex Learning Trust. **Student engagement increased measurably**, with teachers reporting more interactive and collaborative lessons. The displays' **reliability and low maintenance** reduced IT support calls by 60%, while the **energy-efficient LED backlighting** cut display-related energy costs by 40% compared to the previous projector setups.
          `}
        align="center"
        highlightText
      />
    </Section>
    <Section spaceBefore="none" width="wide">
      <Testimonials
        testimonial={[
          {
            image: {
              src: "img/optoma/about-team-discussion.jpg",
              alt: "Sarah Mitchell, IT Director at Sussex Learning Trust",
            },
            name: "- Sarah Mitchell",
            quote:
              "The Optoma interactive displays have completely changed how our teachers deliver lessons. The intuitive touch interface means staff were confident using them from day one, and students are far more engaged. It has been one of the best technology investments we have made across the trust.",
            title: "IT Director, Sussex Learning Trust",
          },
        ]}
      />
    </Section>
    <Section width="wide" inverted>
      <Cta
        padding
        highlightText
        textAlign="center"
        headline="Ready to **transform** your learning environment with **Optoma** interactive displays?"
        sub="Get in touch to discuss your education technology needs."
        buttons={[
          {
            label: "Request a demo",
            url: "https://www.optoma.co.uk/contact",
            icon: "person",
          },
          {
            label: "View IFPDs",
            url: "https://www.optoma.co.uk/products/ifpds",
            icon: "chevron-right",
          },
        ]}
      />
    </Section>
    <Section
      headline={{
        text: "More Customer Success Stories",
        textAlign: "center",
      }}
    >
      <TeaserCard
        url="#"
        headline="Roblox at Gamescom"
        text="Discover how Optoma projectors and LED displays created an immersive gaming experience at Europe's largest games convention"
        image="img/optoma/case-study-roblox.jpg"
        button={{
          label: "View case study",
          chevron: true,
        }}
      />
      <TeaserCard
        url="#"
        headline="arebyte Gallery"
        text="See how Optoma projection technology powers one of London's leading digital art spaces"
        image="img/optoma/case-study-arebyte.jpg"
        button={{
          label: "View case study",
          chevron: true,
        }}
      />
    </Section>

    <Footer {...footerProps} />
  </>
);

export default Showcase;
