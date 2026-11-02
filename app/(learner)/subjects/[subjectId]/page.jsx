import { notFound } from "next/navigation";
import SubjectDetailView from "@/features/curriculum/SubjectDetailView";
import { subjectIds } from "@/lib/subjects";

export function generateStaticParams() {
  return subjectIds.map((subjectId) => ({ subjectId }));
}

export default async function SubjectPage({ params }) {
  const { subjectId } = await params;

  if (!subjectIds.includes(subjectId)) {
    notFound();
  }

  return <SubjectDetailView subjectName={subjectId} />;
}
