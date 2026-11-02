"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
} from "lucide-react";
import { authHeaders } from "@/lib/session";

function getApiBase() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("__config_error__");
  return base.replace(/\/$/, "");
}

const CONSENT_STATUSES = [
  {
    value: "granted",
    label: "Granted",
    color: "bg-emerald-100 text-emerald-700",
  },
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-700" },
  { value: "revoked", label: "Revoked", color: "bg-rose-100 text-rose-700" },
  {
    value: "withdrawn",
    label: "Withdrawn",
    color: "bg-slate-200 text-slate-700",
  },
];

export default function SettingsPage() {
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  const [consentStatuses, setConsentStatuses] = useState([]);
  const [loadingConsent, setLoadingConsent] = useState(true);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [editingConsent, setEditingConsent] = useState(null);
  const [consentSubmitting, setConsentSubmitting] = useState(false);

  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    reset: resetSettingsForm,
  } = useForm({
    defaultValues: {
      institutionName: "",
      classLevels: "",
      aiTutorEnabled: true,
    },
  });

  const {
    register: registerConsent,
    handleSubmit: handleConsentSubmit,
    reset: resetConsentForm,
  } = useForm({
    defaultValues: {
      learner_code: "",
      learner_name: "",
      status: "granted",
      note: "",
    },
  });

  const loadConsentStatuses = () => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("adminConsentStatuses");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const persistConsentStatuses = (list) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("adminConsentStatuses", JSON.stringify(list));
      }
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const base = getApiBase();
        const headers = await authHeaders();

        const settingsRes = await fetch(`${base}/api/v1/settings`, {
          headers,
        }).catch(() => null);

        if (settingsRes && settingsRes.ok) {
          const data = await settingsRes.json().catch(() => null);
          if (data && typeof data === "object" && !Array.isArray(data)) {
            if (!cancelled) {
              resetSettingsForm({
                institutionName:
                  data.institution_name || data.institution || "",
                classLevels: (data.class_levels || data.classes || []).join(
                  ", ",
                ),
                aiTutorEnabled:
                  data.ai_tutor_enabled ?? data.tutor_enabled ?? true,
              });
            }
          }
        }

        const usersRes = await fetch(`${base}/api/v1/users`, { headers }).catch(
          () => null,
        );
        if (usersRes && usersRes.ok) {
          const usersData = await usersRes.json().catch(() => null);
          const usersList = Array.isArray(usersData)
            ? usersData
            : usersData?.items || usersData?.data || [];
          if (!cancelled) {
            const local = loadConsentStatuses();
            const byCode = Object.fromEntries(
              local.map((c) => [c.learner_code, c]),
            );
            const merged = usersList.map((u) => {
              const code = u.learner_code || u.user_id;
              const existing = byCode[code];
              return (
                existing || {
                  consent_id: `consent_${code}`,
                  learner_code: code,
                  learner_name:
                    u.display_name || u.learner_name || u.email || code,
                  status: u.consent_status || u.consent || "pending",
                  note: u.consent_note || "",
                  updated_at: u.updated_at || new Date().toISOString(),
                  created_at: u.created_at || new Date().toISOString(),
                }
              );
            });
            setConsentStatuses(merged);
            persistConsentStatuses(merged);
          }
        }
      } catch {
      } finally {
        if (!cancelled) {
          setLoadingSettings(false);
          setConsentStatuses(loadConsentStatuses());
          setLoadingConsent(false);
        }
      }
    }
    const t = setTimeout(() => loadData(), 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [resetSettingsForm]);

  const onSubmitSettings = handleSettingsSubmit(async (data) => {
    setSavingSettings(true);
    setSavedMsg("");
    setError("");
    try {
      const base = getApiBase();
      const headers = await authHeaders();
      const res = await fetch(`${base}/api/v1/settings`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_name: data.institutionName,
          class_levels: data.classLevels
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          ai_tutor_enabled: data.aiTutorEnabled,
        }),
      });
      if (!res.ok) throw new Error("__service_error__");
      setSavedMsg("Settings saved successfully.");
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (err) {
      if (err.message === "__config_error__") {
        setError("Service temporarily unavailable.");
      } else if (err.message === "__service_error__") {
        setError("Failed to save settings.");
      } else if (err instanceof TypeError) {
        setError("Network unavailable.");
      } else {
        setError("Failed to save settings.");
      }
    } finally {
      setSavingSettings(false);
    }
  });

  const handleOpenConsentModal = (entry = null) => {
    setEditingConsent(entry);
    resetConsentForm({
      learner_code: entry?.learner_code || "",
      learner_name: entry?.learner_name || "",
      status: entry?.status || "granted",
      note: entry?.note || "",
    });
    setConsentModalOpen(true);
  };

  const handleSaveConsent = handleConsentSubmit((formData) => {
    setConsentSubmitting(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const entry = {
        consent_id: editingConsent
          ? editingConsent.consent_id
          : `consent_${formData.learner_code}`,
        learner_code: formData.learner_code.trim(),
        learner_name: formData.learner_name.trim(),
        status: formData.status,
        note: formData.note.trim(),
        updated_at: now,
        created_at: editingConsent?.created_at || now,
      };

      let updated;
      if (editingConsent) {
        updated = consentStatuses.map((c) =>
          c.consent_id === editingConsent.consent_id ? entry : c,
        );
      } else {
        updated = [entry, ...consentStatuses];
      }
      persistConsentStatuses(updated);
      setConsentStatuses(updated);
      setConsentModalOpen(false);
      setEditingConsent(null);
      resetConsentForm();
    } catch {
      setError("Failed to save consent status.");
    } finally {
      setConsentSubmitting(false);
    }
  });

  const handleDeleteConsent = (consentId) => {
    if (!confirm("Are you sure you want to remove this consent entry?")) return;
    try {
      const updated = consentStatuses.filter((c) => c.consent_id !== consentId);
      persistConsentStatuses(updated);
      setConsentStatuses(updated);
    } catch {
      setError("Failed to remove consent entry.");
    }
  };

  const statusColor = (status) =>
    CONSENT_STATUSES.find((s) => s.value === status)?.color ||
    "bg-slate-100 text-slate-700";

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-blue-900">Admin Settings</h2>
        <p className="text-slate-500 text-sm">
          Configure institution preferences and manage learner consent status.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {savedMsg}
        </div>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Institution Settings
        </h3>
        {loadingSettings ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : (
          <form onSubmit={onSubmitSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Institution Name
              </label>
              <input
                {...registerSettings("institutionName")}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Class Levels (comma separated)
              </label>
              <input
                {...registerSettings("classLevels")}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aiTutor"
                {...registerSettings("aiTutorEnabled")}
              />
              <label htmlFor="aiTutor" className="text-sm text-slate-700">
                Enable AI Tutor
              </label>
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-800">
            Learner Consent Status
          </h3>
        </div>

        {loadingConsent ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : consentStatuses.length === 0 ? (
          <p className="text-sm text-slate-400">No consent entries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-[#283593] text-white">
                  <th className="p-4 rounded-l-xl">Learner Code</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Note</th>
                  <th className="p-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consentStatuses.map((c) => (
                  <tr
                    key={c.consent_id}
                    className="bg-white hover:bg-slate-50 transition-colors rounded-xl border border-slate-100"
                  >
                    <td className="p-4 rounded-l-xl">{c.learner_code}</td>
                    <td className="p-4">{c.learner_name}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(
                          c.status,
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">{c.note}</td>
                    <td className="p-4 text-right space-x-2 rounded-r-xl">
                      <button
                        onClick={() => handleOpenConsentModal(c)}
                        className="text-blue-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConsent(c.consent_id)}
                        className="text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {consentModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingConsent ? "Edit Consent" : "Add Consent"}
              </h3>
              <button onClick={() => setConsentModalOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveConsent} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Learner Code
                </label>
                <input
                  required
                  {...registerConsent("learner_code")}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Learner Name
                </label>
                <input
                  {...registerConsent("learner_name")}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  {...registerConsent("status")}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {CONSENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Note
                </label>
                <textarea
                  {...registerConsent("note")}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={consentSubmitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {consentSubmitting ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
