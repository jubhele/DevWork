import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getUserFromPortalCookie } from '@/lib/auth'
import LoginFormPage from './LoginForm'

export default async function LoginPage() {
  const cookieStore = await cookies()
  const portalCookie = cookieStore.get('bf_portal')?.value
  const user = getUserFromPortalCookie(portalCookie)

  if (user) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <LoginFormPage />
    </div>
  )
}
