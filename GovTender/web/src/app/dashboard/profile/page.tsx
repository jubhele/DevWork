"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  company_name: string;
  email: string;
  csd_number: string | null;
  bbbee_level: number | null;
  cidb_grade: string | null;
  psira_number: string | null;
  service_lines: string[];
  sectors: string[];
  geographic_reach: string[];
  plan_tier: string;
  plan_active: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("gt_token");
    if (!token) { router.push("/auth/login"); return; }
    fetch("/api/v1/subscribers/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setProfile);
  }, []);

  function set(field: keyof Profile, value: unknown) {
    setProfile((p) => p ? { ...p, [field]: value } : p);
  }

  async function save() {
    const token = localStorage.getItem("gt_token");
    setSaving(true);
    await fetch("/api/v1/subscribers/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function uploadDoc(file: File, docType: string) {
    const token = localStorage.getItem("gt_token");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", docType);
    await fetch("/api/v1/subscribers/documents", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    setUploading(false);
  }

  if (!profile) return <div className="p-8 text-gray-400">Loading profile...</div>;

  const tierColors: Record<string, string> = {
    scout: "bg-gray-100 text-gray-700",
    respond: "bg-blue-100 text-blue-700",
    command: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${tierColors[profile.plan_tier] ?? "bg-gray-100 text-gray-600"}`}>
          {profile.plan_tier} {profile.plan_active ? "" : "(inactive)"}
        </span>
      </div>

      {/* Company details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Company details</h2>

        {[
          { label: "Company name", field: "company_name" as const },
          { label: "CSD number", field: "csd_number" as const },
          { label: "CIDB grade", field: "cidb_grade" as const },
          { label: "PSIRA number", field: "psira_number" as const },
        ].map(({ label, field }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="text"
              value={(profile[field] as string) || ""}
              onChange={(e) => set(field, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">B-BBEE level</label>
          <select
            value={profile.bbbee_level ?? ""}
            onChange={(e) => set("bbbee_level", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Not specified</option>
            {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>Level {n}</option>)}
          </select>
        </div>

        <div className="text-sm text-gray-500">
          <span className="font-medium">Email:</span> {profile.email}
        </div>
      </div>

      {/* Document vault */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Document vault</h2>
        <p className="text-sm text-gray-500 mb-4">
          These documents are used to personalise your proposals. Upload updated versions any time.
        </p>
        <div className="space-y-3">
          {[
            { label: "Company profile", type: "company_profile" },
            { label: "CVs of key personnel", type: "cv" },
            { label: "B-BBEE certificate", type: "certificate" },
            { label: "Rate card", type: "rate_card" },
          ].map(({ label, type }) => (
            <div key={type} className="flex items-center justify-between border border-dashed border-gray-300 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-700">{label}</span>
              <label className="cursor-pointer text-sm text-blue-700 hover:underline">
                {uploading ? "Uploading..." : "Upload"}
                <input type="file" accept=".pdf,.docx,.doc" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f, type); }} />
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
      >
        {saved ? "Saved!" : saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}
