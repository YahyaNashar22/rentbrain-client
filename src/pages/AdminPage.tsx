import { useEffect, useState, type ReactNode } from "react";
import {
  Banknote,
  BriefcaseBusiness,
  FileText,
  FileSpreadsheet,
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
import { exportDate, exportExcel } from "../lib/exportExcel";
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
          <Metric label="Expert profiles" value={data.experts.total} note={`${data.experts.verified} optionally verified`} />
          <Metric label="Open jobs" value={data.jobs.open} note={`${data.jobs.applications} applications`} />
          <Metric label="Completed bookings" value={data.bookings.completed} note={`${data.bookings.total} total`} />
          <Metric label="Successful payments" value={data.payments.successfulPayments} note="See Finance for totals by currency" />
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
  const [exporting, setExporting] = useState(false);
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
  const exportUsers = async () => {
    setExporting(true); setError(undefined);
    try {
      const allUsers: User[] = [];
      let page = 1;
      let total = 0;
      do {
        const query = new URLSearchParams({ page: String(page), limit: "100" });
        if (search.trim()) query.set("search", search.trim());
        const response = await api<Paged<User>>(`/admin/users?${query}`, { auth: true });
        allUsers.push(...response.items); total = response.pagination.total; page += 1;
      } while (allUsers.length < total);
      await exportExcel(`rentbrain-users-${new Date().toISOString().slice(0, 10)}.xlsx`, "Users", allUsers.map((user) => ({
        "User ID": user.id,
        "First name": user.firstName,
        "Last name": user.lastName,
        Email: user.email,
        Phone: user.phone || "",
        Role: user.role,
        Status: user.status,
        Country: user.country || "",
        City: user.city || "",
        "Email verified": exportDate(user.emailVerifiedAt),
        "Registered at": exportDate(user.createdAt),
        "Marketing opt-in": user.marketingOptIn,
      })));
    } catch (caught) { setError(caught); }
    finally { setExporting(false); }
  };
  return (
    <PanelState loading={!data && !error} error={error}>
      <form className="inline-search" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" />
        <Button type="submit">Search</Button>
        <Button busy={exporting} type="button" variant="secondary" onClick={() => void exportUsers()}><FileSpreadsheet size={17} /> Export Excel</Button>
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
  profile: { userId: number; professionalTitle: string; biography?: string; yearsExperience?: number; languages?: string[]; verificationStatus: string; isPublished: boolean; averageRating?: string; reviewCount?: number; createdAt?: string };
  user: { id: number; firstName: string; lastName: string; email: string; phone?: string | null; country?: string | null; city?: string | null; status?: string; createdAt?: string };
};
type Verification = {
  profile: ExpertRow["profile"] & { verificationNote?: string | null };
  documents: Array<{ id: number; type: string; fileUrl: string; status: string; createdAt: string }>;
};

type VerificationResponse = {
  profile: Verification["profile"] | Verification["profile"][];
  documents: Verification["documents"];
};

function ExpertsPanel() {
  const [rows, setRows] = useState<ExpertRow[]>();
  const [selected, setSelected] = useState<Verification>();
  const [error, setError] = useState<unknown>();
  const [exporting, setExporting] = useState(false);
  const load = () => api<ExpertRow[]>("/admin/experts", { auth: true }).then(setRows).catch(setError);
  useEffect(() => { void load(); }, []);
  const inspect = async (id: number) => {
    try {
      const response = await api<VerificationResponse>(`/admin/experts/${id}/verification`, { auth: true });
      const profile = Array.isArray(response.profile) ? response.profile[0] : response.profile;
      if (!profile) throw new Error("The expert verification profile is missing from the server response.");
      setSelected({ profile, documents: response.documents });
    }
    catch (caught) { setError(caught); }
  };
  const decide = async (status: "verified" | "rejected") => {
    if (!selected) return;
    if (!Number.isInteger(selected.profile.userId)) {
      setError(new Error("The expert identifier is missing. Close the review and reload the page."));
      return;
    }
    const note = window.prompt(status === "verified" ? "Optional internal note:" : "Explain what the expert should correct:") ?? undefined;
    if (status === "rejected" && !note) return;
    try {
      await api(`/admin/experts/${selected.profile.userId}/verification`, { method: "PATCH", auth: true, body: { status, note } });
      setSelected(undefined); await load();
    } catch (caught) { setError(caught); }
  };
  const exportExperts = async () => {
    if (!rows) return;
    setExporting(true); setError(undefined);
    try {
      await exportExcel(`rentbrain-experts-${new Date().toISOString().slice(0, 10)}.xlsx`, "Experts", rows.map(({ profile, user }) => ({
        "Expert ID": user.id,
        "First name": user.firstName,
        "Last name": user.lastName,
        Email: user.email,
        Phone: user.phone || "",
        "Professional title": profile.professionalTitle,
        Biography: profile.biography || "",
        "Years experience": profile.yearsExperience ?? 0,
        Languages: profile.languages?.join(", ") || "",
        Country: user.country || "",
        City: user.city || "",
        "Account status": user.status || "",
        "Profile visible": profile.isPublished,
        "Credential status": profile.verificationStatus,
        Rating: Number(profile.averageRating || 0),
        Reviews: profile.reviewCount ?? 0,
        "Registered at": exportDate(user.createdAt),
      })));
    } catch (caught) { setError(caught); }
    finally { setExporting(false); }
  };
  return <PanelState loading={!rows && !error} error={error}>
    <div className="section-title"><div><h2>Experts</h2><p>Profiles are public without approval. Credential review remains optional.</p></div><Button busy={exporting} variant="secondary" onClick={() => void exportExperts()}><FileSpreadsheet size={17} /> Export Excel</Button></div>
    <div className="admin-split">
    <div className="compact-list">{rows?.map(({ profile, user }) => <article key={user.id}><div>
      <StatusBadge value={profile.verificationStatus} /><h3>{user.firstName} {user.lastName}</h3><p>{profile.professionalTitle}</p><small>{user.email}</small>
    </div><Button variant="ghost" onClick={() => void inspect(user.id)}>Credentials</Button></article>)}</div>
    {selected && <aside className="admin-inspector"><div className="section-title"><h2>Credential review</h2><button className="text-button" onClick={() => setSelected(undefined)}>Close</button></div>
      <StatusBadge value={selected.profile.verificationStatus} /><h3>{selected.profile.professionalTitle}</h3>
      {selected.documents.map((document) => <div className="document-row" key={document.id}><div><strong>{document.type.replace(/_/g, " ")}</strong><small>{formatDate(document.createdAt)} · {document.status}</small></div><Button variant="ghost" onClick={() => void downloadApiFile(document.fileUrl, `expert-document-${document.id}`)}>Download</Button></div>)}
      {!selected.documents.length && <p>No documents submitted.</p>}
      <div className="inline-actions"><Button onClick={() => void decide("verified")}>Mark credentials verified</Button><Button variant="danger" onClick={() => void decide("rejected")}>Reject credentials</Button></div>
    </aside>}
  </div></PanelState>;
}

type AdminJobRow = {
  job: Job;
  owner: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone">;
  expert?: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone"> | null;
  contract?: {
    id: string;
    status: string;
    subtotal: string;
    total: string;
    commissionAmount: string;
    expertEarnings: string;
    currency: string;
    completedAt?: string | null;
  } | null;
  payment?: { id: string; status: string; amount: string; currency: string } | null;
  payout?: { id: string; status: string; amount: string; currency: string; providerReference?: string | null } | null;
};

function JobsPanel() {
  const [jobs, setJobs] = useState<AdminJobRow[]>();
  const [error, setError] = useState<unknown>();
  const [exporting, setExporting] = useState(false);
  const load = () => api<AdminJobRow[]>("/admin/jobs", { auth: true }).then(setJobs).catch(setError);
  useEffect(() => { void load(); }, []);
  const moderate = async (job: Job, status: "open" | "completed" | "cancelled" | "closed" | "moderated") => {
    const reason = window.prompt("Reason for this moderation action:");
    if (!reason || reason.length < 3) return;
    try { await api(`/admin/jobs/${job.id}/status`, { method: "PATCH", auth: true, body: { status, reason } }); await load(); }
    catch (caught) { setError(caught); }
  };
  const exportJobs = async () => {
    if (!jobs) return;
    setExporting(true); setError(undefined);
    try {
      await exportExcel(`rentbrain-jobs-${new Date().toISOString().slice(0, 10)}.xlsx`, "Jobs", jobs.map(({ job, owner, expert, contract, payment, payout }) => ({
        "Job ID": job.id,
        Title: job.title,
        Status: job.status,
        "Owner name": `${owner.firstName} ${owner.lastName}`,
        "Owner email": owner.email,
        "Owner phone": owner.phone || "",
        "Expert name": expert ? `${expert.firstName} ${expert.lastName}` : "",
        "Expert email": expert?.email || "",
        "Expert phone": expert?.phone || "",
        "Budget minimum": Number(job.budgetMin || 0),
        "Budget maximum": Number(job.budgetMax || 0),
        Currency: job.currency,
        "Contract status": contract?.status || "",
        "Accepted quote": Number(contract?.subtotal || 0),
        "Client total": Number(contract?.total || 0),
        "Commission": Number(contract?.commissionAmount || 0),
        "Expert net": Number(contract?.expertEarnings || 0),
        "Payment status": payment?.status || "",
        "Payout status": payout?.status || "",
        "Payout reference": payout?.providerReference || "",
        "Created at": exportDate(job.createdAt),
        "Completed at": exportDate(contract?.completedAt),
      })));
    } catch (caught) { setError(caught); }
    finally { setExporting(false); }
  };
  return <PanelState loading={!jobs && !error} error={error}>
    <div className="section-title"><div><h2>Jobs</h2><p>Ownership, assignment, payment, and settlement records.</p></div><Button busy={exporting} variant="secondary" onClick={() => void exportJobs()}><FileSpreadsheet size={17} /> Export Excel</Button></div>
    <div className="admin-table-wrap"><table className="admin-table">
    <thead><tr><th>Job</th><th>Client / owner</th><th>Assigned expert</th><th>Contract & payment</th><th>Expert settlement</th><th>Status</th><th>Created</th><th>Moderation</th></tr></thead>
    <tbody>{jobs?.map(({ job, owner, expert, contract, payment, payout }) => <tr key={job.id}>
      <td><strong>{job.title}</strong><small>{job.id}</small><small>Budget {formatMoney(job.budgetMax || job.budgetMin, job.currency)}</small></td>
      <td><strong>{owner.firstName} {owner.lastName}</strong><small>{owner.phone || "No phone provided"}</small><small>{owner.email}</small></td>
      <td>{expert ? <><strong>{expert.firstName} {expert.lastName}</strong><small>Contact / possible Whish: {expert.phone || "No phone provided"}</small><small>{expert.email}</small></> : <small>No expert assigned</small>}</td>
      <td>{contract ? <><StatusBadge value={contract.status} /><strong>{formatMoney(contract.total, contract.currency)} client total</strong><small>Quote {formatMoney(contract.subtotal, contract.currency)} · Expert net {formatMoney(contract.expertEarnings, contract.currency)}</small><small>Payment: {payment?.status ?? "not created"}</small></> : <small>No quotation accepted</small>}</td>
      <td>{payout ? <><StatusBadge value={payout.status} /><strong>{formatMoney(payout.amount, payout.currency)}</strong>{payout.providerReference && <small>Ref: {payout.providerReference}</small>}</> : contract?.status === "completed" ? <small>No payout record</small> : <small>Available after completion</small>}</td>
      <td><StatusBadge value={job.status} /></td><td>{formatDate(job.createdAt)}</td>
      <td><Select value={job.status} onChange={(event) => void moderate(job, event.target.value as Parameters<typeof moderate>[1])}><option value="open">Open</option><option value="pending_payment" disabled>Pending payment</option><option value="in_progress" disabled>In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="closed">Closed</option><option value="moderated">Moderated</option></Select></td>
    </tr>)}</tbody>
  </table></div></PanelState>;
}
