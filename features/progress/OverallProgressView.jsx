"use client";

import { useProgress } from "./useProgress";
import { PageShell, BackLink } from "./ui";

const EMPTY_TOPICS = [];

export default function OverallProgressView() {
  const { data, loading, error } = useProgress();
  const topics = (data.topicBreakdown ?? EMPTY_TOPICS)
    .filter(
      (topic) =>
        Number(topic.question_count) > 0 &&
        !/^topic(?:\s+[\da-f]{8})?$/i.test(String(topic.title || "").trim()),
    )
    .sort((left, right) =>
      String(left.title || "").localeCompare(String(right.title || "")),
    );

  return (
    <PageShell>
      <BackLink />
      <h1 className="text-2xl font-extrabold text-gray-900">Topics Learnt</h1>

      {loading ? (
        <p className="text-sm text-gray-500">Loading topics…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">
          {error.message || "Could not load topics."}
        </p>
      ) : topics.length === 0 ? (
        <p className="text-sm text-gray-500">No matched topics yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border-y border-gray-200">
          {topics.map((topic) => (
            <li
              key={topic.topic_id}
              className="py-4 font-semibold text-gray-900"
            >
              {topic.title}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
