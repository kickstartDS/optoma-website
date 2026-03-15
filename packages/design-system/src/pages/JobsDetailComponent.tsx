import { Header } from "../components/header/HeaderComponent";
import { headerProps } from "../components/header/Header.stories";
import { Footer } from "../components/footer/FooterComponent";
import { footerProps } from "../components/footer/Footer.stories";
import { Section } from "../components/section/SectionComponent";
import { Hero } from "../components/hero/HeroComponent";
import { Faq } from "../components/faq/FaqComponent";
import { Contact } from "../components/contact/ContactComponent";
import { Features } from "../components/features/FeaturesComponent";
import { Cta } from "../components/cta/CtaComponent";

const JobDetail = () => (
  <>
    <Header {...headerProps} />
    <Section width="full" spaceAfter="none" spaceBefore="none">
      <Hero
        headline="Partner Account Manager"
        sub="Optoma Europe — Hemel Hempstead, UK"
        text="Accelerate growth through strategic partner relationships across the UK AV/IT channel. Join Optoma's sales team and help expand our market-leading display solutions."
        textPosition="left"
        invertText
        image={{
          srcMobile: "img/optoma/corporate-huddle-spaces.jpg",
          alt: "Modern office meeting space with Optoma display solutions",
        }}
        buttons={[
          {
            label: "Apply now",
            url: "mailto:recruitment@optoma.co.uk",
          },
        ]}
      />
    </Section>

    <Section width="wide">
      <Cta
        headline="About This Role"
        text={`As a Partner Account Manager at Optoma Europe, you will be responsible for developing and managing key channel partnerships to drive revenue growth across the UK AV/IT market.

You will work closely with resellers, system integrators and distribution partners to expand Optoma's footprint in corporate, education, and professional AV sectors. This is a strategic role that requires a strong network in the UK AV channel, commercial acumen and a passion for visual technology.

This is a hybrid role based at our European headquarters in Hemel Hempstead, with regular travel to partner sites and industry events across the UK.`}
        image={{
          src: "img/optoma/about-team-discussion.jpg",
          alt: "Optoma team in a strategy meeting",
          padding: false,
        }}
      />
    </Section>

    <Section
      headline={{
        text: "Key Responsibilities",
        sub: "What you will do",
      }}
      width="wide"
    >
      <Features
        layout="largeTiles"
        ctas={{
          toggle: false,
        }}
        feature={[
          {
            icon: "arrow-right",
            title: "Partner Expansion",
            text: "Identify, onboard and develop new channel partners to accelerate Optoma's market penetration across the UK AV/IT ecosystem.",
          },
          {
            icon: "arrow-right",
            title: "Revenue Growth",
            text: "Deliver predictable, scalable growth through disciplined pipeline management, accurate forecasting and CRM best practices.",
          },
          {
            icon: "arrow-right",
            title: "Visual Solutions Advocacy",
            text: "Position Optoma's full range of projection, IFPD, LED and professional display solutions to meet partners' customer requirements.",
          },
          {
            icon: "arrow-right",
            title: "Channel Enablement",
            text: "Provide product training, sales tools and marketing support to empower partners to sell Optoma solutions effectively.",
          },
          {
            icon: "arrow-right",
            title: "Brand Ambassador",
            text: "Represent Optoma at trade shows, partner events and industry forums. Build brand awareness and thought leadership in the AV market.",
          },
        ]}
        style="besideSmall"
      />
    </Section>

    <Section
      headline={{
        text: "What We're Looking For",
        sub: "Skills and experience",
      }}
      width="wide"
    >
      <Features
        layout="largeTiles"
        ctas={{
          toggle: false,
        }}
        feature={[
          {
            icon: "arrow-right",
            title: "AV Industry Knowledge",
            text: "Strong understanding of AV products, technologies and market trends — particularly in projection, interactive displays, LED and professional displays.",
          },
          {
            icon: "arrow-right",
            title: "UK Channel Network",
            text: "An established network of contacts within the UK AV/IT channel — resellers, distributors, system integrators and consultants.",
          },
          {
            icon: "arrow-right",
            title: "Account Management",
            text: "Proven track record of managing strategic accounts, building long-term partnerships and delivering consistent revenue growth.",
          },
          {
            icon: "arrow-right",
            title: "Strategic Thinking",
            text: "Ability to develop and execute partner business plans, identify market opportunities and translate them into actionable growth strategies.",
          },
          {
            icon: "arrow-right",
            title: "Communication Skills",
            text: "Excellent presentation and negotiation skills. Comfortable engaging with stakeholders at all levels, from technical staff to C-suite executives.",
          },
          {
            icon: "arrow-right",
            title: "Hybrid Work Capability",
            text: "Comfortable working in a hybrid environment — office-based in Hemel Hempstead with flexibility to work remotely and travel to partner sites.",
          },
        ]}
        style="besideSmall"
      />
    </Section>

    <Section
      headline={{
        text: "Frequently Asked Questions",
        sub: "Common questions about this vacancy",
      }}
    >
      <Faq
        questions={[
          {
            question: "Where is this role based?",
            answer:
              "This is a hybrid role based at Optoma's European headquarters in Hemel Hempstead, Hertfordshire. You'll split time between the office and working remotely, with regular travel to partner sites and trade events across the UK.",
          },
          {
            question: "What benefits are included?",
            answer:
              "We offer a competitive base salary with performance-based bonuses, private medical and dental insurance, a company pension scheme, up to 30 days annual leave plus bank holidays, and a company car or car allowance.",
          },
          {
            question: "How do I apply?",
            answer:
              "Send your CV and cover letter to recruitment@optoma.co.uk, referencing the Partner Account Manager role. Our HR team will review your application and be in touch within 5 working days if your profile is a good fit.",
          },
        ]}
      />
    </Section>

    <Section
      headline={{
        text: "Interested in this role?",
        sub: "Get in touch with our recruitment team",
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
            icon: "phone",
            label: "+44 (0)1923 691 800",
            newTab: true,
            url: "tel:+441923691800",
          },
          {
            ariaLabel: "Visit Optoma Europe on LinkedIn",
            icon: "linkedin",
            label: "LinkedIn",
            newTab: true,
            url: "#",
          },
        ]}
        copy="For any questions about this vacancy or life at Optoma, please contact our HR team. We're happy to arrange an informal conversation before you apply."
        subtitle="HR & Recruitment"
        title="Optoma Europe HR Team"
      />
    </Section>

    <Footer {...footerProps} />
  </>
);

export default JobDetail;
