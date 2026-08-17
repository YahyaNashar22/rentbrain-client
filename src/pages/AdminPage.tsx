import { useEffect, useState, type ReactNode } from "react";
import {
  Banknote,
  BriefcaseBusiness,
  FileText,
  Gauge,
  ListChecks,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import {
  Button,
  EmptyState,
  ErrorMessage,
  Input,
  Loading,
  PageHeader,
  Select,
  StatusBadge,
  formatDate,
  formatMoney,
} from "../components/ui";
import { api, downloadApiFile } from "../lib/api";
import type { Job, Paged, User } from "../lib/types";
import {
  AuditPanel,
  FinancePanel,
  LegalPanel,
  SettingsPanel,
  TaxonomyPanel,
} from "./AdminOperationsPanels";

type AdminTab =
  | "overview"
  | "users"
  | "experts"
  | "jobs"
  | "finance"
  | "taxonomy"
  | "legal"
  | "settings"
  | "audit";

const tabs = [
  { key: "overview", label: "Overview", icon: Gauge },
  { key: "users", label: "Users", icon: Users },
  { key: "experts", label: "Experts", icon: ShieldCheck },
  { key: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { key: "finance", label: "Finance", icon: Banknote },
  { key: "taxonomy", label: "Categories", icon: Tags },
  { key: "legal", label: "Legal", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "audit", label: "Audit log", icon: ListChecks },
] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");
  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-title">
          <ShieldCheck />
          <div><strong>Admin console</strong><span>Restricted access</span></div>
        </div>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </aside>
      <div className="admin-content">
        <PageHeader
          eyebrow="RentBrain operations"
          title={tabs.find((item) => item.key === tab)?.label || "Admin"}
          description="Changes here affect the live marketplace and are recorded in the audit log."
        />
        <AdminPanel tab={tab} />
      </div>
    </div>
  );
}

function AdminPanel({ tab }: { tab: AdminTab }) {
  if (tab === "overview") return <OverviewPanel />;
  if (tab === "users") return <UsersPanel />;
  if (tab === "experts") return <ExpertsPanel />;
  if (tab === "jobs") return <JobsPanel />;
  if (tab === "finance") return <FinancePanel />;
  if (tab === "taxonomy") return <TaxonomyPanel />;
  if (tab === "legal") return <LegalPanel />;
  if (tab === "settings") return <SettingsPanel />;
  return <AuditPanel />;
}

function PanelState({ loading, error, children }: { loading: boolean; error: unknown; children: ReactNode }) {
  if (loading) return <Loading label="Loading administration data" />;
  return <><ErrorMessage error={error} />{children}</>;
}

type Report = {
  users: { total: number; active: number };
  experts: { total: number; verified: number };
  jobs: { total: number; open: number; applications: number };
  bookings: { total: number; completed: number };
  payments: { successfulPayments: number; grossVolume: string; refunded: string; commission: string };
};

function OverviewPanel() {
  const [data, setData] = useState<Report>();
  const [error, setError] = useState<unknown>();
  useEffect(() => { void api<Report>("/admin/reports/overview", { auth: true }).then(setData).catch(setError); }, []);
  return (
    <PanelState loading={!data && !error} error={error}>
      <div className="admin-metrics">
        {data && <>
          <Metric label="Registered users" value={data.users.total} note={`${data.users.active} active`} />
          <Metric label="Verified experts" value={data.experts.verified} note={`${data.experts.total} profiles`} />
          <Metric label="Open jobs" value={data.jobs.open} note={`${data.jobs.applications} applications`} />
          <Metric label="Completed bookings" value={data.bookings.completed} note={`${data.bookings.total} total`} />
          <Metric label="Gross payment volume" value={formatMoney(data.payments.grossVolume)} note={`${data.payments.successfulPayments} successful`} />
          <Metric label="Platform commission" value={formatMoney(data.payments.commission)} note={`${formatMoney(data.payments.refunded)} refunded`} />
        </>}
      </div>
      <div className="alert"><strong>Launch checklist</strong><span>Publish reviewed policies, set the approved commission, connect the selected payment provider, and configure Gmail before accepting live customers.</span></div>
    </PanelState>
  );
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <article><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function UsersPanel() {
  const [data, setData] = useState<Paged<User>>();
  const [error, setError] = useState<unknown>();
  const [search, setSearch] = useState("");
  const load = () => api<Paged<User>>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`, { auth: true }).then(setData).catch(setError);
  useEffect(() => { void load(); }, []);
  const updateStatus = async (user: User, status: "active" | "suspended" | "closed") => {
    const reason = window.prompt(`Reason for changing this user to ${status}:`);
    if (!reason || reason.length < 3) return;
    try {
      await api(`/admin/users/${user.id}/status`, { method: "PATCH", auth: true, body: { status, reason } });
      await load();
    } catch (caught) { setError(caught); }
  };
  return (
    <PanelState loading={!data && !error} error={error}>
      <form className="inline-search" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" />
        <Button type="submit">Search</Button>
      </form>
      {data?.items.length ? <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Verified</th><th>Action</th></tr></thead>
        <tbody>{data.items.map((user) => <tr key={user.id}>
          <td><strong>{user.firstName} {user.lastName}</strong><small>{user.email}</small></td>
          <td>{user.role}</td><td><StatusBadge value={user.status} /></td><td>{formatDate(user.emailVerifiedAt)}</td>
          <td>{user.status === "active" ? <Button variant="danger" onClick={() => void updateStatus(user, "suspended")}>Suspend</Button> : user.status === "suspended" ? <Button variant="secondary" onClick={() => void updateStatus(user, "active")}>Reactivate</Button> : "Closed"}</td>
        </tr>)}</tbody>
      </table></div> : <EmptyState title="No users found" body="Try another search." />}
    </PanelState>
  );
}

type ExpertRow = {
  profile: { userId: number; professionalTitle: string; verificationStatus: string; isPublished: boolean };
  user: { id: number; firstName: string; lastName: string; email: string };
};
type Verification = {
  profile: ExpertRow["profile"] & { verificationNote?: string | null };
  documents: Array<{ id: number; type: string; fileUrl: string; status: string; createdAt: string }>;
};

function ExpertsPanel() {
  const [rows, setRows] = useState<ExpertRow[]>();
  const [selected, setSelected] = useState<Verification>();
  const [error, setError] = useState<unknown>();
  const load = () => api<ExpertRow[]>("/admin/experts", { auth: true }).then(setRows).catch(setError);
  useEffect(() => { void load(); }, []);
  const inspect = async (id: number) => {
    try { setSelected(await api<Verification>(`/admin/experts/${id}/verification`, { auth: true })); }
    catch (caught) { setError(caught); }
  };
  const decide = async (status: "verified" | "rejected") => {
    if (!selected) return;
    const note = window.prompt(status === "verified" ? "Optional internal note:" : "Explain what the expert should correct:") ?? undefined;
    if (status === "rejected" && !note) return;
    try {
      await api(`/admin/experts/${selected.profile.userId}/verification`, { method: "PATCH", auth: true, body: { status, note } });
      setSelected(undefined); await load();
    } catch (caught) { setError(caught); }
  };
  return <PanelState loading={!rows && !error} error={error}><div className="admin-split">
    <div className="compact-list">{rows?.map(({ profile, user }) => <article key={user.id}><div>
      <StatusBadge value={profile.verificationStatus} /><h3>{user.firstName} {user.lastName}</h3><p>{profile.professionalTitle}</p><small>{user.email}</small>
    </div><Button variant="ghost" onClick={() => void inspect(user.id)}>Review</Button></article>)}</div>
    {selected && <aside className="admin-inspector"><div className="section-title"><h2>Verification review</h2><button className="text-button" onClick={() => setSelected(undefined)}>Close</button></div>
      <StatusBadge value={selected.profile.verificationStatus} /><h3>{selected.profile.professionalTitle}</h3>
      {selected.documents.map((document) => <div className="document-row" key={document.id}><div><strong>{document.type.replace(/_/g, " ")}</strong><small>{formatDate(document.createdAt)} · {document.status}</small></div><Button variant="ghost" onClick={() => void downloadApiFile(document.fileUrl, `expert-document-${document.id}`)}>Download</Button></div>)}
      {!selected.documents.length && <p>No documents submitted.</p>}
      <div className="inline-actions"><Button onClick={() => void decide("verified")}>Approve expert</Button><Button variant="danger" onClick={() => void decide("rejected")}>Reject</Button></div>
    </aside>}
  </div></PanelState>;
}

function JobsPanel() {
  const [jobs, setJobs] = useState<Job[]>();
  const [error, setError] = useState<unknown>();
  const load = () => api<Job[]>("/admin/jobs", { auth: true }).then(setJobs).catch(setError);
  useEffect(() => { void load(); }, []);
  const moderate = async (job: Job, status: "open" | "completed" | "cancelled" | "closed" | "moderated") => {
    const reason = window.prompt("Reason for this moderation action:");
    if (!reason || reason.length < 3) return;
    try { await api(`/admin/jobs/${job.id}/status`, { method: "PATCH", auth: true, body: { status, reason } }); await load(); }
    catch (caught) { setError(caught); }
  };
  return <PanelState loading={!jobs && !error} error={error}><div className="admin-table-wrap"><table className="admin-table">
    <thead><tr><th>Job</th><th>Status</th><th>Budget</th><th>Created</th><th>Moderation</th></tr></thead>
    <tbody>{jobs?.map((job) => <tr key={job.id}><td><strong>{job.title}</strong><small>{job.id}</small></td><td><StatusBadge value={job.status} /></td><td>{formatMoney(job.budgetMax || job.budgetMin, job.currency)}</td><td>{formatDate(job.createdAt)}</td><td><Select value={job.status} onChange={(event) => void moderate(job, event.target.value as Parameters<typeof moderate>[1])}><option value="open">Open</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="closed">Closed</option><option value="moderated">Moderated</option></Select></td></tr>)}</tbody>
  </table></div></PanelState>;
}
