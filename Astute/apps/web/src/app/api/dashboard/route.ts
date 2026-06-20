import { NextRequest, NextResponse } from 'next/server'

function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get('astute_session')?.value
  if (!token) return false
  try {
    JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    return true
  } catch {
    return false
  }
}

const METRICS = [
  { label: 'Active briefs',      value: '18' },
  { label: 'Pending approvals',  value: '06' },
  { label: 'Open tasks',         value: '24' },
]

const ACTIVITY = [
  { id: '1', title: 'Executive summary sent',  detail: 'North portfolio weekly report distributed at 08:15.',                    time: '08:15' },
  { id: '2', title: 'Risk note added',          detail: 'Site review requires follow-up on documentation completeness.',          time: '09:42' },
  { id: '3', title: 'Approval requested',       detail: 'Proposal pack moved to sign-off with attached evidence.',               time: '11:05' },
  { id: '4', title: 'Brief published',          detail: 'Updated threat assessment brief available in the Briefs section.',      time: '13:30' },
]

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, metrics: METRICS, activity: ACTIVITY })
}
