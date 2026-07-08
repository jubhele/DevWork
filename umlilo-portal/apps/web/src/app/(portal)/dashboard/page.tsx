import PowerBIReport from '@/components/PowerBIReport'

export default async function DashboardPage() {
  return (
    <div>
      <div className="mb-6 max-w-4xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ash">Executive reporting</p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-none text-bone-paper">Dashboard</h1>
        <p className="mt-4 text-sm text-ash">
          This surface now shows the secure Power BI executive view inside the portal instead of the old KPI cards.
        </p>
        <p className="mt-2 text-xs text-steel">
          Power BI RLS is enforced through the portal user identity and the embedded token.
        </p>
      </div>

      <PowerBIReport surface="dashboard" />
    </div>
  )
}
