import Link from 'next/link'
import type { ReactNode } from 'react'

type ReportFrameProps = {
  title: string
  eyebrow?: string
  action?: {
    href: string
    label: string
  }
  children: ReactNode
  className?: string
}

export function ReportFrame({ title, eyebrow, action, children, className = '' }: ReportFrameProps) {
  return (
    <section className={`space-y-6 ${className}`.trim()}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] uppercase tracking-[0.28em] text-ash">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-text sm:text-5xl">{title}</h1>
        </div>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex w-fit items-center justify-center rounded-[2px] border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-fire-orange/90"
          >
            {action.label}
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  )
}

type KpiCardProps = {
  label: string
  value: string | number
  sub?: string
  tone?: 'default' | 'warning' | 'danger' | 'info'
}

export function KpiCard({ label, value, sub, tone = 'default' }: KpiCardProps) {
  const toneClasses =
    tone === 'warning' ? 'text-warning' :
    tone === 'danger' ? 'text-danger' :
    tone === 'info' ? 'text-info' :
    'text-ink-text'

  return (
    <article className="rounded-[2px] border border-[#ccc] bg-white p-5 shadow-none">
      <p className="text-[11px] uppercase tracking-[0.28em] text-ash">{label}</p>
      <p className={`mt-2 font-display text-4xl leading-none sm:text-[44px] ${toneClasses}`}>{value}</p>
      {sub ? <p className="mt-2 text-xs text-ash">{sub}</p> : null}
    </article>
  )
}

type KpiGridProps = {
  children: ReactNode
}

export function KpiGrid({ children }: KpiGridProps) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
}

type SectionCardProps = {
  title: string
  action?: {
    href: string
    label: string
  }
  children: ReactNode
  className?: string
}

export function SectionCard({ title, action, children, className = '' }: SectionCardProps) {
  return (
    <section className={`overflow-hidden rounded-[2px] border border-[#ccc] bg-white shadow-none ${className}`.trim()}>
      <div className="flex items-center justify-between border-b border-[#ccc] bg-[#e4e4e4] px-5 py-4">
        <h2 className="font-display text-xl text-ink-text">{title}</h2>
        {action ? (
          <Link href={action.href} className="text-xs uppercase tracking-[0.16em] text-fire-orange">
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

type TabsProps = {
  items: Array<{
    href: string
    label: string
    active: boolean
  }>
}

export function FilterTabs({ items }: TabsProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-steel-dark">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`-mb-px whitespace-nowrap border-b-2 px-5 py-3 text-xs uppercase tracking-[0.2em] ${
            item.active ? 'border-fire-orange text-fire-orange' : 'border-transparent text-ash hover:text-ink-text'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
