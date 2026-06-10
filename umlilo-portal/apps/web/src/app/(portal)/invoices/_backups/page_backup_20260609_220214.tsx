import { cookies } from 'next/headers'
import Link from 'next/link'
import { getApiAuthHeaders } from '@/lib/auth'
import type { Invoice, PaginatedResponse } from '@blackfire/types'

const STATUS_COLOUR: Record<string, string> = {
  Draft:     'bg-ash/10 text-ash',
  Sent:      'bg-info/10 text-info',
  Paid:      'bg-success/10 text-success',
  Overdue:   'bg-danger/10 text-danger',
  Cancelled: 'bg-ash/10 text-ash opacity-60',
}

async function getInvoices(headers: Record<string, string> | null): Promise<PaginatedResponse<Invoice> | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
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
  const invoices = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase">Invoices</h1>
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
                    <Link href={`/invoices/${inv.id}`} className="text-flame-gold hover:text-fire-orange font-mono text-xs">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-bone-paper">{inv.client_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOUR[inv.status] ?? 'text-ash'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-bone-paper font-mono text-xs">
                    R{inv.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-4 py-3 text-xs ${inv.status === 'Overdue' ? 'text-danger font-medium' : 'text-ash'}`}>
                    {new Date(inv.due_date).toLocaleDateString('en-ZA')}
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {inv.paid_date ? new Date(inv.paid_date).toLocaleDateString('en-ZA') : '—'}
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
