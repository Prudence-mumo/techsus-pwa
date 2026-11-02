"use client";

import React from "react";
import Link from "next/link";

const PRIMARY_BUTTON =
  "w-full bg-[#1B2269] hover:bg-indigo-900 text-white text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-sm text-center leading-tight flex items-center justify-center cursor-pointer";

export default function SubjectDetailView({ subjectName = "" }) {
  const key = subjectName.toLowerCase();
  const formattedTitle = subjectName
    ? subjectName.charAt(0).toUpperCase() + subjectName.slice(1)
    : "Subject";

  if (!key) return null;

  return (
    <div className="min-h-screen bg-[#F6F7FC] p-3 sm:p-4 lg:p-8 flex flex-col gap-4 sm:gap-6 w-full max-w-7xl mx-auto">
      {/* Subject Header Banner */}
      <div className="bg-[#1B2269] text-white p-5 sm:p-6 lg:p-8 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-sm">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
          📖
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold capitalize">
            {formattedTitle}
          </h1>
          <p className="text-[11px] sm:text-xs text-blue-200 mt-0.5 sm:mt-1">
            Ask anything, or just start learning
          </p>
        </div>
      </div>

      {/* Start without choosing a topic box */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">
          New here? Start without choosing a topic
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Press Start Learning and ask the AI Tutor anything about{" "}
          {formattedTitle}. You don&apos;t need to know where to begin.
        </p>
      </div>

      <Link href={`/subjects/${key}/ask`} className={PRIMARY_BUTTON}>
        Start Learning →
      </Link>
    </div>
  );
}
