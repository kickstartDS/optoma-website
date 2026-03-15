import { Section } from "../components/section/SectionComponent";
import { Header } from "../components/header/HeaderComponent";
import { headerProps } from "../components/header/Header.stories";
import { Footer } from "../components/footer/FooterComponent";
import { footerProps } from "../components/footer/Footer.stories";
import { Hero } from "../components/hero/HeroComponent";
import { Mosaic } from "../components/mosaic/MosaicComponent";
import { Text } from "../components/text/TextComponent";
import { Logos } from "../components/logos/LogosComponent";
import { Cta } from "../components/cta/CtaComponent";

const Overview = () => (
  <>
    <Header {...headerProps} inverted dropdownInverted flyoutInverted />
    <Section spaceBefore="none" width="full" inverted>
      <Hero
        height="fullScreen"
        image={{
          alt: "Optoma ProScene LED displays in a corporate environment",
          indent: "none",
          src: "img/optoma/led-solutions.webp",
          srcDesktop: "img/optoma/led-solutions.webp",
          srcMobile: "img/optoma/led-solutions.webp",
          srcTablet: "img/optoma/led-solutions.webp",
        }}
        highlightText
        overlay
        headline="ProScene LED Displays"
        sub="All-in-One COB LED solutions for every environment"
        textPosition="offset"
        text={`Optoma's ProScene LED displays combine flip-chip LED and COB technology in an all-in-one design. With built-in speakers, Android OS, and single-cable installation, they deliver stunning visual performance with minimal complexity — ideal for corporate, education, digital signage and hospitality environments.`}
      />
    </Section>

    <Section width="wide" content={{ mode: "list", gutter: "large" }} inverted>
      <Mosaic
        layout="textLeft"
        tile={[
          {
            headline: 'FHDC135 — 135" All-in-One LED',
            sub: "ProScene Series",
            text: "The FHDC135 delivers Full HD resolution across a stunning 135-inch diagonal. With built-in speakers, Android OS and single-cable power, it's the perfect large-format display for boardrooms, lecture halls and digital signage installations.",
            image: {
              src: "img/optoma/led-fhdc135.webp",
            },
            backgroundColor: "#1a1a2e",
            button: {
              label: "View product",
              icon: "chevron-right",
              toggle: true,
              url: "#",
            },
          },
        ]}
      />
      <Mosaic
        layout="textRight"
        tile={[
          {
            headline: 'FHDC163 — 163" All-in-One LED',
            sub: "ProScene Series",
            text: "Make a bold impact with the FHDC163 — our largest all-in-one LED display at 163 inches. Featuring COB technology for superior durability and image quality, it's designed for large venues, exhibition spaces and high-traffic lobbies.",
            image: {
              src: "img/optoma/led-fhdc163.webp",
            },
            backgroundColor: "#0f3460",
            button: {
              label: "View product",
              icon: "chevron-right",
              toggle: true,
              url: "#",
            },
          },
        ]}
      />
      <Mosaic
        layout="textLeft"
        tile={[
          {
            headline: 'FHDC108 — 108" All-in-One LED',
            sub: "ProScene Series",
            text: "The compact FHDC108 packs Full HD resolution into a 108-inch form factor. Perfect for meeting rooms, huddle spaces and retail environments where a large display is needed without the complexity of multi-panel installations.",
            image: {
              src: "img/optoma/led-fhdc108.webp",
            },
            backgroundColor: "#16213e",
            button: {
              url: "#",
              label: "View product",
              icon: "chevron-right",
              toggle: true,
            },
          },
        ]}
      />
    </Section>

    <Section backgroundColor="accent" width="wide">
      <Cta
        textAlign="center"
        highlightText
        headline="Experience the future of LED display technology"
        sub="Book a free demonstration at our UK showroom or at your premises"
        buttons={[
          {
            label: "Request a demo",
            url: "#",
            icon: "date",
          },
          {
            label: "Contact sales",
            url: "#",
            icon: "person",
          },
        ]}
      />
    </Section>

    <Section
      spaceAfter="none"
      width="wide"
      headline={{
        align: "center",
        text: "**Trusted across industries**",
      }}
    >
      <Logos
        align="center"
        logo={[
          {
            alt: "AWS Qualified Partner",
            src: "img/optoma/logo-aws-qualified.png",
          },
          {
            alt: "Google for Education Partner",
            src: "img/optoma/logo-google-education.png",
          },
          {
            alt: "Sussex Learning Trust",
            src: "img/optoma/logo-sussex-trust.png",
          },
          {
            alt: "Schindler Group",
            src: "img/optoma/logo-schindler.png",
          },
          {
            alt: "Birmingham City University",
            src: "img/optoma/logo-birmingham.png",
          },
          {
            alt: "Sounds & Vision",
            src: "img/optoma/logo-sounds-vision.png",
          },
          {
            alt: "James Pantyfedwen Foundation",
            src: "img/optoma/logo-jpf.png",
          },
          {
            alt: "Reactiv Suite",
            src: "img/optoma/logo-reactiv-suite.png",
          },
        ]}
        logosPerRow={4}
        tagline=""
      />
    </Section>

    <Section>
      <Text
        text={`Optoma ProScene LED displays feature flip-chip LED and COB technology for superior durability, with eco-friendly standby power under 0.5W. [Learn more about our sustainability commitment](#).`}
        align="center"
      />
    </Section>

    <Footer {...footerProps} />
  </>
);

export default Overview;
