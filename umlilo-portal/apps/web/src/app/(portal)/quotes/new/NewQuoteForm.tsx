'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ClientOption { id: number; name: string; email: string }
interface LineItem { description: string; qty: string; unit_price: string }
interface Props { clients: ClientOption[] }

const labelCls  = 'block text-xs text-ash uppercase tracking-wider mb-1'
const inputCls  = 'w-full bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-bone-paper placeholder-ash/50 focus:outline-none focus:border-fire-orange'
const selectCls = `${inputCls} appearance-none`

const emptyItem = (): LineItem => ({ description: '', qty: '1', unit_price: '' })

export default function NewQuoteForm({ clients }: Props) {
  const router           = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const defaultClient = clients[0]
  const [form, setForm] = useState({
    client_id:   defaultClient?.id?.toString() ?? '',
    client_name: defaultClient?.name ?? 'AECI Chempark',
    valid_until: '',
    callout_ref: '',
    notes:       '',
  })
  const [items, setItems] = useState<LineItem[]>([emptyItem()])

  function setField(field: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'client_id') {
        const c = clients.find(x => x.id.toString() === value)
        if (c) next.client_name = c.name
      }
      return next
    })
  }

  function setItem(index: number, field: keyof LineItem, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() { setItems(prev => [...prev, emptyItem()]) }

  function removeItem(index: number) {
    setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)
  }

  function lineTotal(item: LineItem) {
    return (parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0)
  }

  const quoteTotal = items.reduce((sum, item) => sum + lineTotal(item), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validItems = items.filter(item => item.description.trim() && parseFloat(item.qty) > 0 && parseFloat(item.unit_price) > 0)
    if (!validItems.length) { setError('At least one line item with a description and price is required'); return }

    start(async () => {
      try {
        const payload: Record<string, unknown> = {
          items: validItems.map(item => ({
            description: item.description.trim(),
            qty:         parseFloat(item.qty) || 1,
            unit_price:  parseFloat(item.unit_price) || 0,
          })),
        }
        if (form.client_id)           payload.client_id   = parseInt(form.client_id)
        if (form.client_name)         payload.client_name = form.client_name.trim()
        if (form.valid_until)         payload.valid_until = form.valid_until
        if (form.callout_ref.trim())  payload.callout_ref = form.callout_ref.trim()
        if (form.notes.trim())        payload.notes       = form.notes.trim()

        const res  = await fetch('/api/quotes.php', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.success) { setError(data.error ?? 'Failed to create quote'); return }
        router.push('/quotes')
        router.refresh()
      } catch {
        setError('Network error — please try again')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-navy border border-steel-dark rounded-lg p-6 space-y-5">
      {error && (
        <div className="px-3 py-2 rounded bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
      )}

      {/* Client */}
      <div>
        <label className={labelCls}>Client *</label>
        {clients.length > 0 ? (
          <select value={form.client_id} onChange={e => setField('client_id', e.target.value)} className={selectCls} required>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <input type="text" value={form.client_name} onChange={e => setField('client_name', e.target.value)}
            className={inputCls} placeholder="Client name" required maxLength={255} />
        )}
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Line Items *</label>
          <button type="button" onClick={addItem}
            className="text-xs text-fire-orange hover:text-flame-gold font-mono uppercase tracking-wider">
            + Add Line
          </button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_60px_90px_32px] gap-2 px-1">
            <span className="text-[10px] text-ash uppercase tracking-wider">Description</span>
            <span className="text-[10px] text-ash uppercase tracking-wider">Qty</span>
            <span className="text-[10px] text-ash uppercase tracking-wider">Unit Price</span>
            <span />
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px_90px_32px] gap-2 items-center">
              <input type="text" value={item.description} onChange={e => setItem(i, 'description', e.target.value)}
                className={inputCls} placeholder="e.g. Alarm response" maxLength={255} required={i === 0} />
              <input type="number" value={item.qty} onChange={e => setItem(i, 'qty', e.target.value)}
                className={inputCls} min="0.01" step="0.01" />
              <input type="number" value={item.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)}
                className={inputCls} placeholder="0.00" min="0" step="0.01" required={i === 0} />
              <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                className="text-ash hover:text-danger disabled:opacity-30 text-lg leading-none font-light">
                ×
              </button>
            </div>
          ))}
        </div>
        {quoteTotal > 0 && (
          <p className="mt-2 text-right text-xs text-ash">
            Total: <span className="text-bone-paper font-mono">R{quoteTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
          </p>
        )}
      </div>

      {/* Valid until + Callout ref */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Valid Until</label>
          <input type="date" value={form.valid_until} onChange={e => setField('valid_until', e.target.value)}
            className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Callout Ref</label>
          <input type="text" value={form.callout_ref} onChange={e => setField('callout_ref', e.target.value)}
            className={inputCls} placeholder="e.g. CALL-0001" maxLength={30} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
          className={`${inputCls} h-20 resize-none`} placeholder="Internal notes or scope details" maxLength={2000} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending}
          className="px-5 py-2 text-sm font-medium bg-fire-orange text-coal rounded hover:bg-flame-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {pending ? 'Creating…' : 'Create Quote'}
        </button>
        <a href="/quotes" className="px-4 py-2 text-sm text-ash hover:text-bone-paper transition-colors">Cancel</a>
      </div>
    </form>
  )
}
