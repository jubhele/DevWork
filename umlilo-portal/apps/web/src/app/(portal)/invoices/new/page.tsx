import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getUserFromPortalCookie, can, getApiAuthHeaders } from '@/lib/auth'
import NewInvoiceForm from './NewInvoiceForm'

interface ClientOption { id: number; name: string; email: string }

async function getClients(headers: Record<string, string> | null): Promise<ClientOption[]> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE
    ?? `http://localhost:${process.env.PORT ?? '3000'}/api`
  if (!headers) return []
  try {
    const res = await fetch(`${API_BASE}/clients.php?active=1`, { headers, cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as ClientOption[]
  } catch {
    return []
  }
}

export default async function NewInvoicePage() {
  const cookieStore = await cookies()
  const portalCookie = cookieStore.get('bf_portal')?.value
  const user = getUserFromPortalCookie(portalCookie)

  if (!user || !can(user, 'invoice.create')) notFound()

  const clients = await getClients(getApiAuthHeaders(portalCookie))

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <a href="/invoices" className="text-xs text-ash hover:text-fire-orange uppercase tracking-wider">
          ← Invoices
        </a>
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase mt-2">
          Draft New Invoice
        </h1>
      </div>
      <NewInvoiceForm clients={clients} />
    </div>
  )
}
