"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { authHeaders } from "@/lib/session";
import { API_BASE_URL } from "@/lib/config";
import { PageShell, BackLink } from "./ui";

const SUBJECT_LABELS = {
  mathematics: "Mathematics",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  english: "English",
};
const VISIBLE_ATTEMPT_LIMIT = 1;

function displayValue(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value))
    return value.map((item) => displayValue(item)).join(", ");
  if (typeof value === "object") {
    return displayValue(value.answer ?? value.text ?? value.value, fallback);
  }
  return String(value);
}

function getAnswerRecords(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).map(([question_id, answer]) =>
    answer && typeof answer === "object"
      ? { question_id, ...answer }
      : { question_id, answer },
  );
}

function resolveImageUrl(value) {
  const source =
    typeof value === "string"
      ? value
      : (value?.url ?? value?.src ?? value?.path ?? value?.image_url);
  if (typeof source !== "string" || !source.trim()) return null;

  const trimmed = source.trim();
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  return `${API_BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

function questionImage(question) {
  return resolveImageUrl(
    question.image_url ?? question.imageUrl ?? question.image,
  );
}

function subjectLabel(value) {
  const subject = String(value || "other")
    .trim()
    .toLowerCase();
  return (
    SUBJECT_LABELS[subject] ||
    subject.replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function isCorrectAnswer(question, answerRecord, learnerAnswer, correctAnswer) {
  const explicit = question.is_correct ?? answerRecord?.is_correct;
  if (typeof explicit === "boolean") return explicit;

  const status = question.status ?? answerRecord?.status;
  if (typeof status === "string") {
    if (status.toLowerCase() === "correct") return true;
    if (["incorrect", "wrong"].includes(status.toLowerCase())) return false;
  }

  const questionType = String(
    question.question_type ?? question.type ?? "",
  ).toLowerCase();
  if (questionType === "multiple_choice" && correctAnswer != null) {
    return (
      displayValue(learnerAnswer, "").trim().toLowerCase() ===
      displayValue(correctAnswer, "").trim().toLowerCase()
    );
  }

  return null;
}

export default function AssessmentAverageView() {
  const [attempts, setAttempts] = useState([]);
  const [expandedSubjects, setExpandedSubjects] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAttempts() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/assessments/?skip=0&limit=500`,
          {
            credentials: "include",
            headers: { Accept: "application/json", ...(await authHeaders()) },
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            typeof payload?.detail === "string"
              ? payload.detail
              : `Could not load assessment results (${response.status}).`,
          );
        }

        const results = Array.isArray(payload)
          ? payload
          : (payload?.items ?? payload?.results ?? []);
        setAttempts(
          results.filter(
            (assessment) =>
              String(assessment.status || "").toLowerCase() === "completed",
          ),
        );
      } catch (requestError) {
        if (requestError?.name !== "AbortError") {
          setError(
            requestError?.message || "Could not load assessment results.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAttempts();
    return () => controller.abort();
  }, []);

  const assessmentsBySubject = new Map();
  for (const attempt of attempts) {
    const subject = String(attempt.subject_name || "other").toLowerCase();
    if (!assessmentsBySubject.has(subject))
      assessmentsBySubject.set(subject, []);
    assessmentsBySubject.get(subject).push(attempt);
  }

  return (
    <PageShell>
      <BackLink />
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Assessment Results by Subject
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Review completed assessments, your answers, and the correct answers.
        </p>
      </div>

      {loading ? (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading completed assessments…
        </p>
      ) : error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        >
          {error}
        </p>
      ) : assessmentsBySubject.size === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Completed assessments will appear here with their questions and
          answers.
        </p>
      ) : (
        [...assessmentsBySubject.entries()].map(
          ([subject, subjectAttempts]) => (
            <section key={subject} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#1B2269]">
                  {subjectLabel(subject)}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {subjectAttempts.length} completed
                  </span>
                  {subjectAttempts.length > VISIBLE_ATTEMPT_LIMIT && (
                    <button
                      type="button"
                      aria-expanded={expandedSubjects.has(subject)}
                      onClick={() => {
                        setExpandedSubjects((current) => {
                          const next = new Set(current);
                          if (next.has(subject)) next.delete(subject);
                          else next.add(subject);
                          return next;
                        });
                      }}
                      className="text-sm font-semibold text-[#1B2269] hover:underline"
                    >
                      {expandedSubjects.has(subject) ? "Show less" : "View all"}
                    </button>
                  )}
                </div>
              </div>

              {(expandedSubjects.has(subject)
                ? subjectAttempts
                : subjectAttempts.slice(0, VISIBLE_ATTEMPT_LIMIT)
              ).map((attempt) => {
                const answerRecords = getAnswerRecords(attempt.answers);
                const answersByQuestion = new Map(
                  answerRecords.map((record) => [
                    String(
                      record.question_id ?? record.questionId ?? record.id,
                    ),
                    record,
                  ]),
                );
                const questions = Array.isArray(attempt.question_snapshot)
                  ? attempt.question_snapshot
                  : [];

                return (
                  <details
                    key={attempt.assessment_id}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
                      <span className="font-semibold text-gray-900">
                        {subjectLabel(attempt.subject_name)} assessment
                        {attempt.attempt_number
                          ? ` · Attempt ${attempt.attempt_number}`
                          : ""}
                      </span>
                      <span className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <time dateTime={attempt.completed_at || undefined}>
                          {formatDate(attempt.completed_at)}
                        </time>
                      </span>
                    </summary>

                    <div className="space-y-4 border-t border-gray-100 p-4">
                      {questions.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          This assessment has no saved question details.
                        </p>
                      ) : (
                        questions.map((question, index) => {
                          const questionId = String(
                            question.question_id ??
                              question.id ??
                              `question-${index}`,
                          );
                          const answerRecord =
                            answersByQuestion.get(questionId);
                          const learnerAnswer =
                            answerRecord?.answer ??
                            answerRecord?.user_answer ??
                            answerRecord?.userAnswer;
                          const correctAnswer =
                            question.correct_answer ??
                            answerRecord?.correct_answer ??
                            answerRecord?.correctAnswer;
                          const correctness = isCorrectAnswer(
                            question,
                            answerRecord,
                            learnerAnswer,
                            correctAnswer,
                          );
                          const imageUrl = questionImage(question);

                          return (
                            <article
                              key={questionId}
                              className="rounded-lg border border-gray-200 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  Question {index + 1}
                                </h3>
                                {correctness !== null && (
                                  <span
                                    className={`text-sm font-semibold ${
                                      correctness
                                        ? "text-emerald-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {correctness ? "Correct" : "Needs review"}
                                  </span>
                                )}
                              </div>

                              <div className="prose prose-sm mt-2 max-w-none text-gray-800">
                                <ReactMarkdown
                                  components={{
                                    img: ({ src, alt }) => {
                                      const markdownImage =
                                        resolveImageUrl(src);
                                      return markdownImage ? (
                                        <img
                                          src={markdownImage}
                                          alt={alt || "Question illustration"}
                                          className="my-3 max-h-[28rem] max-w-full rounded-lg object-contain"
                                        />
                                      ) : null;
                                    },
                                  }}
                                >
                                  {String(
                                    question.question_text ??
                                      question.text ??
                                      "Question text unavailable.",
                                  )}
                                </ReactMarkdown>
                              </div>

                              {imageUrl && (
                                <img
                                  src={imageUrl}
                                  alt={
                                    question.image_alt ??
                                    "Question illustration"
                                  }
                                  className="my-3 max-h-[28rem] max-w-full rounded-lg object-contain"
                                />
                              )}

                              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                <div className="rounded-md bg-gray-50 p-3">
                                  <dt className="font-semibold text-gray-700">
                                    Your answer
                                  </dt>
                                  <dd className="mt-1 whitespace-pre-wrap text-gray-800">
                                    {displayValue(learnerAnswer)}
                                  </dd>
                                </div>
                                <div className="rounded-md bg-emerald-50 p-3">
                                  <dt className="font-semibold text-emerald-800">
                                    Correct answer
                                  </dt>
                                  <dd className="mt-1 whitespace-pre-wrap text-gray-800">
                                    {displayValue(correctAnswer)}
                                  </dd>
                                </div>
                              </dl>

                              {(question.feedback ||
                                question.language_notes) && (
                                <p className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                                  {displayValue(question.feedback)}
                                  {question.language_notes && (
                                    <span className="mt-1 block">
                                      {displayValue(question.language_notes)}
                                    </span>
                                  )}
                                </p>
                              )}
                            </article>
                          );
                        })
                      )}
                    </div>
                  </details>
                );
              })}
            </section>
          ),
        )
      )}
    </PageShell>
  );
}
