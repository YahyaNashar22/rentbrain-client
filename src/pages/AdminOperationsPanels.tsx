import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Button,
  ErrorMessage,
  Field,
  Input,
  Loading,
  Select,
  StatusBadge,
  Textarea,
  formatDate,
  formatMoney,
} from "../components/ui";
import { api } from "../lib/api";
import type { Category, Paged, Specialization } from "../lib/types";

function PanelState({ loading, error, children }: { loading: boolean; error: unknown; children: ReactNode }) {
  if (loading) return <Loading label="Loading administration data" />;
  return <><ErrorMessage error={error} />{children}</>;
}

type PaymentRow = {
  payment: { id: string; provider: string; amount: string; currency: string; status: string; refundedAmount: string };
};
type ProviderBalance = { provider: string; currency: "USD" | "LBP"; balance: number; environment: string; automatedPayouts: boolean };
type Payout = {
  id: string;
  expertId: number;
  amount: string;
  currency: string;
  status: string;
  providerReference?: string | null;
};
type PayoutRow = {
  payout: Payout;
  expert: { id: number; firstName: string; lastName: string; email: string; phone?: string | null };
};
type Refund = {
  id: string;
  paymentId: string;
  amount: string;
  status: string;
  reason: string;
  adminNote?: string | null;
};

export function FinancePanel() {
  const [payments, setPayments] = useState<PaymentRow[]>();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [providerBalance, setProviderBalance] = useState<ProviderBalance>();
  const [balanceCurrency, setBalanceCurrency] = useState<"USD" | "LBP">("USD");
  const [error, setError] = useState<unknown>();
  const load = () => Promise.all([
    api<PaymentRow[]>("/admin/payments", { auth: true }),
    api<PayoutRow[]>("/admin/payouts", { auth: true }),
    api<Refund[]>("/admin/refunds", { auth: true }),
  ]).then(([paymentRows, payoutRows, refundRows]) => {
    setPayments(paymentRows); setPayouts(payoutRows); setRefunds(refundRows);
  }).catch(setError);
  useEffect(() => { void load(); }, []);

  const loadProviderBalance = async () => {
    try {
      setProviderBalance(await api<ProviderBalance>(`/admin/payments/provider-balance?currency=${balanceCurrency}`, { auth: true }));
    } catch (caught) { setError(caught); }
  };

  const decideRefund = async (refund: Refund, decision: "approved" | "rejected") => {
    const adminNote = window.prompt("Decision note (required):");
    if (!adminNote || adminNote.length < 3) return;
    try {
      await api(`/admin/refunds/${refund.id}`, { method: "PATCH", auth: true, body: { decision, adminNote } });
      await load();
    } catch (caught) { setError(caught); }
  };
  const updatePayout = async (item: Payout, status: "processing" | "paid" | "failed" | "held") => {
    const providerReference = status === "paid" ? window.prompt("Payment/provider reference:") : undefined;
    try {
      await api(`/admin/payouts/${item.id}`, { method: "PATCH", auth: true, body: { status, providerReference: providerReference || null } });
      await load();
    } catch (caught) { setError(caught); }
  };
  const completeRefund = async (refund: Refund) => {
    const providerReference = window.prompt("External refund reference:");
    if (!providerReference) return;
    try {
      await api(`/admin/refunds/${refund.id}/complete`, { method: "PATCH", auth: true, body: { providerReference } });
      await load();
    } catch (caught) { setError(caught); }
  };

  return <PanelState loading={!payments && !error} error={error}>
    <section className="admin-section"><h2>Refund requests</h2>
      {refunds.length ? <div className="compact-list">{refunds.map((refund) => <article key={refund.id}>
        <div><StatusBadge value={refund.status} /><h3>{formatMoney(refund.amount)}</h3><p>{refund.reason}</p><small>Payment {refund.paymentId}</small></div>
        <div className="inline-actions">
          {refund.status === "requested" && <><Button onClick={() => void decideRefund(refund, "approved")}>Approve</Button><Button variant="danger" onClick={() => void decideRefund(refund, "rejected")}>Reject</Button></>}
          {refund.status === "processing" && (payments?.find(({ payment }) => payment.id === refund.paymentId)?.payment.provider === "manual" ? <Button variant="secondary" onClick={() => void completeRefund(refund)}>Record completion</Button> : <small>Whish reconciliation in progress</small>)}
        </div>
      </article>)}</div> : <p className="muted">No refund requests.</p>}
    </section>
    <section className="admin-section"><div className="section-title"><div><h2>Whish merchant balance</h2><p>Read directly from the configured payment environment.</p></div><div className="inline-actions"><Select value={balanceCurrency} onChange={(event) => setBalanceCurrency(event.target.value as "USD" | "LBP")}><option value="USD">USD</option><option value="LBP">LBP</option></Select><Button variant="secondary" onClick={() => void loadProviderBalance()}>Refresh balance</Button></div></div>{providerBalance && <div className="alert alert-success"><strong>{formatMoney(providerBalance.balance, providerBalance.currency)}</strong><span>{providerBalance.provider} · {providerBalance.environment} environment</span></div>}</section>
    <section className="admin-section"><h2>Expert payouts</h2><div className="alert"><strong>Payout ledger</strong><span>Whish Pay collects into RentBrain's merchant balance but does not expose provider transfers in this API. Pay the recorded net amount through the approved settlement process, then save its reference here.</span></div><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Expert</th><th>Amount</th><th>Status</th><th>Update</th></tr></thead>
      <tbody>{payouts.map(({ payout, expert }) => <tr key={payout.id}><td><strong>{expert.firstName} {expert.lastName}</strong><small>{expert.phone || expert.email}</small></td><td>{formatMoney(payout.amount, payout.currency)}</td><td><StatusBadge value={payout.status} /></td><td>{payout.status === "paid" ? <small>{payout.providerReference}</small> : <Select value={payout.status} onChange={(event) => void updatePayout(payout, event.target.value as Parameters<typeof updatePayout>[1])}><option value="pending">Pending</option><option value="processing">Processing</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="held">Held</option></Select>}</td></tr>)}</tbody>
    </table></div></section>
    <section className="admin-section"><h2>Payments</h2><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Reference</th><th>Provider</th><th>Amount</th><th>Refunded</th><th>Status</th></tr></thead>
      <tbody>{payments?.map(({ payment }) => <tr key={payment.id}><td><small>{payment.id}</small></td><td>{payment.provider}</td><td>{formatMoney(payment.amount, payment.currency)}</td><td>{formatMoney(payment.refundedAmount, payment.currency)}</td><td><StatusBadge value={payment.status} /></td></tr>)}</tbody>
    </table></div></section>
  </PanelState>;
}

export function TaxonomyPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [error, setError] = useState<unknown>();
  const load = () => Promise.all([
    api<Category[]>("/marketplace/categories"),
    api<Specialization[]>("/marketplace/specializations"),
  ]).then(([categoryRows, specializationRows]) => {
    setCategories(categoryRows); setSpecializations(specializationRows);
  }).catch(setError);
  useEffect(() => { void load(); }, []);
  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try {
      await api("/admin/categories", { method: "POST", auth: true, body: { name: String(data.get("name")), slug: slugify(String(data.get("name"))), description: String(data.get("description")) || null, isActive: true } });
      event.currentTarget.reset(); await load();
    } catch (caught) { setError(caught); }
  };
  const addSpecialization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try {
      await api("/admin/specializations", { method: "POST", auth: true, body: { categoryId: Number(data.get("categoryId")), name: String(data.get("name")), slug: slugify(String(data.get("name"))), isActive: true } });
      event.currentTarget.reset(); await load();
    } catch (caught) { setError(caught); }
  };
  const renameCategory = async (category: Category) => {
    const name = window.prompt("Category name:", category.name)?.trim();
    if (!name || name === category.name) return;
    try {
      await api(`/admin/categories/${category.id}`, { method: "PATCH", auth: true, body: { name, slug: slugify(name) } });
      await load();
    } catch (caught) { setError(caught); }
  };
  const renameSpecialization = async (item: Specialization) => {
    const name = window.prompt("Specialization name:", item.name)?.trim();
    if (!name || name === item.name) return;
    try {
      await api(`/admin/specializations/${item.id}`, { method: "PATCH", auth: true, body: { name, slug: slugify(name) } });
      await load();
    } catch (caught) { setError(caught); }
  };
  return <><ErrorMessage error={error} /><div className="admin-form-grid">
    <form className="content-card form-stack" onSubmit={addCategory}><h2>Add category</h2><Field label="Name"><Input name="name" required /></Field><Field label="Description"><Textarea name="description" rows={3} /></Field><Button type="submit">Create category</Button></form>
    <form className="content-card form-stack" onSubmit={addSpecialization}><h2>Add specialization</h2><Field label="Category"><Select name="categoryId" required><option value="">Choose</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label="Name"><Input name="name" required /></Field><Button type="submit">Create specialization</Button></form>
  </div><div className="taxonomy-list">{categories.map((category) => <article key={category.id}><div className="section-title"><h3>{category.name}</h3><Button variant="ghost" onClick={() => void renameCategory(category)}>Rename</Button></div><p>{category.description}</p><div className="tag-row">{specializations.filter((item) => item.categoryId === category.id).map((item) => <button className="tag" key={item.id} onClick={() => void renameSpecialization(item)} title="Rename specialization">{item.name}</button>)}</div></article>)}</div></>;
}

type Legal = {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  publishedAt?: string | null;
  effectiveAt?: string | null;
};

export function LegalPanel() {
  const [documents, setDocuments] = useState<Legal[]>();
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Legal>();
  const [viewing, setViewing] = useState<Legal>();
  const load = () => api<Legal[]>("/admin/legal", { auth: true }).then(setDocuments).catch(setError);
  useEffect(() => { void load(); }, []);
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try {
      const body = { type: String(data.get("type")), version: String(data.get("version")), title: String(data.get("title")), content: String(data.get("content")), effectiveAt: null };
      await api(editing ? `/admin/legal/${editing.id}` : "/admin/legal", { method: editing ? "PATCH" : "POST", auth: true, body });
      setShow(false); setEditing(undefined); setMessage(editing ? "Draft updated." : "Draft created."); await load();
    } catch (caught) { setError(caught); }
  };
  const publish = async (document: Legal) => {
    const restoring = document.status === "archived";
    const action = restoring ? "Republish archived" : "Publish";
    if (!window.confirm(`${action} ${document.title} version ${document.version}? The currently published version of this policy will be archived.`)) return;
    try {
      const updated = await api<Legal>(`/admin/legal/${document.id}/publish`, { method: "POST", auth: true });
      setViewing((current) => current?.id === updated.id ? updated : current);
      setMessage(restoring ? `Version ${document.version} was restored.` : `Version ${document.version} was published.`);
      await load();
    }
    catch (caught) { setError(caught); }
  };
  const copyContent = async (document: Legal) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard access is not available in this browser");
      await navigator.clipboard.writeText(document.content);
      setMessage(`${document.title} version ${document.version} copied to the clipboard.`);
    } catch (caught) { setError(caught); }
  };
  return <PanelState loading={!documents && !error} error={error}>
    {message && <div className="alert alert-success">{message}</div>}
    <div className="section-title"><div><h2>Policy versions</h2><p>Published versions remain immutable. Archived versions can be viewed, copied, or restored without changing their content.</p></div><Button onClick={() => { setEditing(undefined); setViewing(undefined); setShow((value) => !value); }}>Create draft</Button></div>
    {show && <form key={editing?.id || "new"} className="content-card form-stack" onSubmit={create}><div className="form-grid thirds"><Field label="Policy"><Select name="type" defaultValue={editing?.type || "terms"}><option value="terms">Terms</option><option value="privacy">Privacy</option><option value="cookie">Cookie</option><option value="refund_cancellation">Refund & cancellation</option></Select></Field><Field label="Version"><Input name="version" defaultValue={editing?.version} placeholder="1.0" required /></Field><Field label="Title"><Input name="title" defaultValue={editing?.title} required /></Field></div><Field label="Policy content"><Textarea name="content" defaultValue={editing?.content} minLength={20} rows={16} required /></Field><div className="inline-actions"><Button type="submit">{editing ? "Update draft" : "Save draft"}</Button><Button type="button" variant="ghost" onClick={() => { setShow(false); setEditing(undefined); }}>Cancel</Button></div></form>}
    {viewing && <article className="content-card legal-preview">
      <div className="section-title"><div><StatusBadge value={viewing.status} /><h2>{viewing.title}</h2><p>{viewing.type.replace(/_/g, " ")} · Version {viewing.version}</p></div><Button variant="ghost" onClick={() => setViewing(undefined)}>Close</Button></div>
      <Field label="Policy content" hint="Read-only historical content"><Textarea value={viewing.content} rows={18} readOnly /></Field>
      <div className="inline-actions"><Button variant="secondary" onClick={() => void copyContent(viewing)}>Copy content</Button>{viewing.status === "archived" && <Button onClick={() => void publish(viewing)}>Republish this version</Button>}</div>
    </article>}
    <div className="compact-list">{documents?.map((document) => <article key={document.id}><div><StatusBadge value={document.status} /><h3>{document.title}</h3><p>{document.type.replace(/_/g, " ")} · Version {document.version}</p><small>Created {formatDate(document.createdAt)}</small></div><div className="inline-actions"><Button variant="ghost" onClick={() => { setViewing(document); setShow(false); }}>View</Button>{document.status === "draft" && <><Button variant="ghost" onClick={() => { setEditing(document); setViewing(undefined); setShow(true); }}>Edit</Button><Button onClick={() => void publish(document)}>Publish</Button></>}{document.status === "archived" && <Button variant="secondary" onClick={() => void publish(document)}>Republish</Button>}</div></article>)}</div>
  </PanelState>;
}

type PlatformSetting = {
  key: string;
  value: unknown;
  description?: string | null;
  isPublic: boolean;
  updatedAt: string;
};

type SettingCatalogItem = {
  key: string;
  label: string;
  group: string;
  description: string;
  valueType: "email" | "json" | "text";
  example: unknown;
  defaultIsPublic: boolean;
  editor: "commission" | "generic";
};

const settingText = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

export function SettingsPanel() {
  const [settings, setSettings] = useState<PlatformSetting[]>();
  const [catalog, setCatalog] = useState<SettingCatalogItem[]>();
  const [selectedKey, setSelectedKey] = useState("support.email");
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const load = () => Promise.all([
    api<PlatformSetting[]>("/admin/settings", { auth: true }),
    api<SettingCatalogItem[]>("/admin/settings/catalog", { auth: true }),
  ]).then(([settingRows, catalogRows]) => {
    setSettings(settingRows); setCatalog(catalogRows);
  }).catch(setError);
  useEffect(() => { void load(); }, []);
  const current = settings?.find((item) => item.key === "commission")?.value as { expertPercentage?: number; clientFeePercentage?: number } | undefined;
  const catalogRows = [
    ...(catalog || []),
    ...(settings || []).filter((setting) => !catalog?.some((item) => item.key === setting.key)).map((setting) => ({
      key: setting.key,
      label: "Custom setting",
      group: "Custom",
      description: setting.description || "A custom setting stored by an administrator.",
      valueType: "json" as const,
      example: setting.value,
      defaultIsPublic: setting.isPublic,
      editor: "generic" as const,
    })),
  ];
  const editableRows = catalogRows.filter((item) => item.editor === "generic");
  const selectedSetting = settings?.find((item) => item.key === selectedKey);
  const selectedCatalog = catalogRows.find((item) => item.key === selectedKey);
  const saveCommission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try {
      await api("/admin/settings/commission", { method: "PUT", auth: true, body: { value: { expertPercentage: Number(data.get("expertPercentage")), clientFeePercentage: Number(data.get("clientFeePercentage")) }, description: "Current marketplace commission and client fee percentages", isPublic: true } });
      setMessage("Commission configuration saved. Existing bookings were not changed."); await load();
    } catch (caught) { setError(caught); }
  };
  const saveGeneric = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try {
      let value: unknown;
      try { value = JSON.parse(String(data.get("value"))); } catch { value = String(data.get("value")); }
      await api(`/admin/settings/${encodeURIComponent(selectedKey)}`, { method: "PUT", auth: true, body: { value, description: String(data.get("description")) || null, isPublic: data.get("isPublic") === "on" } });
      setMessage(`${selectedKey} saved.`); await load();
    } catch (caught) { setError(caught); }
  };
  return <PanelState loading={(!settings || !catalog) && !error} error={error}>
    {message && <div className="alert alert-success">{message}</div>}
    <section className="admin-section">
      <div className="section-title"><div><h2>Settings key catalog</h2><p>These are all settings currently understood by RentBrain. Custom keys already in the database also appear here.</p></div></div>
      <div className="settings-list setting-catalog">{catalogRows.map((item) => {
        const configured = settings?.some((setting) => setting.key === item.key);
        return <article key={item.key}>
          <div><span className="eyebrow">{item.group}</span><StatusBadge value={configured ? "configured" : "not configured"} /></div>
          <h3>{item.label}</h3>
          <code className="setting-key">{item.key}</code>
          <p>{item.description}</p>
          <dl className="catalog-meta"><div><dt>Value format</dt><dd>{item.valueType}</dd></div><div><dt>Public default</dt><dd>{item.defaultIsPublic ? "Yes" : "No"}</dd></div></dl>
          <small>Example</small><pre>{settingText(item.example)}</pre>
          {item.editor === "generic" ? <Button variant="secondary" onClick={() => { setSelectedKey(item.key); setMessage(""); }}>Edit this setting</Button> : <small>Use the dedicated commission editor below.</small>}
        </article>;
      })}</div>
    </section>
    <div className="admin-form-grid">
      <form className="content-card form-stack" onSubmit={saveCommission}><h2>Marketplace commission</h2><Field label="Expert commission (%)"><Input name="expertPercentage" type="number" min="0" max="100" step="0.01" defaultValue={current?.expertPercentage ?? 0} required /></Field><Field label="Client fee (%)"><Input name="clientFeePercentage" type="number" min="0" max="100" step="0.01" defaultValue={current?.clientFeePercentage ?? 0} required /></Field><Button type="submit">Save rates</Button></form>
      <form key={`${selectedKey}:${selectedSetting?.updatedAt || "new"}`} className="content-card form-stack" onSubmit={saveGeneric}><h2>Add or update setting</h2><Field label="Key" hint="Choose from the catalog; no key typing required."><Select name="key" value={selectedKey} onChange={(event) => { setSelectedKey(event.target.value); setMessage(""); }}>{editableRows.map((item) => <option key={item.key} value={item.key}>{item.key} — {item.label}</option>)}</Select></Field><Field label="Value" hint={`Expected format: ${selectedCatalog?.valueType || "text or JSON"}`}><Textarea name="value" rows={4} defaultValue={settingText(selectedSetting?.value ?? selectedCatalog?.example ?? "")} required /></Field><Field label="Description"><Input name="description" defaultValue={selectedSetting?.description || selectedCatalog?.description || ""} /></Field><label className="check-row"><input name="isPublic" type="checkbox" defaultChecked={selectedSetting?.isPublic ?? selectedCatalog?.defaultIsPublic ?? false} /><span>Expose through public settings API</span></label><Button type="submit">Save setting</Button></form>
    </div>
    <div className="section-title"><div><h2>Stored settings</h2><p>Current values saved in the database.</p></div></div>
    <div className="settings-list">{settings?.map((setting) => <article key={setting.key}><div><strong>{setting.key}</strong><span>{setting.isPublic ? "Public" : "Private"}</span></div><pre>{JSON.stringify(setting.value, null, 2)}</pre><small>{setting.description}</small></article>)}</div>
  </PanelState>;
}

type Audit = {
  id: string;
  actorId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export function AuditPanel() {
  const [data, setData] = useState<Paged<Audit>>();
  const [error, setError] = useState<unknown>();
  useEffect(() => { void api<Paged<Audit>>("/admin/audit-logs?limit=100", { auth: true }).then(setData).catch(setError); }, []);
  return <PanelState loading={!data && !error} error={error}><div className="admin-table-wrap"><table className="admin-table">
    <thead><tr><th>When</th><th>Action</th><th>Entity</th><th>Actor</th><th>IP</th></tr></thead>
    <tbody>{data?.items.map((item) => <tr key={item.id}><td>{formatDate(item.createdAt, true)}</td><td><strong>{item.action}</strong></td><td>{item.entityType} {item.entityId}</td><td>{item.actorId || "System"}</td><td>{item.ipAddress || "—"}</td></tr>)}</tbody>
  </table></div></PanelState>;
}

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
