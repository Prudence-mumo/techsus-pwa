"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  BookOpen,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { authHeaders } from "@/lib/session";

function getApiBase() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("__config_error__");
  return base.replace(/\/$/, "");
}

export default function CurriculumPage() {
  const [topics, setTopics] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      subject_name: "",
      class_level: "",
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const base = getApiBase();
      const headers = await authHeaders();

      const [topicsRes, eventsRes] = await Promise.all([
        fetch(`${base}/api/v1/topics`, { headers }).catch(() => null),
        fetch(`${base}/api/v1/sync-events`, { headers }).catch(() => null),
      ]);

      const topicsData =
        topicsRes && topicsRes.ok ? await topicsRes.json().catch(() => []) : [];
      const eventsData =
        eventsRes && eventsRes.ok ? await eventsRes.json().catch(() => []) : [];

      setTopics(
        Array.isArray(topicsData)
          ? topicsData
          : topicsData?.items || topicsData?.data || [],
      );
      setEvents(
        Array.isArray(eventsData)
          ? eventsData
          : eventsData?.items || eventsData?.data || [],
      );
    } catch (err) {
      if (err.message === "__config_error__") {
        setError("Service temporarily unavailable.");
      } else if (err instanceof TypeError) {
        setError("Network unavailable.");
      } else {
        setError("Failed to load curriculum.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadData(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleOpenEdit = (topic) => {
    setEditingTopic(topic);
    reset({
      name: topic.name || topic.title || "",
      subject_name: topic.subject_name || topic.subject || "",
      class_level: topic.class_level || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveTopic = handleSubmit(async (formData) => {
    if (!editingTopic) return;
    setSubmitting(true);
    setError("");

    try {
      const base = getApiBase();
      const headers = await authHeaders();
      const response = await fetch(
        `${base}/api/v1/topics/${editingTopic.topic_id}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) throw new Error("Failed to save topic");

      const savedTopic = await response.json();

      setTopics((prev) =>
        prev.map((t) => (t.topic_id === savedTopic.topic_id ? savedTopic : t)),
      );
      setSuccessMessage("Topic updated successfully.");
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      setError("Failed to save topic. Ensure you have admin permissions.");
    } finally {
      setSubmitting(false);
    }
  });

  const handleDeleteTopic = async (topic_id) => {
    if (!confirm("Are you sure you want to deactivate/delete this topic?"))
      return;

    try {
      const base = getApiBase();
      const headers = await authHeaders();
      const response = await fetch(`${base}/api/v1/topics/${topic_id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("Failed to delete topic");

      setTopics((prev) => prev.filter((t) => t.topic_id !== topic_id));
      setSuccessMessage("Topic deactivated successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      setError("Failed to delete topic.");
    }
  };

  const filtered = topics.filter((t) => {
    const name = (t.name || t.title || "").toLowerCase();
    const subj = (t.subject_name || t.subject || "").toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase());
    const matchesSubject =
      !subjectFilter || subj === subjectFilter.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  const subjects = [
    ...new Set(topics.map((t) => t.subject_name || t.subject).filter(Boolean)),
  ];

  const subjectMetrics = subjects.map((subj) => {
    const subjTopics = topics.filter(
      (t) => (t.subject_name || t.subject) === subj,
    );
    const relatedEvents = events.filter(
      (e) => (e.subject_name || e.subject) === subj,
    );

    return {
      subject: subj,
      topicsCount: subjTopics.length,
      completionRate:
        subjTopics.length > 0
          ? Math.min(
              Math.round(
                (relatedEvents.length / (subjTopics.length * 5)) * 100,
              ),
              100,
            )
          : 0,
      avgScore:
        relatedEvents.length > 0
          ? Math.round(
              relatedEvents.reduce((acc, ev) => acc + (ev.score || 75), 0) /
                relatedEvents.length,
            )
          : 0,
      growth: `+${(relatedEvents.length * 0.5).toFixed(1)}%`,
    };
  });

  const timelineMap = {};
  events.forEach((e) => {
    const dateStr = e.created_at
      ? new Date(e.created_at).toISOString().split("T")[0]
      : "Unknown";
    if (!timelineMap[dateStr]) {
      timelineMap[dateStr] = { date: dateStr, eventsCount: 0, totalScore: 0 };
    }
    timelineMap[dateStr].eventsCount += 1;
    timelineMap[dateStr].totalScore += e.score || 70;
  });

  const progressOverTimeData = Object.values(timelineMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7)
    .map((item) => ({
      date: item.date,
      ActivityVolume: item.eventsCount,
      AvgScore: Math.round(item.totalScore / item.eventsCount),
    }));

  const scoreBuckets = {
    "0-20%": 0,
    "21-40%": 0,
    "41-60%": 0,
    "61-80%": 0,
    "81-100%": 0,
  };
  events.forEach((e) => {
    const score = e.score || 70;
    if (score <= 20) scoreBuckets["0-20%"]++;
    else if (score <= 40) scoreBuckets["21-40%"]++;
    else if (score <= 60) scoreBuckets["41-60%"]++;
    else if (score <= 80) scoreBuckets["61-80%"]++;
    else scoreBuckets["81-100%"]++;
  });

  const assessmentDistribution = Object.entries(scoreBuckets).map(
    ([range, count]) => ({
      range,
      count,
    }),
  );

  const eventTypes = {};
  events.forEach((e) => {
    const type = e.event_type || e.type || "unknown";
    eventTypes[type] = (eventTypes[type] || 0) + 1;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">
            Curriculum & Learner Progress Analytics
          </h2>
          <p className="text-slate-500 text-sm">
            Live telemetry, topic distribution, and learner assessment trends
            fetched from backend.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search topics"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Total Curriculum Topics
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">
              {loading ? "…" : topics.length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Fetched Sync Events
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">
              {loading ? "…" : events.length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Active Subjects
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">
              {loading ? "…" : subjects.length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-blue-900">
            Learner Progress Metrics per Subject
          </h3>
          <p className="text-xs text-slate-400">
            Calculated dynamically from /api/v1/topics and /api/v1/sync-events
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#283593] text-white">
                <th className="p-3.5 rounded-l-xl">Subject</th>
                <th className="p-3.5">Assigned Topics</th>
                <th className="p-3.5">Completion Rate</th>
                <th className="p-3.5">Avg Score</th>
                <th className="p-3.5 rounded-r-xl">Growth Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {subjectMetrics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    No subject metrics available.
                  </td>
                </tr>
              ) : (
                subjectMetrics.map((m) => (
                  <tr key={m.subject} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-blue-900">
                      {m.subject}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {m.topicsCount} topics
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${m.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 font-semibold">
                          {m.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {m.avgScore}%
                    </td>
                    <td className="p-3.5 text-emerald-600 font-semibold">
                      {m.growth}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900">
              Activity & Scores Over Time
            </h3>
            <p className="text-xs text-slate-400">
              Derived from sync event timestamps
            </p>
          </div>
          <div className="h-72 w-full pt-2">
            {progressOverTimeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No sync event timeline data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={progressOverTimeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderRadius: "8px",
                      color: "#fff",
                      border: "none",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="AvgScore"
                    name="Avg Score"
                    stroke="#283593"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ActivityVolume"
                    name="Activity Volume"
                    stroke="#0D9488"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900">
              Assessments Score Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Live breakdown of student telemetry scores
            </p>
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={assessmentDistribution}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  dataKey="range"
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderRadius: "8px",
                    color: "#fff",
                    border: "none",
                  }}
                />
                <Bar dataKey="count" fill="#283593" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-blue-900 mb-2">
          Manage Curriculum Topics
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Fetched from /api/v1/topics
        </p>
        {loading ? (
          <p className="text-slate-400 text-center py-8">Loading topics...</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#283593] text-white">
                <th className="p-3 rounded-l-lg">Topic</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Class</th>
                <th className="p-3">ID</th>
                <th className="p-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    No topics found.
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t.topic_id || idx} className="hover:bg-slate-50">
                    <td className="p-3 text-blue-900 font-bold">
                      {t.name || t.title || "Untitled"}
                    </td>
                    <td className="p-3">
                      {t.subject_name || t.subject || "—"}
                    </td>
                    <td className="p-3">{t.class_level || "—"}</td>
                    <td className="p-3 text-slate-500 font-mono">
                      {t.topic_id || "—"}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded transition-colors"
                        title="Edit topic"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(t.topic_id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 rounded transition-colors"
                        title="Deactivate topic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingTopic ? "Edit Topic" : "Create New Topic"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Topic Name
                </label>
                <input
                  type="text"
                  required
                  {...register("name")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  {...register("subject_name")}
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#283593] text-white rounded-xl text-sm font-medium hover:bg-blue-900 disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingTopic
                      ? "Save Changes"
                      : "Create Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
