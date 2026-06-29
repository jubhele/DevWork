'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function NewInvoicePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [amount, setAmount] = useState('')

  const numAmount = parseFloat(amount) || 0
  const tax = numAmount * 0.15
  const total = numAmount + tax

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: data.get('client_name'),
          quoteRef: data.get('quote_ref') || null,
          amount: numAmount,
          dueDate: data.get('due_date'),
          notes: data.get('notes') || null,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) { setError(body.message ?? 'Could not create invoice.'); return }
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
      <h1 className="font-display text-5xl text-ink-text">New Invoice</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Issue a billing invoice to a client</p>
      <form onSubmit={submit} className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Client Name
            <input name="client_name" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Linked Quote Ref (optional)
            <input name="quote_ref" maxLength={50} placeholder="e.g. BF-Q-001" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text placeholder:text-ash/50" />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Amount Excl. VAT (R)
            <input
              name="amount" type="number" min="0" step="0.01" required
              value={amount} onChange={e => setAmount(e.target.value)}
              className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Due Date
            <input name="due_date" type="date" required className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        {numAmount > 0 && (
          <div className="rounded border border-steel-dark/40 bg-bone-paper p-4 text-right text-sm space-y-1">
            <div className="text-ash">Subtotal: <span className="font-medium text-ink-text">R {numAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
            <div className="text-ash">VAT (15%): <span className="font-medium text-ink-text">R {tax.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
            <div className="font-display text-xl text-fire-orange">Total: R {total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
          </div>
        )}
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Notes
          <textarea name="notes" rows={3} maxLength={2000} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
          <button disabled={saving} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create Invoice'}</button>
        </div>
      </form>
    </div>
  )
}
