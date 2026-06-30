import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-3xl rounded border border-steel-dark bg-white p-8 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-ash">403 Access Denied</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-text">You do not have permission to view this page.</h1>
      <p className="mt-4 text-sm text-ash">
        Your account is signed in, but your current role does not include the permissions required for this section.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
        >
          Go To Dashboard
        </Link>
        <Link
          href="/help"
          className="rounded border border-steel-dark bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ash"
        >
          Open Help
        </Link>
      </div>
    </div>
  )
}
