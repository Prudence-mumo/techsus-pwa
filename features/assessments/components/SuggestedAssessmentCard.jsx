"use client";

import { assessmentsContent } from "../content";
import { BookIcon } from "./icons";

export function SuggestedAssessmentCard({ assessment, onStart }) {
  if (!assessment) {
    return (
      <section className="rounded-lg bg-white p-6 text-sm text-muted shadow-md">
        {assessmentsContent.noSuggested}
      </section>
    );
  }

  return (
    <section
      aria-labelledby={`assessment-title-${assessment.id}`}
      className="rounded-xl bg-white p-6 shadow-sm border border-blue-100 mb-4"
    >
      <div className="flex items-center gap-2 text-[#263884]">
        <BookIcon className="h-5 w-5" />
        <p className="text-sm font-bold uppercase tracking-wider">
          {assessment.subject}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onStart(assessment.id)}
        className="mt-4 rounded-full bg-[#263884] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 cursor-pointer shadow-sm"
      >
        {assessmentsContent.startAssessment}
      </button>
    </section>
  );
}
