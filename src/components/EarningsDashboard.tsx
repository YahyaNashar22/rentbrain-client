import { useEffect, useState } from "react"
import { api } from "../lib/api"
import { ErrorMessage, Loading, StatusBadge, formatMoney } from "./ui"

type EarningsResponse = {
  summaries: Array<{
    currency: string
    collected: string
    commission: string
    netEarnings: string
    awaitingCompletion: string
    pendingPayout: string
    paidOut: string
    held: string
  }>
  entries: Array<{
    sourceType: "service_booking" | "job_contract"
    title: string
    subtotal?: string
    commissionRate?: string
    commissionAmount?: string
    expertEarnings?: string
    currency?: string
    payment: { id: string; status: string }
    payout?: { status: string; amount: string } | null
  }>
}

export function EarningsDashboard() {
  const [earnings, setEarnings] = useState<EarningsResponse>()
  const [error, setError] = useState<unknown>()

  useEffect(() => {
    void api<EarningsResponse>("/payments/earnings", { auth: true })
      .then(setEarnings)
      .catch(setError)
  }, [])

  if (error) return <ErrorMessage error={error} />
  if (!earnings) return <Loading label="Loading earnings" />
  if (!earnings.summaries.length && !earnings.entries.length) {
    return <div className="alert">Your paid service and job earnings will appear here.</div>
  }

  return <section className="dashboard-section">
    <div className="section-title"><div>
      <h2>Expert earnings</h2>
      <p>Collected funds remain in RentBrain's merchant account until work is completed and the payout is settled.</p>
    </div></div>
    {earnings.summaries.map((summary) => <div className="admin-metrics" key={summary.currency}>
      <Metric label="Client payments" value={formatMoney(summary.collected, summary.currency)} note="Paid work before commission" />
      <Metric label="Commission deducted" value={formatMoney(summary.commission, summary.currency)} note="RentBrain provider commission" />
      <Metric label="Earned after completion" value={formatMoney(summary.netEarnings, summary.currency)} note="Completed payout value" />
      <Metric label="Awaiting completion" value={formatMoney(summary.awaitingCompletion, summary.currency)} note="Funded but not payout-ready" />
      <Metric label="Pending payout" value={formatMoney(summary.pendingPayout, summary.currency)} note="Awaiting settlement" />
      <Metric label="Paid out" value={formatMoney(summary.paidOut, summary.currency)} note={`${formatMoney(summary.held, summary.currency)} held`} />
    </div>)}
    <div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Work</th><th>Gross</th><th>Commission</th><th>Expert net</th><th>Payment</th><th>Payout</th></tr></thead>
      <tbody>{earnings.entries.map((entry) => <tr key={entry.payment.id}>
        <td><strong>{entry.title}</strong><small>{entry.sourceType === "job_contract" ? "Job quotation" : "Service booking"}</small></td>
        <td>{formatMoney(entry.subtotal, entry.currency)}</td>
        <td>{formatMoney(entry.commissionAmount, entry.currency)}<small>{entry.commissionRate}%</small></td>
        <td>{formatMoney(entry.expertEarnings, entry.currency)}</td>
        <td><StatusBadge value={entry.payment.status} /></td>
        <td>{entry.payout ? <><StatusBadge value={entry.payout.status} /><small>{formatMoney(entry.payout.amount, entry.currency)}</small></> : <small>After completion</small>}</td>
      </tr>)}</tbody>
    </table></div>
  </section>
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}
