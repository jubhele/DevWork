import { cookies } from 'next/headers'
import { can, getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSafetyFiles } from '@/lib/data/safety'
import { FilterTabs, KpiCard, KpiGrid, ReportFrame, SectionCard } from '@/components/report/ReportFrame'
import type { SafetyFile } from '@blackfire/types'

function StatusBadge({ value }: { value: string }) {
  const tone =
    value === 'Approved' || value === 'Compliant' ? 'bg-success/10 text-success' :
    value === 'Expired' ? 'bg-danger/10 text-danger' :
    value === 'Expiring Soon' ? 'bg-warning/10 text-warning' :
    'bg-info/10 text-info'
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>
}

const FILTERS = [
  { value: 'all', label: 'All Files' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
]

function scoreTone(score: number | null): 'default' | 'warning' | 'danger' | 'info' {
  if (score == null) return 'info'
  if (score < 75) return 'danger'
  if (score < 90) return 'warning'
  return 'default'
}

function getSafetyScore(file: SafetyFile) {
  return file.score_percent || file.score
}

function getAverageScore(files: SafetyFile[]) {
  const scored = files.map(getSafetyScore).filter(score => Number.isFinite(score))
  if (!scored.length) return null
  return Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length)
}

function getRegions(files: SafetyFile[]) {
  const regions = new Map<string, { total: number; approved: number; submitted: number; risk: number; scoreTotal: number; scoreCount: number }>()

  files.forEach(file => {
    const key = file.site || 'Unassigned'
    const current = regions.get(key) ?? { total: 0, approved: 0, submitted: 0, risk: 0, scoreTotal: 0, scoreCount: 0 }
    const score = getSafetyScore(file)
    current.total += 1
    if (file.status === 'Approved') current.approved += 1
    if (file.status === 'Submitted') current.submitted += 1
    if (Number.isFinite(score)) {
      current.scoreTotal += score
      current.scoreCount += 1
      if (score < 75) current.risk += 1
    }
    regions.set(key, current)
  })

  return [...regions.entries()]
    .map(([name, region]) => ({
      name,
      ...region,
      score: region.scoreCount ? Math.round(region.scoreTotal / region.scoreCount) : null,
    }))
    .sort((a, b) => b.total - a.total)
}

export default async function SafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const user = await getServerUser((await cookies()).toString())
  if (!user) redirect('/login')
  const filter = (await searchParams).filter ?? 'all'
  const files = await getSafetyFiles({ filter })
  const allFiles = filter === 'all' ? files : await getSafetyFiles({ filter: 'all' })
  const averageScore = getAverageScore(allFiles)
  const approvedFiles = allFiles.filter(file => file.status === 'Approved').length
  const submittedFiles = allFiles.filter(file => file.status === 'Submitted').length
  const riskFiles = allFiles.filter(file => getSafetyScore(file) < 75).length
  const regions = getRegions(allFiles)

  return (
    <ReportFrame
      title="Safety & Compliance"
      eyebrow="Compliance and safety document management"
      action={user != null && can(user, 'safety.create') ? { href: '/safety/new', label: '+ New Audit' } : undefined}
    >
      <KpiGrid>
        <KpiCard
          label="Compliance Score"
          value={averageScore == null ? 'N/A' : `${averageScore}%`}
          sub={averageScore == null ? 'No scored files yet' : averageScore >= 90 ? 'Complying' : averageScore >= 75 ? 'Minor concerns' : 'Action required'}
          tone={scoreTone(averageScore)}
        />
        <KpiCard label="Approved Files" value={approvedFiles} sub={`${allFiles.length} active files`} />
        <KpiCard label="Under Review" value={submittedFiles} sub="Submitted for approval" tone={submittedFiles ? 'warning' : 'default'} />
        <KpiCard label="Risk Signals" value={riskFiles} sub="Files below 75%" tone={riskFiles ? 'danger' : 'default'} />
      </KpiGrid>

      <SectionCard title="Regional Compliance">
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {regions.length ? regions.slice(0, 4).map(region => (
            <article key={region.name} className="rounded border border-steel-dark bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-2xl text-ink-text">{region.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ash">{region.total} files | {region.approved} approved | {region.submitted} review</p>
                </div>
                <span className={`font-display text-3xl leading-none ${region.score != null && region.score < 75 ? 'text-danger' : region.score != null && region.score < 90 ? 'text-warning' : 'text-success'}`}>
                  {region.score == null ? 'N/A' : `${region.score}%`}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded bg-charcoal">
                <div className="h-full bg-success" style={{ width: `${region.total ? Math.round((region.approved / region.total) * 100) : 0}%` }} />
              </div>
              <p className="mt-3 text-sm text-ash">{region.risk ? `${region.risk} low-score files need attention.` : 'No low-score files flagged.'}</p>
            </article>
          )) : (
            <p className="py-8 text-center text-ash md:col-span-2">No regional safety files found.</p>
          )}
        </div>
      </SectionCard>

      <FilterTabs
        items={FILTERS.map(f => ({
          href: `/safety?filter=${f.value}`,
          label: f.label,
          active: filter === f.value,
        }))}
      />

      <SectionCard title="Safety Records" className="mt-6">
        <div className="grid gap-3 p-4 md:hidden">
          {files.length ? files.map(f => (
            <article key={f.id} className="rounded border border-steel-dark bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-fire-orange">{f.ref_id}</p>
                  <h3 className="mt-1 truncate font-medium text-ink-text">{f.client_name}</h3>
                  <p className="mt-1 text-sm text-ash">{f.site}</p>
                </div>
                <StatusBadge value={f.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-ash">
                <div><dt className="uppercase tracking-[0.14em]">Score</dt><dd className="mt-1 text-sm text-ink-text">{Math.round(getSafetyScore(f))}%</dd></div>
                <div><dt className="uppercase tracking-[0.14em]">Created</dt><dd className="mt-1 text-sm text-ink-text">{new Date(f.created_at).toLocaleDateString('en-ZA')}</dd></div>
              </dl>
            </article>
          )) : (
            <p className="py-10 text-center text-ash">No safety files found for this filter.</p>
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Approved</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {files.length ? files.map(f => (
                <tr key={f.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                  <td className="px-4 py-3 font-mono text-xs text-fire-orange">{f.ref_id}</td>
                  <td className="px-4 py-3 font-medium text-ink-text">{f.client_name}</td>
                  <td className="px-4 py-3 text-ash">{f.site}</td>
                  <td className="px-4 py-3"><StatusBadge value={f.status} /></td>
                  <td className="px-4 py-3 text-ash">{f.approved_at ? new Date(f.approved_at).toLocaleDateString('en-ZA') : '—'}</td>
                  <td className="px-4 py-3 text-ash">{new Date(f.created_at).toLocaleDateString('en-ZA')}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-ash">No safety files found for this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </ReportFrame>
  )
}
