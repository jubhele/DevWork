import type { TaskCategory, User } from '@blackfire/types'

export type TrackerStream = TaskCategory | 'call-log'

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  admin: 'Admin',
  sales: 'Sales',
  general: 'General',
}

const TASK_CATEGORY_ROLES: Record<TaskCategory, string[]> = {
  admin: ['sysadmin', 'admin', 'admin_clerk', 'manager'],
  sales: ['sysadmin', 'admin', 'manager'],
  general: ['sysadmin', 'admin', 'manager', 'admin_clerk', 'finance', 'safety_officer', 'call_logger', 'junior_tech', 'senior_tech', 'viewer'],
}

export function visibleTaskCategories(user: User): TaskCategory[] {
  const roles = user.roles?.length ? user.roles : [user.role]
  return (Object.keys(TASK_CATEGORY_ROLES) as TaskCategory[]).filter(category =>
    TASK_CATEGORY_ROLES[category].some(role => roles.includes(role as User['role'])),
  )
}

export function visibleTrackerStreams(user: User): TrackerStream[] {
  const streams: TrackerStream[] = visibleTaskCategories(user)
  if (user.role === 'sysadmin' || (user.permissions ?? []).includes('callout.view')) streams.push('call-log')
  return streams
}

export function streamLabel(stream: TrackerStream): string {
  return stream === 'call-log' ? 'Call Log' : TASK_CATEGORY_LABELS[stream]
}

