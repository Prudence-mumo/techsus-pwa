"use client";

import { useProgress } from "./useProgress";
import { PageShell, BackLink, Card, CardHeader } from "./ui";

function recommendationText(rec) {
  if (typeof rec === "string") return rec;
  if (rec && typeof rec === "object") {
    return rec.reason || rec.recommendation || rec.topic || JSON.stringify(rec);
  }
  return String(rec);
}

function GapCard({ gap }) {
  const recommendations = Array.isArray(gap.recommendations)
    ? gap.recommendations
    : [];
  return (
    <div
      key={gap.topic_id || gap.title}
      className="rounded-xl border border-gray-100 p-5 flex flex-col gap-2 bg-white shadow-sm w-full"
    >
      <h3 className="text-sm font-bold text-gray-900">
        {typeof gap.title === "object" ? JSON.stringify(gap.title) : gap.title}
      </h3>
      <p className="text-xs text-gray-500">
        {typeof gap.recommendation === "object"
          ? JSON.stringify(gap.recommendation)
          : gap.recommendation}
      </p>
      {recommendations.length > 0 && (
        <div className="mt-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
            Recommendations
          </span>
          <ul className="text-xs text-gray-700 list-disc list-inside space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i}>{recommendationText(rec)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function GapsRecommendationsView() {
  const { data } = useProgress();
  const GAPS_BY_SUBJECT = data.gapsBySubject;
  const allGaps = Object.values(GAPS_BY_SUBJECT).flat();
  const totalGaps = allGaps.length;

  return (
    <PageShell>
      <BackLink />
      <Card>
        <CardHeader
          title="Gaps & Recommendations"
          badge={`${totalGaps} areas need attention`}
          badgeTone="red"
        />

        <p className="text-xs sm:text-sm text-gray-500">
          These topics have low completion or assessment scores. Focus on them
          to improve your overall progress.
        </p>

        {totalGaps === 0 ? (
          <p className="text-gray-500 text-sm">
            No gaps to review. Keep it up!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {allGaps.map((gap) => (
              <GapCard key={gap.topic_id || gap.title} gap={gap} />
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
