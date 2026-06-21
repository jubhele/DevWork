"use client";
import { useEffect, useState } from "react";

type Stats = {
  active_tenders: number;
  proposals_draft: number;
  proposals_ready: number;
  pipeline_value: number;
};

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("gt_token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }
    // TODO: fetch from /api/v1/dashboard/stats once implemented
    setStats({ active_tenders: 0, proposals_draft: 0, proposals_ready: 0, pipeline_value: 0 });
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  const cards = [
    { label: "Active Tenders", value: stats.active_tenders },
    { label: "Proposals in Draft", value: stats.proposals_draft },
    { label: "Proposals Ready", value: stats.proposals_ready },
    {
      label: "Pipeline Value",
      value: `R${stats.pipeline_value.toLocaleString("en-ZA")}`,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{c.label}</p>
            <p className="text-3xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
