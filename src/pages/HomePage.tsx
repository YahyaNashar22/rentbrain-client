import { useEffect, useState } from "react"
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck,
  CreditCard,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Link } from "react-router-dom"
import { api } from "../lib/api"
import type { Category } from "../lib/types"
import { buttonClass } from "../components/ui"

const categoryIcons = ["UX", "MD", "DEV", "LAW", "FIT", "BIZ", "EDU", "HOME"]

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    void api<Category[]>("/marketplace/categories")
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={17} /> Expertise, when you need it
            </div>
            <h1>
              The World's Sharpest Minds. <span>One Platform.</span>
            </h1>
            <p>
              Book a focused session or post a real-world need—from product
              design advice to finding care for your family.
            </p>
            <div className="hero-actions">
              <Link className={buttonClass()} to="/experts">
                Find an expert <ArrowRight size={19} />
              </Link>
              <Link className={buttonClass("ghost")} to="/expert/setup">
                Become an expert
              </Link>
              <Link className={buttonClass("secondary")} to="/jobs/new">
                Post what you need
              </Link>
            </div>
            <div className="hero-notes">
              <span>
                <BadgeCheck size={18} /> Expert profiles & optional credentials
              </span>
              <span>
                <ShieldCheck size={18} /> Role-based platform security
              </span>
            </div>
          </div>
          <div className="hero-board" aria-label="Ways to use RentBrain">
            <div className="board-label">All Experts. One App.</div>
            <article className="board-card card-one">
              <span>01</span>
              <h2>Ask</h2>
              <p>Describe what you need clearly.</p>
            </article>
            <article className="board-card card-two">
              <span>02</span>
              <h2>Choose</h2>
              <p>Compare services or applications.</p>
            </article>
            <article className="board-card card-three">
              <span>03</span>
              <h2>Work</h2>
              <p>Book a session and track progress.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section category-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Explore expertise</div>
              <h2>What do you need help with?</h2>
            </div>
            <Link to="/experts">
              View all experts <ArrowRight size={17} />
            </Link>
          </div>
          <div className="category-grid">
            {(categories.length
              ? categories.slice(0, 8)
              : fallbackCategories
            ).map((category, index) => (
              <Link
                className="category-card"
                to={`/experts?categoryId=${category.id}`}
                key={category.id}
              >
                <span>{categoryIcons[index]}</span>
                <h3>{category.name}</h3>
                <p>
                  {category.description ||
                    "Find a specialist who fits your need."}
                </p>
                <ArrowRight size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="container">
          <div className="section-heading centered">
            <div>
              <div className="eyebrow">Two simple paths</div>
              <h2>Book a service or open the brief.</h2>
              <p>
                Use the workflow that fits the problem. The same account can
                hire and offer expertise.
              </p>
            </div>
          </div>
          <div className="path-grid">
            <article className="path-card path-blue">
              <Search size={34} />
              <div className="path-number">01</div>
              <h3>Browse expert services</h3>
              <p>
                Search expert profiles, compare optional credentials, choose a published service, and
                request an available time.
              </p>
              <Link to="/experts">
                Browse experts <ArrowRight />
              </Link>
            </article>
            <article className="path-card path-light">
              <BriefcaseBusiness size={34} />
              <div className="path-number">02</div>
              <h3>Post a job or request</h3>
              <p>
                Share your brief and budget. Experts can apply, and you
                decide who to work with.
              </p>
              <Link to="/jobs/new">
                Create a brief <ArrowRight />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section feature-strip">
        <div className="container feature-grid">
          <article>
            <BadgeCheck />
            <h3>Reviewed profiles</h3>
            <p>Experts submit documents before they can publish or apply.</p>
          </article>
          <article>
            <CalendarCheck />
            <h3>Real availability</h3>
            <p>
              Book only inside an expert's schedule, with conflicts checked
              server-side.
            </p>
          </article>
          <article>
            <CreditCard />
            <h3>Clear checkout</h3>
            <p>Fees and expert commission are captured with every booking.</p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-inner">
          <div>
            <div className="eyebrow light">Start with one clear need</div>
            <h2>Someone knows how to help.</h2>
            <p>Explore expert services or invite the right people to apply.</p>
          </div>
          <div>
            <Link className={buttonClass("secondary")} to="/register">
              Create your account
            </Link>
            <Link className="text-link-light" to="/jobs">
              See open jobs <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

const fallbackCategories: Category[] = [
  {
    id: 1,
    name: "Design & Creative",
    slug: "design",
    description: "Brand, product, and creative direction.",
    isActive: true,
  },
  {
    id: 2,
    name: "Health & Wellness",
    slug: "health",
    description: "Find guidance for personal and family needs.",
    isActive: true,
  },
  {
    id: 3,
    name: "Technology",
    slug: "technology",
    description: "Software, systems, and technical support.",
    isActive: true,
  },
  {
    id: 4,
    name: "Legal",
    slug: "legal",
    description: "Specialized legal consultation and support.",
    isActive: true,
  },
]
