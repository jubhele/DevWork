import Link from 'next/link'
import { cookies } from 'next/headers'
import { can, getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPortalUsers, type PortalUser } from '@/lib/data/users'

const ROLE_LABELS: Record<string, string> = {
  sysadmin: 'Sysadmin',
  admin: 'Admin',
  manager: 'Manager',
  admin_clerk: 'Admin Clerk',
  call_logger: 'Call Logger',
  senior_tech: 'Senior Tech',
  junior_tech: 'Junior Tech',
  client_support: 'Client Support',
  safety_officer: 'Safety Officer',
  viewer: 'Viewer',
}

export default async function UsersPage() {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  const roles = user ? [user.role, ...(user.roles ?? [])].map((r) => String(r).toLowerCase()) : []

  if (!user || (!roles.includes('sysadmin') && !roles.includes('admin') && !can(user, 'user.view'))) redirect('/forbidden')

  const users = await getPortalUsers()

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Users &amp; Roles</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Portal access management</p>
        </div>
        <Link href="/admin/users/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          + New User
        </Link>
      </div>

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Display Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? users.map(u => (
                <tr key={u.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                  <td className="px-4 py-3 font-mono text-xs text-fire-orange">{u.username}</td>
                  <td className="px-4 py-3 font-medium text-ink-text">{u.display_name}</td>
                  <td className="px-4 py-3 text-ash">{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${u.status === 'Active' ? 'bg-success/10 text-success' : 'bg-ash/10 text-ash'}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-ash">{u.last_login ? new Date(u.last_login).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}</td>
                  <td className="px-4 py-3 text-ash">{new Date(u.created_at).toLocaleDateString('en-ZA')}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-ash">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
