export type BriefItem = {
  id: string
  title: string
  tag: string
  date: string
  excerpt: string
  body: string
}

export type AlertItem = {
  id: string
  title: string
  detail: string
  time: string
  read: boolean
}

export type MetricItem = {
  label: string
  value: string
}

export const BRIEFS: BriefItem[] = [
  {
    id: 'b1',
    title: 'North Portfolio Weekly Update',
    tag: 'WEEKLY',
    date: '20 Jun 2026',
    excerpt: 'All monitored sites reported normal activity. Camera uptime averaged 98.2%.',
    body: 'All monitored sites within the North portfolio reported normal activity this week. Camera uptime averaged 98.2%. One access-control fault was logged at Entrance B of Site 03 and resolved within 4 hours. No incidents requiring escalation. The weekly summary has been distributed to all stakeholders.',
  },
  {
    id: 'b2',
    title: 'Risk Assessment — Site 07 Perimeter',
    tag: 'RISK',
    date: '19 Jun 2026',
    excerpt: 'Vegetation growth is obstructing two camera zones along the eastern perimeter.',
    body: 'Vegetation growth along the eastern perimeter of Site 07 is obstructing two camera zones. Recommended action: schedule a clearance crew within 72 hours. As an interim measure, patrol frequency for the affected zone has been increased. A follow-up assessment is required once clearance is complete.',
  },
  {
    id: 'b3',
    title: 'Approval Required — Q3 Reporting Pack',
    tag: 'ACTION',
    date: '18 Jun 2026',
    excerpt: 'Q3 executive reporting pack is ready for sign-off before distribution.',
    body: 'The Q3 executive reporting pack is ready for sign-off. Contents include incident summaries, SLA performance metrics, and trend analysis across all client sites. Approval is required from the senior analyst before the pack can be distributed to clients. Target distribution date is end of business 21 Jun 2026.',
  },
  {
    id: 'b4',
    title: 'New Monitoring Zone Commissioned',
    tag: 'UPDATE',
    date: '17 Jun 2026',
    excerpt: 'Zone 12 at the southern boundary is now live with full camera and sensor coverage.',
    body: 'Zone 12 at the southern boundary of the Chempark facility has been commissioned and is now live. Full camera coverage and perimeter sensor integration are confirmed. The zone has been added to the active monitoring dashboard and included in the weekly reporting cycle from this week forward.',
  },
]

export const ALERTS: AlertItem[] = [
  { id: 'a1', title: 'New brief published',  detail: 'North Portfolio Weekly Update is now available in Briefs.', time: '08:15', read: false },
  { id: 'a2', title: 'Approval waiting',     detail: 'Q3 Reporting Pack requires your sign-off.',               time: '09:42', read: false },
  { id: 'a3', title: 'Risk note updated',    detail: 'Site 07 perimeter assessment has been revised.',           time: '11:05', read: true  },
]

export const METRICS: MetricItem[] = [
  { label: 'Active briefs',     value: '18' },
  { label: 'Pending approvals', value: '06' },
  { label: 'Open tasks',        value: '24' },
]
