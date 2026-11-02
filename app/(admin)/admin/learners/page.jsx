"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Search,
  Filter,
  User,
  Edit2,
  Trash2,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { authHeaders } from "@/lib/session";

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("__config_error__");
  return base.replace(/\/$/, "");
}

export default function LearnersPage() {
  const [learners, setLearners] = useState([]);
  const [learnerActivity, setLearnerActivity] = useState({});
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [inactiveFilter, setInactiveFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [now, setNow] = useState(() =>
    typeof window !== "undefined" ? Date.now() : null,
  );

  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      display_name: "",
      class_level: "",
      class_name: "",
      school_name: "",
      role: "student",
    },
  });

  const loadLearnersAndActivity = async () => {
    try {
      setLoading(true);
      const base = getApiBase();
      const headers = await authHeaders();

      const response = await fetch(`${base}/api/v1/users`, { headers });
      if (!response.ok) throw new Error("__service_error__");
      const data = await response.json();
      const usersList = Array.isArray(data) ? data : data.items || [];
      setLearners(usersList);

      const activityMap = {};
      await Promise.all(
        usersList.map(async (u) => {
          try {
            const actRes = await fetch(
              `${base}/api/v1/ai-tutor/students/${u.user_id}/activity`,
              { headers },
            );
            if (actRes.ok) {
              const actData = await actRes.json();
              const events = Array.isArray(actData)
                ? actData
                : actData.items || actData.data || [];
              if (events.length > 0) {
                const latest = events.reduce((latestTime, ev) => {
                  const t = new Date(
                    ev.created_at || ev.timestamp || 0,
                  ).getTime();
                  return t > latestTime ? t : latestTime;
                }, 0);
                activityMap[u.user_id] = latest;
              } else {
                activityMap[u.user_id] = null;
              }
            }
          } catch {
            activityMap[u.user_id] = null;
          }
        }),
      );
      setLearnerActivity(activityMap);
    } catch {
      setError("Failed to load learners and activity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadLearnersAndActivity(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleDeleteUser = async (user_id) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This revokes all active sessions.",
      )
    )
      return;

    try {
      const base = getApiBase();
      const headers = await authHeaders();
      const response = await fetch(`${base}/api/v1/users/${user_id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setLearners((prev) => prev.filter((u) => u.user_id !== user_id));
      setSuccessMessage("User deleted successfully and sessions revoked.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      setError("Failed to delete user.");
    }
  };

  const handleUpdateUser = handleSubmit(async (formData) => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const base = getApiBase();
      const headers = await authHeaders();
      const response = await fetch(
        `${base}/api/v1/users/${editingUser.user_id}`,
        {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) throw new Error("Failed to update user");

      const updatedUser = await response.json();
      setLearners((prev) =>
        prev.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u)),
      );
      setEditingUser(null);
      setSuccessMessage("User updated successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      setError("Failed to update user.");
    } finally {
      setSaving(false);
    }
  });

  const fourteenDaysAgo = now ? now - 14 * 24 * 60 * 60 * 1000 : null;

  const filtered = learners.filter((u) => {
    const matchesSearch =
      !search ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.learner_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesGrade = !gradeFilter || u.class_level === gradeFilter;

    const lastActive = learnerActivity[u.user_id];
    const isInactive =
      lastActive === null ||
      (fourteenDaysAgo !== null && lastActive < fourteenDaysAgo);
    const matchesInactive = !inactiveFilter || isInactive;

    return matchesSearch && matchesGrade && matchesInactive;
  });

  const grades = [
    ...new Set(learners.map((u) => u.class_level).filter(Boolean)),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">
            Learner Activity & Management
          </h2>
          <p className="text-slate-500 text-sm">
            Monitor student engagement, review last active times, and manage
            accounts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setInactiveFilter(!inactiveFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              inactiveFilter
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {inactiveFilter
              ? "Showing Inactive (>14d)"
              : "Filter Inactive Learners"}
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search learners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All grades</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm font-medium" role="alert">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="text-emerald-600 text-sm font-medium" role="status">
          {successMessage}
        </p>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
        {loading ? (
          <p className="text-slate-400 text-center py-12">
            Checking learner activity telemetry...
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#283593] text-white">
                <th className="p-4 rounded-l-xl">Learner</th>
                <th className="p-4">Email</th>
                <th className="p-4">Grade</th>
                <th className="p-4">Last Active</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-slate-400 py-8"
                  >
                    No learners match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const lastActiveTime = learnerActivity[u.user_id];
                  const isInactive =
                    lastActiveTime === null || lastActiveTime < fourteenDaysAgo;
                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50">
                      <td className="p-4 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block">
                            {u.display_name || u.learner_code || "Unknown"}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {u.user_id}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{u.email || "—"}</td>
                      <td className="p-4 text-slate-600">
                        {u.class_level || "—"}
                      </td>
                      <td className="p-4">
                        {lastActiveTime ? (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                              isInactive
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {new Date(lastActiveTime).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                            Never active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"}`}
                        >
                          {u.role || "student"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            reset({
                              display_name: u.display_name || "",
                              class_level: u.class_level || "",
                              class_name: u.class_name || "",
                              school_name: u.school_name || "",
                              role: u.role || "student",
                            });
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.user_id)}
                          className="p-2 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete user & revoke sessions"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">
                Edit User
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  {...register("display_name")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Class Level (Grade)
                </label>
                <input
                  type="text"
                  {...register("class_level")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#283593] text-white rounded-xl text-sm font-medium hover:bg-blue-900 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
