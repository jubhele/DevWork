import { getCurrentUser, can } from '@/lib/server-auth'
import { getStatements } from '@/lib/data/statements'
import StatementLog from './StatementLog'

export default async function StatementsPage() {
  const user = await getCurrentUser()
  if (!user || !can(user, 'finance.statement')) {
    return <p className="text-sm text-ash">You do not have access to statements.</p>
  }
  const rows = await getStatements()

  return <StatementLog rows={rows} />
}
