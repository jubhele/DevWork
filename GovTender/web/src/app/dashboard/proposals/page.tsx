"use client";
import { useEffect, useState } from "react";

type Proposal = {
  id: string;
  tender_ref: string;
  tender_title: string;
  status: "draft" | "ready" | "submitted" | "awarded" | "not_awarded";
  docx_path: string | null;
  pdf_path: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<Proposal["status"], string> = {
  draft: "Drafting",
  ready: "Ready",
  submitted: "Submitted",
  awarded: "Awarded",
  not_awarded: "Not Awarded",
};

const STATUS_COLOR: Record<Proposal["status"], string> = {
  draft: "bg-yellow-100 text-yellow-800",
  ready: "bg-blue-100 text-blue-800",
  submitted: "bg-purple-100 text-purple-800",
  awarded: "bg-green-100 text-green-800",
  not_awarded: "bg-gray-100 text-gray-600",
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("gt_token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }
    // TODO: add GET /proposals endpoint to API and wire here
    setLoading(false);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Proposals</h1>
      {loading ? (
        <div className="text-gray-400 py-16 text-center">Loading...</div>
      ) : proposals.length === 0 ? (
        <div className="text-gray-400 py-16 text-center">
          No proposals yet. Open a tender and click &quot;Generate Proposal&quot; to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">{p.tender_ref}</p>
                <h3 className="font-semibold text-gray-900">{p.tender_title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
                {p.pdf_path && (
                  <a href={`/api/v1/proposals/${p.id}/download`} className="text-xs text-blue-700 hover:underline">
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
