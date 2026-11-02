"use client";

import { assessmentsContent } from "../content";
import { ArrowRightIcon } from "./icons";
import { ResultCard } from "./ResultCard";

export function RecentResults({ results, onViewAll }) {
  return (
    <section aria-labelledby="recent-results-title">
      <div className="flex items-center justify-between">
        <h2
          id="recent-results-title"
          className="text-base font-semibold text-primary"
        >
          {assessmentsContent.recentResults}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-2 text-base font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {assessmentsContent.viewAll}
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
      {results.length === 0 ? (
        <p className="mt-3 rounded-lg bg-white p-4 text-sm text-muted shadow-md">
          {assessmentsContent.noResults}
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </ul>
      )}
    </section>
  );
}
