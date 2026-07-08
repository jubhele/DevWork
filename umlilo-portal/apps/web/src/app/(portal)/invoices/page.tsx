import PowerBIReport from '@/components/PowerBIReport'

export default async function InvoicesPage() {
  return (
    <div>
      <div className="mb-6 max-w-4xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ash">Finance reporting</p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-none text-bone-paper">Invoices</h1>
        <p className="mt-4 text-sm text-ash">
          The invoice surface now opens the secure Power BI finance report in-portal instead of the legacy invoice table.
        </p>
        <p className="mt-2 text-xs text-steel">
          The token request includes an effective identity with a Power BI role so data is filtered per portal access.
        </p>
      </div>

      <PowerBIReport surface="invoices" />
    </div>
  )
}
