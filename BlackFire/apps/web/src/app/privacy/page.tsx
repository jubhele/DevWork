import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Privacy Policy — BlackFire Solutions',
  description: 'How BlackFire Solutions collects, uses, and protects your personal information under POPIA.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bone-paper text-ink-text">
      <header className="border-b border-steel-dark bg-white px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Image src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" width={140} height={46} className="h-10 w-auto" />
          <Link href="/login" className="text-xs uppercase tracking-[0.22em] text-ash hover:text-ink-text">Sign In</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <p className="mb-2 text-xs uppercase tracking-[0.28em] text-ash">Last updated: 21 June 2026</p>
        <h1 className="font-display text-5xl tracking-tight text-ink-text mb-8">Privacy Policy</h1>

        <Section title="1. Introduction">
          <p>BlackFire Solutions (Pty) Ltd ("BlackFire", "we", "us") operates the Umlilo Operations Portal and related services (collectively, "the Portal"). This Privacy Policy explains how we collect, use, store, disclose, and protect personal information in compliance with the <strong>Protection of Personal Information Act 4 of 2013 (POPIA)</strong>.</p>
          <p className="mt-3">By accessing the Portal you confirm that you have read and understood this policy.</p>
        </Section>

        <Section title="2. Responsible Party">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="font-medium text-ink-text">Company</dt><dd className="text-ash">BlackFire Solutions (Pty) Ltd</dd>
            <dt className="font-medium text-ink-text">Contact</dt><dd className="text-ash">info@blackfiresolutions.co.za</dd>
            <dt className="font-medium text-ink-text">Information Officer</dt><dd className="text-ash">J. Shange</dd>
          </dl>
        </Section>

        <Section title="3. Personal Information We Collect">
          <p className="mb-4">We collect only the minimum personal information necessary to operate the Portal:</p>
          <table className="w-full text-sm border border-steel-dark rounded overflow-hidden">
            <thead className="bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Examples</th>
                <th className="px-4 py-3 text-left">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Identity', 'Full name, employee number', 'Authentication, audit trail'],
                ['Contact', 'Email address, phone number', 'Notifications, incident escalation'],
                ['Credentials', 'Hashed password, session tokens', 'Secure authentication'],
                ['Operational records', 'Callout logs, task assignments, safety entries', 'Service delivery'],
                ['Usage data', 'Login timestamps, page access logs', 'Security monitoring and audit'],
              ].map(([cat, ex, purpose]) => (
                <tr key={cat} className="border-t border-steel-dark/60">
                  <td className="px-4 py-3 font-medium text-ink-text">{cat}</td>
                  <td className="px-4 py-3 text-ash">{ex}</td>
                  <td className="px-4 py-3 text-ash">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-ash">We do <strong className="text-ink-text">not</strong> collect sensitive personal information (special categories under POPIA §26) unless explicitly required and disclosed separately.</p>
        </Section>

        <Section title="4. Lawful Basis for Processing">
          <ul className="space-y-2 text-sm text-ash list-disc list-inside">
            <li><strong className="text-ink-text">Performance of a contract</strong> — operating the Portal on behalf of the host company and its authorised personnel.</li>
            <li><strong className="text-ink-text">Legal obligation</strong> — maintaining audit trails, OHS Act records, and security incident logs.</li>
            <li><strong className="text-ink-text">Legitimate interests</strong> — fraud prevention, system security, and Portal improvement.</li>
          </ul>
        </Section>

        <Section title="5. How We Use Your Information">
          <ul className="space-y-1 text-sm text-ash list-disc list-inside">
            <li>Authenticating users and managing access levels</li>
            <li>Recording security callouts, task completions, and safety audits</li>
            <li>Generating invoices and financial reports for management</li>
            <li>Sending system notifications (password resets, assignment alerts)</li>
            <li>Maintaining an audit log for compliance and incident review</li>
          </ul>
          <p className="mt-3 text-sm text-ash">We do <strong className="text-ink-text">not</strong> sell, rent, or share personal information with third parties for marketing purposes.</p>
        </Section>

        <Section title="6. Data Sharing">
          <table className="w-full text-sm border border-steel-dark rounded overflow-hidden">
            <thead className="bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Recipient</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Safeguard</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Host company management', 'Operational reporting', 'Data processing agreement'],
                ['Afrihost', 'Server infrastructure', 'Standard contractual clauses'],
                ['Anthropic / OpenAI', 'AI report generation — anonymised data only', 'No personal identifiers transmitted'],
              ].map(([r, reason, s]) => (
                <tr key={r} className="border-t border-steel-dark/60">
                  <td className="px-4 py-3 font-medium text-ink-text">{r}</td>
                  <td className="px-4 py-3 text-ash">{reason}</td>
                  <td className="px-4 py-3 text-ash">{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="7. Your Rights Under POPIA">
          <div className="space-y-3 text-sm">
            {[
              ['Access', 'Request a copy of your personal information', 'Email info@blackfiresolutions.co.za'],
              ['Correction', 'Correct inaccurate or outdated information', 'Contact your system administrator or email us'],
              ['Deletion', 'Request erasure of your account and personal data', 'Use the "Delete my account" option in Support, or email us'],
              ['Objection', 'Object to processing under legitimate interests', 'Email us with the specific objection'],
            ].map(([right, desc, how]) => (
              <div key={right} className="rounded border border-steel-dark bg-white p-4">
                <p className="font-medium text-ink-text">{right}</p>
                <p className="text-ash">{desc}</p>
                <p className="mt-1 text-xs text-fire-orange">{how}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-ash">We will respond to requests within <strong className="text-ink-text">30 days</strong>.</p>
          <p className="mt-2 text-sm text-ash">You may also lodge a complaint with the <strong className="text-ink-text">Information Regulator of South Africa</strong> at{' '}
            <a href="https://inforeg.org.za" target="_blank" rel="noopener noreferrer" className="text-fire-orange hover:underline">inforeg.org.za</a>.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p className="text-sm text-ash">The Portal uses a single session cookie (<code className="font-mono text-xs bg-charcoal px-1 py-0.5 rounded">bf_portal</code>) strictly to maintain your authenticated session. This cookie is HTTP-only, Secure, and expires on sign-out or after 7 days of inactivity. We do not use advertising or analytics cookies.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p className="text-sm text-ash">We will notify registered users by email at least 14 days before material changes take effect. The current version is always available at <code className="font-mono text-xs bg-charcoal px-1 py-0.5 rounded">/privacy</code>.</p>
        </Section>

        <Section title="10. Contact">
          <p className="text-sm text-ash">For privacy queries, correction requests, or deletion requests:</p>
          <p className="mt-2 text-sm font-medium text-ink-text">BlackFire Solutions (Pty) Ltd — Information Officer</p>
          <p className="text-sm text-ash">Email: info@blackfiresolutions.co.za</p>
        </Section>
      </main>

      <footer className="border-t border-steel-dark bg-white px-6 py-6 text-center text-xs text-ash sm:px-10">
        <p>© {new Date().getFullYear()} BlackFire Solutions (Pty) Ltd · <Link href="/login" className="hover:text-ink-text">Portal Login</Link></p>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl text-ink-text mb-4">{title}</h2>
      {children}
    </section>
  )
}
