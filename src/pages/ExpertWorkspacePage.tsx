import { useEffect, useState, type FormEvent } from "react"
import {
  BadgeCheck,
  CalendarDays,
  FileCheck2,
  Plus,
  ShieldCheck,
  Store,
} from "lucide-react"
import {
  Button,
  ErrorMessage,
  Field,
  Input,
  Loading,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  formatMoney,
} from "../components/ui"
import { api, ApiError } from "../lib/api"
import type { Category, Expert, Service, Specialization } from "../lib/types"

type Tab = "profile" | "services" | "availability" | "verification"

export default function ExpertWorkspacePage() {
  const [profile, setProfile] = useState<Expert | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [tab, setTab] = useState<Tab>("profile")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [message, setMessage] = useState("")
  const load = async () => {
    setLoading(true)
    try {
      const [taxonomy, specialties] = await Promise.all([
        api<Category[]>("/marketplace/categories"),
        api<Specialization[]>("/marketplace/specializations"),
      ])
      setCategories(taxonomy)
      setSpecializations(specialties)
      try {
        setProfile(await api<Expert>("/marketplace/expert/me", { auth: true }))
      } catch (caught) {
        if (!(caught instanceof ApiError) || caught.status !== 404) throw caught
        setProfile(null)
      }
    } catch (caught) {
      setError(caught)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])
  if (loading) return <Loading label="Loading expert workspace" />
  const notify = (value: string) => {
    setMessage(value)
    setError(undefined)
  }
  return (
    <>
      <PageHeader
        eyebrow="Expert workspace"
        title={
          profile ? "Build your expert practice" : "Become a RentBrain expert"
        }
        description="Create your profile, verify your credentials, define services, and choose when clients can book."
        actions={
          profile && (
            <StatusBadge
              value={profile.verificationStatus || "not_submitted"}
            />
          )
        }
      />
      <ErrorMessage error={error} />
      {message && <div className="alert alert-success">{message}</div>}
      <nav className="tab-nav" aria-label="Expert settings">
        {([
          { key: "profile", icon: Store, label: "Profile" },
          { key: "verification", icon: ShieldCheck, label: "Verification" },
          { key: "services", icon: Plus, label: "Services" },
          { key: "availability", icon: CalendarDays, label: "Availability" },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => setTab(key)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>
      {tab === "profile" && (
        <ProfileForm
          profile={profile}
          specializations={specializations}
          onSaved={async (successMessage = "Expert profile saved.") => {
            await load()
            notify(successMessage)
          }}
          onError={setError}
        />
      )}
      {tab === "verification" && (
        <VerificationPanel
          profile={profile}
          onUploaded={async () => {
            await load()
            notify("Document uploaded securely and submitted for review.")
          }}
          onError={setError}
        />
      )}
      {tab === "services" && (
        <ServicesPanel
          profile={profile}
          categories={categories}
          specializations={specializations}
          onChanged={async () => {
            await load()
            notify("Services updated.")
          }}
          onError={setError}
        />
      )}
      {tab === "availability" && (
        <AvailabilityPanel
          profile={profile}
          onSaved={() => notify("Weekly availability saved.")}
          onError={setError}
        />
      )}
    </>
  )
}

function ProfileForm({
  profile,
  specializations,
  onSaved,
  onError,
}: {
  profile: Expert | null
  specializations: Specialization[]
  onSaved: (message?: string) => Promise<void>
  onError: (error: unknown) => void
}) {
  const [busy, setBusy] = useState(false)
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<number[]>(
    () => profile?.specializations?.map((item) => item.id) ?? [],
  )
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    onError(undefined)
    try {
      await api("/marketplace/expert/me", {
        method: "PUT",
        auth: true,
        body: {
          professionalTitle: String(data.get("professionalTitle")),
          biography: String(data.get("biography")),
          yearsExperience: Number(data.get("yearsExperience")),
          languages: String(data.get("languages"))
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          specializationIds: selectedSpecializationIds,
          isPublished: data.get("isPublished") === "on",
        },
      })
      await onSaved("Expert profile saved.")
    } catch (caught) {
      onError(caught)
    } finally {
      setBusy(false)
    }
  }
  const blockDate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    onError(undefined)
    try {
      await api("/marketplace/expert/me/availability/overrides", {
        method: "POST",
        auth: true,
        body: {
          date: String(data.get("date")),
          isAvailable: false,
          note: String(data.get("note")) || undefined,
        },
      })
      form.reset()
      await onSaved("Date blocked successfully.")
    } catch (caught) {
      onError(caught)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
    <form className="content-card form-stack" onSubmit={submit}>
      <h2>Public expert profile</h2>
      <Field label="Professional title">
        <Input
          name="professionalTitle"
          defaultValue={profile?.professionalTitle ?? ""}
          minLength={3}
          placeholder="Pediatrician, UX designer, legal consultant…"
          required
        />
      </Field>
      <Field
        label="Biography"
        hint="Tell clients who you help, how you work, and your relevant experience."
      >
        <Textarea
          name="biography"
          defaultValue={profile?.biography ?? ""}
          minLength={30}
          rows={8}
          required
        />
      </Field>
      <div className="form-grid">
        <Field label="Years of experience">
          <Input
            name="yearsExperience"
            type="number"
            min="0"
            max="80"
            defaultValue={profile?.yearsExperience ?? 0}
            required
          />
        </Field>
        <Field label="Languages" hint="Comma separated">
          <Input
            name="languages"
            defaultValue={profile?.languages.join(", ") ?? "English, Arabic"}
          />
        </Field>
      </div>
      <div className="field">
        <div className="specialization-heading">
          <span>Specializations</span>
          <strong>
            {selectedSpecializationIds.length} selected
          </strong>
        </div>
        {specializations.length ? (
          <div className="specialization-picker">
            {specializations.map((item) => {
              const selected = selectedSpecializationIds.includes(item.id)
              return (
              <label
                className={`check-row${selected ? " selected" : ""}`}
                key={item.id}
              >
                <input
                  name="specializationIds"
                  type="checkbox"
                  value={item.id}
                  checked={selected}
                  onChange={() =>
                    setSelectedSpecializationIds((current) =>
                      current.includes(item.id)
                        ? current.filter((id) => id !== item.id)
                        : [...current, item.id],
                    )
                  }
                />
                <strong>{item.name}</strong>
              </label>
              )
            })}
          </div>
        ) : (
          <div className="alert">
            No specializations are configured yet. An administrator can add
            them from Admin console → Categories.
          </div>
        )}
        <small>
          Click one or more options. Click a selected option again to remove it.
          Choose every option that accurately describes your expertise.
          Specializations are managed centrally by RentBrain administrators.
        </small>
      </div>
      {profile?.verificationStatus === "verified" ? (
        <label className="check-row">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={profile.isPublished}
          />
          <span>Publish my profile in expert search</span>
        </label>
      ) : (
        <div className="alert">
          <ShieldCheck size={18} />
          <span>
            Your profile can be published after administrator verification.
          </span>
        </div>
      )}
      <Button busy={busy} type="submit">
        Save expert profile
      </Button>
    </form>
    <form className="content-card form-stack" onSubmit={blockDate}>
      <h2>Block a date</h2>
      <p>Add an exception for a holiday, personal day, or another unavailable date.</p>
      <div className="form-grid">
        <Field label="Date"><Input name="date" type="date" min={new Date().toISOString().slice(0, 10)} required /></Field>
        <Field label="Optional note"><Input name="note" maxLength={255} placeholder="Personal day" /></Field>
      </div>
      <Button busy={busy} variant="secondary" type="submit">Block this date</Button>
    </form>
    </>
  )
}

function VerificationPanel({
  profile,
  onUploaded,
  onError,
}: {
  profile: Expert | null
  onUploaded: () => Promise<void>
  onError: (error: unknown) => void
}) {
  const [busy, setBusy] = useState(false)
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    onError(undefined)
    try {
      await api("/uploads/expert-document", {
        method: "POST",
        auth: true,
        body: data,
      })
      form.reset()
      await onUploaded()
    } catch (caught) {
      onError(caught)
    } finally {
      setBusy(false)
    }
  }
  if (!profile)
    return (
      <div className="empty-state">
        <FileCheck2 />
        <h2>Create your profile first</h2>
        <p>
          We need your professional details before accepting verification
          documents.
        </p>
      </div>
    )
  return (
    <div className="content-card verification-panel">
      <div>
        <StatusBadge value={profile.verificationStatus || "not_submitted"} />
        <h2>Expert verification</h2>
        <p>
          Upload evidence relevant to the services you plan to offer. Files are
          private and accessible only to you and administrators.
        </p>
        {profile.verificationStatus === "verified" && (
          <div className="alert alert-success">
            <BadgeCheck /> Your profile is verified.
          </div>
        )}
      </div>
      <form className="form-stack" onSubmit={upload}>
        <Field label="Document type">
          <Select name="type">
            <option value="professional_license">Professional license</option>
            <option value="identity_document">Identity document</option>
            <option value="degree_or_certificate">Degree or certificate</option>
            <option value="portfolio_evidence">Portfolio evidence</option>
          </Select>
        </Field>
        <Field label="Choose file" hint="PDF, JPEG, or PNG. Maximum 10 MB.">
          <Input
            name="file"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            required
          />
        </Field>
        <Button busy={busy} type="submit">
          Upload securely
        </Button>
      </form>
    </div>
  )
}

function ServicesPanel({
  profile,
  categories,
  specializations,
  onChanged,
  onError,
}: {
  profile: Expert | null
  categories: Category[]
  specializations: Specialization[]
  onChanged: () => Promise<void>
  onError: (error: unknown) => void
}) {
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [categoryId, setCategoryId] = useState(0)
  if (!profile)
    return (
      <div className="empty-state">
        <Store />
        <h2>Create your expert profile first</h2>
        <p>Your services belong to your expert profile.</p>
      </div>
    )
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    onError(undefined)
    try {
      await api("/marketplace/expert/me/services", {
        method: "POST",
        auth: true,
        body: {
          categoryId: Number(data.get("categoryId")),
          specializationId: Number(data.get("specializationId")) || null,
          title: String(data.get("title")),
          description: String(data.get("description")),
          durationMinutes: Number(data.get("durationMinutes")),
          price: Number(data.get("price")),
          currency: "USD",
          deliveryMode: String(data.get("deliveryMode")),
          status:
            profile.verificationStatus === "verified"
              ? String(data.get("status"))
              : "draft",
        },
      })
      setShowForm(false)
      await onChanged()
    } catch (caught) {
      onError(caught)
    } finally {
      setBusy(false)
    }
  }
  const archive = async (service: Service) => {
    try {
      await api(`/marketplace/expert/me/services/${service.id}`, {
        method: "DELETE",
        auth: true,
      })
      await onChanged()
    } catch (caught) {
      onError(caught)
    }
  }
  const togglePublication = async (service: Service) => {
    const status = service.status === "published" ? "paused" : "published"
    try {
      await api(`/marketplace/expert/me/services/${service.id}`, {
        method: "PATCH",
        auth: true,
        body: { status },
      })
      await onChanged()
    } catch (caught) {
      onError(caught)
    }
  }
  return (
    <>
      <div className="section-title">
        <div>
          <h2>Your services</h2>
          <p>
            Keep each offer focused, priced clearly, and easy to understand.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          <Plus size={18} /> Add service
        </Button>
      </div>
      {showForm && (
        <form className="content-card form-stack" onSubmit={submit}>
          <div className="form-grid">
            <Field label="Category">
              <Select
                name="categoryId"
                value={categoryId || ""}
                onChange={(event) => setCategoryId(Number(event.target.value))}
                required
              >
                <option value="">Choose category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Specialization">
              <Select name="specializationId">
                <option value="">General</option>
                {specializations
                  .filter((item) => item.categoryId === categoryId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
          <Field label="Service title">
            <Input name="title" minLength={3} required />
          </Field>
          <Field label="Description">
            <Textarea name="description" minLength={20} rows={5} required />
          </Field>
          <div className="form-grid thirds">
            <Field label="Duration (minutes)">
              <Input
                name="durationMinutes"
                type="number"
                min="15"
                max="1440"
                defaultValue="60"
                required
              />
            </Field>
            <Field label="Price (USD)">
              <Input name="price" type="number" min="0" step="0.01" required />
            </Field>
            <Field label="Delivery">
              <Select name="deliveryMode">
                <option value="online">Online</option>
                <option value="in_person">In person</option>
                <option value="hybrid">Hybrid</option>
              </Select>
            </Field>
          </div>
          {profile.verificationStatus === "verified" && (
            <Field label="Listing status">
              <Select name="status">
                <option value="published">Publish now</option>
                <option value="draft">Save draft</option>
              </Select>
            </Field>
          )}
          <Button busy={busy} type="submit">
            Create service
          </Button>
        </form>
      )}
      {profile.services?.length ? (
        <div className="service-list">
          {profile.services.map((service) => (
            <article className="service-card" key={service.id}>
              <div>
                <StatusBadge value={service.status} />
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <div className="service-price">
                <strong>{formatMoney(service.price, service.currency)}</strong>
                <small>{service.durationMinutes} min</small>
                {profile.verificationStatus === "verified" &&
                  service.status !== "archived" && (
                    <Button
                      variant="secondary"
                      onClick={() => void togglePublication(service)}
                    >
                      {service.status === "published" ? "Pause" : "Publish"}
                    </Button>
                  )}
                {service.status !== "archived" && (
                  <Button
                    variant="danger"
                    onClick={() => void archive(service)}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No services created yet.</p>
      )}
    </>
  )
}

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
function AvailabilityPanel({
  profile,
  onSaved,
  onError,
}: {
  profile: Expert | null
  onSaved: () => void
  onError: (error: unknown) => void
}) {
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState([
    false,
    true,
    true,
    true,
    true,
    true,
    false,
  ])
  if (!profile)
    return (
      <div className="empty-state">
        <CalendarDays />
        <h2>Create your profile first</h2>
        <p>Availability is attached to your expert profile.</p>
      </div>
    )
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Beirut"
    const rules = weekdays.flatMap((_, weekday) =>
      enabled[weekday]
        ? [
            {
              weekday,
              startTime: String(data.get(`start-${weekday}`)),
              endTime: String(data.get(`end-${weekday}`)),
              timezone,
            },
          ]
        : [],
    )
    setBusy(true)
    onError(undefined)
    try {
      await api("/marketplace/expert/me/availability", {
        method: "PUT",
        auth: true,
        body: { rules },
      })
      onSaved()
    } catch (caught) {
      onError(caught)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="content-card form-stack" onSubmit={submit}>
      <h2>Weekly availability</h2>
      <p>
        Bookings are only accepted inside these hours. Times use your browser
        timezone.
      </p>
      <div className="availability-list">
        {weekdays.map((day, index) => (
          <div key={day}>
            <label className="check-row">
              <input
                type="checkbox"
                checked={enabled[index]}
                onChange={() =>
                  setEnabled((values) =>
                    values.map((value, dayIndex) =>
                      dayIndex === index ? !value : value,
                    ),
                  )
                }
              />
              <strong>{day}</strong>
            </label>
            <Input
              name={`start-${index}`}
              type="time"
              defaultValue="09:00"
              disabled={!enabled[index]}
              required={enabled[index]}
            />
            <span>to</span>
            <Input
              name={`end-${index}`}
              type="time"
              defaultValue="17:00"
              disabled={!enabled[index]}
              required={enabled[index]}
            />
          </div>
        ))}
      </div>
      <Button busy={busy} type="submit">
        Save availability
      </Button>
    </form>
  )
}
