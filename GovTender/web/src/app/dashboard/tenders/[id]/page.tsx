"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TenderDetail = {
  id: string;
  title: string;
  ref_number: string;
  issuing_entity: string;
  description: string;
  estimated_value: number | null;
  closing_date: string | null;
  source_portal: string;
  geographic_scope: string;
  cidb_grade: string | null;
  bbbee_level: number | null;
  required_docs: string[];
  source_url: string | null;
  score: number;
  reason: string;
};

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("gt_token");
    if (!token) { router.push("/auth/login"); return; }
    fetch(`/api/v1/tenders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setTender(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function generateProposal() {
    const token = localStorage.getItem("gt_token");
    setGenerating(true);
    const res = await fetch("/api/v1/proposals/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tender_id: id }),
    });
    const data = await res.json();
    setGenerating(false);
    if (data.proposal_id || data.id) {
      setProposalId(data.proposal_id || data.id);
      router.push(`/dashboard/proposals/${data.proposal_id || data.id}`);
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!tender) return <div className="p-8 text-red-500">Tender not found.</div>;

  const scoreColor = tender.score >= 80 ? "text-green-700 bg-green-50 border-green-200"
    : tender.score >= 60 ? "text-yellow-700 bg-yellow-50 border-yellow-200"
    : "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-blue-700 hover:underline mb-6 block">
        ← Back to tenders
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                {tender.score}% match
              </span>
              <span className="text-xs text-gray-400 uppercase">{tender.source_portal}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{tender.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{tender.issuing_entity}</p>
          </div>
          {tender.estimated_value && (
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-gray-900">
                R{tender.estimated_value.toLocaleString("en-ZA")}
              </div>
              <div className="text-xs text-gray-400">Estimated value</div>
            </div>
          )}
        </div>

        <p className="text-sm text-blue-700 italic mb-4">{tender.reason}</p>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><span className="text-gray-500">Ref:</span> <span className="font-medium">{tender.ref_number}</span></div>
          <div><span className="text-gray-500">Closes:</span> <span className="font-medium">
            {tender.closing_date ? new Date(tender.closing_date).toLocaleDateString("en-ZA") : "TBC"}
          </span></div>
          <div><span className="text-gray-500">Geographic scope:</span> <span className="font-medium">{tender.geographic_scope}</span></div>
          {tender.cidb_grade && <div><span className="text-gray-500">CIDB grade:</span> <span className="font-medium">{tender.cidb_grade}</span></div>}
          {tender.bbbee_level && <div><span className="text-gray-500">B-BBEE required:</span> <span className="font-medium">Level {tender.bbbee_level}</span></div>}
        </div>

        {tender.source_url && (
          <a href={tender.source_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-700 hover:underline">
            View on {tender.source_portal} portal →
          </a>
        )}
      </div>

      {tender.description && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{tender.description}</p>
        </div>
      )}

      {tender.required_docs?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Required documents</h2>
          <ul className="space-y-1">
            {tender.required_docs.map((doc, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-gray-400">•</span> {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={generateProposal}
        disabled={generating}
        className="w-full bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
      >
        {generating ? "Generating proposal... (~2 min)" : "Generate proposal"}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">
        Claude Sonnet will draft a complete, submission-ready proposal using your company documents.
      </p>
    </div>
  );
}
