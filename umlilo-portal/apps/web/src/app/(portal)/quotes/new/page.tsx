import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getUserFromPortalCookie, can, getApiAuthHeaders } from '@/lib/auth'
import NewQuoteForm from './NewQuoteForm'

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

export default async function NewQuotePage() {
  const cookieStore = await cookies()
  const portalCookie = cookieStore.get('bf_portal')?.value
  const user = getUserFromPortalCookie(portalCookie)

  if (!user || !can(user, 'quote.create')) notFound()

  const clients = await getClients(getApiAuthHeaders(portalCookie))

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/quotes" className="text-xs text-ash hover:text-fire-orange uppercase tracking-wider">
          ← Quotes
        </a>
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase mt-2">
          Draft New Quote
        </h1>
      </div>
      <NewQuoteForm clients={clients} />
    </div>
  )
}
