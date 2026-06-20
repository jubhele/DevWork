import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth'
import { UserProvider } from '@/context/UserContext'
import PortalShell from '@/components/PortalShell'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const user = await getServerUser(cookieHeader)

  if (!user) redirect('/login')

  return (
    <UserProvider user={user}>
      <PortalShell>{children}</PortalShell>
    </UserProvider>
  )
}
