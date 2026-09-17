import { Link } from "react-router-dom"

type FaqCard = {
  title: string
  body: string
  to?: string
}

type FaqSection = {
  number: string
  label: string
  kicker: string
  title: string
  accent: string
  intro?: string
  cards: FaqCard[]
  layout?: "stack" | "grid"
  footer: string
  closing?: { title: string; accent: string }
}

const sections: FaqSection[] = [
  {
    number: "01",
    label: "FAQ",
    kicker: "Quick answers",
    title: "What is",
    accent: "RentBrain?",
    intro:
      "RentBrain is a platform that connects people who have expertise with people and businesses looking for the right expertise.",
    cards: [
      {
        title: "What can I do on RentBrain?",
        body: "Create an expert profile, post what you need, or discover and hire experts—depending on what you are looking for.",
      },
      {
        title: "Who is RentBrain for?",
        body: "Freelancers, consultants, professionals, creators, individuals, and businesses looking to connect around real needs and real skills.",
      },
    ],
    footer: "The world's sharpest minds. One platform.",
  },
  {
    number: "02",
    label: "Experts",
    kicker: "For experts",
    title: "I have a skill.",
    accent: "How do I get discovered?",
    cards: [
      {
        title: "Can I become an expert?",
        body: "Yes. Create an expert presence on RentBrain, showcase what you do, and make your skills easier for potential clients to discover.",
      },
      {
        title: "What should my profile show?",
        body: "Your expertise, services, experience, and the information people need to understand what you can help them with.",
      },
      {
        title: "Do I need to be a traditional freelancer?",
        body: "No. Consultants, specialists, professionals, creators, and other skilled people can present what they offer.",
      },
    ],
    footer: "Build your expert presence",
  },
  {
    number: "03",
    label: "Needs",
    kicker: "For people with a need",
    title: "Need someone?",
    accent: "Start with what you need.",
    intro:
      "Describe the help you are looking for and use RentBrain to connect with relevant expertise.",
    layout: "grid",
    cards: [
      {
        title: "Need a doctor?",
        body: "Post the type of professional help you are looking for.",
      },
      {
        title: "Need a designer?",
        body: "Describe the project, then connect with suitable expertise.",
      },
      {
        title: "Need a consultant?",
        body: "Share the problem or service you need support with.",
      },
      {
        title: "Need something else?",
        body: "Your need can be specific to your work, project, or life.",
      },
    ],
    footer: "Post a need",
    closing: {
      title: "The idea is simple:",
      accent: "you explain the need, RentBrain helps bring the right expertise closer.",
    },
  },
  {
    number: "04",
    label: "Hiring",
    kicker: "Find & hire",
    title: "How do I",
    accent: "find the right expert?",
    cards: [
      {
        title: "Can I browse experts?",
        body: "RentBrain is designed to help you discover professionals based on the expertise and services they offer.",
      },
      {
        title: "How do I choose?",
        body: "Review the information available on an expert's profile and decide who best matches your needs.",
      },
      {
        title: "Can businesses use RentBrain?",
        body: "Yes. Businesses can use the platform to look for expertise for projects, services, or specific needs.",
      },
    ],
    footer: "Discover. Compare. Connect.",
  },
  {
    number: "05",
    label: "How it works",
    kicker: "Three simple paths",
    title: "One platform.",
    accent: "Three ways in.",
    cards: [
      {
        title: "01 — Become an Expert",
        body: "Create your profile and showcase your expertise.",
        to: "/expert/setup",
      },
      {
        title: "02 — Post What You Need",
        body: "Describe the service, project, or help you are looking for.",
        to: "/jobs/new",
      },
      {
        title: "03 — Find an Expert",
        body: "Explore expertise that can match your need.",
        to: "/experts",
      },
      {
        title: "Then connect",
        body: "Move from a need or skill to a real professional connection.",
      },
    ],
    footer: "People. Skills. Opportunities.",
  },
  {
    number: "06",
    label: "FAQ",
    kicker: "One last question",
    title: "Why",
    accent: "RentBrain?",
    intro:
      "Because expertise is everywhere—and finding the right connection should feel simpler.",
    cards: [
      {
        title: "Is RentBrain only for freelancers?",
        body: "No. It serves experts, people with specific needs, and people or businesses looking to hire expertise.",
      },
      {
        title: "What makes the platform different?",
        body: "It brings the skill side and the need side into one place, so people can enter the platform from different starting points.",
      },
      {
        title: "Where do I start?",
        body: "Start with your role: are you offering expertise, looking for help, or trying to hire someone?",
      },
    ],
    footer: "RentBrain",
    closing: {
      title: "The world's sharpest minds.",
      accent: "One platform.",
    },
  },
]

export default function FaqPage() {
  return (
    <div className="faq-page">
      {sections.map((section) => (
        <section
          className={`faq-slide faq-slide-${section.number}`}
          id={`faq-${section.number}`}
          key={section.number}
          aria-labelledby={`faq-title-${section.number}`}
        >
          <div className="faq-orb" aria-hidden />
          <div className="container faq-slide-inner">
            <header className="faq-slide-top">
              <span className="faq-wordmark">Rent<span>Brain</span></span>
              <span>{section.number} / {section.label}</span>
            </header>

            <div className="faq-slide-content">
              <p className="faq-kicker">{section.kicker}</p>
              <h1 id={`faq-title-${section.number}`}>
                {section.title} <span>{section.accent}</span>
              </h1>
              {section.intro && <p className="faq-intro">{section.intro}</p>}
              {(section.intro || section.closing) && <span className="faq-accent-line" aria-hidden />}

              <div className={`faq-card-grid ${section.layout === "grid" ? "faq-card-grid-two" : ""}`}>
                {section.cards.map((card) =>
                  card.to ? (
                    <Link className="faq-answer-card faq-answer-link" to={card.to} key={card.title}>
                      <FaqCardContent card={card} />
                    </Link>
                  ) : (
                    <article className="faq-answer-card" key={card.title}>
                      <FaqCardContent card={card} />
                    </article>
                  ),
                )}
              </div>

              {section.closing && (
                <div className="faq-closing">
                  <strong>{section.closing.title}</strong>
                  <span>{section.closing.accent}</span>
                </div>
              )}
            </div>

            <footer className="faq-slide-footer">
              <span>{section.footer}</span>
              <span>{section.number}</span>
            </footer>
          </div>
        </section>
      ))}
    </div>
  )
}

function FaqCardContent({ card }: { card: FaqCard }) {
  return (
    <>
      <h2>{card.title}</h2>
      <p>{card.body}</p>
    </>
  )
}
