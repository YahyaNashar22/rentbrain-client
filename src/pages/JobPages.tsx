import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  MapPin,
  Search,
  UsersRound,
} from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
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
import { api, queryString } from "../lib/api"
import type {
  Application,
  Category,
  Job,
  Paged,
  Specialization,
} from "../lib/types"

type JobResult = {
  job: Job
  client: { id: number; firstName: string; lastName: string }
}

export function JobsPage() {
  const [params, setParams] = useSearchParams()
  const [result, setResult] = useState<Paged<JobResult> | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<unknown>()
  const query = params.toString()
  useEffect(() => {
    void Promise.all([
      api<Paged<JobResult>>(`/jobs${query ? `?${query}` : ""}`),
      api<Category[]>("/marketplace/categories"),
    ])
      .then(([jobs, taxonomy]) => {
        setResult(jobs)
        setCategories(taxonomy)
        setError(undefined)
      })
      .catch(setError)
  }, [query])
  const filter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setParams(
      queryString({
        search: String(data.get("search")),
        categoryId: String(data.get("categoryId")),
        remote: String(data.get("remote")),
      }).slice(1),
    )
  }
  return (
    <div className="container section">
      <PageHeader
        eyebrow="Open opportunities"
        title="Solve a problem. Take on the work."
        description="Browse requests from people and organizations looking for the right expertise."
        actions={
          <Link className="btn btn-primary" to="/jobs/new">
            Post a job
          </Link>
        }
      />
      <form className="search-panel jobs-search" onSubmit={filter}>
        <Field label="Search jobs">
          <div className="input-icon">
            <Search size={19} />
            <Input
              name="search"
              defaultValue={params.get("search") ?? ""}
              placeholder="What kind of work?"
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
        <Field label="Location">
          <Select name="remote" defaultValue={params.get("remote") ?? ""}>
            <option value="">Any location</option>
            <option value="true">Remote</option>
            <option value="false">Local / in person</option>
          </Select>
        </Field>
        <Button type="submit">Filter</Button>
      </form>
      <ErrorMessage error={error} />
      {!result && !error ? (
        <Loading label="Loading opportunities" />
      ) : result?.items.length ? (
        <div className="jobs-list">
          {result.items.map(({ job, client }) => (
            <JobCard job={job} client={client} key={job.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No open jobs found"
          body="Change the filters or be the first to post a need."
          action={
            <Link className="btn btn-primary" to="/jobs/new">
              Post a job
            </Link>
          }
        />
      )}
    </div>
  )
}

function JobCard({ job, client }: JobResult) {
  return (
    <article className="job-card">
      <div className="job-card-main">
        <div className="job-topline">
          <StatusBadge value={job.isRemote ? "remote" : "local"} />
          <span>{formatDate(job.createdAt)}</span>
        </div>
        <h2>
          <Link to={`/jobs/${job.id}`}>{job.title}</Link>
        </h2>
        <p className="clamp-2">{job.description}</p>
        <div className="tag-row">
          {job.requiredSkills.slice(0, 5).map((skill) => (
            <span className="tag" key={skill}>
              {skill}
            </span>
          ))}
        </div>
        <div className="job-meta">
          <span>
            <BriefcaseBusiness size={16} /> Posted by {client.firstName}{" "}
            {client.lastName}
          </span>
          <span>
            <MapPin size={16} />{" "}
            {job.isRemote ? "Remote" : job.location || "Location flexible"}
          </span>
          {job.applicationDeadline && (
            <span>
              <CalendarClock size={16} /> Apply by{" "}
              {formatDate(job.applicationDeadline)}
            </span>
          )}
        </div>
      </div>
      <div className="job-budget">
        <small>Budget</small>
        <strong>{budgetLabel(job)}</strong>
        <Link to={`/jobs/${job.id}`}>
          View brief <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  )
}

export function JobDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => {
    void api<Job>(`/jobs/${id}`, { auth: Boolean(user) })
      .then(setJob)
      .catch(setError)
  }, [id, user])
  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      navigate("/login", { state: { from: `/jobs/${id}` } })
      return
    }
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError(undefined)
    try {
      await api(`/jobs/${id}/applications`, {
        method: "POST",
        auth: true,
        body: {
          coverLetter: String(data.get("coverLetter")),
          proposedAmount: Number(data.get("proposedAmount")),
          currency: job?.currency || "USD",
          estimatedDurationDays: Number(data.get("estimatedDurationDays")),
        },
      })
      setDone(true)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }
  if (!job && !error)
    return (
      <div className="container section">
        <Loading label="Loading job" />
      </div>
    )
  if (!job)
    return (
      <div className="container section">
        <ErrorMessage error={error} />
      </div>
    )
  const isOwner = user?.id === job.clientId
  return (
    <div className="container section">
      <div className="job-detail-head">
        <div>
          <StatusBadge value={job.status} />
          <h1>{job.title}</h1>
          <div className="job-meta">
            <span>
              <MapPin size={17} />{" "}
              {job.isRemote ? "Remote" : job.location || "Flexible"}
            </span>
            <span>
              <CalendarClock size={17} /> Posted {formatDate(job.createdAt)}
            </span>
          </div>
        </div>
        <div className="job-detail-budget">
          <small>Proposed budget</small>
          <strong>{budgetLabel(job)}</strong>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="content-card">
            <h2>The brief</h2>
            <p className="pre-wrap">{job.description}</p>
          </section>
          <section className="content-card">
            <h2>Skills requested</h2>
            <div className="tag-row">
              {job.requiredSkills.length ? (
                job.requiredSkills.map((skill) => (
                  <span className="tag tag-blue" key={skill}>
                    {skill}
                  </span>
                ))
              ) : (
                <span className="muted">No specific skills listed.</span>
              )}
            </div>
          </section>
        </div>
        <aside className="booking-panel">
          <div className="eyebrow">Apply to help</div>
          {isOwner ? (
            <>
              <h2>This is your job</h2>
              <p>
                Review and manage incoming applications from your workspace.
              </p>
              <Link className="btn btn-primary" to="/jobs/manage">
                Manage applications
              </Link>
            </>
          ) : done ? (
            <div className="auth-success">
              <UsersRound />
              <h2>Application sent</h2>
              <p>
                The job owner has been notified. You can track your status in
                your workspace.
              </p>
              <Link className="btn btn-secondary" to="/jobs/manage">
                View my applications
              </Link>
            </div>
          ) : (
            <form className="form-stack" onSubmit={apply}>
              <ErrorMessage error={error} />
              <Field label="Your approach">
                <Textarea
                  name="coverLetter"
                  minLength={30}
                  rows={6}
                  placeholder="Explain how you would help and why you are a good fit…"
                  required
                />
              </Field>
              <Field label={`Proposed amount (${job.currency})`}>
                <Input
                  name="proposedAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </Field>
              <Field label="Estimated duration (days)">
                <Input
                  name="estimatedDurationDays"
                  type="number"
                  min="1"
                  max="3650"
                  required
                />
              </Field>
              <Button busy={busy} type="submit">
                Submit application
              </Button>
              <small>A verified expert profile is required to apply.</small>
            </form>
          )}
        </aside>
      </div>
    </div>
  )
}

export function NewJobPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [categoryId, setCategoryId] = useState(0)
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void api<Category[]>("/marketplace/categories")
      .then(setCategories)
      .catch(setError)
  }, [])
  useEffect(() => {
    setSpecializations([])
    if (categoryId)
      void api<Specialization[]>(
        `/marketplace/specializations?categoryId=${categoryId}`,
      ).then(setSpecializations)
  }, [categoryId])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError(undefined)
    try {
      const deadline = String(data.get("applicationDeadline"))
      const job = await api<Job>("/jobs", {
        method: "POST",
        auth: true,
        body: {
          categoryId: Number(data.get("categoryId")),
          specializationId: Number(data.get("specializationId")) || null,
          title: String(data.get("title")),
          description: String(data.get("description")),
          budgetMin: numberOrNull(data.get("budgetMin")),
          budgetMax: numberOrNull(data.get("budgetMax")),
          currency: "USD",
          location: String(data.get("location")) || null,
          isRemote: data.get("isRemote") === "on",
          requiredSkills: String(data.get("skills"))
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          applicationDeadline: deadline
            ? new Date(deadline).toISOString()
            : null,
          status: String(data.get("status")),
        },
      })
      navigate(job.status === "open" ? `/jobs/${job.id}` : "/jobs/manage")
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="container narrow section">
      <PageHeader
        eyebrow="Create a brief"
        title="What do you need done?"
        description="Give experts enough detail to understand the outcome, constraints, and budget."
      />
      <form className="content-card form-stack" onSubmit={submit}>
        <ErrorMessage error={error} />
        <Field label="Job title">
          <Input
            name="title"
            minLength={5}
            maxLength={180}
            placeholder="e.g. Review our mobile checkout UX"
            required
          />
        </Field>
        <div className="form-grid">
          <Field label="Category">
            <Select
              name="categoryId"
              value={categoryId || ""}
              onChange={(event) => setCategoryId(Number(event.target.value))}
              required
            >
              <option value="">Choose category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Specialization">
            <Select name="specializationId">
              <option value="">Any specialization</option>
              {specializations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Detailed brief"
          hint="At least 30 characters. Include the desired outcome and useful context."
        >
          <Textarea name="description" minLength={30} rows={8} required />
        </Field>
        <div className="form-grid">
          <Field label="Minimum budget (USD)">
            <Input name="budgetMin" type="number" min="0" step="0.01" />
          </Field>
          <Field label="Maximum budget (USD)">
            <Input name="budgetMax" type="number" min="0" step="0.01" />
          </Field>
        </div>
        <Field label="Required skills" hint="Separate skills with commas.">
          <Input name="skills" placeholder="UX research, Figma, prototyping" />
        </Field>
        <div className="form-grid">
          <Field label="Location">
            <Input name="location" placeholder="Beirut, Lebanon" />
          </Field>
          <Field label="Application deadline">
            <Input
              name="applicationDeadline"
              type="datetime-local"
              min={minimumLocalDate()}
            />
          </Field>
        </div>
        <label className="check-row">
          <input name="isRemote" type="checkbox" />
          <span>This work can be done remotely</span>
        </label>
        <Field label="Publish">
          <Select name="status">
            <option value="open">Open for applications now</option>
            <option value="draft">Save as draft</option>
          </Select>
        </Field>
        <div className="form-actions">
          <Link className="btn btn-ghost" to="/jobs">
            Cancel
          </Link>
          <Button busy={busy} type="submit">
            Save job
          </Button>
        </div>
      </form>
    </div>
  )
}

type OwnedApplication = {
  application: Application
  expert: {
    id: number
    firstName: string
    lastName: string
    title: string
    rating: string
  }
}
type MyApplication = { application: Application; job: Job }
type JobPayment = {
  payment: { id: string; amount: string; currency: string; status: string; checkoutUrl?: string | null }
  job?: Job | null
}

export function ManageJobsPage() {
  const navigate = useNavigate()
  const [posted, setPosted] = useState<Job[]>([])
  const [mine, setMine] = useState<MyApplication[]>([])
  const [selectedJob, setSelectedJob] = useState<string>()
  const [applications, setApplications] = useState<OwnedApplication[]>([])
  const [jobPayments, setJobPayments] = useState<JobPayment[]>([])
  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState(true)
  const acceptanceKeys = useRef(new Map<string, string>())
  const load = () =>
    Promise.all([
      api<Job[]>("/jobs/mine/posted", { auth: true }),
      api<MyApplication[]>("/jobs/mine/applications", { auth: true }),
      api<JobPayment[]>("/payments", { auth: true }),
    ])
      .then(([jobs, applied, paymentRows]) => {
        setPosted(jobs)
        setMine(applied)
        setJobPayments(paymentRows.filter((row) => row.job))
        setLoading(false)
      })
      .catch((caught) => {
        setError(caught)
        setLoading(false)
      })
  useEffect(() => {
    void load()
  }, [])
  const showApplications = async (jobId: string) => {
    setSelectedJob(jobId)
    try {
      setApplications(
        await api<OwnedApplication[]>(`/jobs/${jobId}/applications`, {
          auth: true,
        }),
      )
    } catch (caught) {
      setError(caught)
    }
  }
  const decide = async (
    jobId: string,
    application: Application,
    decision: "accepted" | "rejected",
  ) => {
    if (
      decision === "accepted" &&
      !window.confirm(
        `Accept this ${formatMoney(application.proposedAmount, application.currency)} quotation and continue to secure payment? The job starts only after payment is confirmed.`,
      )
    ) return
    try {
      const key = acceptanceKeys.current.get(application.id) ?? crypto.randomUUID()
      acceptanceKeys.current.set(application.id, key)
      const result = await api<{
        payment?: { id: string; checkoutUrl?: string | null } | null
      }>(`/jobs/${jobId}/applications/${application.id}`, {
        method: "PATCH",
        auth: true,
        headers: { "Idempotency-Key": key },
        body: { decision },
      })
      if (decision === "accepted" && result.payment) {
        acceptanceKeys.current.delete(application.id)
        if (result.payment.checkoutUrl) {
          const checkoutUrl = new URL(result.payment.checkoutUrl, window.location.origin)
          if (checkoutUrl.origin === window.location.origin) {
            navigate(`${checkoutUrl.pathname}${checkoutUrl.search}`)
          } else {
            window.location.assign(checkoutUrl.toString())
          }
          return
        }
        navigate(`/checkout/${result.payment.id}`)
        return
      }
      await showApplications(jobId)
      await load()
    } catch (caught) {
      setError(caught)
    }
  }
  const status = async (
    jobId: string,
    value: "completed" | "cancelled" | "closed",
  ) => {
    try {
      await api(`/jobs/${jobId}/status`, {
        method: "PATCH",
        auth: true,
        body: { status: value },
      })
      await load()
    } catch (caught) {
      setError(caught)
    }
  }
  const publish = async (jobId: string) => {
    try {
      await api(`/jobs/${jobId}`, {
        method: "PATCH",
        auth: true,
        body: { status: "open" },
      })
      await load()
    } catch (caught) {
      setError(caught)
    }
  }
  if (loading) return <Loading label="Loading your jobs" />
  return (
    <>
      <PageHeader
        eyebrow="Jobs & applications"
        title="Manage the work"
        description="Track briefs you posted and opportunities you applied to."
        actions={
          <Link className="btn btn-primary" to="/jobs/new">
            Post a job
          </Link>
        }
      />
      <ErrorMessage error={error} />
      <section className="dashboard-section">
        <h2>Jobs you posted</h2>
        {posted.length ? (
          <div className="compact-list">
            {posted.map((job) => (
              <article key={job.id}>
                <div>
                  <StatusBadge value={job.status} />
                  <h3>{job.title}</h3>
                  <p>{budgetLabel(job)}</p>
                </div>
                <div className="inline-actions">
                  {job.status === "draft" && (
                    <Button onClick={() => void publish(job.id)}>Publish</Button>
                  )}
                  {job.status === "pending_payment" && (() => {
                    const payment = jobPayments.find((row) => row.job?.id === job.id)?.payment
                    return payment?.checkoutUrl ? (
                      <><StatusBadge value={payment.status} /><a className="btn btn-primary" href={payment.checkoutUrl}>Pay {formatMoney(payment.amount, payment.currency)}</a></>
                    ) : <small>Preparing payment…</small>
                  })()}
                  {["open", "pending_payment", "in_progress"].includes(job.status) && (
                    <Button
                      variant="ghost"
                      onClick={() => void showApplications(job.id)}
                    >
                      Applications
                    </Button>
                  )}
                  {job.status === "in_progress" && (
                    <Button
                      variant="secondary"
                      onClick={() => void status(job.id, "completed")}
                    >
                      Mark complete
                    </Button>
                  )}
                  {["pending_payment", "in_progress"].includes(job.status) && (
                    <Button
                      variant="danger"
                      onClick={() => void status(job.id, "cancelled")}
                    >
                      Cancel job
                    </Button>
                  )}
                  {job.status === "open" && (
                    <Button
                      variant="danger"
                      onClick={() => void status(job.id, "closed")}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No jobs posted"
            body="Post a brief when you need someone to help."
          />
        )}
      </section>
      {selectedJob && (
        <section className="dashboard-section inset">
          <div className="section-title">
            <h2>Applications</h2>
            <button
              className="text-button"
              onClick={() => setSelectedJob(undefined)}
            >
              Close
            </button>
          </div>
          {applications.length ? (
            <div className="application-list">
              {applications.map(({ application, expert }) => (
                <article key={application.id}>
                  <div>
                    <StatusBadge value={application.status} />
                    <h3>
                      {expert.firstName} {expert.lastName}
                    </h3>
                    <strong>{expert.title}</strong>
                    <p>{application.coverLetter}</p>
                    <small>
                      {formatMoney(
                        application.proposedAmount,
                        application.currency,
                      )}{" "}
                      · {application.estimatedDurationDays} days
                    </small>
                  </div>
                  {application.status === "pending" && (
                    <div className="inline-actions">
                      <Button
                        onClick={() =>
                          void decide(
                            application.jobId,
                            application,
                            "accepted",
                          )
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() =>
                          void decide(
                            application.jobId,
                            application,
                            "rejected",
                          )
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No applications yet.</p>
          )}
        </section>
      )}
      <section className="dashboard-section">
        <h2>Your applications</h2>
        {mine.length ? (
          <div className="compact-list">
            {mine.map(({ application, job }) => (
              <article key={application.id}>
                <div>
                  <StatusBadge value={application.status} />
                  <h3>
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  <p>
                    {formatMoney(
                      application.proposedAmount,
                      application.currency,
                    )}{" "}
                    · {application.estimatedDurationDays} days
                  </p>
                </div>
                {application.status === "pending" && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      void api(
                        `/jobs/applications/${application.id}/withdraw`,
                        { method: "PATCH", auth: true },
                      )
                        .then(load)
                        .catch(setError)
                    }
                  >
                    Withdraw
                  </Button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">You have not applied to any jobs.</p>
        )}
      </section>
    </>
  )
}

const budgetLabel = (job: Job) =>
  job.budgetMin && job.budgetMax
    ? `${formatMoney(job.budgetMin, job.currency)} – ${formatMoney(job.budgetMax, job.currency)}`
    : formatMoney(job.budgetMax || job.budgetMin, job.currency)
const numberOrNull = (value: FormDataEntryValue | null) =>
  value === null || value === "" ? null : Number(value)
const minimumLocalDate = () => {
  const date = new Date(Date.now() + 10 * 60_000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
