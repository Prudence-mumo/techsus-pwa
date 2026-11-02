"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export default function OverviewPage() {
  const [stats, setStats] = useState({
    activeLearners: 0,
    weeklyLearning: 0,
    lessonsCompleted: 0,
    waitingToSync: 0,
  });

  const [downloadedPackages, setDownloadedPackages] = useState([]);
  const [coverageData, setCoverageData] = useState([]);
  const [curriculumData, setCurriculumData] = useState([]);
  const [timeframe, setTimeframe] = useState("MONTHLY");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const base = getApiBase();
        const headers = await authHeaders();

        const [usersRes, packagesRes, syncRes, coverageRes, topicsRes] =
          await Promise.all([
            fetch(`${base}/api/v1/users`, { headers }).catch(() => null),
            fetch(`${base}/api/v1/offline-packages`, { headers }).catch(
              () => null,
            ),
            fetch(`${base}/api/v1/sync-events`, { headers }).catch(() => null),
            fetch(`${base}/api/v1/telemetry/coverage?timeframe=${timeframe}`, {
              headers,
            }).catch(() => null),
            fetch(`${base}/api/v1/topics`, { headers }).catch(() => null),
          ]);

        const users =
          usersRes && usersRes.ok ? await usersRes.json().catch(() => []) : [];
        const packages =
          packagesRes && packagesRes.ok
            ? await packagesRes.json().catch(() => [])
            : [];
        const syncEvents =
          syncRes && syncRes.ok ? await syncRes.json().catch(() => []) : [];
        const rawCoverage =
          coverageRes && coverageRes.ok
            ? await coverageRes.json().catch(() => null)
            : null;
        const topicsData =
          topicsRes && topicsRes.ok
            ? await topicsRes.json().catch(() => [])
            : [];

        const learners = Array.isArray(users)
          ? users
          : users?.items || users?.data || [];
        const pkgs = Array.isArray(packages)
          ? packages
          : packages?.items || packages?.data || [];
        const events = Array.isArray(syncEvents)
          ? syncEvents
          : syncEvents?.items || syncEvents?.data || [];
        const topics = Array.isArray(topicsData)
          ? topicsData
          : topicsData?.items || topicsData?.data || [];

        const downloadedMap = {};
        events.forEach((ev) => {
          const type = String(ev?.event_type || ev?.type || "").toLowerCase();
          if (type !== "package_download") return;
          const pkgId = ev?.package_id || ev?.packageId;
          if (!pkgId) return;
          downloadedMap[pkgId] = {
            package_id: pkgId,
            package_version: ev?.package_version || null,
            downloaded_by: ev?.student_id || ev?.user_id || null,
            downloaded_at: ev?.created_at || ev?.client_occurred_at || null,
            status: ev?.sync_status || null,
          };
        });

        if (!cancelled) {
          setStats({
            activeLearners: learners.length,
            weeklyLearning: 0,
            lessonsCompleted: events.length,
            waitingToSync: pkgs.filter((p) => p?.status !== "published").length,
          });

          setDownloadedPackages(Object.values(downloadedMap));

          if (rawCoverage && Array.isArray(rawCoverage)) {
            setCoverageData(rawCoverage);
          } else if (
            rawCoverage &&
            rawCoverage?.data &&
            Array.isArray(rawCoverage.data)
          ) {
            setCoverageData(rawCoverage.data);
          } else {
            setCoverageData([]);
          }

          if (topics.length > 0) {
            const subjectCounts = {};
            topics.forEach((t) => {
              const subj = t.subject_name || t.subject || t.name || "Unknown";
              subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
            });
            const total = topics.length || 1;
            const curriculum = Object.entries(subjectCounts).map(
              ([subject, count]) => ({
                subject,
                percentage: Math.round((count / total) * 100),
              }),
            );
            setCurriculumData(curriculum);
          } else {
            setCurriculumData([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (err.message === "__config_error__") {
            setError("Service temporarily unavailable.");
          } else if (err instanceof TypeError) {
            setError("Network unavailable.");
          } else {
            setError("Failed to load overview.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  const cards = [
    {
      label: "Active learners",
      value: stats.activeLearners,
      sub: "from /api/v1/users",
    },
    {
      label: "Weekly learning",
      value: `${stats.weeklyLearning}%`,
      sub: "active this week",
    },
    {
      label: "Sync events",
      value: stats.lessonsCompleted,
      sub: "from /api/v1/sync-events",
    },
    {
      label: "Waiting to sync",
      value: stats.waitingToSync,
      sub: "from /api/v1/offline-packages",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {error && (
        <p className="text-red-600 text-sm font-medium" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <p className="text-slate-500 text-sm font-medium">{card.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">
              {loading ? "…" : card.value}
            </h3>
            <p className="text-slate-400 text-xs mt-2">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-blue-900">
              Learner coverage
            </h2>
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setTimeframe("MONTHLY")}
                className={`px-3 py-1 rounded transition-all ${timeframe === "MONTHLY" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                MONTHLY
              </button>
              <button
                onClick={() => setTimeframe("QUARTERLY")}
                className={`px-3 py-1 rounded transition-all ${timeframe === "QUARTERLY" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                QUARTERLY
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Fetching backend telemetry...
              </div>
            ) : coverageData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No coverage data available from backend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={coverageData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="month"
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
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="Current"
                    stroke="#0D9488"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0D9488" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Previous"
                    stroke="#CBD5E1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-blue-900 mb-6">
            Curriculum coverage
          </h2>
          <div className="space-y-4 pt-2">
            {loading ? (
              <p className="text-slate-400 text-center py-8">Loading...</p>
            ) : curriculumData.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No curriculum data available from backend.
              </p>
            ) : (
              curriculumData.map((item) => (
                <div key={item.subject}>
                  <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                    <span>{item.subject}</span>
                    <span className="text-slate-500 text-xs font-semibold">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-900 h-full rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {downloadedPackages.length > 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-blue-900 mb-4">
            Downloaded packages
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Offline packages students have downloaded for their learning (from
            /api/v1/sync-events package_download events)
          </p>
          <div className="divide-y divide-slate-100">
            {downloadedPackages.map((pkg, idx) => (
              <div
                key={pkg.package_id || idx}
                className="py-3 flex justify-between items-center gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {pkg.package_id}
                  </p>
                  <p className="text-xs text-slate-400">
                    v{pkg.package_version || "—"}{" "}
                    {pkg.downloaded_by ? `• student ${pkg.downloaded_by}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">
                    {pkg.downloaded_at
                      ? new Date(pkg.downloaded_at).toLocaleDateString()
                      : "—"}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      pkg.status === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : pkg.status === "failed"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {pkg.status || "downloaded"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-blue-900 mb-2">
            Downloaded packages
          </h2>
          <p className="text-sm text-slate-400">
            Currently no offline downloaded packages.
          </p>
        </div>
      )}
    </div>
  );
}
