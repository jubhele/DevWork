'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice } from '@blackfire/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

export default function LogPaymentPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/invoices.php?status=Sent,Overdue,Partial&limit=200`, {
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(body => { if (body?.success) setInvoices(body.data ?? []) })
      .catch(() => null)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const res = await fetch(`${API_BASE}/invoices.php?action=payment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          invoice_id: data.get('invoice_id'),
          amount: parseFloat(data.get('amount') as string) || 0,
          method: data.get('method'),
          reference: data.get('reference') || null,
          payment_date: data.get('payment_date'),
          notes: data.get('notes') || null,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) { setError(body.message ?? 'Could not log payment.'); return }
      router.push('/invoices')
      router.refresh()
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl text-ink-text">Log Payment</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Record a payment received against an invoice</p>
      <form onSubmit={submit} className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Invoice
          <select name="invoice_id" required className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text">
            <option value="">Select invoice…</option>
            {invoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                {(inv as any).invoice_no ?? (inv as any).invoice_number} — {inv.client_name} — R {Number((inv as any).amount ?? inv.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} ({inv.status})
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Amount Received (R)
            <input name="amount" type="number" min="0.01" step="0.01" required className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Payment Date
            <input name="payment_date" type="date" required className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Method
            <select name="method" defaultValue="EFT" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text">
              <option>EFT</option><option>Cash</option><option>Cheque</option><option>Card</option><option>Other</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Reference / POP
            <input name="reference" maxLength={100} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Notes
          <textarea name="notes" rows={3} maxLength={1000} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
          <button disabled={saving} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{saving ? 'Logging…' : 'Log Payment'}</button>
        </div>
      </form>
    </div>
  )
}
