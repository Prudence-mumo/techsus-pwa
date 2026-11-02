"use client";

import { assessmentsContent } from "../content";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
});

export function ResultCard({ result }) {
  // Safely parse the date or fallback if completedAt is missing/invalid
  const parsedDate = result?.completedAt ? new Date(result.completedAt) : null;
  const completed =
    parsedDate && !isNaN(parsedDate)
      ? dateFormatter.format(parsedDate)
      : "Recently";

  return (
    <li className="flex items-start justify-between rounded-lg bg-white p-4 shadow-md">
      <div>
        <h3 className="text-base font-semibold text-primary">{result.title}</h3>
        <p className="mt-1 text-xs text-muted">
          {result.subject}
          {"  "}
          {assessmentsContent.completedOn(completed)}
        </p>
      </div>
      <p className="text-3xl font-light text-primary">
        {Math.round(result.scorePercent || 0)}%
      </p>
    </li>
  );
}
