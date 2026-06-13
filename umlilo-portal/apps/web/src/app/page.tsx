'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import './landing.css'

const TESTIMONIALS = [
  {
    q: 'Two break-in attempts in the year before BlackFire. Zero since. The drone overwatch on our perimeter changed what “patrolled” means — and every incident is logged in the portal before I even ask.',
    w: 'Facilities Manager',
    p: 'Chemical Manufacturing · Kempton Park, Gauteng',
  },
  {
    q: 'They took over from our previous provider with no coverage gap — equipment audited, codes changed, officers posted, all in one weekend. The handover plan they promised is the handover we got.',
    w: 'Estate Manager',
    p: 'Residential Estate · Midrand, Gauteng',
  },
  {
    q: 'The monthly report used to be a phone call and a promise. Now it is callout logs, inspection records and safety files I can open myself. That visibility is why we renewed.',
    w: 'Operations Director',
    p: 'Logistics & Warehousing · Johannesburg South',
  },
]

const WIZARD_STEPS = ['CONTACT', 'SITE', 'REQUIREMENTS', 'REVIEW']

export default function PublicLanding() {
  const router = useRouter()
  const [navSolid, setNavSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [wizStep, setWizStep] = useState(1)
  const [wizDone, setWizDone] = useState(false)
  const [wizErr, setWizErr] = useState('')
  const [tIndex, setTIndex] = useState(0)
  const [newsEmail, setNewsEmail] = useState('')
  const [newsOk, setNewsOk] = useState(false)
  const [chips, setChips] = useState<Record<string, boolean>>({})
  const [ignDone, setIgnDone] = useState(false)
  const [ignPct, setIgnPct] = useState(0)

  const wForm = useRef<{ name: string; company: string; phone: string; email: string; site_type: string; province: string; area: string; message: string }>({
    name: '', company: '', phone: '', email: '', site_type: '', province: '', area: '', message: '',
  })
  const [formV, setFormV] = useState({ ...wForm.current })

  const updateField = (k: keyof typeof wForm.current, v: string) => {
    wForm.current[k] = v
    setFormV(prev => ({ ...prev, [k]: v }))
  }

  // Ignition preloader
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || sessionStorage.getItem('bf_ign')) { setIgnDone(true); return }
    let pct = 0
    const t = setInterval(() => {
      pct = Math.min(100, pct + Math.ceil(Math.random() * 16))
      setIgnPct(pct)
      if (pct >= 100) {
        clearInterval(t)
        sessionStorage.setItem('bf_ign', '1')
        setTimeout(() => setIgnDone(true), 180)
      }
    }, 90)
    return () => clearInterval(t)
  }, [])

  // Sticky nav
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 64)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll reveals
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.v3-landing .rv').forEach(el => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.15 })
    document.querySelectorAll('.v3-landing .rv').forEach((el, i) => {
      ;(el as HTMLElement).style.transitionDelay = (reduced ? 0 : (i % 6) * 60) + 'ms'
      io.observe(el)
    })
    return () => io.disconnect()
  }, [ignDone])

  // Count-up
  useEffect(() => {
    if (!ignDone) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        cio.unobserve(e.target)
        const el = e.target as HTMLElement
        const end = parseInt(el.dataset.count || '0', 10)
        if (reduced) { el.textContent = String(end); return }
        let t0: number | null = null
        const step = (ts: number) => {
          if (!t0) t0 = ts
          const p = Math.min(1, (ts - t0) / 1400)
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
    }, { threshold: 0.4 })
    document.querySelectorAll('.v3-landing [data-count]').forEach(el => cio.observe(el))
    return () => cio.disconnect()
  }, [ignDone])

  // Testimonials auto-rotate
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const interval = setInterval(() => setTIndex(i => (i + 1) % TESTIMONIALS.length), 7000)
    return () => clearInterval(interval)
  }, [])

  const validate = (step: number): string => {
    const f = wForm.current
    if (step === 1) {
      if (!f.name.trim()) return 'Please enter your full name.'
      if (!f.phone.trim()) return 'Please enter a phone number.'
      if (!f.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return 'Please enter a valid email address.'
    }
    if (step === 2) {
      if (!f.site_type) return 'Please select a site type.'
      if (!f.province) return 'Please select a province.'
      if (!f.area.trim()) return 'Please tell us the town or area.'
    }
    if (step === 3 && !Object.values(chips).some(Boolean)) return 'Select at least one requirement.'
    return ''
  }

  const wizNext = (consent: boolean) => {
    setWizErr('')
    const err = validate(wizStep)
    if (err) { setWizErr(err); return }
    if (wizStep === 4) {
      if (!consent) { setWizErr('Please confirm POPIA consent to submit.'); return }
      setWizDone(true)
      return
    }
    setWizStep(s => s + 1)
  }

  const [consent, setConsent] = useState(false)

  const selectedNeeds = Object.entries(chips).filter(([, v]) => v).map(([k]) => k)

  return (
    <div className="v3-landing">
      {/* Ignition */}
      <div id="ignition" className={ignDone ? 'done' : ''} aria-hidden="true">
        <div className="ign-tri" style={{ ['--fill' as string]: ignPct + '%' }} />
        <div className="ign-count">IGNITION <b>{ignPct}%</b></div>
      </div>

      {/* Topbar */}
      <div className="v3-topbar">
        <div><span className="pulse" />24/7 ARMED RESPONSE &middot; EMERGENCY LINE</div>
        <a href="tel:+27689126581">+27 68 912 6581</a>
      </div>

      {/* Nav */}
      <nav className={navSolid ? 'solid' : ''} style={{ position: 'sticky', top: 0 }}>
        <a className="nav-logo" href="#top" aria-label="BlackFire Solutions home">
          <Image src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" width={120} height={46} style={{ height: 46, width: 'auto' }} priority unoptimized />
        </a>
        <div className={`nav-links${menuOpen ? ' open' : ''}`} id="navLinks">
          <a href="#top" className="active">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#faq">FAQ</a>
          <a href="#assess">Get Assessed</a>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="v3-btn v3-btn-ghost nav-cta" onClick={() => router.push('/login')}>Umlilo Portal &rarr;</button>
          <button className="ham-btn" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>&#8801;</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero" id="top">
        <div className="izilo-triangle-bg" />
        <div className="wrap">
          <div>
            <div className="eyebrow rv">BlackFire Solutions &middot; PSIRA Registered &middot; Gauteng &rarr; Nationwide</div>
            <h1 className="rv">Security<br /><span className="fire">engineered</span><br />to <span className="ember">protect.</span></h1>
            <p className="hero-sub rv">Drone surveillance, AI-monitored CCTV, access control, armed response and guard deployment &mdash; integrated under one command, purpose-built for industrial, commercial and residential sites across South Africa.</p>
            <div className="hero-actions rv">
              <a className="v3-btn v3-btn-fire" href="#assess">Request a Security Assessment</a>
              <a className="v3-btn v3-btn-ghost" href="#services">Our Services</a>
            </div>
            <div className="proof-chip rv">
              <span className="num" data-count="500">0</span>
              <span className="lbl">Active clients<br />nationwide</span>
            </div>
          </div>
          <div className="scene-frame hero-frame rv">
            <Image src="https://images.unsplash.com/photo-1670689334799-cdc6777db8cc?auto=format&fit=crop&w=1100&h=1375&q=80" alt="Industrial plant fully lit at night" fill style={{ objectFit: 'cover' }} loading="lazy" unoptimized />
            <span className="brief-chip">IMG-BRIEF-01</span>
          </div>
        </div>
        <div className="scroll-cue"><span>SCROLL</span><span className="tri" /></div>
      </header>

      <div className="izilo-band izilo-chevron drift" role="presentation" />

      {/* Assessment Wizard */}
      <section id="assess">
        <div className="wrap">
          <div className="sec-head rv">
            <div className="eyebrow">Get Assessed</div>
            <h2>Tell us about your site. We come back with a plan.</h2>
            <p className="sec-sub">Four short steps &mdash; under five minutes. A BlackFire assessor reviews every submission personally and responds within one business day.</p>
          </div>
          <div className="wizard rv">
            {!wizDone && (
              <>
                <div className="wiz-progress" aria-hidden="true">
                  {[1,2,3,4].map(i => <span key={i} className={wizStep >= i ? 'on' : ''} />)}
                </div>
                <div className="wiz-counter">STEP <b>0{wizStep}</b> / 04 &middot; <span>{WIZARD_STEPS[wizStep - 1]}</span></div>
              </>
            )}

            {wizStep === 1 && !wizDone && (
              <div className="wiz-step on">
                <h3>Who should we contact?</h3>
                <div className="wiz-grid">
                  <div className="field"><label>Full name</label><input type="text" value={formV.name} onChange={e => updateField('name', e.target.value)} placeholder="Your name" /></div>
                  <div className="field"><label>Company (optional)</label><input type="text" value={formV.company} onChange={e => updateField('company', e.target.value)} placeholder="Company name" /></div>
                  <div className="field"><label>Phone / WhatsApp</label><input type="tel" value={formV.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+27" /></div>
                  <div className="field"><label>Email</label><input type="email" value={formV.email} onChange={e => updateField('email', e.target.value)} placeholder="email@company.co.za" /></div>
                </div>
              </div>
            )}
            {wizStep === 2 && !wizDone && (
              <div className="wiz-step on">
                <h3>Tell us about the site</h3>
                <div className="wiz-grid">
                  <div className="field"><label>Site type</label>
                    <select value={formV.site_type} onChange={e => updateField('site_type', e.target.value)}>
                      <option value="">Select&hellip;</option>
                      {['Industrial / Plant','Commercial / Office','Residential Estate','Private Residence','Agricultural','Event / Temporary'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>Province</label>
                    <select value={formV.province} onChange={e => updateField('province', e.target.value)}>
                      <option value="">Select&hellip;</option>
                      {['Gauteng','KwaZulu-Natal','Western Cape','Eastern Cape','Free State','Limpopo','Mpumalanga','North West','Northern Cape'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="field full"><label>Town / area</label><input type="text" value={formV.area} onChange={e => updateField('area', e.target.value)} placeholder="e.g. Kempton Park" /></div>
                </div>
              </div>
            )}
            {wizStep === 3 && !wizDone && (
              <div className="wiz-step on">
                <h3>What does the site need?</h3>
                <div className="field full" style={{ marginBottom: 14 }}>
                  <label>Select all that apply</label>
                  <div className="chiprow">
                    {['Armed Response','Drone Surveillance','CCTV & AI Monitoring','Access Control','Guard Deployment','Electronic Security','Perimeter Detection','Risk & Compliance'].map(n => (
                      <button key={n} type="button" className="chip" aria-pressed={!!chips[n]} onClick={() => setChips(c => ({ ...c, [n]: !c[n] }))}>{n}</button>
                    ))}
                  </div>
                </div>
                <div className="field full"><label>Anything we should know? (optional)</label><textarea value={formV.message} onChange={e => updateField('message', e.target.value)} maxLength={2000} /></div>
              </div>
            )}
            {wizStep === 4 && !wizDone && (
              <div className="wiz-step on">
                <h3>Review &amp; submit</h3>
                <dl className="wiz-review">
                  <dt>Contact</dt><dd>{formV.name}{formV.company ? ` · ${formV.company}` : ''}</dd>
                  <dt>Reach you on</dt><dd>{formV.phone} &middot; {formV.email}</dd>
                  <dt>Site</dt><dd>{formV.site_type} &mdash; {formV.area}, {formV.province}</dd>
                  <dt>Requirements</dt><dd>{selectedNeeds.join(' · ') || '—'}</dd>
                  <dt>Notes</dt><dd>{formV.message || '—'}</dd>
                </dl>
                <label className="consent">
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                  <span>I consent to BlackFire Solutions processing these details to prepare a security assessment, in line with POPIA. Details are never shared with third parties.</span>
                </label>
              </div>
            )}
            {wizDone && (
              <div className="wiz-step on" data-step="5">
                <div className="wiz-done">
                  <div className="tri" />
                  <h3>Assessment request received.</h3>
                  <p style={{ color: 'var(--ink-2)', fontSize: 15 }}>A BlackFire assessor will contact you within one business day. Urgent? Call <strong>+27 68 912 6581</strong> &mdash; the line is live 24/7.</p>
                </div>
              </div>
            )}

            {wizErr && <div className="wiz-err" role="alert">{wizErr}</div>}
            {!wizDone && (
              <div className="wiz-nav">
                <button className="btn-back" disabled={wizStep === 1} onClick={() => { setWizErr(''); setWizStep(s => Math.max(1, s - 1)) }}>Back</button>
                <button className="btn-fire-l" onClick={() => wizNext(consent)}>{wizStep === 4 ? 'Submit Request' : 'Next'}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="izilo-band izilo-diamond drift" role="presentation" />

      {/* About */}
      <section className="sec-light" id="about">
        <div className="wrap about-grid">
          <div style={{ position: 'relative' }} className="rv">
            <div className="scene-frame about-frame">
              <Image src="https://images.unsplash.com/photo-1772743227731-e16af7c8d85a?auto=format&fit=crop&w=1100&h=825&q=80" alt="Officer on rooftop patrol" fill style={{ objectFit: 'cover' }} loading="lazy" unoptimized />
              <span className="brief-chip">IMG-BRIEF-02</span>
            </div>
            <div className="float-badge" style={{ right: -14, bottom: 26 }}><div className="v">10+</div><div className="k">Years protecting</div></div>
            <div className="float-badge" style={{ left: -14, top: 26 }}><div className="v" style={{ fontSize: 14 }}>PSIRA</div><div className="k">Registered</div></div>
          </div>
          <div>
            <div className="eyebrow rv">About BlackFire Solutions</div>
            <h2 className="rv" style={{ fontFamily: 'var(--f-disp)', fontWeight: 800, textTransform: 'uppercase', fontSize: 'clamp(32px,4.2vw,50px)', lineHeight: 1.03, color: 'var(--ink)' }}>The security partner industrial South Africa runs on.</h2>
            <p className="rv" style={{ marginTop: 18, color: 'var(--ink-2)', fontSize: 16.5 }}>From chemical plants to residential estates, BlackFire Solutions designs, deploys and operates integrated security &mdash; and gives every client live visibility through the Umlilo Portal: callouts, safety files, inspections and reporting in one place.</p>
            <ul className="about-points rv">
              <li><span className="dmark" />PSIRA registered, fully insured, personnel vetted and certified to national standards.</li>
              <li><span className="dmark" />One control room. Drones, CCTV, alarms and response units under a single command.</li>
              <li><span className="dmark" />Every callout, inspection and safety file logged and visible to you in the Umlilo Portal.</li>
              <li><span className="dmark" />Dedicated account manager, monthly reporting, scheduled site visits.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services">
        <div className="izilo-triangle-bg" />
        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div className="sec-head rv">
            <div className="eyebrow">What We Do</div>
            <h2>Eight disciplines. One command.</h2>
            <p className="sec-sub">Fifty-five services across eight specialist disciplines &mdash; designed to interlock, not to be sold piecemeal.</p>
          </div>
          <div className="svc-grid">
            {[
              { img: 'photo-1485230405346-71acb9518d9c', alt: 'Security officer standing post', g: 'g-up', h: 'Armed Response', p: '24/7 tactical units on standby. Average response under four minutes in covered zones.' },
              { img: 'photo-1569228593208-6314ad85a2ba', alt: 'Drone at sunset', g: 'g-down', h: 'Drone Surveillance', p: 'Aerial patrol, thermal imaging and incident overwatch for large perimeters and events.' },
              { img: 'photo-1496368077930-c1e31b4e5b44', alt: 'CCTV cameras', g: 'g-diamond', h: 'CCTV & AI Monitoring', p: 'AI-assisted camera networks monitored live from our control room — not after the fact.' },
              { img: 'photo-1618482914248-29272d021005', alt: 'Access control hardware', g: 'g-up', h: 'Access Control', p: 'Biometric, vehicle and visitor management systems for sites that take entry seriously.' },
              { img: 'photo-1581568736305-49a04e012c13', alt: 'Guard on patrol', g: 'g-down', h: 'Guard Deployment', p: 'Vetted, trained officers — armed and unarmed — deployed to industrial, commercial and residential posts.' },
              { img: 'photo-1670689334024-ad61dd564fe2', alt: 'Electronic security systems', g: 'g-diamond', h: 'Electronic Security', p: 'Alarms, panic systems, monitoring and analogue-to-IP upgrades, installed and maintained.' },
              { img: 'photo-1687274427456-ccf06e264df2', alt: 'Perimeter fence', g: 'g-up', h: 'Perimeter Detection', p: 'Electric fencing, beams and thermal lines that find the breach before it becomes an entry.' },
              { img: 'photo-1484480974693-6ca0a78fb36b', alt: 'Inspection checklist', g: 'g-down', h: 'Risk & Compliance', p: 'Site assessments, safety files and audit-ready documentation — managed in the Umlilo Portal.' },
            ].map(s => (
              <div className="svc-card rv" key={s.h}>
                <div className="svc-img">
                  <Image src={`https://images.unsplash.com/${s.img}?auto=format&fit=crop&w=800&h=500&q=80`} alt={s.alt} fill style={{ objectFit: 'cover' }} loading="lazy" unoptimized />
                  <span className={`svc-glyph ${s.g}`} />
                </div>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
          <div className="svc-more rv"><a href="#assess">VIEW ALL 55 SERVICES &rarr;</a></div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="izilo-triangle-bg" />
        <div className="wrap stats-grid">
          {[
            { count: 500, suffix: '+', label: 'Active clients', prefix: null },
            { count: 4, suffix: 'min', label: 'Avg. response', prefix: '<' },
            { count: null, suffix: '/7', label: 'Control room', prefix: '24' },
            { count: 55, suffix: '+', label: 'Services offered', prefix: null },
          ].map((s, i) => (
            <div className="stat rv" key={i}>
              <div className="v">
                {s.prefix && <small>{s.prefix}</small>}
                {s.count !== null ? <span data-count={s.count}>0</span> : '24'}
                <small>{s.suffix}</small>
              </div>
              <div className="k">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="izilo-band izilo-diamond drift" role="presentation" />

      {/* Testimonials */}
      <section>
        <div className="wrap">
          <div className="sec-head rv" style={{ textAlign: 'center', margin: '0 auto' }}>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>Client Feedback</div>
            <h2 style={{ margin: '0 auto' }}>Sites that stayed protected. Clients that stayed.</h2>
          </div>
          <div className="tst rv" aria-live="polite">
            <blockquote>&ldquo;{TESTIMONIALS[tIndex].q}&rdquo;</blockquote>
            <div className="who">{TESTIMONIALS[tIndex].w}</div>
            <div className="where">{TESTIMONIALS[tIndex].p}</div>
          </div>
          <div className="tst-dots" role="tablist" aria-label="Testimonials">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} type="button" role="tab" aria-label={`Testimonial ${i + 1}`} aria-selected={i === tIndex} onClick={() => setTIndex(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec-light" id="faq">
        <div className="wrap">
          <div className="sec-head rv">
            <div className="eyebrow">Questions, answered</div>
            <h2>Before you sign anything, know everything.</h2>
          </div>
          <div className="faq-grid">
            <div className="rv">
              <div className="scene-frame faq-frame">
                <Image src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=900&h=1200&q=80" alt="Wall of surveillance cameras" fill style={{ objectFit: 'cover' }} loading="lazy" unoptimized />
                <span className="brief-chip">IMG-BRIEF-03</span>
              </div>
              <div className="faq-call">
                <div className="k">Prefer to talk it through?</div>
                <a className="v" href="tel:+27689126581">+27 68 912 6581</a>
              </div>
            </div>
            <div>
              {[
                { q: 'What does a security assessment involve?', a: 'An assessor visits your site, walks the perimeter and entry points, reviews existing systems and incident history, and maps your actual risk profile. You receive a written assessment with recommendations — whether or not you proceed with us.' },
                { q: 'How fast is armed response, really?', a: 'In covered zones our average is under four minutes. During your assessment we tell you honestly what response time your specific location can expect — before you sign, not after.' },
                { q: 'What is the Umlilo Portal?', a: 'Our client portal. Every callout, inspection, safety file and invoice on your account is logged and visible to you in real time. It is how we stay accountable — you see what we see.' },
                { q: 'Are your officers PSIRA registered?', a: 'Yes — BlackFire Solutions is a PSIRA registered company and every officer we deploy is individually registered, vetted and trained to national standards.' },
                { q: 'Can you take over from our current provider?', a: 'Yes. We manage handovers regularly — including notice-period overlap, equipment audits and re-keying or re-coding of access systems so there is no coverage gap on day one.' },
              ].map((f, i) => (
                <details key={i} className="acc rv" open={i === 0}>
                  <summary>{f.q}<span className="mk" /></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="eyebrow">How it works</div>
            <h2>From first call to full deployment.</h2>
          </div>
          <div className="steps">
            <div className="step rv"><div className="n">01</div><h3>Assessment</h3><p>Submit the form or call. An assessor visits your site, maps the risk profile and documents what you actually need — in writing.</p></div>
            <div className="step rv"><div className="n">02</div><h3>Proposal</h3><p>You receive an itemised proposal: services, equipment, deployment plan and pricing. No vague line items, no hidden costs, no pressure.</p></div>
            <div className="step rv"><div className="n">03</div><h3>Deployment</h3><p>Systems installed, officers posted, control room live. Your Umlilo Portal access is activated on day one — visibility from the first shift.</p></div>
          </div>
        </div>
      </section>

      <div className="izilo-band izilo-chevron drift" role="presentation" />

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="scene-frame cta-frame">
          <Image src="https://images.unsplash.com/photo-1642285709726-f9eb035b034b?auto=format&fit=crop&w=2100&h=800&q=80" alt="Wide industrial plant at night" fill style={{ objectFit: 'cover' }} loading="lazy" unoptimized />
          <span className="brief-chip">IMG-BRIEF-04</span>
        </div>
        <div className="cta-overlay">
          <div className="wrap">
            <h2 className="rv">Your site.<br /><span className="ember">Secured properly.</span></h2>
            <p className="rv">A tailored assessment and itemised proposal within one business day.</p>
            <a className="v3-btn v3-btn-fire rv" href="#assess">Get Started Now</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <Image src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" width={140} height={52} style={{ height: 52, width: 'auto' }} unoptimized />
            <div className="foot-tag">Fire, taught to behave.</div>
            <p>PSIRA registered security, headquartered in Gauteng, operating nationwide. Drone surveillance, AI CCTV, armed response and integrated systems — with full client visibility through the Umlilo Portal.</p>
          </div>
          <div className="foot-col">
            <h4>Services</h4>
            <a href="#services">Armed Response</a>
            <a href="#services">Drone Surveillance</a>
            <a href="#services">CCTV &amp; AI Monitoring</a>
            <a href="#services">Access Control</a>
            <a href="#services">Guard Deployment</a>
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#faq">FAQ</a>
            <a href="#assess">Request Assessment</a>
            <a href="tel:+27689126581">+27 68 912 6581</a>
            <a href="mailto:info@blackfiresolutions.co.za">info@blackfiresolutions.co.za</a>
            <span className="login-link" onClick={() => router.push('/login')}>Umlilo Portal &rarr;</span>
          </div>
          <div className="foot-col news">
            <h4>Stay informed</h4>
            <label htmlFor="newsEmail">Security advisories and service updates. No noise.</label>
            <div className="news-row">
              <input id="newsEmail" type="email" value={newsEmail} onChange={e => setNewsEmail(e.target.value)} placeholder={newsOk ? 'You’re on the list — thank you.' : 'you@company.co.za'} autoComplete="email" />
              <button type="button" aria-label="Subscribe" onClick={() => { if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsEmail)) { setNewsOk(true); setNewsEmail('') } }}>
                <span className="udia" />
              </button>
            </div>
            <div className="news-note">POPIA-compliant. Unsubscribe any time.</div>
            <span className="login-link" style={{ marginTop: 18, fontFamily: 'var(--f-mono)', fontSize: 13, letterSpacing: '.14em', color: 'var(--gold)' }} onClick={() => router.push('/login')}>Umlilo Portal &rarr;</span>
          </div>
        </div>
        <div className="wrap foot-bottom">
          <div>&copy; {new Date().getFullYear()} BLACKFIRE SOLUTIONS (PTY) LTD &middot; PSIRA REGISTERED &middot; ALL RIGHTS RESERVED</div>
          <div>BLKFR &middot; THERMAL GEOMETRY &middot; IZILO-W-001</div>
        </div>
        <div className="izilo-band izilo-diamond" role="presentation" style={{ marginTop: 0 }} />
      </footer>

      {/* WhatsApp FAB */}
      <a className="wa-fab" aria-label="Chat on WhatsApp" href="https://api.whatsapp.com/send/?phone=27689126581&text=Hi+BlackFire+Solutions+%E2%80%94+I%27d+like+to+request+a+security+assessment.&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2.2-.2 3.6a11.6 11.6 0 0 0 4.6 4.3c1.7.8 2.4.9 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" /></svg>
      </a>
    </div>
  )
}
