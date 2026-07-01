'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ClientOption { id: number; name: string; email: string }
interface Props { clients: ClientOption[] }

const labelCls  = 'block text-xs text-ash uppercase tracking-wider mb-1'
const inputCls  = 'w-full bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-bone-paper placeholder-ash/50 focus:outline-none focus:border-fire-orange'
const selectCls = `${inputCls} appearance-none`

export default function NewInvoiceForm({ clients }: Props) {
  const router           = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const defaultClient = clients[0]
  const [form, setForm] = useState({
    client_id:   defaultClient?.id?.toString() ?? '',
    client_name: defaultClient?.name ?? 'AECI Chempark',
    amount:      '',
    due_date:    '',
    po:          '',
    callout_ref: '',
    quote_ref:   '',
    status:      'Draft',
  })

  function set(field: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'client_id') {
        const c = clients.find(x => x.id.toString() === value)
        if (c) next.client_name = c.name
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { setError('Amount must be greater than zero'); return }
    if (!form.due_date) { setError('Due date is required'); return }

    start(async () => {
      try {
        const payload: Record<string, unknown> = {
          amount,
          due_date: form.due_date,
          status:   form.status,
        }
        if (form.client_id)   payload.client_id   = parseInt(form.client_id)
        if (form.client_name) payload.client_name = form.client_name.trim()
        if (form.po.trim())          payload.po          = form.po.trim()
        if (form.callout_ref.trim()) payload.callout_ref = form.callout_ref.trim()
        if (form.quote_ref.trim())   payload.quote_ref   = form.quote_ref.trim()

        const res  = await fetch('/api/invoices.php', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.success) { setError(data.error ?? 'Failed to create invoice'); return }
        router.push('/invoices')
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
          <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className={selectCls} required>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <input type="text" value={form.client_name} onChange={e => set('client_name', e.target.value)}
            className={inputCls} placeholder="Client name" required maxLength={255} />
        )}
      </div>

      {/* Amount + Due date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Amount (R) *</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
            className={inputCls} placeholder="0.00" step="0.01" min="0.01" required />
        </div>
        <div>
          <label className={labelCls}>Due Date *</label>
          <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
            className={inputCls} required />
        </div>
      </div>

      {/* PO + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>PO Number</label>
          <input type="text" value={form.po} onChange={e => set('po', e.target.value)}
            className={inputCls} placeholder="e.g. PO-2026-001" maxLength={100} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={selectCls}>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
          </select>
        </div>
      </div>

      {/* Callout ref + Quote ref */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Callout Ref</label>
          <input type="text" value={form.callout_ref} onChange={e => set('callout_ref', e.target.value)}
            className={inputCls} placeholder="e.g. CALL-0001" maxLength={30} />
        </div>
        <div>
          <label className={labelCls}>Quote Ref</label>
          <input type="text" value={form.quote_ref} onChange={e => set('quote_ref', e.target.value)}
            className={inputCls} placeholder="e.g. QTE-0001" maxLength={30} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending}
          className="px-5 py-2 text-sm font-medium bg-fire-orange text-coal rounded hover:bg-flame-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {pending ? 'Creating…' : 'Create Invoice'}
        </button>
        <a href="/invoices" className="px-4 py-2 text-sm text-ash hover:text-bone-paper transition-colors">Cancel</a>
      </div>
    </form>
  )
}
