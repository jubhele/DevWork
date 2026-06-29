import Link from 'next/link'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getInvoices } from '@/lib/data/invoices'
import type { Invoice } from '@blackfire/types'

function Status({ value }: { value: string }) {
  const tone =
    value === 'Paid' ? 'bg-success/10 text-success' :
    value === 'Overdue' ? 'bg-danger/10 text-danger' :
    value === 'Partial' ? 'bg-warning/10 text-warning' :
    'bg-info/10 text-info'
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>
}

export default async function InvoicesPage() {
  const user = await getCurrentUser()
  const result = await getInvoices()
  const invoices: Invoice[] = result.data

  const canCreate = user != null && can(user, 'invoices.create')

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Invoices</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Billing and payment tracking</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <Link href="/invoices/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                + New Invoice
              </Link>
              <Link href="/invoices/log-payment" className="rounded border border-steel-dark bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ash">
                Log Payment
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Invoice Ref</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-left">Issued</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length ? invoices.map((inv: Invoice) => (
                <tr key={inv.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                  <td className="px-4 py-3 font-mono text-xs text-fire-orange">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-medium text-ink-text">{inv.client_name}</td>
                  <td className="px-4 py-3"><Status value={inv.status} /></td>
                  <td className="px-4 py-3 text-ash">R {Number(inv.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-ash">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-ZA') : '—'}</td>
                  <td className="px-4 py-3 text-ash">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-ZA') : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-14 text-center text-ash">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
