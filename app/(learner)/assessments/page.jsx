"use client";

import { useRouter } from "next/navigation";
import { AssessmentsScreen } from "@/features/assessments";

export default function Page() {
  const router = useRouter();

  return (
    <AssessmentsScreen
      onStartAssessment={(assessmentId) =>
        router.push(`/assessments/${assessmentId}`)
      }
    />
  );
}
