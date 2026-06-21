"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Proposal = {
  id: string;
  status: string;
  docx_path: string | null;
  pdf_path: string | null;
  submission_ref: string | null;
  submitted_at: string | null;
  created_at: string;
  tender?: { title: string; ref_number: string; issuing_entity: string; closing_date: string | null };
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:       { label: "Draft",       color: "bg-gray-100 text-gray-700" },
  ready:       { label: "Ready",       color: "bg-blue-100 text-blue-700" },
  submitted:   { label: "Submitted",   color: "bg-yellow-100 text-yellow-700" },
  awarded:     { label: "Awarded",     color: "bg-green-100 text-green-700" },
  not_awarded: { label: "Not awarded", color: "bg-red-100 text-red-600" },
  error:       { label: "Error",       color: "bg-red-100 text-red-700" },
};

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("gt_token");
    if (!token) { router.push("/auth/login"); return; }
    const poll = setInterval(() => {
      fetch(`/api/v1/proposals/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          setProposal(data);
          setLoading(false);
          if (data.status !== "draft") clearInterval(poll);
        })
        .catch(() => setLoading(false));
    }, 3000);
    return () => clearInterval(poll);
  }, [id]);

  async function submitProposal() {
    const token = localStorage.getItem("gt_token");
    setSubmitting(true);
    await fetch(`/api/v1/proposals/${id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSubmitting(false);
    window.location.reload();
  }

  async function markOutcome(outcome: "awarded" | "not_awarded") {
    const token = localStorage.getItem("gt_token");
    setMarking(true);
    await fetch(`/api/v1/proposals/${id}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ outcome }),
    });
    setMarking(false);
    window.location.reload();
  }

  if (loading) return <div className="p-8 text-gray-400">Generating proposal...</div>;
  if (!proposal) return <div className="p-8 text-red-500">Proposal not found.</div>;

  const statusInfo = STATUS_LABELS[proposal.status] ?? { label: proposal.status, color: "bg-gray-100 text-gray-600" };

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-blue-700 hover:underline mb-6 block">
        ← Back to proposals
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className="text-xs text-gray-400">
            Created {new Date(proposal.created_at).toLocaleDateString("en-ZA")}
          </span>
        </div>

        {proposal.tender && (
          <div className="mb-4">
            <h1 className="text-lg font-bold text-gray-900">{proposal.tender.title}</h1>
            <p className="text-sm text-gray-500">{proposal.tender.issuing_entity} · {proposal.tender.ref_number}</p>
            {proposal.tender.closing_date && (
              <p className="text-xs text-gray-400 mt-1">
                Closes {new Date(proposal.tender.closing_date).toLocaleDateString("en-ZA")}
              </p>
            )}
          </div>
        )}

        {proposal.submission_ref && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 mb-4">
            Submission reference: <strong>{proposal.submission_ref}</strong>
            {proposal.submitted_at && (
              <span className="text-green-600 ml-2">
                — submitted {new Date(proposal.submitted_at).toLocaleDateString("en-ZA")}
              </span>
            )}
          </div>
        )}

        {proposal.status === "draft" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            Generating your proposal... this usually takes 1–2 minutes.
          </div>
        )}
      </div>

      {/* Downloads */}
      {(proposal.pdf_path || proposal.docx_path) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Download proposal</h2>
          <div className="flex gap-3">
            {proposal.pdf_path && (
              <a
                href={`/api/v1/proposals/${id}/download/pdf`}
                className="flex-1 text-center bg-red-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-800"
              >
                Download PDF
              </a>
            )}
            {proposal.docx_path && (
              <a
                href={`/api/v1/proposals/${id}/download/docx`}
                className="flex-1 text-center bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                Download DOCX
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {proposal.status === "ready" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Submit to portal</h2>
          <p className="text-sm text-gray-500 mb-4">
            GovTender will log in to the portal and submit the proposal on your behalf.
            Requires portal credentials saved in your profile.
          </p>
          <button
            onClick={submitProposal}
            disabled={submitting}
            className="w-full bg-green-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit to portal"}
          </button>
        </div>
      )}

      {proposal.status === "submitted" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Update outcome</h2>
          <div className="flex gap-3">
            <button
              onClick={() => markOutcome("awarded")}
              disabled={marking}
              className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-60"
            >
              Awarded
            </button>
            <button
              onClick={() => markOutcome("not_awarded")}
              disabled={marking}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-60"
            >
              Not awarded
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
