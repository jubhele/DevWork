import Link from 'next/link'
import { getCallouts } from '@/lib/data/callouts'
import { getTasks } from '@/lib/data/tasks'
import { KpiCard, KpiGrid, ReportFrame, SectionCard } from '@/components/report/ReportFrame'

const LINKS = [
  { href: '/tracker', label: 'Tracker', desc: 'Admin, Sales, General, and Call Log streams' },
  { href: '/ops/schedule', label: 'Schedule', desc: 'Due today and upcoming operational work' },
  { href: '/ops/tasks', label: 'Task Planning', desc: 'Assignee load and priority task pressure' },
]

export default async function OpsPage() {
  const [openTasks, openCallouts] = await Promise.all([
    getTasks({ status: ['Open', 'In Progress'], limit: 500 }).catch(() => ({ data: [] })),
    getCallouts({ limit: 500 }).catch(() => ({ data: [] })),
  ])

  const liveCallouts = openCallouts.data.filter(callout => ['Open', 'In Progress'].includes(callout.status))
  const urgentCallouts = liveCallouts.filter(callout => ['Urgent', 'Emergency'].includes(callout.priority))

  return (
    <ReportFrame title="Operations" eyebrow="Field operations - overview">
      <KpiGrid>
        <KpiCard label="Open Tasks" value={openTasks.data.length} sub="Internal workstreams" />
        <KpiCard label="Open Call Logs" value={liveCallouts.length} sub="Operational jobs only" />
        <KpiCard label="Urgent Jobs" value={urgentCallouts.length} sub="Urgent and emergency" tone={urgentCallouts.length ? 'warning' : 'default'} />
        <KpiCard label="Commercial Docs" value="Finance" sub="Quote Log and invoices" />
      </KpiGrid>

      <SectionCard title="Operations Workspace">
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {LINKS.map(link => (
            <Link key={link.href} href={link.href} className="block border border-steel-dark bg-white p-5 transition-colors hover:border-fire-orange">
              <p className="text-[11px] uppercase tracking-[0.22em] text-fire-orange">{link.label}</p>
              <p className="mt-2 text-sm leading-6 text-ash">{link.desc}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </ReportFrame>
  )
}
