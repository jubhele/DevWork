const streams = [
  ['Admin', 'Banking, finance follow-ups, compliance paperwork, recruitment, and internal administration.'],
  ['Sales', 'Client opportunities, proposals, capability planning, and work likely to become a quote.'],
  ['General', 'Internal systems, portal issues, team training, and cross-functional company work.'],
  ['Call Log', 'Real client incidents, dispatched service work, field jobs, and operational events that may lead to a quote or invoice.'],
]

export default function HelpPage() {
  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-5xl text-ink-text">Help & Guide</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Tracker and dashboard workflow</p>
      <section className="mb-6 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-ink-text">Choose the stream before you log work</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {streams.map(([name, description]) => <div key={name} className="border-l-2 border-fire-orange bg-charcoal p-4"><h3 className="font-semibold text-ink-text">{name}</h3><p className="mt-1 text-sm leading-6 text-ash">{description}</p></div>)}
        </div>
      </section>
      <section className="mb-6 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-ink-text">Work with a Tracker record</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-ash">
          <li>Open a task or Call Log row. Every tab shows Created, Start, End, and Due date and time.</li>
          <li>Use the Schedule section to set or change Start, End, and Due. Created is retained as a read-only timestamp.</li>
          <li>Add information with a label and description. Every entry becomes its own record in the description table.</li>
          <li>Edit an existing description and save it. The previous version is preserved as a revision.</li>
          <li>Upload supporting PDF, Word, Excel, JPEG, or PNG files in Files, then select View to open them.</li>
          <li>Schedule, description, and file changes are written to the Audit Log.</li>
        </ol>
      </section>
      <section className="rounded border border-steel-dark bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-ink-text">How the dashboard changed</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-ash">
          <li>Open Tasks counts active Admin, Sales, and General work visible to your role.</li>
          <li>Urgent Tasks highlights internal work that needs immediate attention.</li>
          <li>Open Callouts now counts only genuine operational jobs in the Call Log stream.</li>
          <li>Recent Tracker Activity links directly to the classified work item and preserves imported call-log references for audit history.</li>
        </ul>
      </section>
    </div>
  )
}
