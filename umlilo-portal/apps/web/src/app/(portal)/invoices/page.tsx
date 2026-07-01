import { cookies } from 'next/headers'
import { getApiAuthHeaders } from '@/lib/auth'
import type { Invoice, PaginatedResponse } from '@blackfire/types'

const STATUS_COLOUR: Record<string, string> = {
  Draft:     'bg-ash/10 text-ash',
  Sent:      'bg-info/10 text-info',
  Paid:      'bg-success/10 text-success',
  Overdue:   'bg-danger/10 text-danger',
  Cancelled: 'bg-ash/10 text-ash opacity-60',
}

type InvoiceRow = Invoice & {
  invoice_no?: string
  ref_id?: string
}

function asNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function invoiceTotal(invoice: InvoiceRow) {
  return asNumber(invoice.total ?? invoice.amount)
}

function formatCurrency(value: unknown) {
  return `R${asNumber(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '-' : date.toLocaleDateString('en-ZA')
}

async function getInvoices(headers: Record<string, string> | null): Promise<PaginatedResponse<Invoice> | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE
    ?? `http://localhost:${process.env.PORT ?? '3000'}/api`
  if (!headers) return null
  try {
    const res = await fetch(`${API_BASE}/invoices.php`, {
      headers,
      cache: 'no-store',
    })
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}

export default async function InvoicesPage() {
  const cookieStore = await cookies()
  const result = await getInvoices(getApiAuthHeaders(cookieStore.get('bf_portal')?.value))
  const invoices = (result?.data ?? []) as InvoiceRow[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase">Invoices</h1>
        <a href="/invoices/new" className="h-9 px-4 inline-flex items-center rounded-[3px] border border-steel-dark bg-navy font-mono text-[10px] uppercase tracking-[0.16em] text-fire-orange hover:border-fire-orange transition-colors">
          + Draft New
        </a>
      </div>

      {invoices.length === 0 ? (
        <p className="text-ash text-sm">No invoices found.</p>
      ) : (
        <div className="bg-navy border border-steel-dark rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-steel-dark text-xs text-ash uppercase tracking-wider">
                <th className="text-left px-4 py-3">Invoice #</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Due Date</th>
                <th className="text-left px-4 py-3">Paid</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  className={`border-b border-steel-dark/50 hover:bg-charcoal transition-colors ${i % 2 === 0 ? '' : 'bg-charcoal/30'}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-flame-gold font-mono text-xs">
                      {inv.invoice_number ?? inv.invoice_no ?? inv.ref_id ?? inv.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-bone-paper">{inv.client_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOUR[inv.status] ?? 'text-ash'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-bone-paper font-mono text-xs">
                    {formatCurrency(invoiceTotal(inv))}
                  </td>
                  <td className={`px-4 py-3 text-xs ${inv.status === 'Overdue' ? 'text-danger font-medium' : 'text-ash'}`}>
                    {formatDate(inv.due_date)}
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {formatDate(inv.paid_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
