"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/session";
import { fetchStudentProgressSummary } from "@/lib/userApi";

const EMPTY = {
  subjects: [],
  topicsMasteredCount: 0,
  featuredSubject: { name: "", topics: [] },
  masteredTopics: [],
  inProgressTopics: [],
  learntTopics: [],
  gaps: [],
  gapsBySubject: {},
  totalTopics: 0,
  completedTopics: 0,
  topicCoveragePct: 0,
  totalLessons: 0,
  completedLessons: 0,
  lessonCoveragePct: 0,
  totalAssessments: 0,
  averageAccuracy: 0,
  unclassifiedQuestionCount: 0,
  topicBreakdown: [],
};

function normalize(data) {
  if (!data) return EMPTY;
  return {
    subjects: data.subjects ?? [],
    topicsMasteredCount: data.completed_topics ?? 0,
    featuredSubject: data.featured_subject ?? EMPTY.featuredSubject,
    masteredTopics: data.mastered_topics ?? [],
    inProgressTopics: data.in_progress_topics ?? [],
    learntTopics: data.learnt_topics ?? [],
    gaps: data.gaps ?? [],
    gapsBySubject: data.gaps_by_subject ?? {},
    totalTopics: data.total_topics ?? 0,
    completedTopics: data.completed_topics ?? 0,
    topicCoveragePct: data.topic_coverage_pct ?? 0,
    totalLessons: data.total_lessons ?? 0,
    completedLessons: data.completed_lessons ?? 0,
    lessonCoveragePct: data.topic_coverage_pct ?? 0,
    totalAssessments: data.total_assessments ?? 0,
    averageAccuracy: data.average_accuracy ?? 0,
    unclassifiedQuestionCount: data.unclassified_question_count ?? 0,
    topicBreakdown: data.topic_breakdown ?? [],
  };
}

export function useProgress() {
  const [state, setState] = useState({
    data: EMPTY,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const userId = await getUserId();
        const data = userId ? await fetchStudentProgressSummary(userId) : null;
        if (active)
          setState({ data: normalize(data), loading: false, error: null });
      } catch (error) {
        if (active) setState({ data: EMPTY, loading: false, error });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
