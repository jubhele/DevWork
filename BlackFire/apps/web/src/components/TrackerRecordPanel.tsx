'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { Attachment, TrackerUpdate } from '@blackfire/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? (process.env.NODE_ENV === 'production' ? 'https://blackfiresolutions.co.za/api' : 'http://localhost:8080/api')

type EntityType = 'task' | 'callout'

function inputDateTime(value: string | null) {
  return value ? value.replace(' ', 'T').slice(0, 16) : ''
}

function displayDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value.replace(' ', 'T')).toLocaleString('en-ZA')
}

async function fetchRecordData(entityType: EntityType, entityRef: string) {
  const [updateResponse, fileResponse] = await Promise.all([
    fetch(`${API_BASE}/tracker_updates.php?entity_type=${entityType}&entity_ref=${encodeURIComponent(entityRef)}`, { credentials: 'include' }),
    fetch(`${API_BASE}/files.php?action=list&entity_type=${entityType}&entity_ref=${encodeURIComponent(entityRef)}`, { credentials: 'include' }),
  ])
  const updateBody = await updateResponse.json()
  const fileBody = await fileResponse.json()
  return {
    updates: updateResponse.ok && updateBody.success ? updateBody.data ?? [] : [],
    attachments: fileResponse.ok && fileBody.success ? fileBody.attachments ?? [] : [],
  } as { updates: TrackerUpdate[]; attachments: Attachment[] }
}

export default function TrackerRecordPanel({
  entityType,
  entityRef,
  createdAt,
  startAt,
  endAt,
  dueAt,
  canEdit,
}: {
  entityType: EntityType
  entityRef: string
  createdAt: string
  startAt: string | null
  endAt: string | null
  dueAt: string | null
  canEdit: boolean
}) {
  const [schedule, setSchedule] = useState({ start_at: inputDateTime(startAt), end_at: inputDateTime(endAt), due_at: inputDateTime(dueAt) })
  const [updates, setUpdates] = useState<TrackerUpdate[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadRecordData() {
    setLoading(true)
    try {
      const data = await fetchRecordData(entityType, entityRef)
      setUpdates(data.updates)
      setAttachments(data.attachments)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    void fetchRecordData(entityType, entityRef).then(data => {
      if (ignore) return
      setUpdates(data.updates)
      setAttachments(data.attachments)
      setLoading(false)
    })
    return () => { ignore = true }
  }, [entityRef, entityType])

  async function saveSchedule() {
    setMessage('Saving schedule…')
    const endpoint = entityType === 'task' ? 'tasks.php' : 'callouts.php'
    const response = await fetch(`${API_BASE}/${endpoint}?id=${encodeURIComponent(entityRef)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(schedule),
    })
    const body = await response.json()
    setMessage(response.ok && body.success ? 'Schedule saved and recorded in the audit log.' : body.error ?? 'Schedule could not be saved.')
  }

  async function addUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const response = await fetch(`${API_BASE}/tracker_updates.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ entity_type: entityType, entity_ref: entityRef, label: data.get('label'), content: data.get('content') }),
    })
    const body = await response.json()
    if (response.ok && body.success) {
      form.reset()
      setMessage('Description added and recorded in the audit log.')
      await loadRecordData()
    } else {
      setMessage(body.error ?? 'Description could not be added.')
    }
  }

  async function saveUpdate(update: TrackerUpdate) {
    const response = await fetch(`${API_BASE}/tracker_updates.php?id=${update.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ label: update.label, content: update.content }),
    })
    const body = await response.json()
    setMessage(response.ok && body.success ? 'Description edited; the previous version was preserved.' : body.error ?? 'Description could not be saved.')
    if (response.ok && body.success) await loadRecordData()
  }

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    data.set('entity_type', entityType)
    data.set('entity_ref', entityRef)
    const response = await fetch(`${API_BASE}/files.php`, { method: 'POST', credentials: 'include', body: data })
    const body = await response.json()
    if (response.ok && body.success) {
      form.reset()
      setMessage('File uploaded and recorded in the audit log.')
      await loadRecordData()
    } else {
      setMessage(body.error ?? 'File could not be uploaded.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded border border-steel-dark bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div><h2 className="font-display text-2xl text-ink-text">Schedule</h2><p className="text-sm text-ash">Dates and times for this record</p></div>
          {canEdit && <button type="button" onClick={saveSchedule} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">Save schedule</button>}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs uppercase tracking-[0.15em] text-ash">Created
            <span className="mt-2 block rounded border border-steel-dark bg-charcoal/60 px-3 py-2.5 text-sm normal-case tracking-normal text-ink-text">{displayDateTime(createdAt)}</span>
          </label>
          {(['start_at', 'end_at', 'due_at'] as const).map(field => (
            <label key={field} className="text-xs uppercase tracking-[0.15em] text-ash">{field === 'start_at' ? 'Start' : field === 'end_at' ? 'End' : 'Due'}
              <input type="datetime-local" value={schedule[field]} disabled={!canEdit} onChange={event => setSchedule(current => ({ ...current, [field]: event.target.value }))} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm normal-case tracking-normal text-ink-text disabled:bg-charcoal/50" />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded border border-steel-dark bg-white p-6 shadow-sm">
        <div className="mb-5"><h2 className="font-display text-2xl text-ink-text">Description records</h2><p className="text-sm text-ash">Each entry is separate and every edit preserves a revision.</p></div>
        <div className="space-y-4">
          {updates.map((update, index) => (
            <article key={update.id} className="rounded border border-steel-dark p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ash"><span>Record {index + 1} · {update.created_by} · {displayDateTime(update.created_at)}</span><span>{Number(update.revision_count)} revision{Number(update.revision_count) === 1 ? '' : 's'}</span></div>
              <input aria-label={`Label for description ${index + 1}`} value={update.label} disabled={!canEdit} onChange={event => setUpdates(current => current.map(item => item.id === update.id ? { ...item, label: event.target.value } : item))} className="mb-3 w-full rounded border border-steel-dark px-3 py-2 text-sm font-semibold text-ink-text" />
              <textarea aria-label={`Description ${index + 1}`} value={update.content} disabled={!canEdit} rows={4} onChange={event => setUpdates(current => current.map(item => item.id === update.id ? { ...item, content: event.target.value } : item))} className="w-full rounded border border-steel-dark px-3 py-2 text-sm text-ink-text" />
              {canEdit && <div className="mt-3 text-right"><button type="button" onClick={() => saveUpdate(update)} className="rounded border border-fire-orange px-3 py-2 text-xs uppercase tracking-[0.15em] text-fire-orange">Save edit</button></div>}
            </article>
          ))}
          {!loading && !updates.length && <p className="rounded border border-dashed border-steel-dark px-4 py-8 text-center text-sm text-ash">No description records yet.</p>}
        </div>
        {canEdit && <form onSubmit={addUpdate} className="mt-5 grid gap-3 rounded bg-charcoal/50 p-4"><input name="label" required maxLength={120} placeholder="Label, e.g. Client feedback" className="rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text" /><textarea name="content" required maxLength={10000} rows={4} placeholder="Enter a new description or update" className="rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text" /><div className="text-right"><button className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">Add description</button></div></form>}
      </section>

      <section className="rounded border border-steel-dark bg-white p-6 shadow-sm">
        <div className="mb-5"><h2 className="font-display text-2xl text-ink-text">Files</h2><p className="text-sm text-ash">Upload documents or images and open them from this record.</p></div>
        {canEdit && <form onSubmit={uploadFile} className="mb-5 flex flex-wrap items-center gap-3"><input name="file" type="file" required accept=".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png" className="min-w-0 flex-1 rounded border border-steel-dark px-3 py-2 text-sm text-ash" /><button className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">Upload</button></form>}
        <div className="divide-y divide-steel-dark rounded border border-steel-dark">
          {attachments.map(file => <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"><div><p className="font-medium text-ink-text">{file.original_name}</p><p className="text-xs text-ash">{Math.ceil(file.file_size / 1024)} KB · {file.uploaded_by} · {displayDateTime(file.created_at)}</p></div><div className="flex gap-3"><a target="_blank" rel="noreferrer" href={`${API_BASE}/files.php?action=view&id=${file.id}`} className="text-xs font-semibold uppercase tracking-[0.15em] text-fire-orange">View</a><a href={`${API_BASE}/files.php?action=download&id=${file.id}`} className="text-xs font-semibold uppercase tracking-[0.15em] text-fire-orange">Download</a></div></div>)}
          {!loading && !attachments.length && <p className="px-4 py-8 text-center text-sm text-ash">No files uploaded.</p>}
        </div>
      </section>
      {message && <p role="status" className="text-sm text-ash">{message}</p>}
    </div>
  )
}
