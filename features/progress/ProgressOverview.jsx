"use client";

import Link from "next/link";
import { useProgress } from "./useProgress";
import { PageShell } from "./ui";

function StatCard({ href, label }) {
  return (
    <Link
      href={href}
      className="group flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1B2269] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2269] focus-visible:ring-offset-2 sm:min-h-[240px] sm:p-6"
    >
      <span className="text-lg font-extrabold text-[#1B2269] sm:text-xl">
        {label}
      </span>
    </Link>
  );
}

export default function ProgressOverview() {
  const { data, loading, error, refetch } = useProgress();

  if (error) {
    return (
      <PageShell>
        <h1 className="text-2xl font-extrabold text-gray-900">Progress</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-base font-bold">
            Unable to load progress metrics
          </h2>
          <p className="mt-2 text-sm">
            {error.message || "A network or server error occurred."}
          </p>
          {refetch && (
            <button
              onClick={refetch}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Retry connection
            </button>
          )}
        </div>
      </PageShell>
    );
  }

  if (loading || !data) {
    return (
      <PageShell>
        <h1 className="text-2xl font-extrabold text-gray-900">Progress</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[220px] animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  const cards = [
    {
      href: "/progress/assessment-average",
      label: "Assessments",
    },
    {
      href: "/progress/overall",
      label: "Topics learnt",
    },
    {
      href: "/progress/gaps",
      label: "Gaps",
    },
  ];

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">Progress</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.label} href={card.href} label={card.label} />
        ))}
      </div>
    </PageShell>
  );
}
