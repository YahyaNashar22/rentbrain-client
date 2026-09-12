import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { ArrowLeft, CheckCircle2, KeyRound, MailCheck } from "lucide-react"
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import { Brand } from "../components/Layout"
import {
  Button,
  ErrorMessage,
  Field,
  Input,
  SuccessMessage,
} from "../components/ui"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"

function AuthFrame({
  title,
  eyebrow,
  children,
  footer,
}: {
  title: string
  eyebrow: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Brand inverse />
        <div>
          <div className="eyebrow light">All Experts. One App.</div>
          <h1>Useful expertise, without the usual friction.</h1>
          <p>
            One secure account for booking services, posting needs, and building
            an expert practice.
          </p>
        </div>
        <div className="auth-points">
          <span>
            <CheckCircle2 /> Verified marketplace profiles
          </span>
          <span>
            <CheckCircle2 /> Clear job and booking workflows
          </span>
          <span>
            <CheckCircle2 /> Private account sessions
          </span>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  if (user) return <Navigate to="/dashboard" replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const data = new FormData(event.currentTarget)
    try {
      await login(String(data.get("email")), String(data.get("password")))
      const destination =
        (location.state as { from?: string } | null)?.from ?? "/dashboard"
      navigate(destination, { replace: true })
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="Sign in to RentBrain"
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="form-stack" onSubmit={submit}>
        <ErrorMessage error={error} />
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <div className="form-meta form-meta-end">
          <Link to="/resend-verification">Resend verification email</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button busy={busy} type="submit">
          Sign in
        </Button>
      </form>
    </AuthFrame>
  )
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const [registeredEmail, setRegisteredEmail] = useState("")
  if (user) return <Navigate to="/dashboard" replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const data = new FormData(event.currentTarget)
    try {
      const email = String(data.get("email"))
      await register({
        firstName: String(data.get("firstName")),
        lastName: String(data.get("lastName")),
        email,
        password: String(data.get("password")),
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Beirut",
        acceptTerms: true,
        acceptPrivacy: true,
      })
      setRegisteredEmail(email)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Join the marketplace"
      title="Create your account"
      footer={
        <>
          Already registered? <Link to="/login">Sign in</Link>
        </>
      }
    >
      {registeredEmail ? (
        <div className="auth-success">
          <MailCheck />
          <h3>Check your inbox</h3>
          <p>We sent a verification link. Open it before signing in.</p>
          <p>Please check your spam or junk folder if you do not see it.</p>
          <div className="form-stack">
            <Link
              className="btn btn-secondary"
              to={`/resend-verification?email=${encodeURIComponent(registeredEmail)}`}
            >
              Resend verification email
            </Link>
            <Link className="btn btn-primary" to="/login">
              Go to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form className="form-stack" onSubmit={submit}>
          <ErrorMessage error={error} />
          <div className="form-grid">
            <Field label="First name">
              <Input name="firstName" autoComplete="given-name" required />
            </Field>
            <Field label="Last name">
              <Input name="lastName" autoComplete="family-name" required />
            </Field>
          </div>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field
            label="Password"
            hint="10+ characters with uppercase, lowercase, and a number."
          >
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </Field>
          <label className="check-row">
            <input type="checkbox" required />
            <span>
              I accept the{" "}
              <Link to="/legal/terms" target="_blank">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/legal/privacy" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <Button busy={busy} type="submit">
            Create account
          </Button>
        </form>
      )}
    </AuthFrame>
  )
}

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [state, setState] = useState<"working" | "done" | "error">("working")
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    const token = params.get("token")
    if (!token) {
      setError(new Error("This verification link is missing its token."))
      setState("error")
      return
    }
    void api("/auth/verify-email", { method: "POST", body: { token } })
      .then(() => setState("done"))
      .catch((caught) => {
        setError(caught)
        setState("error")
      })
  }, [params])
  return (
    <AuthFrame
      eyebrow="Email verification"
      title={
        state === "done" ? "Your email is verified" : "Verifying your email"
      }
    >
      {state === "working" && (
        <div className="loading-line">
          Checking your secure verification link…
        </div>
      )}
      {state === "done" && (
        <div className="auth-success">
          <MailCheck />
          <p>Your account is ready to use.</p>
          <Link className="btn btn-primary" to="/login">
            Sign in
          </Link>
        </div>
      )}
      {state === "error" && (
        <>
          <ErrorMessage error={error} />
          <Link className="btn btn-secondary" to="/login">
            Back to sign in
          </Link>
        </>
      )}
    </AuthFrame>
  )
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const email = String(new FormData(event.currentTarget).get("email"))
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } })
      navigate(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Reset your password"
      footer={
        <Link to="/login">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      }
    >
      <p className="form-intro">
        Enter your account email and we will send a six-digit code that expires
        in 10 minutes.
      </p>
      <form className="form-stack" onSubmit={submit}>
        <ErrorMessage error={error} />
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Button busy={busy} type="submit">
          Send reset code
        </Button>
      </form>
    </AuthFrame>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const [done, setDone] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const data = new FormData(event.currentTarget)
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: {
          email: String(data.get("email")),
          otp: String(data.get("otp")),
          password: String(data.get("password")),
        },
      })
      setDone(true)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthFrame eyebrow="Secure reset" title="Choose a new password">
      {done ? (
        <div className="auth-success">
          <KeyRound />
          <h3>Password updated</h3>
          <p>Your old sessions were revoked.</p>
          <Link className="btn btn-primary" to="/login">
            Sign in securely
          </Link>
        </div>
      ) : (
        <form className="form-stack" onSubmit={submit}>
          <ErrorMessage error={error} />
          <Field label="Email">
            <Input
              name="email"
              type="email"
              defaultValue={params.get("email") ?? ""}
              required
            />
          </Field>
          <Field label="Six-digit code">
            <Input
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </Field>
          <Field
            label="New password"
            hint="10+ characters with uppercase, lowercase, and a number."
          >
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </Field>
          <Button busy={busy} type="submit">
            Update password
          </Button>
        </form>
      )}
    </AuthFrame>
  )
}

export function ResendVerification() {
  const [params] = useSearchParams()
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      await api("/auth/resend-verification", {
        method: "POST",
        body: { email: String(new FormData(event.currentTarget).get("email")) },
      })
      setDone(true)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthFrame
      eyebrow="Email verification"
      title="Send a new verification link"
    >
      {done && (
        <SuccessMessage>
          If the account is eligible, a new link is on its way. Please check
          your spam or junk folder if you do not see it.
        </SuccessMessage>
      )}
      <form className="form-stack" onSubmit={submit}>
        <ErrorMessage error={error} />
        <Field label="Email">
          <Input
            name="email"
            type="email"
            defaultValue={params.get("email") ?? ""}
            required
          />
        </Field>
        <Button busy={busy} type="submit">
          {done ? "Send another link" : "Send link"}
        </Button>
      </form>
    </AuthFrame>
  )
}
