import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"
import { AlertCircle, LoaderCircle } from "lucide-react"

export const buttonClass = (
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
) => `btn btn-${variant}`

export function Button({
  children,
  variant = "primary",
  busy,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  busy?: boolean
}) {
  return (
    <button
      className={buttonClass(variant)}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? (
        <LoaderCircle aria-hidden className="spin" size={18} />
      ) : (
        children
      )}
    </button>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="control" {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="control" {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="control" {...props} />
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function StatusBadge({ value }: { value: string }) {
  const safe = value.toLowerCase().replace(/_/g, " ")
  return <span className={`status status-${value.toLowerCase()}`}>{safe}</span>
}

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div className="alert alert-error" role="alert">
      <AlertCircle aria-hidden size={19} />
      <span>{error instanceof Error ? error.message : String(error)}</span>
    </div>
  )
}

export function SuccessMessage({ children }: { children: ReactNode }) {
  return <div className="alert alert-success">{children}</div>
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle aria-hidden className="spin" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-mark">RB</div>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  )
}

export function Avatar({
  src,
  name,
  size = "medium",
}: {
  src?: string
  name: string
  size?: "small" | "medium" | "large"
}) {
  return src ? (
    <img
      className={`avatar avatar-${size}`}
      src={src}
      alt={`${name}'s avatar`}
    />
  ) : (
    <span className={`avatar avatar-fallback avatar-${size}`} aria-label={name}>
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()}
    </span>
  )
}

export const formatMoney = (
  amount?: string | number | null,
  currency = "USD",
) =>
  amount == null
    ? "Flexible"
    : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
        Number(amount),
      )

export const formatDate = (date?: string | Date | null, includeTime = false) =>
  date
    ? new Intl.DateTimeFormat(
        "en-LB",
        includeTime
          ? { dateStyle: "medium", timeStyle: "short" }
          : { dateStyle: "medium" },
      ).format(new Date(date))
    : "—"
