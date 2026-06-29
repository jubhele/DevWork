'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface LineItem { description: string; qty: string; unit_price: string }

export default function NewQuotePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<LineItem[]>([{ description: '', qty: '1', unit_price: '' }])

  function addItem() { setItems(prev => [...prev, { description: '', qty: '1', unit_price: '' }]) }
  function removeItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: keyof LineItem, value: string) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0
    const price = parseFloat(item.unit_price) || 0
    return sum + qty * price
  }, 0)
  const tax = subtotal * 0.15
  const total = subtotal + tax

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    const validItems = items.filter(it => it.description && parseFloat(it.unit_price) > 0)
    if (!validItems.length) { setError('Add at least one line item.'); setSaving(false); return }
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:  data.get('client_name'),
          calloutRef:  data.get('callout_ref') || null,
          validUntil:  data.get('valid_until'),
          notes:       data.get('notes') || null,
          items: validItems.map(it => ({
            description: it.description,
            qty:       parseFloat(it.qty) || 1,
            unitPrice: parseFloat(it.unit_price) || 0,
          })),
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) { setError(body.message ?? 'Could not create quote.'); return }
      router.push('/quotes')
      router.refresh()
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-5xl text-ink-text">New Quote</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Submit a service quotation</p>
      <form onSubmit={submit} className="space-y-6">
        <div className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg uppercase tracking-widest text-ash">Client Details</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">Client Name
              <input name="client_name" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">Linked Callout Ref (optional)
              <input name="callout_ref" maxLength={50} placeholder="e.g. BF-C-001" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text placeholder:text-ash/50" />
            </label>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">Valid Until
              <input name="valid_until" type="date" required className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
            </label>
          </div>
        </div>

        <div className="rounded border border-steel-dark bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg uppercase tracking-widest text-ash">Line Items</h2>
            <button type="button" onClick={addItem} className="rounded border border-steel-dark px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-ash hover:bg-charcoal/10">+ Add Line</button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_80px_110px_32px] gap-2 text-[10px] uppercase tracking-[0.14em] text-ash">
              <span>Description</span><span className="text-center">Qty</span><span className="text-right">Unit Price (R)</span><span />
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_110px_32px] gap-2 items-center">
                <input
                  value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder="Service description" maxLength={255}
                  className="rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text"
                />
                <input
                  value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)}
                  type="number" min="0.01" step="0.01"
                  className="rounded border border-steel-dark bg-white px-3 py-2 text-center text-sm text-ink-text"
                />
                <input
                  value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                  type="number" min="0" step="0.01" placeholder="0.00"
                  className="rounded border border-steel-dark bg-white px-3 py-2 text-right text-sm text-ink-text"
                />
                <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="grid h-8 w-8 place-items-center rounded border border-steel-dark text-ash disabled:opacity-30 hover:text-danger">×</button>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-1 border-t border-steel-dark/50 pt-4 text-right text-sm">
            <div className="text-ash">Subtotal: <span className="font-medium text-ink-text">R {subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
            <div className="text-ash">VAT (15%): <span className="font-medium text-ink-text">R {tax.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
            <div className="font-display text-xl text-fire-orange">Total: R {total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Notes
            <textarea name="notes" rows={3} maxLength={2000} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
          <button disabled={saving} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{saving ? 'Submitting…' : 'Submit Quote'}</button>
        </div>
      </form>
    </div>
  )
}
