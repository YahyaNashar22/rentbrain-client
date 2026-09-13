import { useEffect, useState, type FormEvent } from "react"
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Star,
  UserRound,
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
  StatusBadge,
  Textarea,
  formatDate,
  formatMoney,
} from "../components/ui"
import { useAuth } from "../context/AuthContext"
import { EarningsDashboard } from "../components/EarningsDashboard"
import { api, assetUrl } from "../lib/api"
import type { Booking, Job, Notification } from "../lib/types"

export function DashboardPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    void Promise.all([
      api<Booking[]>("/bookings", { auth: true }),
      api<Job[]>("/jobs/mine/posted", { auth: true }),
      api<Notification[]>("/notifications", { auth: true }),
    ])
      .then(([bookingRows, jobRows, notices]) => {
        setBookings(bookingRows)
        setJobs(jobRows)
        setNotifications(notices)
      })
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <Loading label="Preparing your hub" />
  const nextBooking = bookings
    .filter(
      (booking) =>
        ["confirmed", "pending_payment"].includes(booking.status) &&
        new Date(booking.startsAt) > new Date(),
    )
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0]
  return (
    <>
      <PageHeader
        eyebrow="My hub"
        title={`Hello, ${user?.firstName}.`}
        description="A clear view of your bookings, jobs, and account activity."
        actions={
          <Link className="btn btn-primary" to="/jobs/new">
            Post a need
          </Link>
        }
      />
      <div className="stats-grid">
        <article>
          <CalendarDays />
          <span>
            {
              bookings.filter((item) =>
                ["confirmed", "pending_payment"].includes(item.status),
              ).length
            }
          </span>
          <p>Active bookings</p>
        </article>
        <article>
          <BriefcaseBusiness />
          <span>
            {
              jobs.filter((item) =>
                ["open", "in_progress"].includes(item.status),
              ).length
            }
          </span>
          <p>Active jobs</p>
        </article>
        <article>
          <Bell />
          <span>{notifications.filter((item) => !item.readAt).length}</span>
          <p>Unread updates</p>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="section-title">
            <h2>Next booking</h2>
            <Link to="/bookings">View all</Link>
          </div>
          {nextBooking ? (
            <article className="next-booking">
              <div className="date-block">
                <strong>{new Date(nextBooking.startsAt).getDate()}</strong>
                <span>
                  {new Date(nextBooking.startsAt).toLocaleString("en", {
                    month: "short",
                  })}
                </span>
              </div>
              <div>
                <StatusBadge value={nextBooking.status} />
                <h3>Service session</h3>
                <p>{formatDate(nextBooking.startsAt, true)}</p>
              </div>
            </article>
          ) : (
            <p className="muted">
              No upcoming bookings. <Link to="/experts">Find an expert</Link>.
            </p>
          )}
        </section>
        <section className="dashboard-section">
          <div className="section-title">
            <h2>Recent updates</h2>
            <Link to="/notifications">View all</Link>
          </div>
          {notifications.slice(0, 4).map((notice) => (
            <div className="notice-mini" key={notice.id}>
              <span className={!notice.readAt ? "unread-dot" : "read-dot"} />
              <div>
                <strong>{notice.title}</strong>
                <p>{notice.body}</p>
              </div>
            </div>
          ))}
          {!notifications.length && (
            <p className="muted">You are all caught up.</p>
          )}
        </section>
      </div>
      <section className="dashboard-section quick-actions">
        <h2>What would you like to do?</h2>
        <div>
          <Link to="/experts">
            <SearchGlyph /> Find an expert
          </Link>
          <Link to="/jobs/new">
            <BriefcaseBusiness /> Post a job
          </Link>
          <Link to="/expert/setup">
            <ShieldCheck /> Offer your expertise
          </Link>
          <Link to="/profile">
            <UserRound /> Update your profile
          </Link>
        </div>
      </section>
    </>
  )
}

function SearchGlyph() {
  return <span className="nav-glyph">?</span>
}

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<unknown>()
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [passwordError, setPasswordError] = useState<unknown>()
  const [passwordBusy, setPasswordBusy] = useState(false)
  if (!user) return null
  const update = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError(undefined)
    setMessage("")
    try {
      await api("/users/me", {
        method: "PATCH",
        auth: true,
        body: {
          firstName: String(data.get("firstName")),
          lastName: String(data.get("lastName")),
          phone: String(data.get("phone")) || null,
          country: String(data.get("country")) || null,
          city: String(data.get("city")) || null,
          timezone: String(data.get("timezone")),
          marketingOptIn: data.get("marketingOptIn") === "on",
        },
      })
      await refreshUser()
      setMessage("Profile saved.")
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError(undefined)
    try {
      await api("/uploads/avatar", { method: "POST", auth: true, body: data })
      await refreshUser()
      setMessage("Profile photo updated.")
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }
  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const newPassword = String(data.get("newPassword"))
    const confirmNewPassword = String(data.get("confirmNewPassword"))
    setPasswordError(undefined)
    if (newPassword !== confirmNewPassword) {
      setPasswordError(new Error("New passwords do not match"))
      return
    }
    setPasswordBusy(true)
    try {
      await api("/users/me/password", {
        method: "PATCH",
        auth: true,
        body: {
          currentPassword: String(data.get("currentPassword")),
          newPassword,
          confirmNewPassword,
        },
      })
      form.reset()
      await logout()
      navigate("/login", {
        replace: true,
        state: { passwordChanged: true },
      })
    } catch (caught) {
      setPasswordError(caught)
    } finally {
      setPasswordBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Account profile"
        title="Your personal details"
        description="These details help experts and clients know who they are working with."
      />
      <ErrorMessage error={error} />
      {message && <div className="alert alert-success">{message}</div>}
      <section className="content-card profile-photo-row">
        <Avatar
          src={assetUrl(user.avatarUrl)}
          name={`${user.firstName} ${user.lastName}`}
          size="large"
        />
        <form onSubmit={upload}>
          <Field label="Profile photo" hint="JPEG, PNG, or WebP. Maximum 5 MB.">
            <Input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </Field>
          <Button busy={busy} variant="secondary" type="submit">
            <Camera size={18} /> Upload photo
          </Button>
        </form>
      </section>
      <form className="content-card form-stack" onSubmit={update}>
        <div className="form-grid">
          <Field label="First name">
            <Input name="firstName" defaultValue={user.firstName} required />
          </Field>
          <Field label="Last name">
            <Input name="lastName" defaultValue={user.lastName} required />
          </Field>
        </div>
        <Field label="Email">
          <Input value={user.email} disabled />
          <small>Email changes require a separate verification workflow.</small>
        </Field>
        <div className="form-grid">
          <Field label="Phone">
            <Input
              name="phone"
              defaultValue={user.phone ?? ""}
              autoComplete="tel"
            />
          </Field>
          <Field label="Country code">
            <Input
              name="country"
              defaultValue={user.country ?? ""}
              maxLength={2}
              placeholder="LB"
            />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="City">
            <Input name="city" defaultValue={user.city ?? ""} />
          </Field>
          <Field label="Timezone">
            <Input name="timezone" defaultValue={user.timezone} required />
          </Field>
        </div>
        <label className="check-row">
          <input
            name="marketingOptIn"
            type="checkbox"
            defaultChecked={user.marketingOptIn}
          />
          <span>Send me occasional RentBrain product updates</span>
        </label>
        <Button busy={busy} type="submit">
          Save profile
        </Button>
      </form>
      <form className="content-card form-stack" onSubmit={changePassword}>
        <div className="section-title">
          <div>
            <h2>Change password</h2>
            <p>
              Confirm your current password before choosing a new one. You will
              need to sign in again, and other sessions will no longer be able
              to refresh.
            </p>
          </div>
          <KeyRound aria-hidden size={28} />
        </div>
        <ErrorMessage error={passwordError} />
        <Field label="Current password">
          <Input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
          />
        </Field>
        <div className="form-grid">
          <Field
            label="New password"
            hint="At least 10 characters with uppercase, lowercase, and a number."
          >
            <Input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              name="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
            />
          </Field>
        </div>
        <Button busy={passwordBusy} type="submit">
          Change password
        </Button>
      </form>
    </>
  )
}

type PaymentRecord = {
  payment: {
    id: string
    amount: string
    currency: string
    status: string
    refundedAmount: string
    provider: string
    checkoutUrl?: string | null
    failureReason?: string | null
    createdAt: string
  }
  booking?: Booking | null
  service?: { id: number; title: string } | null
  jobContract?: {
    id: string
    expertId: number
    subtotal: string
    commissionRate: string
    commissionAmount: string
    expertEarnings: string
    currency: string
    status: string
  } | null
  job?: Job | null
}

export function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<string>()
  const load = () =>
    Promise.all([
      api<Booking[]>("/bookings", { auth: true }),
      api<PaymentRecord[]>("/payments", { auth: true }),
    ])
      .then(([bookingRows, paymentRows]) => {
        setBookings(bookingRows)
        setPayments(paymentRows)
        setLoading(false)
      })
      .catch((caught) => {
        setError(caught)
        setLoading(false)
      })
  useEffect(() => {
    void load()
  }, [])
  const cancel = async (booking: Booking) => {
    const reason = window.prompt("Why are you cancelling this booking?")
    if (!reason) return
    try {
      await api(`/bookings/${booking.id}/cancel`, {
        method: "PATCH",
        auth: true,
        body: { reason },
      })
      await load()
    } catch (caught) {
      setError(caught)
    }
  }
  const outcome = async (booking: Booking, status: string) => {
    try {
      await api(`/bookings/${booking.id}/outcome`, {
        method: "PATCH",
        auth: true,
        body: { status },
      })
      await load()
    } catch (caught) {
      setError(caught)
    }
  }
  const review = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await api("/reviews", {
        method: "POST",
        auth: true,
        body: {
          bookingId: reviewing,
          rating: Number(data.get("rating")),
          comment: String(data.get("comment")) || undefined,
        },
      })
      setReviewing(undefined)
    } catch (caught) {
      setError(caught)
    }
  }
  if (loading) return <Loading label="Loading bookings" />
  return (
    <>
      <PageHeader
        eyebrow="Sessions & payments"
        title="Your bookings"
        description="Track upcoming sessions, outcomes, payments, and refunds."
      />
      <ErrorMessage error={error} />
      <EarningsDashboard />
      {bookings.length ? (
        <div className="booking-list">
          {bookings.map((booking) => {
            const isExpert = booking.expertId === user?.id
            const payment = payments.find(
              (item) => item.booking?.id === booking.id,
            )?.payment
            return (
              <article key={booking.id}>
                <div className="booking-time">
                  <CalendarDays />
                  <strong>{formatDate(booking.startsAt, true)}</strong>
                  <span>{booking.timezone}</span>
                </div>
                <div className="booking-info">
                  <StatusBadge value={booking.status} />
                  <h3>{isExpert ? "Expert session" : "Booked service"}</h3>
                  <p>
                    {isExpert
                      ? "You are providing this session."
                      : "You are the client for this session."}
                  </p>
                  <small>
                    {formatMoney(booking.total, booking.currency)}
                    {payment
                      ? ` · Payment ${payment.status.replace(/_/g, " ")}`
                      : ""}
                  </small>
                </div>
                <div className="inline-actions">
                  {["pending_payment", "confirmed"].includes(
                    booking.status,
                  ) && (
                    <Button
                      variant="danger"
                      onClick={() => void cancel(booking)}
                    >
                      Cancel
                    </Button>
                  )}
                  {isExpert &&
                    booking.status === "confirmed" &&
                    new Date(booking.startsAt) <= new Date() && (
                      <Button
                        onClick={() => void outcome(booking, "completed")}
                      >
                        Mark complete
                      </Button>
                    )}
                  {!isExpert && booking.status === "completed" && (
                    <Button
                      variant="secondary"
                      onClick={() => setReviewing(booking.id)}
                    >
                      <Star size={16} /> Review
                    </Button>
                  )}
                  {payment?.status === "succeeded" && !isExpert && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const reason = window.prompt(
                          "Explain why you are requesting a refund (10+ characters).",
                        )
                        if (reason)
                          void api(`/payments/${payment.id}/refunds`, {
                            method: "POST",
                            auth: true,
                            body: { reason },
                          })
                            .then(load)
                            .catch(setError)
                      }}
                    >
                      Request refund
                    </Button>
                  )}
                  {!isExpert && ["pending", "processing"].includes(payment?.status || "") && payment?.checkoutUrl && (
                    <a className="btn btn-primary" href={payment.checkoutUrl}>Pay with Whish</a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No bookings yet"
          body="Find a verified expert and request a time that works."
          action={
            <Link className="btn btn-primary" to="/experts">
              Find an expert
            </Link>
          }
        />
      )}
      {reviewing && (
        <form className="content-card form-stack review-form" onSubmit={review}>
          <h2>Leave a review</h2>
          <Field label="Rating">
            <Select name="rating" required>
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Very good</option>
              <option value="3">3 — Good</option>
              <option value="2">2 — Fair</option>
              <option value="1">1 — Poor</option>
            </Select>
          </Field>
          <Field label="Comment">
            <Textarea name="comment" rows={4} />
          </Field>
          <div className="inline-actions">
            <Button type="submit">Publish review</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReviewing(undefined)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </>
  )
}

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState(true)
  const load = () =>
    api<Notification[]>("/notifications", { auth: true })
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false))
  useEffect(() => {
    void load()
  }, [])
  const read = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH", auth: true })
      await load()
    } catch (caught) {
      setError(caught)
    }
  }
  if (loading) return <Loading label="Loading notifications" />
  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Important updates about bookings, jobs, payments, and verification."
      />
      <ErrorMessage error={error} />
      {items.length ? (
        <div className="notification-list">
          {items.map((item) => (
            <article className={!item.readAt ? "unread" : ""} key={item.id}>
              <div className="notification-icon">
                <Bell />
              </div>
              <div>
                <StatusBadge value={item.type.split(".").at(-1) || "update"} />
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <small>{formatDate(item.createdAt, true)}</small>
              </div>
              {!item.readAt && (
                <Button variant="ghost" onClick={() => void read(item.id)}>
                  Mark read
                </Button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notifications"
          body="Updates about your activity will appear here and be sent by email."
        />
      )}
    </>
  )
}

type LegalDocument = {
  id: string
  type: string
  title: string
  content: string
  version: string
  effectiveAt?: string | null
}

export function LegalPage() {
  const { type = "terms" } = useParams()
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    void api<LegalDocument[]>("/legal/current")
      .then(setDocuments)
      .catch(setError)
  }, [])
  const document = documents.find((item) => item.type === type)
  return (
    <div className="container narrow section">
      <PageHeader
        eyebrow="Legal"
        title={document?.title || titleForLegal(type)}
        description={
          document
            ? `Version ${document.version}${
                document.effectiveAt
                  ? ` · Effective ${formatDate(document.effectiveAt)}`
                  : ""
              }`
            : undefined
        }
      />
      <ErrorMessage error={error} />
      {!document && !error ? (
        <Loading label="Loading policy" />
      ) : document ? (
        <article className="legal-content pre-wrap">{document.content}</article>
      ) : (
        <div className="alert">
          This policy has not been published by an administrator yet.
        </div>
      )}
    </div>
  )
}

export function CheckoutPage() {
  const { paymentId } = useParams()
  const [searchParams] = useSearchParams()
  const [payment, setPayment] = useState<PaymentRecord["payment"]>()
  const [isJobPayment, setIsJobPayment] = useState(false)
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    let active = true
    let checks = 0
    let checking = false
    const check = async () => {
      if (checking) return
      checking = true
      try {
        if (paymentId) {
          await api(`/payments/${paymentId}/reconcile`, {
            method: "POST",
            auth: true,
          })
        }
        const rows = await api<PaymentRecord[]>("/payments", { auth: true })
        const found = rows.find((row) => row.payment.id === paymentId)
        if (!found) throw new Error("Payment not found")
        if (active) {
          setPayment(found.payment)
          setIsJobPayment(Boolean(found.jobContract))
          setError(undefined)
        }
      } catch (caught) {
        if (active) setError(caught)
      } finally {
        checking = false
      }
    }
    void check()
    const timer = window.setInterval(() => {
      checks += 1
      if (checks >= 6) window.clearInterval(timer)
      else void check()
    }, 5_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [paymentId])
  const redirectResult = searchParams.get("payment")
  const pending = payment && ["pending", "processing"].includes(payment.status)
  return (
    <div className="container narrow section">
      <PageHeader eyebrow="Checkout" title={isJobPayment ? "Secure your job payment" : "Complete your booking payment"} />
      <ErrorMessage error={error} />
      {!payment && !error ? (
        <Loading />
      ) : (
        payment && (
          <article className="checkout-card">
            <CreditCard />
            <StatusBadge value={payment.status} />
            <h2>{formatMoney(payment.amount, payment.currency)}</h2>
            {payment.status === "succeeded" && <div className="alert alert-success"><strong>Payment confirmed</strong><span>{isJobPayment ? "Your Whish payment was verified and the selected quotation is now in progress." : "Your Whish payment was verified and the booking is confirmed."}</span></div>}
            {pending && <div className="alert"><strong>{redirectResult === "failure" ? "Payment attempt unsuccessful" : "Waiting for payment"}</strong><span>{redirectResult === "failure" ? "The Whish payment link remains open, so you can retry with the same link." : "RentBrain is checking the payment directly with Whish. Your booking is confirmed only after verification."}</span></div>}
            {payment.status === "failed" && <div className="alert alert-error"><strong>Payment link expired</strong><span>{payment.failureReason || "The payment was not completed."}</span></div>}
            {payment.status === "refunded" && <div className="alert"><strong>Payment refunded</strong><span>The refund was completed externally and recorded by RentBrain administration.</span></div>}
            {pending && payment.checkoutUrl && <a className="btn btn-primary" href={payment.checkoutUrl}>Continue to Whish Pay</a>}
            <Link className="btn btn-secondary" to={isJobPayment ? "/jobs/manage" : "/bookings"}>
              {isJobPayment ? "Return to jobs" : "Return to bookings"}
            </Link>
          </article>
        )
      )}
    </div>
  )
}

export function ContactPage() {
  const [email, setEmail] = useState<string>();
  useEffect(() => {
    void api<Array<{ key: string; value: unknown }>>("/settings/public")
      .then((settings) => {
        const value = settings.find((item) => item.key === "support.email")?.value;
        if (typeof value === "string") setEmail(value);
      })
      .catch(() => undefined);
  }, []);
  return (
    <div className="container narrow section">
      <PageHeader
        eyebrow="Support"
        title="How can we help?"
        description="For account or booking support, include the relevant reference ID without sharing passwords or one-time codes."
      />
      <article className="content-card">
        <h2>Email support</h2>
        {email ? <><p>Include the relevant reference ID and the email on your account.</p><a className="btn btn-primary" href={`mailto:${email}`}>{email}</a></> : <div className="alert">The support mailbox has not been configured by an administrator yet.</div>}
      </article>
    </div>
  )
}

const titleForLegal = (type: string) =>
  ({
    terms: "Terms and Conditions",
    privacy: "Privacy Policy",
    cookie: "Cookie Policy",
    refund_cancellation: "Refund and Cancellation Policy",
  })[type] || "Policy"
