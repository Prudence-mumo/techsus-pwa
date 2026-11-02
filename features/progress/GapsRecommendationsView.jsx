"use client";

import Link from "next/link";
import { PROGRESS_COLORS } from "./ProgressData";
import { useProgress } from "./useProgress";
import { PageShell, BackLink, Card, CardHeader } from "./ui";

const SEVERITY_STYLES = {
  warning: {
    accent: PROGRESS_COLORS.orange,
    background: "#FFF7F0",
    tag: "",
  },
  critical: {
    accent: PROGRESS_COLORS.red,
    background: "#FFF1F1",
    tag: " · Critical",
  },
};

export default function GapsRecommendationsView() {
  const { data } = useProgress();
  const GAPS = data.gaps;
  return (
    <PageShell>
      <BackLink />
      <Card>
        <CardHeader
          title="Gaps & Recommendations"
          badge={`${GAPS.length} areas need attention`}
          badgeTone="red"
        />

        <p className="text-xs sm:text-sm text-gray-500">
          These topics have low completion or assessment scores. Focus on them
          to improve your overall progress.
        </p>

        <div className="flex flex-col gap-4">
          {GAPS.map((gap) => {
            const style = SEVERITY_STYLES[gap.severity];
            return (
              <div
                key={`${gap.subjectId}-${gap.id}`}
                className="rounded-xl border-l-4 p-5 flex flex-col gap-1.5"
                style={{
                  borderLeftColor: style.accent,
                  backgroundColor: style.background,
                }}
              >
                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                  {gap.subject}
                  {style.tag}
                </span>
                <h3 className="text-sm font-bold text-gray-900">{gap.title}</h3>
                <p className="text-xs text-gray-500">{gap.description}</p>
                <Link
                  href={`/subjects/${gap.subjectId}/lessons/${gap.id}`}
                  className="mt-2 w-fit bg-[#1B2269] hover:bg-indigo-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
                >
                  Review Lesson →
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
    </PageShell>
  );
}
