import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getApiAuthHeaders } from '@/lib/auth'
import type { Callout } from '@blackfire/types'

async function getCallout(id: string, headers: Record<string, string> | null): Promise<Callout | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
  if (!headers) return null
  try {
    const res = await fetch(`${API_BASE}/callouts.php?id=${id}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = await res.json()
    return body.success ? body.data : null
  } catch {
    return null
  }
}

const PRIORITY_COLOUR: Record<string, string> = {
  Normal:    'text-ash',
  Urgent:    'text-ember-amber',
  Emergency: 'text-ember-red',
}

const STATUS_COLOUR: Record<string, string> = {
  Open:          'bg-ember-amber/10 text-ember-amber border border-ember-amber/30',
  'In Progress': 'bg-info/10 text-info border border-info/30',
  Completed:     'bg-success/10 text-success border border-success/30',
  Invoiced:      'bg-ash/10 text-ash border border-ash/30',
  Cancelled:     'bg-danger/10 text-danger border border-danger/30',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ash uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-bone-paper">{children}</dd>
    </div>
  )
}

export default async function CalloutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const callout = await getCallout(id, getApiAuthHeaders(cookieStore.get('bf_portal')?.value))

  if (!callout) notFound()

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/callouts" className="text-xs text-ash hover:text-fire-orange uppercase tracking-wider">
            ← Callouts
          </Link>
          <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase mt-2">
            {callout.ref_id}
          </h1>
        </div>
        <span className={`px-3 py-1 rounded text-xs font-medium mt-7 ${STATUS_COLOUR[callout.status] ?? 'text-ash'}`}>
          {callout.status}
        </span>
      </div>

      {/* Details card */}
      <div className="bg-navy border border-steel-dark rounded-lg p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Client">{callout.client_name}</Field>
          <Field label="Service">{callout.service}</Field>
          <Field label="Location">{callout.location}</Field>
          <Field label="Priority">
            <span className={`font-medium ${PRIORITY_COLOUR[callout.priority] ?? 'text-ash'}`}>
              {callout.priority}
            </span>
          </Field>
          <Field label="Assigned To">{callout.assigned_to ?? '—'}</Field>
          <Field label="Callout Date">
            {new Date(callout.callout_date).toLocaleDateString('en-ZA', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Field>
          <Field label="Created By">{callout.created_by}</Field>
          <Field label="Created At">
            {new Date(callout.created_at).toLocaleString('en-ZA')}
          </Field>
          {callout.notes && (
            <div className="sm:col-span-2">
              <Field label="Notes">
                <p className="whitespace-pre-wrap text-ash">{callout.notes}</p>
              </Field>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
