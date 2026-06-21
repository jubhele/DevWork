"use client";
import { useEffect, useState } from "react";

type Tender = {
  id: string;
  title: string;
  ref_number: string;
  issuing_entity: string;
  estimated_value: number | null;
  closing_date: string | null;
  score: number;
  reason: string;
  source_url: string | null;
};

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(60);

  useEffect(() => {
    const token = localStorage.getItem("gt_token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }
    fetch(`/api/v1/tenders?min_score=${minScore}&page_size=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setTenders(data.tenders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [minScore]);

  const scoreColor = (s: number) =>
    s >= 80 ? "bg-green-100 text-green-800" :
    s >= 60 ? "bg-yellow-100 text-yellow-800" :
    "bg-gray-100 text-gray-700";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenders</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">Min. match score:</label>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {[40, 60, 70, 80].map((v) => (
              <option key={v} value={v}>{v}%+</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 py-16 text-center">Loading tenders...</div>
      ) : tenders.length === 0 ? (
        <div className="text-gray-400 py-16 text-center">
          No tenders matched yet. The crawler runs nightly — check back tomorrow.
        </div>
      ) : (
        <div className="space-y-3">
          {tenders.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor(t.score)}`}>
                      {t.score}% match
                    </span>
                    <span className="text-xs text-gray-400">{t.ref_number}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{t.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{t.issuing_entity}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  {t.estimated_value && (
                    <div className="text-sm font-semibold text-gray-900">
                      R{t.estimated_value.toLocaleString("en-ZA")}
                    </div>
                  )}
                  {t.closing_date && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Closes {new Date(t.closing_date).toLocaleDateString("en-ZA")}
                    </div>
                  )}
                  {t.source_url && (
                    <a
                      href={t.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-700 hover:underline mt-1 block"
                    >
                      View tender →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
