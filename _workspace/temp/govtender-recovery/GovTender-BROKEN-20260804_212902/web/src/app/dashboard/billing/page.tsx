"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BillingInfo = {
  plan_tier: string;
  plan_active: boolean;
  stripe_customer_id: string | null;
};

const TIER_DETAILS = {
  scout: {
    name: "Scout",
    price: "R499/mo",
    features: ["Daily tender digest email", "Dashboard access", "Match scores + reasons", "No proposal generation"],
  },
  respond: {
    name: "Respond",
    price: "R1 499/mo",
    features: ["Everything in Scout", "5 proposals/month", "Document vault (20 files)", "Manual submission"],
  },
  command: {
    name: "Command",
    price: "R3 999/mo",
    features: ["Everything in Respond", "Unlimited proposals", "Auto-submit to portals", "Win-rate analytics", "Priority support"],
  },
};

export default function BillingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("gt_token");
    if (!token) { router.push("/auth/login"); return; }
    fetch("/api/v1/subscribers/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setBilling({ plan_tier: d.plan_tier, plan_active: d.plan_active, stripe_customer_id: d.stripe_customer_id }));
  }, []);

  async function openStripePortal() {
    const token = localStorage.getItem("gt_token");
    setLoadingPortal(true);
    const res = await fetch("/api/v1/billing/portal", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const { url } = await res.json();
    setLoadingPortal(false);
    if (url) window.location.href = url;
  }

  if (!billing) return <div className="p-8 text-gray-400">Loading...</div>;

  const tier = TIER_DETAILS[billing.plan_tier as keyof typeof TIER_DETAILS];

  return (
    <div className="p-8 max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>

      {/* Current plan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Current plan</h2>
            {tier && <p className="text-2xl font-bold text-blue-700 mt-1">{tier.name} — {tier.price}</p>}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${billing.plan_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {billing.plan_active ? "Active" : "Inactive"}
          </span>
        </div>
        {tier && (
          <ul className="space-y-1.5 text-sm text-gray-600">
            {tier.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span> {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manage subscription */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Manage subscription</h2>
        <p className="text-sm text-gray-500 mb-4">
          Change plan, update payment method, download invoices, or cancel — all via the Stripe billing portal.
        </p>
        {billing.stripe_customer_id ? (
          <button
            onClick={openStripePortal}
            disabled={loadingPortal}
            className="w-full bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
          >
            {loadingPortal ? "Opening portal..." : "Open billing portal"}
          </button>
        ) : (
          <a
            href="/pricing"
            className="block w-full text-center bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800"
          >
            Upgrade your plan
          </a>
        )}
      </div>

      {/* Overage */}
      {billing.plan_tier === "respond" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Need more proposals?</strong> Additional proposals are available at R149 each, billed automatically.
          Upgrade to Command for unlimited proposals at R3 999/mo.
        </div>
      )}
    </div>
  );
}
