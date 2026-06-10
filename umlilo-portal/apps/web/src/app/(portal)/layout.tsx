import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getUserFromPortalCookie } from '@/lib/auth'
import { UserProvider } from '@/context/UserContext'
import Sidebar from '@/components/Sidebar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const portalCookie = cookieStore.get('bf_portal')?.value
  const user = getUserFromPortalCookie(portalCookie)

  if (!user) redirect('/login')

  return (
    <UserProvider user={user}>
      <div className="flex h-screen bg-coal text-bone-paper overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </UserProvider>
  )
}
