import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Languages,
  MapPin,
  Search,
  Star,
  Video,
} from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  Avatar,
  Button,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  Loading,
  PageHeader,
  Select,
  formatMoney,
} from "../components/ui"
import { useAuth } from "../context/AuthContext"
import { api, assetUrl, queryString } from "../lib/api"
import type {
  Category,
  Expert,
  Paged,
  Service,
  Specialization,
} from "../lib/types"

export function ExpertsPage() {
  const [params, setParams] = useSearchParams()
  const [experts, setExperts] = useState<Paged<Expert> | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<unknown>()
  const query = params.toString()

  useEffect(() => {
    void Promise.all([
      api<Paged<Expert>>(`/marketplace/experts${query ? `?${query}` : ""}`),
      api<Category[]>("/marketplace/categories"),
    ])
      .then(([result, taxonomy]) => {
        setExperts(result)
        setCategories(taxonomy)
        setError(undefined)
      })
      .catch(setError)
  }, [query])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setParams(
      queryString({
        search: String(data.get("search")),
        categoryId: String(data.get("categoryId")),
        minRating: String(data.get("minRating")),
      }).slice(1),
    )
  }

  return (
    <div className="container section">
      <PageHeader
        eyebrow="Expert marketplace"
        title="Find the right mind for the moment."
        description="Search verified expert profiles and book a focused service."
      />
      <form className="search-panel" onSubmit={submit}>
        <Field label="What do you need?">
          <div className="input-icon">
            <Search size={19} />
            <Input
              name="search"
              defaultValue={params.get("search") ?? ""}
              placeholder="Designer, doctor, business coach…"
            />
          </div>
        </Field>
        <Field label="Category">
          <Select
            name="categoryId"
            defaultValue={params.get("categoryId") ?? ""}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Minimum rating">
          <Select name="minRating" defaultValue={params.get("minRating") ?? ""}>
            <option value="">Any rating</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </Select>
        </Field>
        <Button type="submit">Search</Button>
      </form>
      <ErrorMessage error={error} />
      {!experts && !error ? (
        <Loading label="Finding experts" />
      ) : experts?.items.length ? (
        <>
          <div className="results-meta">
            <strong>{experts.pagination.total}</strong> expert
            {experts.pagination.total === 1 ? "" : "s"} found
          </div>
          <div className="expert-grid">
            {experts.items.map((expert) => (
              <ExpertCard expert={expert} key={expert.userId} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No experts match yet"
          body="Try a broader search or remove a filter."
        />
      )}
    </div>
  )
}

function ExpertCard({ expert }: { expert: Expert }) {
  const name = `${expert.firstName} ${expert.lastName}`
  return (
    <article className="expert-card">
      <div className="expert-top">
        <Avatar src={assetUrl(expert.avatarUrl)} name={name} size="large" />
        <span className="verified-chip">
          <BadgeCheck size={16} /> Verified
        </span>
      </div>
      <h2>{name}</h2>
      <p className="expert-title">{expert.professionalTitle}</p>
      <div className="rating">
        <Star size={17} fill="currentColor" />{" "}
        {Number(expert.averageRating).toFixed(1)}{" "}
        <span>({expert.reviewCount})</span>
      </div>
      <p className="clamp-3">{expert.biography}</p>
      <div className="expert-meta">
        {(expert.city || expert.country) && (
          <span>
            <MapPin size={16} />{" "}
            {[expert.city, expert.country].filter(Boolean).join(", ")}
          </span>
        )}
        <span>
          <Languages size={16} />{" "}
          {expert.languages.slice(0, 2).join(", ") || "Language not listed"}
        </span>
      </div>
      <Link className="btn btn-secondary" to={`/experts/${expert.userId}`}>
        View profile
      </Link>
    </article>
  )
}

type Review = {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  client: { firstName: string; lastName: string }
}
type ExpertCalendar = {
  rules: Array<{ weekday: number; startTime: string; endTime: string; timezone: string }>
  overrides: Array<{ date: string; isAvailable: boolean }>
  busy: Array<{ startsAt: string; endsAt: string }>
}

export function ExpertDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [expert, setExpert] = useState<Expert | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [selected, setSelected] = useState<Service | null>(null)
  const [calendar, setCalendar] = useState<ExpertCalendar>()
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const from = new Date()
    const to = new Date(Date.now() + 30 * 86_400_000)
    void Promise.all([
      api<Expert>(`/marketplace/experts/${id}`),
      api<Review[]>(`/reviews/experts/${id}`),
      api<ExpertCalendar>(
        `/marketplace/experts/${id}/calendar${queryString({ from: from.toISOString(), to: to.toISOString() })}`,
      ),
    ])
      .then(([profile, feedback, availability]) => {
        setExpert(profile)
        setReviews(feedback)
        setCalendar(availability)
      })
      .catch(setError)
  }, [id])

  const book = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      navigate("/login", { state: { from: `/experts/${id}` } })
      return
    }
    if (!selected) return
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError(undefined)
    try {
      const result = await api<{ payment: { checkoutUrl?: string | null } }>(
        "/bookings",
        {
          method: "POST",
          auth: true,
          headers: { "Idempotency-Key": crypto.randomUUID() },
          body: {
            serviceId: selected.id,
            startsAt: new Date(String(data.get("startsAt"))).toISOString(),
            timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Beirut",
            meetingMethod: String(data.get("meetingMethod")),
            clientNotes: String(data.get("notes") || "") || undefined,
          },
        },
      )
      navigate(
        result.payment.checkoutUrl
          ? new URL(result.payment.checkoutUrl).pathname
          : "/bookings",
      )
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  if (!expert && !error)
    return (
      <div className="container section">
        <Loading label="Loading expert profile" />
      </div>
    )
  if (!expert)
    return (
      <div className="container section">
        <ErrorMessage error={error} />
      </div>
    )
  const name = `${expert.firstName} ${expert.lastName}`
  return (
    <div className="container section">
      <div className="profile-hero">
        <Avatar src={assetUrl(expert.avatarUrl)} name={name} size="large" />
        <div>
          <div className="verified-chip">
            <BadgeCheck size={16} /> Verified expert
          </div>
          <h1>{name}</h1>
          <h2>{expert.professionalTitle}</h2>
          <div className="profile-facts">
            <span>
              <Star size={17} fill="currentColor" />{" "}
              {Number(expert.averageRating).toFixed(1)} ({expert.reviewCount})
            </span>
            <span>
              <MapPin size={17} />{" "}
              {[expert.city, expert.country].filter(Boolean).join(", ") ||
                "Remote"}
            </span>
            <span>{expert.completedBookings} completed sessions</span>
          </div>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="content-card">
            <h2>About</h2>
            <p className="pre-wrap">{expert.biography}</p>
            <div className="tag-row">
              {expert.languages.map((language) => (
                <span className="tag" key={language}>
                  {language}
                </span>
              ))}
              {expert.specializations?.map((item) => (
                <span className="tag tag-blue" key={item.id}>
                  {item.name}
                </span>
              ))}
            </div>
          </section>
          <section>
            <div className="section-title">
              <h2>Services</h2>
              <p>Choose a service to request a time.</p>
            </div>
            <div className="service-list">
              {expert.services?.map((service) => (
                <article
                  className={
                    selected?.id === service.id
                      ? "service-card selected"
                      : "service-card"
                  }
                  key={service.id}
                >
                  <div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <div className="service-meta">
                      <span>
                        <Clock3 size={16} /> {service.durationMinutes} min
                      </span>
                      <span>
                        <Video size={16} />{" "}
                        {service.deliveryMode.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <div className="service-price">
                    <strong>
                      {formatMoney(service.price, service.currency)}
                    </strong>
                    <Button
                      variant="secondary"
                      onClick={() => setSelected(service)}
                    >
                      Choose
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section>
            <div className="section-title">
              <h2>Client reviews</h2>
            </div>
            {reviews.length ? (
              <div className="review-list">
                {reviews.map((review) => (
                  <article className="review-card" key={review.id}>
                    <div className="rating">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={15}
                          fill={index < review.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    <p>{review.comment || "Rating only"}</p>
                    <small>
                      {review.client.firstName} {review.client.lastName}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">No reviews yet.</p>
            )}
          </section>
        </div>
        <aside className="booking-panel">
          <div className="eyebrow">Request a session</div>
          <h2>{selected ? selected.title : "Choose a service"}</h2>
          {selected ? (
            <form className="form-stack" onSubmit={book}>
              <ErrorMessage error={error} />
              {calendar?.rules.length ? (
                <div className="schedule-list">
                  <strong>Typical weekly hours</strong>
                  {calendar.rules.map((rule, index) => (
                    <span key={`${rule.weekday}-${index}`}>
                      {weekdayNames[rule.weekday]} · {rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)}
                    </span>
                  ))}
                  <small>Shown in {calendar.rules[0]?.timezone}. Blocked dates and existing bookings are checked at checkout.</small>
                </div>
              ) : (
                <div className="alert">This expert has not published booking hours yet.</div>
              )}
              <Field label="Preferred date and time">
                <Input
                  name="startsAt"
                  type="datetime-local"
                  min={minimumLocalDate()}
                  required
                />
              </Field>
              <Field label="Meeting method">
                <Select name="meetingMethod">
                  <option value="video">Video call</option>
                  <option value="phone">Phone call</option>
                  <option value="in_person">In person</option>
                </Select>
              </Field>
              <Field label="Notes for the expert">
                <textarea
                  className="control"
                  name="notes"
                  rows={3}
                  placeholder="Share useful context…"
                />
              </Field>
              <div className="booking-total">
                <span>Total before any configured client fee</span>
                <strong>
                  {formatMoney(selected.price, selected.currency)}
                </strong>
              </div>
              <Button busy={busy} type="submit">
                <CalendarDays size={18} /> Continue to checkout
              </Button>
              <small>
                Availability and pricing are verified by the server before
                checkout.
              </small>
            </form>
          ) : (
            <p>Select one of the expert's published services to continue.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

const minimumLocalDate = () => {
  const date = new Date(Date.now() + 10 * 60_000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
