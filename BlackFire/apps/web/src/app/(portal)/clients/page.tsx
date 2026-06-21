import { cookies } from 'next/headers'
import Link from 'next/link'
import { getServerUser } from '@/lib/auth'
import type { Client } from '@blackfire/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

async function getClients(cookieHeader: string): Promise<Client[]> {
  try {
    const res = await fetch(`${API_BASE}/clients.php?limit=500`, {
      headers: { Cookie: cookieHeader, 'X-Requested-With': 'XMLHttpRequest' },
      cache: 'no-store',
    })
    const body = res.ok ? await res.json() : null
    return body?.success ? (body.data ?? []) : []
  } catch {
    return []
  }
}

export default async function ClientsPage() {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  const clients = await getClients(cookieHeader)

  const canCreate = user?.role === 'sysadmin' || user?.role === 'admin' || user?.role === 'manager'

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Clients</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Client accounts and site contacts</p>
        </div>
        {canCreate && (
          <Link href="/clients/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            + New Client
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.length ? clients.map(c => (
                <tr key={c.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                  <td className="px-4 py-3 font-medium text-ink-text">{c.name}</td>
                  <td className="px-4 py-3 text-ash">{c.site ?? '—'}</td>
                  <td className="px-4 py-3 text-ash">{c.contact_person ?? '—'}</td>
                  <td className="px-4 py-3 text-ash">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-ash">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${c.active ? 'bg-success/10 text-success' : 'bg-ash/10 text-ash'}`}>{c.active ? 'Active' : 'Inactive'}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-ash">No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
