import { useState } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────

const heroExperts = [
  {
    name: 'Dr. Sarah Chen',
    specialty: 'AI & Machine Learning',
    rating: 4.97,
    rate: '$180/hr',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&auto=format',
  },
  {
    name: 'James Reinholt',
    specialty: 'Investment Banking',
    rating: 4.92,
    rate: '$240/hr',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
  },
  {
    name: 'Priya Sharma',
    specialty: 'Brand Strategy',
    rating: 4.95,
    rate: '$150/hr',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&auto=format',
  },
]

const stats = [
  { value: '12,400+', label: 'Verified Experts' },
  { value: '94,000+', label: 'Bookings Completed' },
  { value: '98.3%', label: 'Client Satisfaction' },
  { value: '140+', label: 'Countries Served' },
]

const categories = [
  { name: 'Technology', count: '2,840 experts', icon: '⚡', bg: '#EEF2FF' },
  { name: 'Finance', count: '1,920 experts', icon: '📈', bg: '#F0FDF4' },
  { name: 'Marketing', count: '1,640 experts', icon: '📣', bg: '#FFFBEB' },
  { name: 'Design', count: '980 experts', icon: '✏️', bg: '#FDF2F8' },
  { name: 'Legal', count: '760 experts', icon: '⚖️', bg: '#F5F3FF' },
  { name: 'Business', count: '3,100 experts', icon: '💼', bg: '#FFF7ED' },
]

const steps = [
  {
    num: '01',
    title: 'Search',
    desc: 'Browse 12,400+ verified experts by skill, availability, rating, and rate. Smart filters surface the right match in seconds.',
  },
  {
    num: '02',
    title: 'Book',
    desc: "Choose a slot from the expert's live calendar. Secure payment is collected upfront — no back-and-forth, no hidden fees.",
  },
  {
    num: '03',
    title: 'Meet',
    desc: 'Connect via our built-in HD video platform or async messaging. Get focused expertise on your schedule and your terms.',
  },
  {
    num: '04',
    title: 'Review',
    desc: 'Rate your session and share feedback. Your reviews help the community discover the very best practitioners in every field.',
  },
]

const featuredExperts = [
  {
    name: 'Dr. Sarah Chen',
    title: 'AI Research Scientist',
    specialty: 'Technology',
    rating: 4.97,
    reviews: 312,
    experience: '12 years',
    rate: '$180',
    tags: ['Machine Learning', 'Python', 'NLP'],
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=480&h=400&fit=crop&auto=format',
    available: true,
  },
  {
    name: 'Marcus Reinholt',
    title: 'Investment Strategist',
    specialty: 'Finance',
    rating: 4.92,
    reviews: 218,
    experience: '15 years',
    rate: '$240',
    tags: ['VC Funding', 'M&A', 'Valuation'],
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&h=400&fit=crop&auto=format',
    available: true,
  },
  {
    name: 'Priya Sharma',
    title: 'Brand Strategist',
    specialty: 'Marketing',
    rating: 4.95,
    reviews: 187,
    experience: '9 years',
    rate: '$150',
    tags: ['Brand Identity', 'GTM Strategy', 'Positioning'],
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=480&h=400&fit=crop&auto=format',
    available: false,
  },
]

const whyFeatures = [
  {
    title: 'Verified Experts',
    desc: 'Every expert passes a rigorous 5-step vetting process including credential checks, live assessment, and portfolio review. Only 8% of applicants are approved.',
    icon: 'shield',
  },
  {
    title: 'Secure Payments',
    desc: 'Funds are held in escrow and released only after you confirm satisfaction. Full refund guaranteed within 24 hours — no questions asked.',
    icon: 'lock',
  },
  {
    title: 'Fast Booking',
    desc: 'Book a session in under 60 seconds. Many experts offer same-day availability. Instant calendar sync eliminates all scheduling friction.',
    icon: 'bolt',
  },
  {
    title: 'Global Marketplace',
    desc: 'Access world-class expertise from 140+ countries. 24/7 coverage across every timezone, with built-in translation for 40+ languages.',
    icon: 'globe',
  },
]

const testimonials = [
  {
    quote: "I needed help navigating a Series A term sheet and found the right expert within an hour. The session saved us from a costly clause. Worth every penny.",
    author: 'Alex Thornton',
    role: 'Co-founder & CEO, Velox Labs',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&auto=format',
  },
  {
    quote: "As a freelance UX consultant, RentBrain tripled my monthly income in six months. The platform handles all admin so I can focus entirely on the work.",
    author: 'Lena Vogt',
    role: 'Senior UX Design Consultant',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&auto=format',
  },
  {
    quote: "We built our entire marketing stack using RentBrain experts — three specialists, four weeks, zero full-time hires. This is how modern startups should operate.",
    author: 'Daniel Osei',
    role: 'CEO, Faro Health',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format',
  },
]

const faqs = [
  {
    q: 'How are experts verified on RentBrain?',
    a: 'Every expert undergoes a multi-step verification: identity check, credential and license verification, portfolio review, and a live assessment with our quality team. Only the top 8% of applicants are approved to join the platform.',
  },
  {
    q: "What if I'm not satisfied with my session?",
    a: "We have a full satisfaction guarantee. If you're not happy with your consultation, report it within 24 hours and we'll issue a complete refund — no questions asked. Your investment is always protected.",
  },
  {
    q: 'Can I book an expert for a long-term project?',
    a: "Absolutely. Experts can be engaged for one-time consultations, weekly retainers, or multi-month project contracts. Use the 'Project' tab on any expert's profile to request a custom scope and fixed-price quote.",
  },
  {
    q: 'How does payment work?',
    a: 'Payment is collected upfront and held in escrow. Funds are released to the expert only after you confirm the session was completed to your satisfaction, ensuring your money is always protected.',
  },
  {
    q: 'How do I become an expert on RentBrain?',
    a: "Click 'Become an Expert' and complete the application. The review process takes 5–7 business days. You'll need professional credentials, a portfolio or case studies, and a short verification call with our team.",
  },
  {
    q: 'Is RentBrain available globally?',
    a: 'Yes. We support experts and clients in 140+ countries. Sessions happen via our built-in HD video platform, with on-demand interpretation available for 40+ languages.',
  },
]

const footerLinks: Record<string, string[]> = {
  Platform: ['Find an Expert', 'Become an Expert', 'How It Works', 'Pricing', 'Enterprise'],
  Categories: ['Technology', 'Finance', 'Marketing', 'Design', 'Legal', 'Business'],
  Company: ['About Us', 'Blog', 'Careers', 'Press', 'Contact'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'],
}

// ─── SVG Icons ────────────────────────────────────────────────────────────

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StarFilled({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="#F59E0B">
      <path d="M6 .5l1.545 3.13 3.455.502-2.5 2.436.59 3.437L6 8.25 2.91 9.505l.59-3.437L1 3.632l3.455-.502L6 .5z" />
    </svg>
  )
}

function StarEmpty({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="#E3E0D7">
      <path d="M6 .5l1.545 3.13 3.455.502-2.5 2.436.59 3.437L6 8.25 2.91 9.505l.59-3.437L1 3.632l3.455-.502L6 .5z" />
    </svg>
  )
}

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= Math.round(rating) ? <StarFilled key={s} size={size} /> : <StarEmpty key={s} size={size} />
      )}
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function getIcon(name: string) {
  if (name === 'shield') return <ShieldIcon />
  if (name === 'lock') return <LockIcon />
  if (name === 'bolt') return <BoltIcon />
  return <GlobeIcon />
}

// ─── Hero Illustration ───────────────────────────────────────────────────

const netNodes: [number, number, number][] = [
  [260, 260, 32],
  [260, 108, 15],
  [378, 164, 12],
  [416, 278, 18],
  [374, 392, 13],
  [260, 430, 12],
  [146, 392, 16],
  [104, 278, 13],
  [142, 164, 17],
  [316, 186, 8],
  [340, 316, 7],
  [204, 320, 8],
  [188, 200, 7],
]

const netLines: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8],
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1],
  [0, 9], [0, 10], [0, 11], [0, 12],
  [2, 9], [3, 10], [6, 11], [8, 12],
  [9, 12], [10, 11],
]

function HeroIllustration() {
  return (
    <svg viewBox="0 0 520 520" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="bgAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4F6EF7" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#4F6EF7" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="centerAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C94B08" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C94B08" stopOpacity="0" />
        </radialGradient>
        <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="260" cy="260" r="240" fill="url(#bgAura)" />
      <circle cx="260" cy="260" r="120" fill="url(#centerAura)" />

      <circle cx="260" cy="260" r="156" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 9" fill="none" />
      <circle cx="260" cy="260" r="210" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2 12" fill="none" />

      {netLines.map(([a, b], i) => (
        <line
          key={i}
          x1={netNodes[a][0]} y1={netNodes[a][1]}
          x2={netNodes[b][0]} y2={netNodes[b][1]}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      ))}

      {netNodes.slice(1).map(([cx, cy, r], i) => (
        <circle
          key={i + 1}
          cx={cx} cy={cy} r={r}
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
      ))}

      <circle cx="260" cy="260" r="52" fill="rgba(201,75,8,0.18)" />
      <circle cx="260" cy="260" r="32" fill="#C94B08" filter="url(#nodeGlow)" />
      <text
        x="260" y="260"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="12"
        fontWeight="700"
        fontFamily="'Outfit', sans-serif"
        letterSpacing="0.5"
      >
        RB
      </text>
    </svg>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="bg-ink sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-[11px] font-body tracking-wider">RB</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight font-body">RentBrain</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Find Experts', 'Categories', 'How It Works', 'Pricing'].map((link) => (
            <a key={link} href="#" className="text-white/60 hover:text-white text-sm font-medium font-body transition-colors">
              {link}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a href="#" className="hidden sm:block text-white/65 hover:text-white text-sm font-medium font-body transition-colors">
            Sign In
          </a>
          <a href="#" className="bg-brand hover:bg-brand-deep text-white text-sm font-semibold px-4 py-2 rounded-lg font-body transition-colors">
            Get Started
          </a>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="bg-ink overflow-hidden pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_480px] gap-8 xl:gap-12 items-center">

          {/* Left */}
          <div className="max-w-xl lg:max-w-none">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
              <span className="text-white/65 text-sm font-body">Trusted by 94,000+ professionals worldwide</span>
            </div>

            <h1
              className="font-display text-cream tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', lineHeight: '1.06' }}
            >
              Hire the expert<br />
              <em className="text-brand">your project</em><br />
              actually needs.
            </h1>

            <p className="text-white/55 text-lg xl:text-xl leading-relaxed mb-10 font-body max-w-[480px]">
              RentBrain connects you with 12,400 vetted professionals — technology, finance, law, marketing, design — for consultations and project-based work.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-12">
              <a
                href="#"
                className="bg-brand hover:bg-brand-deep text-white font-semibold px-8 py-3.5 rounded-xl text-base font-body transition-colors inline-flex items-center gap-2"
              >
                Find an Expert
                <ArrowRight />
              </a>
              <a
                href="#"
                className="text-white font-semibold px-8 py-3.5 rounded-xl text-base font-body transition-colors"
                style={{ border: '1.5px solid rgba(255,255,255,0.2)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                Become an Expert
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {heroExperts.map((e, i) => (
                  <img
                    key={i}
                    src={e.photo}
                    alt={e.name}
                    className="w-9 h-9 rounded-full object-cover bg-gray-700"
                    style={{ border: '2px solid #0A0F1E' }}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => <StarFilled key={s} size={13} />)}
                </div>
                <p className="text-white/40 text-sm font-body">4.9 avg. from 94K+ sessions</p>
              </div>
            </div>
          </div>

          {/* Right: illustration + floating cards */}
          <div className="hidden lg:block relative h-[520px]">
            <div className="absolute inset-0">
              <HeroIllustration />
            </div>

            {/* Card 1 — top right */}
            <div
              className="absolute top-6 right-0 bg-surface rounded-2xl p-3 flex items-center gap-3 w-64 z-10"
              style={{ transform: 'rotate(-1.5deg)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
            >
              <img src={heroExperts[0].photo} alt={heroExperts[0].name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink text-[13px] leading-tight truncate font-body">{heroExperts[0].name}</div>
                <div className="text-dim text-xs truncate font-body mt-0.5">{heroExperts[0].specialty}</div>
                <div className="flex items-center gap-1 mt-1">
                  <StarFilled size={10} />
                  <span className="text-ink text-xs font-semibold font-body">{heroExperts[0].rating}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right pl-2.5" style={{ borderLeft: '1px solid #E3E0D7' }}>
                <div className="text-ink font-bold text-sm font-body">{heroExperts[0].rate}</div>
                <div className="text-dim text-[10px] font-body">per hour</div>
              </div>
            </div>

            {/* Card 2 — mid left */}
            <div
              className="absolute -left-4 bg-surface rounded-2xl p-3 flex items-center gap-3 w-[244px] z-10"
              style={{ top: '38%', transform: 'rotate(1.5deg)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
            >
              <img src={heroExperts[1].photo} alt={heroExperts[1].name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink text-[13px] leading-tight truncate font-body">{heroExperts[1].name}</div>
                <div className="text-dim text-xs truncate font-body mt-0.5">{heroExperts[1].specialty}</div>
                <div className="flex items-center gap-1 mt-1">
                  <StarFilled size={10} />
                  <span className="text-ink text-xs font-semibold font-body">{heroExperts[1].rating}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right pl-2.5" style={{ borderLeft: '1px solid #E3E0D7' }}>
                <div className="text-ink font-bold text-sm font-body">{heroExperts[1].rate}</div>
                <div className="text-dim text-[10px] font-body">per hour</div>
              </div>
            </div>

            {/* Card 3 — bottom right: "Just booked" */}
            <div
              className="absolute bottom-10 right-6 bg-surface rounded-2xl px-4 py-3 w-[214px] z-10"
              style={{ transform: 'rotate(-0.5deg)', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[11px] text-dim font-medium font-body">Just booked · 2 min ago</span>
              </div>
              <div className="flex items-center gap-2.5">
                <img src={heroExperts[2].photo} alt={heroExperts[2].name} className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                <div>
                  <div className="text-ink text-[12px] font-semibold font-body leading-tight">{heroExperts[2].name}</div>
                  <div className="text-dim text-[11px] font-body">{heroExperts[2].specialty}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────

function Stats() {
  return (
    <section className="bg-surface" style={{ borderBottom: '1px solid #E3E0D7' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-0 lg:divide-x lg:divide-rule">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center px-6">
              <div className="font-display text-ink font-semibold leading-none mb-2" style={{ fontSize: '2.5rem' }}>
                {stat.value}
              </div>
              <div className="text-dim text-sm font-body">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Categories ───────────────────────────────────────────────────────────

function Categories() {
  return (
    <section className="bg-warm py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brand text-xs font-semibold tracking-widest uppercase font-body mb-3">Browse Categories</p>
            <h2 className="font-display text-ink leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
              Find expertise<br />across every field
            </h2>
          </div>
          <a href="#" className="hidden sm:inline-flex items-center gap-2 text-ink font-semibold text-sm font-body hover:text-brand transition-colors">
            View all categories <ArrowRight />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className="group bg-surface rounded-2xl p-5 hover:shadow-lg transition-all hover:-translate-y-0.5"
              style={{ border: '1px solid rgba(227,224,215,0.6)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: cat.bg }}
              >
                {cat.icon}
              </div>
              <div className="font-semibold text-ink text-sm font-body mb-1 group-hover:text-brand transition-colors">
                {cat.name}
              </div>
              <div className="text-dim text-xs font-body">{cat.count}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="bg-surface py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-brand text-xs font-semibold tracking-widest uppercase font-body mb-3">How It Works</p>
          <h2 className="font-display text-ink leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
            From search to session<br />in four steps
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-[25px] left-[14%] right-[14%] h-px bg-rule" />

          {steps.map((step, i) => (
            <div key={step.num} className="relative text-center">
              <div
                className={`relative mx-auto w-[52px] h-[52px] rounded-full flex items-center justify-center font-display font-semibold text-base z-10 mb-6 ${
                  i === 0
                    ? 'bg-brand text-white'
                    : 'bg-warm text-ink'
                }`}
                style={i !== 0 ? { border: '1px solid #E3E0D7' } : {}}
              >
                {step.num}
              </div>
              <h3 className="font-display text-ink font-semibold text-xl mb-3">{step.title}</h3>
              <p className="text-dim text-sm leading-relaxed font-body">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Featured Experts ─────────────────────────────────────────────────────

function FeaturedExperts() {
  return (
    <section className="bg-warm py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brand text-xs font-semibold tracking-widest uppercase font-body mb-3">Featured Experts</p>
            <h2 className="font-display text-ink leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
              Work with the<br />very best
            </h2>
          </div>
          <a href="#" className="hidden sm:inline-flex items-center gap-2 text-ink font-semibold text-sm font-body hover:text-brand transition-colors">
            Browse all experts <ArrowRight />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featuredExperts.map((expert) => (
            <div
              key={expert.name}
              className="bg-surface rounded-2xl overflow-hidden hover:shadow-xl transition-all group"
              style={{ border: '1px solid rgba(227,224,215,0.6)' }}
            >
              <div className="relative h-52 bg-gray-100 overflow-hidden">
                <img
                  src={expert.photo}
                  alt={expert.name}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div
                  className={`absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full font-body ${
                    expert.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {expert.available ? '● Available' : '○ Booked'}
                </div>
                <div className="absolute bottom-3 left-3 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full font-body" style={{ background: 'rgba(10,15,30,0.75)', backdropFilter: 'blur(4px)' }}>
                  {expert.specialty}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-ink font-semibold text-[1.1rem] leading-tight">{expert.name}</h3>
                    <p className="text-dim text-sm font-body mt-0.5">{expert.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0 pl-3">
                    <div className="text-ink font-bold text-base font-body">
                      {expert.rate}<span className="text-dim text-xs font-normal">/hr</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={expert.rating} size={11} />
                    <span className="text-ink text-xs font-semibold font-body">{expert.rating}</span>
                    <span className="text-dim text-xs font-body">({expert.reviews})</span>
                  </div>
                  <div className="text-dim text-xs font-body">{expert.experience} exp.</div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {expert.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium px-2.5 py-1 bg-warm rounded-lg text-ink font-body">
                      {tag}
                    </span>
                  ))}
                </div>

                <a
                  href="#"
                  className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-ink-soft text-cream font-semibold text-sm py-3 rounded-xl transition-colors font-body"
                >
                  Book a Session <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Why Choose ───────────────────────────────────────────────────────────

function WhyChoose() {
  return (
    <section className="bg-ink py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-brand text-xs font-semibold tracking-widest uppercase font-body mb-4">Why RentBrain</p>
            <h2
              className="font-display text-cream leading-tight mb-6"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}
            >
              Built for professionals<br />who value their time.
            </h2>
            <p className="text-white/50 text-base leading-relaxed font-body mb-8 max-w-md">
              We built RentBrain because wasted hours on bad-fit consultants cost real money. Every feature exists to help you get the right expertise, reliably, every time.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-semibold px-7 py-3.5 rounded-xl font-body text-sm transition-colors"
            >
              Find an Expert Today <ArrowRight size={14} />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {whyFeatures.map((feat) => (
              <div
                key={feat.title}
                className="rounded-2xl p-6 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-brand" style={{ background: 'rgba(201,75,8,0.18)' }}>
                  {getIcon(feat.icon)}
                </div>
                <h3 className="font-display text-cream font-semibold text-base mb-2">{feat.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed font-body">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="bg-surface py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-brand text-xs font-semibold tracking-widest uppercase font-body mb-3">Testimonials</p>
          <h2 className="font-display text-ink leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
            Trusted by thousands<br />of clients and experts
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="bg-warm rounded-2xl p-7 flex flex-col"
              style={{ border: '1px solid rgba(227,224,215,0.6)' }}
            >
              <div className="flex items-center gap-0.5 mb-5">
                {[1, 2, 3, 4, 5].map((s) => <StarFilled key={s} size={14} />)}
              </div>
              <blockquote className="text-ink text-[15px] leading-relaxed font-body flex-1 mb-6">
                "{t.quote}"
              </blockquote>
              <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid #E3E0D7' }}>
                <img
                  src={t.photo}
                  alt={t.author}
                  className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0"
                />
                <div>
                  <div className="text-ink font-semibold text-sm font-body">{t.author}</div>
                  <div className="text-dim text-xs font-body">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="bg-warm py-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-brand text-xs font-semibold tracking-widest uppercase font-body mb-3">FAQ</p>
          <h2 className="font-display text-ink leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
            Common questions
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-surface rounded-xl overflow-hidden" style={{ border: '1px solid rgba(227,224,215,0.7)' }}>
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-warm/60 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-semibold text-ink text-base font-body">{faq.q}</span>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-warm flex items-center justify-center transition-transform duration-200"
                  style={{ transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6h8" stroke="#0A0F1E" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6">
                  <p className="text-dim text-[15px] leading-relaxed font-body">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="bg-brand py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2
          className="font-display text-white leading-tight mb-4"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
        >
          Ready to get more done?
        </h2>
        <p className="text-white/70 text-lg leading-relaxed font-body mb-10 max-w-lg mx-auto">
          Join 94,000+ professionals who use RentBrain to find world-class expertise — on demand, on budget.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#"
            className="bg-white hover:bg-cream text-brand font-bold px-8 py-4 rounded-xl text-base font-body transition-colors inline-flex items-center gap-2"
          >
            Find an Expert <ArrowRight size={16} />
          </a>
          <a
            href="#"
            className="text-white font-semibold px-8 py-4 rounded-xl text-base font-body transition-colors"
            style={{ border: '2px solid rgba(255,255,255,0.3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            Become an Expert
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-ink pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-[10px] font-body tracking-wider">RB</span>
              </div>
              <span className="text-white font-semibold text-base tracking-tight font-body">RentBrain</span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed font-body mb-5" style={{ maxWidth: '180px' }}>
              The marketplace for on-demand professional expertise.
            </p>
            <div className="flex items-center gap-2.5">
              {[
                { label: 'X', title: 'X (Twitter)' },
                { label: 'in', title: 'LinkedIn' },
                { label: 'GH', title: 'GitHub' },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  title={s.title}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white text-xs font-medium font-body transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white text-[11px] font-semibold tracking-widest uppercase font-body mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-white/40 hover:text-white/75 text-sm font-body transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8">
          <p className="text-white/25 text-sm font-body">© 2025 RentBrain, Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-white/25 text-xs font-body">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="font-body bg-warm text-ink">
      <Nav />
      <Hero />
      <Stats />
      <Categories />
      <HowItWorks />
      <FeaturedExperts />
      <WhyChoose />
      <Testimonials />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  )
}
