"use client";

import Link from "next/link";
import { PageShell } from "@/features/progress/ui";
import { useProgress } from "@/features/progress/useProgress";
import { assessmentStatus } from "@/features/progress/ProgressData";

export default function AssessmentsView() {
  const { data } = useProgress();
  const subjects = data.subjects;

  return (
    <PageShell>
      <h1 className="text-2xl font-extrabold text-gray-900">Assessments</h1>
      <div className="flex flex-col gap-3">
        {subjects.map((subject) => {
          const status = assessmentStatus(subject.assessmentAverage);
          return (
            <Link
              key={subject.id}
              href={`/assessments/${subject.id}`}
              className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-900">{subject.name}</span>
                <span className="text-xs text-gray-500">
                  {status.icon} {status.label}
                </span>
              </div>
              <span
                className="text-2xl font-extrabold"
                style={{ color: status.color }}
              >
                {subject.assessmentAverage}%
              </span>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
