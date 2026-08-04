"use client";
import { useState } from "react";

const STEPS = ["Company details", "Capabilities", "Documents"];

const SERVICE_LINE_OPTIONS = [
  "Data engineering", "Business intelligence", "Software development",
  "ICT infrastructure", "Security services", "Guarding",
  "CCTV & access control", "Construction", "Civil engineering",
  "Consulting", "Financial services", "Cleaning services",
  "Environmental services", "Health services", "Education & training",
];

const SECTOR_OPTIONS = [
  "Government — national", "Government — provincial", "Municipalities",
  "State-owned entities", "Defence", "Health", "Education",
  "Transport & infrastructure", "Energy", "Water & sanitation",
];

const GEO_OPTIONS = [
  "National", "Gauteng", "KwaZulu-Natal", "Western Cape",
  "Eastern Cape", "Limpopo", "Mpumalanga", "North West",
  "Free State", "Northern Cape",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    csd_number: "",
    bbbee_level: "",
    cidb_grade: "",
    psira_number: "",
    service_lines: [] as string[],
    sectors: [] as string[],
    geographic_reach: [] as string[],
  });

  function toggle(field: "service_lines" | "sectors" | "geographic_reach", value: string) {
    setForm((f) => {
      const arr = f[field];
      return {
        ...f,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  async function save() {
    setSaving(true);
    const token = localStorage.getItem("gt_token");
    await fetch("/api/v1/subscribers/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        bbbee_level: form.bbbee_level ? parseInt(form.bbbee_level) : null,
      }),
    });
    setSaving(false);
  }

  async function finish() {
    await save();
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pt-16">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${i < step ? "bg-blue-700 text-white" : i === step ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${i === step ? "text-gray-900 font-medium" : "text-gray-400"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {/* Step 0 — Company details */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Company details</h2>
              <p className="text-sm text-gray-500">Used to pre-fill proposals and verify compliance.</p>

              {[
                { label: "CSD Registration number", field: "csd_number", placeholder: "MAAA0000000" },
                { label: "B-BBEE level (1–8)", field: "bbbee_level", placeholder: "2" },
                { label: "CIDB grade (if applicable)", field: "cidb_grade", placeholder: "6CE" },
                { label: "PSIRA registration number (security companies)", field: "psira_number", placeholder: "Optional" },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(form as any)[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 1 — Capabilities */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Service lines</h2>
                <p className="text-sm text-gray-500 mb-3">Select all that apply — used for tender matching.</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_LINE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggle("service_lines", opt)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        form.service_lines.includes(opt)
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Sectors</h2>
                <div className="flex flex-wrap gap-2">
                  {SECTOR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggle("sectors", opt)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        form.sectors.includes(opt)
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Geographic reach</h2>
                <div className="flex flex-wrap gap-2">
                  {GEO_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggle("geographic_reach", opt.toLowerCase().replace(/ /g, "_"))}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        form.geographic_reach.includes(opt.toLowerCase().replace(/ /g, "_"))
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload capability documents</h2>
              <p className="text-sm text-gray-500">
                GovTender uses these to generate proposals personalised to your company.
                Accepted: PDF, DOCX, DOC (max 10 MB each).
              </p>

              {[
                { label: "Company profile", type: "company_profile" },
                { label: "CVs of key personnel", type: "cv" },
                { label: "B-BBEE certificate", type: "certificate" },
                { label: "Rate card / pricing schedule", type: "rate_card" },
              ].map(({ label, type }) => (
                <div key={type} className="border border-dashed border-gray-300 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("doc_type", type);
                      const token = localStorage.getItem("gt_token");
                      await fetch("/api/v1/subscribers/documents", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      });
                    }}
                    className="text-sm text-gray-600"
                  />
                </div>
              ))}

              <p className="text-xs text-gray-400">
                You can add more documents later from your profile page.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-0"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={async () => { await save(); setStep((s) => s + 1); }}
                disabled={saving}
                className="bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-60"
              >
                {saving ? "Finishing..." : "Go to dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
