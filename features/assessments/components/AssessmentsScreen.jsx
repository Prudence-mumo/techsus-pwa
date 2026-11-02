"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, ENDPOINTS } from "@/lib/config";
import { fetchAppConfig } from "@/lib/appConfig";
import { authHeaders, getClassLevel, getUserId } from "@/lib/session";

const SUBJECT_ORDER = [
  "mathematics",
  "biology",
  "chemistry",
  "physics",
  "english",
];

const SUBJECT_LABELS = {
  mathematics: "Mathematics",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  english: "English",
};

const SUBJECT_ICONS = {
  mathematics: "∑",
  biology: "♧",
  chemistry: "⚗",
  physics: "ϟ",
  english: "Aa",
};

function normalizeSubject(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.topics)) return value.topics;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function getApiBaseUrl() {
  if (!API_BASE_URL) throw new Error("Missing API base URL");
  return API_BASE_URL;
}

export function AssessmentsScreen({
  studentId: suppliedStudentId = "",
  classLevel: suppliedClassLevel,
  onStartAssessment,
}) {
  const [topics, setTopics] = useState([]);
  const [appConfig, setAppConfig] = useState(null);
  const [classLevel, setClassLevel] = useState("");
  const [classLevelLoading, setClassLevelLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingSubject, setStartingSubject] = useState("");
  const [studentId, setStudentId] = useState(suppliedStudentId);

  useEffect(() => {
    let active = true;

    async function resolveClassLevel() {
      setClassLevelLoading(true);
      const config = await fetchAppConfig();
      const requestedLevel = String(suppliedClassLevel || "")
        .trim()
        .toUpperCase();
      const requestedOrSessionLevel = requestedLevel || (await getClassLevel());
      const resolvedLevel = config.classLevels.includes(requestedOrSessionLevel)
        ? requestedOrSessionLevel
        : null;

      if (active) {
        setAppConfig(config);
        setClassLevel(resolvedLevel || "");
        setClassLevelLoading(false);
      }
    }

    resolveClassLevel().catch((requestError) => {
      if (active) {
        setClassLevel("");
        setError(
          requestError?.message || "Could not load assessment settings.",
        );
        setClassLevelLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [suppliedClassLevel]);

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      if (suppliedStudentId) {
        setStudentId(suppliedStudentId);
        return;
      }

      try {
        const id = await getUserId();
        if (active && id) setStudentId(id);
      } catch {
        // The backend returns the useful error if no learner is connected.
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [suppliedStudentId]);

  useEffect(() => {
    if (classLevelLoading) return undefined;
    if (!classLevel) return undefined;

    const controller = new AbortController();

    async function loadTopics() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${getApiBaseUrl()}${ENDPOINTS.topics}?limit=500&is_active=true&class_level=${encodeURIComponent(classLevel)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              ...(await authHeaders()),
            },
            cache: "no-store",
          },
        );

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const detail =
            typeof payload?.detail === "string"
              ? payload.detail
              : `Could not load topics (${response.status}).`;
          throw new Error(detail);
        }

        if (!controller.signal.aborted) {
          setTopics(normalizeList(payload));
        }
      } catch (requestError) {
        if (requestError?.name !== "AbortError") {
          setTopics([]);
          setError(
            requestError?.message ||
              "Could not load assessment topics from the backend.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadTopics();

    return () => controller.abort();
  }, [classLevel, classLevelLoading]);

  const subjectCards = useMemo(() => {
    const bySubject = new Map();

    for (const topic of topics) {
      const subject = normalizeSubject(topic.subject_name || topic.subject);
      if (!subject || !topic.topic_id) continue;
      if (!bySubject.has(subject)) bySubject.set(subject, []);
      const subjectTopics = bySubject.get(subject);
      if (!subjectTopics.some((item) => item.topic_id === topic.topic_id)) {
        subjectTopics.push(topic);
      }
    }

    return SUBJECT_ORDER.filter((subject) => bySubject.has(subject)).map(
      (subject) => {
        const subjectTopics = bySubject.get(subject);
        return {
          subject,
          label: SUBJECT_LABELS[subject] || subject,
          topic: subjectTopics[0],
          topics: subjectTopics,
        };
      },
    );
  }, [topics]);
  const classLevelMissing = !classLevelLoading && !classLevel;
  const displayError =
    error ||
    (classLevelMissing
      ? "Your learner class level is missing or unsupported."
      : "");

  async function handleStart(card) {
    const topicOptions = card.topics?.length ? card.topics : [card.topic];
    const topicIndexKey = `assessment-topic-index-${card.subject}`;
    const previousTopicIndex = Number(
      sessionStorage.getItem(topicIndexKey) ?? -1,
    );
    const topicIndex = (previousTopicIndex + 1) % topicOptions.length;
    const topic = topicOptions[topicIndex];
    setStartingSubject(card.subject);
    setError("");

    try {
      const resolvedStudentId = studentId || (await getUserId());

      if (!resolvedStudentId) {
        throw new Error(
          "Your learner account is not connected. Save your learner UUID before starting an assessment.",
        );
      }

      if (!topic?.topic_id) {
        throw new Error("This subject does not have an available topic yet.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}${ENDPOINTS.assessmentStart}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(await authHeaders()),
          },
          body: JSON.stringify({
            student_id: resolvedStudentId,
            subject_name: normalizeSubject(topic.subject_name),
            assessment_type: "diagnostic",
            topic_id: topic.topic_id,
            question_count: appConfig.assessment.questionCount,
            target_duration_seconds: appConfig.assessment.durationSeconds,
          }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail =
          typeof payload?.detail === "string"
            ? payload.detail
            : `Could not start assessment (${response.status}).`;
        throw new Error(detail);
      }

      const assessmentId = payload?.assessment_id || payload?.id;

      if (!assessmentId) {
        throw new Error("The backend did not return an assessment ID.");
      }

      sessionStorage.setItem(topicIndexKey, String(topicIndex));

      if (onStartAssessment) {
        onStartAssessment(assessmentId, payload);
      }
    } catch (requestError) {
      setError(
        requestError?.message || "Could not start this assessment right now.",
      );
    } finally {
      setStartingSubject("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#1f2340]">
      <div className="mx-auto w-full max-w-[930px] px-5 pb-16 pt-8 sm:px-8 lg:px-12">
        <section className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#303795] sm:text-3xl">
            A chance to check in
          </h1>
          <p className="mt-1 text-xs font-medium text-[#555a80] sm:text-sm">
            See what you know, and discover where to grow next
          </p>
        </section>

        {displayError && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {displayError}
          </p>
        )}

        {classLevelLoading || (classLevel && loading) ? (
          <div className="rounded-md border border-[#d5d8ec] bg-white px-6 py-12 text-center text-sm text-[#686d91] shadow-sm">
            Loading assessment subjects…
          </div>
        ) : displayError ? null : subjectCards.length > 0 ? (
          <div className="space-y-4">
            {subjectCards.map((card) => (
              <section
                key={card.subject}
                className="flex flex-col gap-5 rounded-md border border-[#d5d8ec] bg-white px-7 py-6 shadow-[0_3px_5px_rgba(24,32,67,0.14)] transition hover:border-[#303795] sm:flex-row sm:items-center sm:justify-between sm:px-9"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[#303795]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e8edff] text-lg">
                      {SUBJECT_ICONS[card.subject] || "✓"}
                    </span>
                    <h2 className="text-sm font-extrabold uppercase tracking-wide">
                      {card.label}
                    </h2>
                  </div>

                  <p className="mt-3 pl-10 text-xs text-[#6a6e8d]">
                    {appConfig?.assessment.questionCount} questions ·
                    Approximately{" "}
                    {Math.ceil(appConfig?.assessment.durationSeconds / 60)}{" "}
                    minutes
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStart(card)}
                  disabled={Boolean(startingSubject)}
                  className="w-full shrink-0 rounded-full bg-[#303795] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#252a7d] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
                >
                  {startingSubject === card.subject
                    ? "Starting…"
                    : "Start assessment"}
                </button>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#c9cdef] bg-white px-6 py-12 text-center text-sm text-[#686d91]">
            No assessment subjects are available for this class yet.
          </div>
        )}

        <aside className="mt-10 flex items-center gap-5 rounded-md border border-[#d5d8ec] bg-white px-7 py-4 shadow-sm sm:px-9">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center text-4xl"
            aria-hidden="true"
          >
            💡
          </span>
          <span>
            <strong className="block text-sm text-[#1f2340]">Remember</strong>
            <span className="text-xs text-[#5d6284]">
              A little help goes along the way
            </span>
          </span>
        </aside>
      </div>
    </main>
  );
}
