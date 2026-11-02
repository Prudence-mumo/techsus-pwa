"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAppConfig } from "@/hooks/useAppConfig";

const SUBJECT_LABELS = {
  mathematics: "Mathematics",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  english: "English",
};

function normalizeSubject(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function subjectLabel(value) {
  const normalized = normalizeSubject(value);
  return SUBJECT_LABELS[normalized] || String(value || "Assessment");
}

function getSubject(assessment) {
  return normalizeSubject(
    assessment?.subject_name ||
      assessment?.subject ||
      assessment?.question_snapshot?.[0]?.subject_name,
  );
}

function getQuestionImage(question) {
  const image = question.image_url ?? question.imageUrl ?? question.image;
  if (typeof image === "string") return image;
  return image?.url ?? image?.src ?? image?.path ?? image?.image_url ?? null;
}

function resolveImageUrl(source) {
  if (typeof source !== "string" || !source.trim()) return null;
  const imageUrl = source.trim();
  if (/^(https?:|data:|blob:)/i.test(imageUrl)) return imageUrl;

  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
    /\/+$/,
    "",
  );
  return `${apiBase}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function getQuestions(assessment) {
  const raw =
    assessment?.question_snapshot?.length > 0
      ? assessment.question_snapshot
      : assessment?.questions || [];

  return raw.map((question, index) => ({
    id: question.question_id || question.id || `question-${index}`,
    text: question.question_text || question.text || "Question",
    type: question.question_type || question.type || "open_ended",
    options: Array.isArray(question.options) ? question.options : [],
    imageUrl: getQuestionImage(question),
    imageAlt:
      question.image_alt ?? question.imageAlt ?? "Assessment illustration",
  }));
}

function getDisplayTitle(assessment, subject) {
  const title = String(
    assessment?.title || assessment?.topic_title || "",
  ).trim();

  return title || `${subjectLabel(subject)} assessment`;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

export function AssessmentRunner({ assessment, onSubmit, submitting }) {
  const storageKey = `assessment_${assessment?.assessment_id || assessment?.id}`;
  const { config } = useAppConfig();
  const [answers, setAnswers] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem(`${storageKey}_answers`) || "{}",
      );
    } catch {
      return {};
    }
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`${storageKey}_time`);
      return saved
        ? Number(saved)
        : Number(assessment?.target_duration_seconds) || null;
    } catch {
      return Number(assessment?.target_duration_seconds) || null;
    }
  });

  useEffect(() => {
    if (timeLeft !== null || !config?.assessment.durationSeconds) return;
    const timer = window.setTimeout(
      () => setTimeLeft(config.assessment.durationSeconds),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [config, timeLeft]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`${storageKey}_answers`, JSON.stringify(answers));
    } catch {}
  }, [answers, storageKey]);

  useEffect(() => {
    if (timeLeft === null) return;
    try {
      sessionStorage.setItem(`${storageKey}_time`, String(timeLeft));
    } catch {}
  }, [timeLeft, storageKey]);

  const subject = getSubject(assessment);
  const questions = useMemo(() => getQuestions(assessment), [assessment]);
  const title = getDisplayTitle(assessment, subject);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          onSubmit(answers);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [answers, onSubmit, submitting, timeLeft]);

  function handleAnswerChange(questionId, answer) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#1f2340]">
      <div className="mx-auto w-full max-w-[930px] px-5 pb-16 pt-7 sm:px-8 lg:px-12">
        <div className="mb-6 flex max-w-[620px] items-center justify-between rounded-md bg-[#303795] px-6 py-3 text-white shadow-sm">
          <span className="text-xs tracking-[0.12em]">ASSESSMENT RUNNER</span>
          <span className="rounded-md border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs">
            Time: {timeLeft === null ? "--:--" : formatTime(timeLeft)}
          </span>
        </div>

        <section className="mb-7">
          <p className="text-xs tracking-[0.08em] text-[#303795]">
            {subjectLabel(subject).toUpperCase()}
          </p>
          <h1 className="mt-2 text-2xl font-medium text-[#1f2340]">{title}</h1>
          <p className="mt-1 text-sm text-[#686d91]">
            Answer each question, then submit your assessment.
          </p>
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(answers);
          }}
          className="space-y-5"
        >
          {questions.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#c9cdef] bg-white p-8 text-center text-sm text-[#686d91]">
              No questions were returned for this assessment.
            </div>
          ) : (
            questions.map((question, index) => {
              const isMultipleChoice =
                question.type === "multiple_choice" &&
                question.options.length > 0;

              return (
                <section
                  key={question.id}
                  className="rounded-md border border-[#d5d8ec] bg-white p-6 shadow-sm"
                >
                  <label className="block text-base font-normal leading-7 text-[#252943]">
                    {index + 1}.{" "}
                    <ReactMarkdown
                      components={{
                        img: ({ src, alt }) => (
                          <img
                            src={resolveImageUrl(src) || ""}
                            alt={alt || ""}
                            className="my-3 max-h-[28rem] max-w-full rounded-lg object-contain"
                          />
                        ),
                      }}
                    >
                      {question.text}
                    </ReactMarkdown>
                  </label>

                  {question.imageUrl && (
                    <img
                      src={resolveImageUrl(question.imageUrl) || ""}
                      alt={question.imageAlt}
                      loading="lazy"
                      className="mt-4 max-h-[28rem] max-w-full rounded-lg object-contain"
                    />
                  )}

                  {isMultipleChoice ? (
                    <div className="mt-5 space-y-3">
                      {question.options.map((option) => (
                        <label
                          key={option}
                          className="flex cursor-pointer items-start gap-3 rounded-md border border-[#d5d8ec] px-4 py-3 text-sm font-normal text-[#3e4260] transition hover:border-[#303795] hover:bg-[#f6f7ff]"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={() =>
                              handleAnswerChange(question.id, option)
                            }
                            className="mt-1 accent-[#303795]"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      rows={4}
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        handleAnswerChange(question.id, event.target.value)
                      }
                      placeholder="Type your response here..."
                      className="mt-4 w-full resize-y rounded-md border border-[#cfd2e3] p-3 text-sm font-normal text-[#303348] outline-none transition placeholder:text-[#a1a5bc] focus:border-[#303795] focus:ring-2 focus:ring-[#303795]/10"
                    />
                  )}
                </section>
              );
            })
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || questions.length === 0}
              className="rounded-full bg-[#303795] px-8 py-3 text-sm font-normal text-white shadow-sm transition hover:bg-[#252a7d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
