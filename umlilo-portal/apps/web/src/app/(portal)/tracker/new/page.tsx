import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getUserFromPortalCookie, can } from '@/lib/auth'
import { CATEGORY_LABELS, visibleCategoriesForRole } from '@/lib/tracker'
import type { TaskCategory } from '@blackfire/types'
import NewTaskForm from './NewTaskForm'

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const cookieStore = await cookies()
  const user = getUserFromPortalCookie(cookieStore.get('bf_portal')?.value)

  if (!user || !can(user, 'task.create')) notFound()

  const sp = await searchParams
  const reqCat = sp.category as TaskCategory | undefined

  const visibleCategories = visibleCategoriesForRole(user.role)
  const defaultCategory: TaskCategory =
    reqCat && visibleCategories.includes(reqCat) ? reqCat : visibleCategories[0]

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/tracker" className="text-xs uppercase tracking-wider text-ash hover:text-fire-orange">
          {'<-'} Tracker
        </Link>
        <h1 className="mt-2 font-display text-2xl uppercase tracking-wider text-bone-paper">
          New Task
        </h1>
      </div>

      <NewTaskForm
        visibleCategories={visibleCategories}
        categoryLabels={CATEGORY_LABELS}
        defaultCategory={defaultCategory}
      />
    </div>
  )
}
