"use client";

import { RecentResults } from "@/features/assessments/components/RecentResults";
import { useAssessmentsOverview } from "@/features/assessments/hooks/useAssessmentsOverview";

export default function Page() {
  const { data, status, retry } = useAssessmentsOverview();

  return (
    <div className="flex min-h-full flex-col bg-surface">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-6">
        {status === "loading" ? <p role="status">Loading…</p> : null}
        {status === "error" ? (
          <button type="button" onClick={retry}>
            Retry
          </button>
        ) : null}
        {status === "success" && data ? (
          <RecentResults results={data.recent} onViewAll={() => {}} />
        ) : null}
      </main>
    </div>
  );
}
