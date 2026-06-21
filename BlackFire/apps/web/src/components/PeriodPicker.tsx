'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function PeriodPicker() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const year  = Number(searchParams.get('year')  ?? currentYear)
  const month = Number(searchParams.get('month') ?? (new Date().getMonth() + 1))

  function update(key: 'year' | 'month', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={e => update('month', e.target.value)}
        className="rounded border border-steel-dark bg-white px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-ash focus:outline-none focus:ring-1 focus:ring-fire-orange"
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={e => update('year', e.target.value)}
        className="rounded border border-steel-dark bg-white px-3 py-1.5 text-xs tracking-[0.16em] text-ash focus:outline-none focus:ring-1 focus:ring-fire-orange"
      >
        {YEARS.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
