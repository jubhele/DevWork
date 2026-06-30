import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function VaultPage() {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  const roles = user ? [user.role, ...(user.roles ?? [])].map((r) => String(r).toLowerCase()) : []
  if (!user || !roles.some((role) => ['sysadmin', 'admin'].includes(role))) redirect('/forbidden')

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl tracking-tight text-ink-text">Secure Vault</h1>
      <p className="mt-2 mb-8 text-sm uppercase tracking-[0.28em] text-ash">Sensitive security records and controlled documents</p>

      <div className="rounded border border-flame-gold/30 bg-flame-gold/5 p-6 text-sm text-ash">
        <p className="font-medium text-ink-text mb-2">Vault — Coming in Phase 2</p>
        <p>The Secure Vault will store encrypted SLA documents, security risk assessments, incident investigation reports, personnel vetting records, and NDA agreements. Access is restricted to Admin and Sysadmin roles and every access event is logged to the audit trail.</p>
        <ul className="mt-4 space-y-1 list-disc list-inside text-xs">
          <li>Encrypted document storage (AES-256)</li>
          <li>Granular per-document access controls</li>
          <li>Full audit trail — who opened what, when</li>
          <li>Watermarked PDF preview in-browser</li>
          <li>Expiry and review date tracking</li>
        </ul>
      </div>
    </div>
  )
}
