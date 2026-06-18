import ThemeToggle from '@/components/ThemeToggle'

export const metadata = {
  title: 'Privacy Policy — BlackFire Solutions',
}

export default function PrivacyPage() {
  const EFFECTIVE = '31 May 2026'
  const CONTACT   = 'info@blackfiresolutions.co.za'

  return (
    <div className="min-h-screen bg-coal text-bone-paper px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <ThemeToggle className="float-right" />
          <span className="font-display text-2xl tracking-widest text-flame-gold uppercase">BlackFire</span>
          <p className="text-ash text-sm mt-1">Umlilo Portal — Privacy Policy</p>
        </div>

        <h1 className="font-display text-3xl tracking-wider uppercase text-bone-paper mb-2">Privacy Policy</h1>
        <p className="text-ash text-sm mb-8">Effective date: {EFFECTIVE}</p>

        <div className="space-y-8 text-sm leading-relaxed text-bone-paper/90">

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">1. Who We Are</h2>
            <p>
              BlackFire Solutions (Pty) Ltd (&ldquo;BlackFire&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;)
              operates the Umlilo Portal — an operational management platform for security and compliance services.
              We are a responsible party under the Protection of Personal Information Act, 2013
              (<strong>POPIA</strong>) (Act 4 of 2013).
            </p>
            <p className="mt-2 text-ash">Registered address: South Africa &mdash; contact {CONTACT} for details.</p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">2. Information We Collect</h2>
            <p>We collect and process the following categories of personal information:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-ash">
              <li><strong className="text-bone-paper">Account data:</strong> name, username, email address, role and permissions.</li>
              <li><strong className="text-bone-paper">Authentication data:</strong> password hash (never plain text), session identifiers, device identifiers for mobile access.</li>
              <li><strong className="text-bone-paper">Operational data:</strong> callout records, quotes, invoices, safety files and audit events linked to your account.</li>
              <li><strong className="text-bone-paper">Usage data:</strong> IP address, browser type, and timestamps recorded in our audit log for security and compliance purposes.</li>
            </ul>
            <p className="mt-3 text-ash">We do not collect biometric data, racial or ethnic origin, health information, or any other special personal information as defined by POPIA.</p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">3. Lawful Basis for Processing</h2>
            <p>We process your personal information on the following grounds:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-ash">
              <li><strong className="text-bone-paper">Contractual necessity</strong> &mdash; to deliver the services you or your employer have contracted us to provide.</li>
              <li><strong className="text-bone-paper">Legitimate interests</strong> &mdash; security monitoring, fraud prevention, and audit trail maintenance.</li>
              <li><strong className="text-bone-paper">Legal obligation</strong> &mdash; retaining records as required by South African law, including the Companies Act and POPIA itself.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">4. How We Use Your Information</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-ash">
              <li>Authenticating and authorising access to the Umlilo Portal.</li>
              <li>Managing callouts, quotes, invoices, and safety compliance records.</li>
              <li>Generating operational reports for your organisation.</li>
              <li>Sending password-reset emails when you request them.</li>
              <li>Maintaining security audit logs as required by our contractual and legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">5. Data Sharing</h2>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information. We share data only with:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-ash">
              <li><strong className="text-bone-paper">Your organisation</strong> &mdash; administrators and managers at your company who have been granted access.</li>
              <li><strong className="text-bone-paper">Hosting providers</strong> &mdash; our hosting infrastructure (Afrihost, Vercel) processes data under data-processing agreements.</li>
              <li><strong className="text-bone-paper">Law enforcement</strong> &mdash; where legally compelled by a South African court order or equivalent authority.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">6. Data Retention</h2>
            <p className="text-ash">
              Account and operational records are retained for a minimum of <strong className="text-bone-paper">5 years</strong> after the end of the relevant contract, or as required by applicable law.
              Audit logs are retained for <strong className="text-bone-paper">3 years</strong>. Session tokens expire within 2 hours; mobile tokens expire within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">7. Your Rights Under POPIA</h2>
            <p>As a data subject you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-ash">
              <li><strong className="text-bone-paper">Access</strong> &mdash; request a copy of the personal information we hold about you.</li>
              <li><strong className="text-bone-paper">Correction</strong> &mdash; request correction of inaccurate or incomplete information.</li>
              <li><strong className="text-bone-paper">Deletion</strong> &mdash; request erasure where we have no legal obligation to retain the data.</li>
              <li><strong className="text-bone-paper">Objection</strong> &mdash; object to processing based on legitimate interests.</li>
              <li><strong className="text-bone-paper">Complaint</strong> &mdash; lodge a complaint with the Information Regulator of South Africa at <a href="https://www.inforegulator.org.za" className="text-fire-orange hover:underline" target="_blank" rel="noopener noreferrer">www.inforegulator.org.za</a>.</li>
            </ul>
            <p className="mt-3 text-ash">To exercise any of these rights, contact us at <a href={`mailto:${CONTACT}`} className="text-fire-orange hover:underline">{CONTACT}</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">8. Security Measures</h2>
            <p className="text-ash">
              We implement industry-standard technical and organisational measures including:
              bcrypt password hashing, HMAC-signed session cookies, HTTPS-only transmission,
              role-based access control, Bearer token authentication for mobile devices,
              and a comprehensive audit log of all actions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">9. Cookies</h2>
            <p className="text-ash">
              The Umlilo Portal uses a single first-party cookie (<code className="text-flame-gold">bf_portal</code>)
              to maintain your authenticated session. This cookie is HttpOnly, Secure, and SameSite=Lax.
              It expires after 2 hours and contains no third-party tracking data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">10. Changes to This Policy</h2>
            <p className="text-ash">
              We may update this policy to reflect changes in law or our practices.
              Significant changes will be communicated via email or an in-portal notice at least 14 days before they take effect.
              Continued use of the portal after that date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider uppercase text-fire-orange mb-3">11. Contact</h2>
            <p className="text-ash">
              Information Officer: BlackFire Solutions (Pty) Ltd<br />
              Email: <a href={`mailto:${CONTACT}`} className="text-fire-orange hover:underline">{CONTACT}</a><br />
              Country: South Africa
            </p>
          </section>

        </div>

        <p className="mt-12 text-xs text-ash/60 border-t border-steel-dark pt-6">
          &copy; {new Date().getFullYear()} BlackFire Solutions (Pty) Ltd. All rights reserved.
        </p>
      </div>
    </div>
  )
}
