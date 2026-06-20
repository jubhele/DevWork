import Link from 'next/link'

const highlights = [
  { title: 'Unified reporting', copy: 'Pull research, delivery, and performance into a single executive view.' },
  { title: 'Decision support', copy: 'Move from raw signals to clear actions with minimal friction.' },
  { title: 'Client visibility', copy: 'Share status, evidence, and next steps without creating noise.' },
]

const modules = ['Insights', 'Reports', 'Tasks', 'Approvals', 'Notes', 'Exports']

export default function Page() {
  return (
    <main className="shell">
      <header className="nav">
        <div className="wrap nav-inner">
          <div>
            <div className="mono brand">Astute Insights</div>
            <div className="nav-sub">Analysis and reporting workspace</div>
          </div>
          <nav className="nav-links" aria-label="Primary">
            <a href="#highlights">Highlights</a>
            <a href="#platform">Platform</a>
            <a href="#mobile">Mobile</a>
          </nav>
          <Link className="btn ghost" href="/login">
            Sign in
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="mono eyebrow">Observe - Discern - Illuminate</p>
            <h1 className="title">Insight made deliberate.</h1>
            <p className="lede">
              A calm, branded platform for teams that need structured intelligence, executive visibility,
              and a mobile companion that keeps the work moving.
            </p>
            <div className="cta-row">
              <Link className="btn primary" href="/login">Enter the platform</Link>
              <a className="btn ghost" href="#mobile">See the mobile view</a>
            </div>
            <div className="metric-row">
              <div className="metric"><strong>01</strong><span>Shared workspace</span></div>
              <div className="metric"><strong>24/7</strong><span>Accessible anywhere</span></div>
              <div className="metric"><strong>TS</strong><span>TypeScript and Node.js</span></div>
            </div>
          </div>

          <aside className="panel hero-card">
            <div className="mono accent">Platform snapshot</div>
            <div className="stack">
              {highlights.map(item => (
                <div key={item.title} className="stack-card">
                  <h2>{item.title}</h2>
                  <p>{item.copy}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="section" id="highlights">
        <div className="wrap cards">
          {highlights.map(item => (
            <article key={item.title} className="panel card">
              <p className="mono accent">Capability</p>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="platform">
        <div className="wrap panel content-panel">
          <p className="mono accent">Platform</p>
          <h2>Clear structure. Quiet confidence.</h2>
          <p className="lede">
            The web app is a clean public entry point today and a foundation for authenticated dashboards,
            internal reporting, and partner-facing views tomorrow.
          </p>
          <div className="chip-row">
            {modules.map(item => <span key={item} className="chip">{item}</span>)}
          </div>
        </div>
      </section>

      <section className="section" id="mobile">
        <div className="wrap hero-grid">
          <div className="panel mobile-preview">
            <div>
              <p className="mono accent">Mobile companion</p>
              <h2>Decisions on the move.</h2>
            </div>
            <div className="phone">
              <div className="mono accent">Astute App</div>
              <h3>Today&apos;s brief</h3>
              <p>
                Short summaries, approvals, alerts, and notes designed for a field-ready workflow.
              </p>
              <div className="chip-row">
                {modules.map(item => <span key={item} className="chip">{item}</span>)}
              </div>
            </div>
          </div>
          <div className="panel card" id="contact">
            <p className="mono accent">Access</p>
            <h3>Ready for the first release</h3>
            <p>
              Sign in and dashboard screens are now part of the first pass. Next we can connect them to real data and access control.
            </p>
            <div className="cta-row">
              <Link className="btn primary" href="/login">Sign in</Link>
              <Link className="btn ghost" href="/dashboard">Open dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">Astute Insights - TypeScript - Node.js - Next.js - Expo</div>
      </footer>
    </main>
  )
}
