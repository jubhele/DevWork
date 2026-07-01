import type { TaskCategory, TaskPriority, TaskStatus, User } from '@blackfire/types'

export type TrackerStream = TaskCategory | 'call-log'

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  admin: 'Admin Tasks',
  sales: 'Sales Tasks',
  general: 'General Tasks',
}

const CATEGORY_ROLES: Record<TaskCategory, string[]> = {
  admin: ['sysadmin', 'admin', 'admin_clerk', 'manager'],
  sales: ['sysadmin', 'admin', 'manager'],
  general: ['sysadmin', 'admin', 'manager', 'admin_clerk', 'finance', 'safety_officer', 'call_logger', 'junior_tech', 'senior_tech', 'viewer'],
}

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  Low: 'bg-ash',
  Normal: 'bg-info',
  High: 'bg-ember-amber',
  Urgent: 'bg-ember-red',
}

export const STATUS_BADGE: Record<TaskStatus, string> = {
  Open: 'bg-ember-amber/10 text-ember-amber border border-ember-amber/30',
  'In Progress': 'bg-info/10 text-info border border-info/30',
  Done: 'bg-success/10 text-success border border-success/30',
  Cancelled: 'bg-ash/10 text-ash border border-ash/30',
}

export function visibleTaskCategories(user: User): TaskCategory[] {
  const roles = user.roles?.length ? user.roles : [user.role]
  return (Object.keys(CATEGORY_ROLES) as TaskCategory[]).filter(category =>
    CATEGORY_ROLES[category].some(role => roles.includes(role as User['role'])),
  )
}

export function visibleCategoriesForRole(role: string): TaskCategory[] {
  return (Object.keys(CATEGORY_ROLES) as TaskCategory[]).filter(category => CATEGORY_ROLES[category].includes(role))
}

export function visibleTrackerStreams(user: User): TrackerStream[] {
  const streams: TrackerStream[] = visibleTaskCategories(user)
  if (user.role === 'sysadmin' || user.role === 'admin' || (user.permissions ?? []).includes('callout.view')) streams.push('call-log')
  return streams
}

export function streamLabel(stream: TrackerStream) {
  return stream === 'call-log' ? 'Call Log' : CATEGORY_LABELS[stream]
}
