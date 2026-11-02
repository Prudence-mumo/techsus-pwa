"use client";

import { useEffect, useState, use } from "react";
import { fetchLessonReview } from "@/lib/userApi";
import { PageShell, BackLink, Card, CardHeader } from "@/features/progress/ui";

export default function LessonReviewPage({ params }) {
  const { topicId, studentId } = use(params);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchLessonReview(topicId, studentId);
        if (active) setReview(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [topicId, studentId]);

  const recommendations = Array.isArray(review?.recommendations)
    ? review.recommendations
    : [];

  if (loading)
    return (
      <PageShell>
        <p role="status">Loading lesson review…</p>
      </PageShell>
    );
  if (error)
    return (
      <PageShell>
        <Card>
          <CardHeader title="Unable to load lesson review" />
          <p className="text-gray-600">{error}</p>
        </Card>
      </PageShell>
    );
  if (!review) return null;

  return (
    <PageShell>
      <BackLink />
      <Card>
        <CardHeader
          title={review.lesson_title || "Lesson Review"}
          badge={`${review.subject_name}`}
          badgeTone="navy"
        />
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              {review.topic_title}
            </h2>
            <p className="text-xs text-gray-500">
              {review.subject_name} &middot; {review.class_level || ""}
            </p>
          </div>

          {review.content_text && (
            <div className="border rounded-xl p-4 bg-[#F6F7FC] text-sm text-gray-700 leading-relaxed">
              {review.content_text}
            </div>
          )}

          {review.media_url && (
            <img
              src={review.media_url}
              alt="Lesson illustration"
              className="mt-4 rounded-lg w-full h-48 object-cover"
            />
          )}

          <div className="mt-4 pt-4 border-t">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
              Your Assessment
            </h3>
            {review.accuracy_percentage != null ? (
              <p className="text-sm text-gray-700">
                Accuracy:{" "}
                <span
                  className={`font-bold ${
                    review.accuracy_percentage < 50
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {review.accuracy_percentage}%
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                No completed assessment yet.
              </p>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                Recommendations
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {review.identified_gaps && (
            <div className="mt-3 text-xs text-gray-600 bg-amber-50 rounded p-3">
              <span className="font-bold text-amber-800 uppercase text-[10px] block mb-1">
                Gaps
              </span>
              {review.identified_gaps}
            </div>
          )}
        </div>
      </Card>
    </PageShell>
  );
}
