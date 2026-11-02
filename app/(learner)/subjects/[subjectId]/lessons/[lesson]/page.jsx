import { Suspense } from "react";
import { notFound } from "next/navigation";
import LessonView from "@/features/curriculum/LessonView";
import { subjectIds } from "@/lib/subjects";

async function LessonContent({ params }) {
  const { subjectId, lesson } = await params;

  if (!subjectIds.includes(subjectId)) {
    notFound();
  }

  return <LessonView subject={subjectId} lesson={lesson} />;
}

export default function LessonPage({ params }) {
  return (
    <Suspense fallback={null}>
      <LessonContent params={params} />
    </Suspense>
  );
}
