import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
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
  SuccessMessage,
  formatMoney,
} from "../components/ui"
import { useAuth } from "../context/AuthContext"
import { api, assetUrl, queryString } from "../lib/api"
import {
  buildAvailableSlots,
  type AvailabilityCalendar,
} from "../lib/availability"
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
        sort: String(data.get("sort")),
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
            <option value="1">1+ stars</option>
            <option value="2">2+ stars</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </Select>
        </Field>
        <Field label="Sort by">
          <Select name="sort" defaultValue={params.get("sort") ?? "rating"}>
            <option value="rating">Highest rated</option>
            <option value="reviews">Most reviewed</option>
            <option value="experience">Most experienced</option>
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
  sourceType: "booking" | "job_contract"
  workTitle: string
  client: { firstName: string; lastName: string }
}
type ReviewEligibility = {
  sourceId: string
  sourceType: "booking" | "job_contract"
  title: string
  completedAt?: string | null
}
export function ExpertDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [expert, setExpert] = useState<Expert | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility[]>([])
  const [reviewError, setReviewError] = useState<unknown>()
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [selected, setSelected] = useState<Service | null>(null)
  const [calendar, setCalendar] = useState<AvailabilityCalendar>()
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)
  const bookingIdempotencyKey = useRef(crypto.randomUUID())

  useEffect(() => {
    // Pad the UTC query range so the expert's current local date is included
    // even when the client and expert are on opposite sides of midnight.
    const from = new Date(Date.now() - 86_400_000)
    const to = new Date(Date.now() + 31 * 86_400_000)
    void Promise.all([
      api<Expert>(`/marketplace/experts/${id}`),
      api<Review[]>(`/reviews/experts/${id}`),
      api<AvailabilityCalendar>(
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

  useEffect(() => {
    if (!user || !id || user.id === Number(id)) {
      setReviewEligibility([])
      return
    }
    void api<ReviewEligibility[]>(`/reviews/experts/${id}/eligibility`, {
      auth: true,
    })
      .then(setReviewEligibility)
      .catch(setReviewError)
  }, [id, user])

  const availableSlots = useMemo(
    () =>
      selected
        ? buildAvailableSlots(calendar, selected.durationMinutes)
        : [],
    [calendar, selected],
  )
  const slotsByDate = useMemo(() => {
    const groups = new Map<string, typeof availableSlots>()
    for (const slot of availableSlots) {
      const group = groups.get(slot.dateLabel) ?? []
      group.push(slot)
      groups.set(slot.dateLabel, group)
    }
    return [...groups.entries()]
  }, [availableSlots])

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
          headers: { "Idempotency-Key": bookingIdempotencyKey.current },
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
      if (!result.payment.checkoutUrl) {
        navigate("/bookings")
      } else {
        const checkoutUrl = new URL(
          result.payment.checkoutUrl,
          window.location.origin,
        )
        if (checkoutUrl.origin === window.location.origin) {
          navigate(`${checkoutUrl.pathname}${checkoutUrl.search}`)
        } else {
          window.location.assign(checkoutUrl.toString())
        }
      }
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id) return
    const form = event.currentTarget
    const data = new FormData(form)
    const [sourceType, sourceId] = String(data.get("work")).split(":", 2)
    setReviewBusy(true)
    setReviewError(undefined)
    setReviewSuccess(false)
    try {
      await api("/reviews", {
        method: "POST",
        auth: true,
        body: {
          ...(sourceType === "booking"
            ? { bookingId: sourceId }
            : { jobContractId: sourceId }),
          rating: Number(data.get("rating")),
          comment: String(data.get("comment") || "") || undefined,
        },
      })
      const [profile, feedback, eligibility] = await Promise.all([
        api<Expert>(`/marketplace/experts/${id}`),
        api<Review[]>(`/reviews/experts/${id}`),
        api<ReviewEligibility[]>(`/reviews/experts/${id}/eligibility`, {
          auth: true,
        }),
      ])
      setExpert(profile)
      setReviews(feedback)
      setReviewEligibility(eligibility)
      setReviewSuccess(true)
      form.reset()
    } catch (caught) {
      setReviewError(caught)
    } finally {
      setReviewBusy(false)
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
              <p>Ratings below come from clients with completed work.</p>
            </div>
            <ErrorMessage error={reviewError} />
            {reviewSuccess && (
              <SuccessMessage>Your review is now public. Thank you.</SuccessMessage>
            )}
            {reviewEligibility.length > 0 && (
              <div className="review-form-card">
                <h3>Share your experience</h3>
                <p className="muted">
                  Select completed work, then leave one verified review for it.
                </p>
                <form className="form-stack" onSubmit={submitReview}>
                  <Field label="Completed work">
                    <Select name="work" required defaultValue="">
                      <option value="" disabled>Select completed work</option>
                      {reviewEligibility.map((item) => (
                        <option
                          key={`${item.sourceType}:${item.sourceId}`}
                          value={`${item.sourceType}:${item.sourceId}`}
                        >
                          {item.title} ({item.sourceType === "booking" ? "service" : "job"})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Rating">
                    <Select name="rating" required defaultValue="5">
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </Select>
                  </Field>
                  <Field label="Review">
                    <textarea
                      className="control"
                      name="comment"
                      maxLength={3000}
                      rows={4}
                      placeholder="Tell others about your experience…"
                    />
                  </Field>
                  <Button busy={reviewBusy} type="submit">Publish review</Button>
                </form>
              </div>
            )}
            {!user && (
              <p className="muted review-guidance">
                <Link to="/login" state={{ from: `/experts/${id}` }}>Sign in</Link>{" "}
                to review this expert after your service or job is completed.
              </p>
            )}
            {user && user.id !== expert.userId && !reviewEligibility.length && !reviewSuccess && (
              <p className="muted review-guidance">
                You can review this expert after they complete a service booking or paid job for you.
              </p>
            )}
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
                    <small className="review-work">Verified {review.sourceType === "booking" ? "service" : "job"}: {review.workTitle}</small>
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
                  <small>Shown in {calendar.rules[0]?.timezone}. Blocked dates and booked times are excluded below.</small>
                </div>
              ) : (
                <div className="alert">This expert has not published booking hours yet.</div>
              )}
              <Field label="Available date and time">
                <Select
                  key={selected.id}
                  name="startsAt"
                  disabled={!availableSlots.length}
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    {calendar
                      ? availableSlots.length
                        ? "Choose an available time"
                        : "No times available in the next 30 days"
                      : "Loading available times…"}
                  </option>
                  {slotsByDate.map(([dateLabel, slots]) => (
                    <optgroup key={dateLabel} label={dateLabel}>
                      {slots.map((slot) => (
                        <option key={slot.iso} value={slot.iso}>
                          {slot.timeLabel}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
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

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
