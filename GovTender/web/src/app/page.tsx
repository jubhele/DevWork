import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <span className="font-bold text-xl text-blue-700">GovTender</span>
        <div className="flex gap-6 items-center">
          <Link href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm">
            Pricing
          </Link>
          <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 text-sm">
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-8 py-24 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          Find the right tenders.
          <br />
          <span className="text-blue-700">Win more contracts.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          GovTender monitors every South African government tender portal, scores matches against your
          capability profile, and generates submission-ready proposals — automatically.
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800"
        >
          Start for free
        </Link>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Intelligence Engine",
              desc: "Crawls 30+ portals nightly. Every national, provincial, SOE, and municipal tender — scored and ranked.",
            },
            {
              title: "Proposal Generator",
              desc: "Claude Sonnet drafts complete proposals using your capability documents. Download as Word or PDF.",
            },
            {
              title: "Form Automation",
              desc: "Playwright submits on your behalf — fills forms, attaches documents, captures reference numbers.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Straightforward pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Scout",
                price: "R499",
                features: ["Daily digest alerts", "3 sectors", "National scope"],
              },
              {
                name: "Respond",
                price: "R1 499",
                features: ["20 proposals/month", "5 sectors", "Form auto-fill (3 portals)"],
                highlight: true,
              },
              {
                name: "Command",
                price: "R3 999",
                features: ["Unlimited proposals", "All sectors & portals", "Full dashboard + white-label"],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`p-6 rounded-xl border ${
                  tier.highlight
                    ? "border-blue-600 ring-2 ring-blue-600"
                    : "border-gray-200"
                }`}
              >
                <h3 className="font-bold text-lg mb-1">{tier.name}</h3>
                <div className="text-3xl font-bold text-blue-700 mb-4">
                  {tier.price}
                  <span className="text-sm text-gray-500 font-normal">/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-green-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`mt-6 block text-center py-2 rounded-md text-sm font-medium ${
                    tier.highlight
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Get started
                </Link>
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
