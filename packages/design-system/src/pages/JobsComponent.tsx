import { Header } from "../components/header/HeaderComponent";
import { headerProps } from "../components/header/Header.stories";
import { Footer } from "../components/footer/FooterComponent";
import { footerProps } from "../components/footer/Footer.stories";
import { Section } from "../components/section/SectionComponent";
import { ImageText } from "../components/image-text/ImageTextComponent";
import { Hero } from "../components/hero/HeroComponent";
import { Stats } from "../components/stats/StatsComponent";
import { Testimonials } from "../components/testimonials/TestimonialsComponent";
import { TeaserCard } from "../components/teaser-card/TeaserCardComponent";
import { Faq } from "../components/faq/FaqComponent";
import { Contact } from "../components/contact/ContactComponent";
import { Features } from "../components/features/FeaturesComponent";

const Jobs = () => (
  <>
    <Header {...headerProps} />
    <Section width="full" spaceAfter="none" spaceBefore="none">
      <Hero
        headline="Careers at Optoma"
        sub="Shape the future of visual technology"
        textPosition="corner"
        buttons={[
          {
            label: "View openings",
            url: "#openings",
            icon: "arrow-down",
          },
        ]}
        image={{
          srcMobile: "img/optoma/about-coworking.jpg",
        }}
      />
    </Section>
    <Section
      headline={{
        text: "Why Work at Optoma?",
        sub: "Join a global leader in display solutions",
      }}
    >
      <ImageText
        text={`Optoma Europe Ltd was established in 1997 and has grown to approximately 130 employees across Europe and MEA, headquartered in Hemel Hempstead, UK.

We're a passionate team of innovators, engineers and business professionals dedicated to delivering award-winning projection, interactive display, and LED solutions to customers worldwide.

Whether you're an experienced professional or just starting your career, Optoma offers a collaborative, inclusive environment where your contributions make a real impact on how people present, learn and connect.`}
        image={{
          src: "img/optoma/about-team-discussion.jpg",
          alt: "Optoma team discussing in a modern office",
        }}
        layout={"beside-right"}
      />
    </Section>
    <Section width="wide">
      <Testimonials
        layout="slider"
        quoteSigns="normal"
        testimonial={[
          {
            image: {
              alt: "Emma portrait",
              src: "img/people/author-emily.png",
            },
            name: "Emma Richardson",
            quote:
              "What I love about Optoma is the opportunity to work with cutting-edge visual technology while being part of a genuinely supportive team. Every project feels like it matters, and there's always room to grow.",
            title: "Product Marketing Manager, Optoma Europe",
          },
          {
            image: {
              alt: "Tom portrait",
              src: "img/people/author-john.png",
            },
            name: "Tom Hawkins",
            quote:
              "Joining Optoma was the best career move I've made. The hybrid working model gives me flexibility, and the team culture encourages innovation. I've been able to develop my skills in ways I never expected.",
            title: "Senior Sales Engineer, Optoma Europe",
          },
          {
            image: {
              alt: "Priya portrait",
              src: "img/people/author-alex.png",
            },
            name: "Priya Sharma",
            quote:
              "As part of the education team, I see first-hand how our products transform classrooms across the UK. It's incredibly rewarding to know that the work we do directly benefits teachers and students.",
            title: "Education Account Manager, Optoma Europe",
          },
        ]}
      />
    </Section>
    <Section
      headline={{
        text: "Optoma at a Glance",
        sub: "The numbers behind our global success",
        align: "center",
      }}
      width="wide"
    >
      <Stats
        stat={[
          {
            title: "Countries with Offices",
            number: "25+",
          },
          {
            title: "Employees across Europe & MEA",
            number: "130+",
          },
          {
            title: "Years in the AV Industry",
            number: "25+",
          },
          {
            title: "Award-Winning Products",
            number: "200+",
          },
        ]}
      />
    </Section>
    <Section
      id="openings"
      headline={{
        text: "Current Vacancies",
        sub: "Find the role that's right for you",
      }}
      content={{
        mode: "list",
      }}
    >
      <TeaserCard
        layout="row"
        headline="Partner Account Manager"
        text="Drive growth through strategic partner relationships across the UK AV/IT channel. Based in Hemel Hempstead with hybrid working."
        url={"#"}
        button={{
          label: "View vacancy",
        }}
      />
      <TeaserCard
        layout="row"
        headline="Technical Support Engineer"
        text="Provide expert technical support for our range of projectors, IFPDs and LED displays. Help customers get the most from their Optoma solutions."
        url={"#"}
        button={{
          label: "View vacancy",
        }}
      />
      <TeaserCard
        layout="row"
        headline="Digital Marketing Executive"
        text="Create compelling content and manage campaigns that showcase Optoma's display solutions across digital channels."
        url={"#"}
        button={{
          label: "View vacancy",
        }}
      />
    </Section>
    <Section
      width="wide"
      headline={{
        text: "Our Recruitment Process",
        sub: "Your journey to joining Optoma — clear and straightforward",
      }}
      content={{
        mode: "slider",
        tileWidth: "full",
        gutter: "large",
      }}
    >
      <Hero
        textPosition="right"
        invertText
        textbox={false}
        overlay
        image={{
          srcMobile: "img/optoma/about-coworking.jpg",
          alt: "Browse open positions at Optoma",
        }}
        headline="Browse & Apply"
        text="Explore our current vacancies and find a role that matches your skills and ambitions. Submit your CV and cover letter through our careers portal or email recruitment@optoma.co.uk."
      />
      <Hero
        textPosition="left"
        invertText
        textbox={false}
        overlay
        image={{
          srcMobile: "img/optoma/about-team-discussion.jpg",
          alt: "Interview process at Optoma",
        }}
        headline="Interview & Assessment"
        text="If your profile is a good fit, we'll invite you for an interview — typically a mix of competency-based questions and a practical assessment relevant to the role. We want to get to know you, and for you to get to know us."
      />
      <Hero
        textPosition="left"
        invertText
        textbox={false}
        overlay
        image={{
          srcMobile: "img/optoma/about-team-highfive.jpg",
          alt: "Welcome to the Optoma team",
        }}
        headline="Offer & Onboarding"
        text="Successful candidates receive a comprehensive offer including competitive salary, benefits package and a structured onboarding programme to help you hit the ground running from day one."
      />
      <Hero
        textPosition="right"
        invertText
        textbox={false}
        overlay
        image={{
          srcMobile: "img/optoma/corporate-collaboration.jpg",
          alt: "Grow your career at Optoma",
        }}
        headline="Grow & Thrive"
        text="At Optoma you'll have access to ongoing professional development, industry certifications, and internal mobility opportunities as we continue to grow across Europe and MEA."
      />
    </Section>
    <Section
      headline={{
        text: "Frequently Asked Questions",
        sub: "Everything you need to know about working at Optoma",
      }}
    >
      <Faq
        questions={[
          {
            question: "Where is Optoma's office located?",
            answer:
              "Our European headquarters is in Hemel Hempstead, Hertfordshire, UK — well connected by road and rail, approximately 30 minutes from central London. We also have offices across Europe and MEA.",
          },
          {
            question: "Do you offer hybrid or remote working?",
            answer:
              "Yes, many of our roles support hybrid working arrangements. The specific split depends on the role and team, but we're committed to flexible working that supports both productivity and work-life balance.",
          },
          {
            question: "What benefits does Optoma offer?",
            answer:
              "We offer a competitive salary alongside a comprehensive benefits package including private medical insurance, dental cover, pension scheme, up to 30 days annual leave, and professional development opportunities.",
          },
          {
            question: "How do I apply for a position?",
            answer:
              "You can apply directly through the vacancy listing on our careers page, or send your CV and cover letter to recruitment@optoma.co.uk. Please reference the specific role you're interested in.",
          },
          {
            question: "What is the company culture like?",
            answer:
              "Optoma's culture is collaborative, innovative and inclusive. We value diversity of thought and background, encourage continuous learning, and celebrate team achievements. Regular social events and team-building activities help build strong connections across departments.",
          },
        ]}
      />
    </Section>
    <Section
      headline={{
        text: "Benefits & Perks",
        sub: "What you get when you join the Optoma team",
      }}
    >
      <Features
        ctas={{
          toggle: false,
        }}
        feature={[
          {
            icon: "arrow-right",
            title: "Competitive Salary",
            text: "We offer competitive remuneration packages benchmarked against the AV and technology industry, with annual reviews and performance-based bonuses.",
          },
          {
            icon: "arrow-right",
            title: "Health & Dental Cover",
            text: "Comprehensive private medical insurance and dental cover for you — because your wellbeing is our priority.",
          },
          {
            icon: "arrow-right",
            title: "Generous Leave",
            text: "Up to 30 days annual leave plus bank holidays, giving you plenty of time to recharge and enjoy life outside of work.",
          },
          {
            icon: "arrow-right",
            title: "Pension Scheme",
            text: "A solid pension scheme to help you build financial security for the future, with employer contributions.",
          },
          {
            icon: "arrow-right",
            title: "Hybrid Working",
            text: "Flexible hybrid working arrangements that let you balance office collaboration with the comfort and focus of working from home.",
          },
          {
            icon: "arrow-right",
            title: "Professional Development",
            text: "Ongoing training, industry certifications and career development opportunities to help you grow and advance within Optoma.",
          },
        ]}
        layout="largeTiles"
        style="besideSmall"
      />
    </Section>
    <Section
      headline={{
        text: "Get in Touch",
        sub: "Contact our recruitment team about any vacancy",
      }}
    >
      <Contact
        image={{
          alt: "Optoma recruitment team contact",
          aspectRatio: "wide",
          fullWidth: true,
          src: "img/people/contact-jim.png",
        }}
        links={[
          {
            ariaLabel: "Email the Optoma recruitment team",
            icon: "email",
            label: "recruitment@optoma.co.uk",
            newTab: false,
            url: "mailto:recruitment@optoma.co.uk",
          },
          {
            ariaLabel: "Visit Optoma on LinkedIn",
            icon: "facebook",
            label: "@OptomaEurope",
            newTab: true,
            url: "#",
          },
        ]}
        copy="For any questions about current vacancies or the application process, please contact our HR team. We're happy to help with any queries about life at Optoma."
        subtitle="HR & Recruitment"
        title="Optoma Europe HR Team"
      />
    </Section>
    <Footer {...footerProps} />
  </>
);

export default Jobs;
