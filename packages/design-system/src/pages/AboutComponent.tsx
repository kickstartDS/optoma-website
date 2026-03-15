import { Header } from "../components/header/HeaderComponent";
import { headerProps } from "../components/header/Header.stories";
import { Footer } from "../components/footer/FooterComponent";
import { footerProps } from "../components/footer/Footer.stories";
import { Section } from "../components/section/SectionComponent";
import { Cta } from "../components/cta/CtaComponent";
import { ImageStory } from "../components/image-story/ImageStoryComponent";
import { ImageText } from "../components/image-text/ImageTextComponent";
import { Slider } from "../components/slider/SliderComponent";
import { TeaserCard } from "../components/teaser-card/TeaserCardComponent";
import { VideoCurtain } from "../components/video-curtain/VideoCurtainComponent";

const About = () => (
  <>
    <Header {...headerProps} floating />
    <Section
      inverted
      spaceBefore="none"
      spaceAfter="none"
      width="full"
      content={{
        mode: "list",
      }}
    >
      <VideoCurtain
        overlay
        highlightText
        textPosition="corner"
        headline="Bringing Ideas to Life"
        sub="Captivating, inspiring and connecting people through pioneering visual solutions"
        buttons={[
          {
            label: "Discover our story",
            url: "#about",
          },
        ]}
        video={{
          srcMobile: "img/videos/video-agency.mp4",
          srcTablet: "img/videos/video-agency.mp4",
          srcDesktop: "img/videos/video-agency.mp4",
        }}
      />
    </Section>

    <Section
      id="about"
      width="wide"
      headline={{
        text: "Our Purpose, Vision & Mission",
        sub: "What drives us every day",
        width: "default",
        align: "left",
        large: true,
      }}
      style="deko"
      content={{
        mode: "list",
        align: "left",
      }}
    >
      <Cta
        align="top"
        highlightText
        image={{ src: "img/optoma/about-immersive-art.jpg" }}
        text="
**Our Purpose:** To captivate, inspire and connect people.

**Our Vision:** To bring people together through pioneering visual solutions that captivate, inspire and connect.

**Our Mission:** To deliver sustainable and captivating visual solutions that meet customers' evolving needs through innovation, reliability and exceptional service.

**We believe technology should bring people closer — whether in a boardroom, a classroom, or a gallery.**"
        order={{ desktopImageLast: true }}
        buttons={[
          {
            icon: "chevron-right",
            label: "Explore our products",
            url: "#",
          },
        ]}
      />
    </Section>

    <Section
      width="wide"
      headline={{
        text: "Our Values",
        sub: "The principles that guide everything we do",
        textAlign: "left",
      }}
    >
      <Slider autoplay equalHeight gap={15} arrows>
        <ImageText
          text={`
### Customer Focus
We listen, understand and respond to our customers' evolving needs. Every solution we build starts with the people who use it — ensuring reliability, ease of use and genuine value in every interaction.`}
          image={{
            src: "img/optoma/about-team-discussion.jpg",
            alt: "Optoma team collaborating in a modern meeting space",
          }}
          layout={"above"}
        />
        <ImageText
          image={{
            src: "img/optoma/about-data-analytics.jpg",
            alt: "Innovative data analytics and visual solutions",
          }}
          text={`
### Innovation
We push the boundaries of what's possible in visual technology. From laser projection to all-in-one LED displays, we continuously invest in R&D to deliver solutions that set new industry benchmarks.`}
          layout={"above"}
        />
        <ImageText
          image={{
            src: "img/optoma/about-sustainability.jpg",
            alt: "Sustainable manufacturing and eco-friendly technology",
          }}
          text={`
### Integrity
We act with honesty, transparency and accountability. Our commitment to ethical practices extends from how we treat our partners and employees to how we design products that respect the environment.`}
          layout={"above"}
        />
      </Slider>
    </Section>

    <Section
      width="wide"
      content={{
        mode: "list",
        width: "wide",
      }}
    >
      <ImageStory
        headline="A Message from Our Chairman"
        layout="imageLeft"
        text={`
Since founding Optoma, our goal has always been to bring people together through the power of visual technology.

What began as a passion for projection has grown into a global company with offices in over **25 countries**, delivering award-winning display solutions across corporate, education, entertainment and public spaces.

We believe that great technology should be **accessible**, **sustainable** and **captivating**. As we look to the future, we remain committed to pioneering solutions that inspire connection and creativity — while respecting both our customers and the planet.

**— S.Y. Chen, Chairman**
`}
        image={{
          src: "img/optoma/about-chairman.jpg",
          alt: "S.Y. Chen, Chairman of Optoma",
        }}
      />
    </Section>

    <Section style="framed" transition="to-accent" width="wide">
      <ImageStory
        headline="Our Working Culture"
        layout="imageRight"
        text={`
At Optoma, we foster a collaborative and inclusive environment where every team member is valued.

Our culture is built on **mutual respect**, **open communication** and a shared commitment to excellence. We encourage cross-functional collaboration, continuous learning and creative problem-solving.

With a diverse team spanning over 25 countries, we embrace different perspectives and backgrounds. Our flexible working arrangements and focus on employee wellbeing create an environment where people can do their best work — whether in the office, at home, or on the road.

**We're not just building displays — we're building a team that makes a difference.**
`}
        image={{
          src: "img/optoma/about-team-highfive.jpg",
          alt: "Optoma team members celebrating a milestone",
        }}
      />
    </Section>

    <Section
      backgroundColor="accent"
      width="wide"
      headline={{
        width: "default",
        align: "left",
        text: "Global Reach, Local Expertise",
        sub: "Offices in 25+ countries with deep local knowledge",
        switchOrder: true,
      }}
    >
      <TeaserCard
        headline="Corporate Solutions"
        text="Transform meeting rooms and collaboration spaces with projection, interactive displays and LED solutions"
        url={"#"}
        button={{
          label: "Explore corporate",
        }}
      />
      <TeaserCard
        headline="Education"
        text="Empower teaching and learning with Google-certified interactive displays and classroom technology"
        url={"#"}
        button={{
          label: "Explore education",
        }}
      />
      <TeaserCard
        headline="Professional AV"
        text="Large-venue projection, digital signage and LED displays for immersive public spaces and events"
        url={"#"}
        button={{
          label: "Explore Pro AV",
        }}
      />
      <TeaserCard
        headline="Home Entertainment"
        text="Award-winning home cinema projectors delivering stunning 4K UHD and laser performance"
        url={"#"}
        button={{
          label: "Explore home cinema",
        }}
      />
    </Section>

    <Section
      width="wide"
      headline={{
        text: "Sustainability & Responsibility",
        sub: "Building a better future through responsible innovation",
        textAlign: "left",
      }}
    >
      <ImageStory
        layout="imageLeft"
        text={`
Sustainability is at the heart of Optoma's product development and operations.

### Our Commitments
- **Reduced carbon footprint** through energy-efficient designs and eco-friendly manufacturing processes
- **Hazardous-free materials** — meeting and exceeding global environmental regulations
- **Recycled and recyclable packaging** to minimise waste across our supply chain
- **Laser technology transition** — eliminating mercury-containing lamps with long-lasting laser light sources that last up to 30,000 hours
- **Ultra-low standby power** — our LED displays consume less than 0.5W in standby mode

We are committed to creating technology that is not only innovative and reliable, but also responsible — ensuring a positive impact on both our customers and the environment.
`}
        image={{
          src: "img/optoma/about-sustainability.jpg",
          alt: "Optoma sustainability and eco-friendly technology initiatives",
        }}
        buttons={[
          {
            label: "Learn more",
            icon: "chevron-right",
            url: "#",
          },
        ]}
      />
    </Section>

    <Section width="wide">
      <Cta
        headline="Join our team or partner with us"
        sub="We're always looking for talented people and ambitious partners"
        text="Whether you want to develop your career at Optoma or become an authorised reseller, we'd love to hear from you."
        order={{
          desktopImageLast: false,
        }}
        image={{
          src: "img/optoma/about-coworking.jpg",
        }}
        buttons={[
          {
            label: "View careers",
            url: "#",
            icon: "person",
          },
          {
            label: "Become a partner",
            url: "#",
            icon: "chevron-right",
          },
        ]}
      />
    </Section>

    <Footer {...footerProps} />
  </>
);

export default About;
