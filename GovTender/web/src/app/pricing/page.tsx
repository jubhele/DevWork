import Link from "next/link";

const TIERS = [
  {
    name: "Scout",
    price: "R499",
    tagline: "Never miss a relevant tender again.",
    features: [
      "Daily scored tender digest email",
      "Full dashboard — filter by match score, sector, value",
      "All 10+ portals covered (national, SOE, municipal)",
      "Match score + one-line reason per tender",
    ],
    cta: "Start Scout",
    highlight: false,
  },
  {
    name: "Respond",
    price: "R1 499",
    tagline: "Go from tender to submitted proposal.",
    features: [
      "Everything in Scout",
      "5 AI-generated proposals per month",
      "Document vault (up to 20 files — company profile, CVs, certs)",
      "Download as Word (.docx) or PDF",
      "Additional proposals at R149 each",
    ],
    cta: "Start Respond",
    highlight: true,
  },
  {
    name: "Command",
    price: "R3 999",
    tagline: "Full automation. Maximum win rate.",
    features: [
      "Everything in Respond",
      "Unlimited AI proposals",
      "Auto-submit to portals via Playwright (no manual login)",
      "Win/loss tracking + win-rate dashboard",
      "Priority support",
    ],
    cta: "Start Command",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <Link href="/" className="font-bold text-xl text-blue-700">GovTender</Link>
        <div className="flex gap-6 items-center">
          <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 text-sm">Sign in</Link>
          <Link href="/auth/register"
            className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800">
            Get started
          </Link>
        </div>
      </nav>

      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
            <p className="text-lg text-gray-500">
              All plans start with a 14-day free Respond trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {TIERS.map((tier) => (
              <div key={tier.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  tier.highlight ? "border-blue-600 ring-2 ring-blue-600 shadow-md" : "border-gray-200"
                }`}>
                {tier.highlight && (
                  <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Most popular</div>
                )}
                <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold text-blue-700">{tier.price}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">{tier.tagline}</p>
                <ul className="space-y-2.5 text-sm text-gray-700 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register"
                  className={`mt-8 block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently asked questions</h2>
            {[
              {
                q: "Do I need a credit card to start?",
                a: "No. Your 14-day Respond trial starts immediately — no payment details required. You'll be prompted to subscribe when the trial ends.",
              },
              {
                q: "What portals do you cover?",
                a: "eTenders (national), CIDB, SITA, Eskom, Transnet, Rand Water, SANRAL, City of Johannesburg, eThekwini, and City of Cape Town. Provincial portals are on the roadmap.",
              },
              {
                q: "How are proposals generated?",
                a: "We use Claude Sonnet 4.6 with your uploaded company documents (profile, CVs, certifications) as context. The proposal is structured, compliant, and ready to submit.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel through the billing portal at any time. You'll retain access until the end of the billing period.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 pb-5">
                <h3 className="font-semibold text-gray-900 mb-1.5">{q}</h3>
                <p className="text-sm text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 px-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} GovTender · Built by Astute Insights
      </footer>
    </main>
  );
}
