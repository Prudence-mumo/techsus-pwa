"use client";

import { useEffect, useState } from "react";
import { useAppConfig } from "@/hooks/useAppConfig";

function displayValue(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => displayValue(item)).join(", ");
  }
  if (typeof value === "object") {
    if (value.topic && value.reason) {
      return `${value.topic}: ${value.reason}`;
    }
    if (value.reason) return String(value.reason);
    if (value.topic) return String(value.topic);
    if (value.message) return String(value.message);
    if (value.text) return String(value.text);
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${displayValue(item)}`)
      .join("; ");
  }
  return String(value);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  if (typeof value === "object")
    return Object.entries(value).map(([question_id, answer]) => ({
      question_id,
      answer,
    }));
  return [value];
}

function getColor(pct) {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#F59E0B";
  return "#EF4444";
}

function CircularProgress({ percentage, label }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const strokeColor = getColor(percentage);

  return (
    <div className="flex flex-col items-center justify-center space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <div className="relative flex items-center justify-center">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="7"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={strokeColor}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-extrabold text-gray-900">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function AssessmentResults({ assessment, resultsData, onReturn }) {
  const { config } = useAppConfig();
  const gaps = asArray(
    resultsData?.identified_gaps ?? resultsData?.gapsIdentified,
  );
  const recommendations = asArray(resultsData?.recommendations);
  const questionSnapshot = asArray(
    resultsData?.question_snapshot ?? assessment?.question_snapshot,
  );
  const submittedAnswers = asArray(
    resultsData?.submittedAnswers ?? resultsData?.answers,
  );
  const answersByQuestion = new Map(
    submittedAnswers.map((item) => [
      item.question_id || item.questionId || item.id,
      item.answer ?? item.user_answer ?? item.userAnswer ?? "",
    ]),
  );
  const detailedReview = questionSnapshot.map((question) => ({
    question: question.question_text,
    userAnswer: answersByQuestion.get(question.question_id),
    correctAnswer: question.correct_answer,
  }));

  const backendSpeed = Number(
    resultsData?.speed_percentage ??
      resultsData?.speedPercentage ??
      resultsData?.speed,
  );
  const actualDuration = Number(resultsData?.actual_duration_seconds);
  const targetDuration =
    Number(resultsData?.target_duration_seconds) ||
    Number(assessment?.target_duration_seconds) ||
    Number(config?.assessment.durationSeconds) ||
    0;
  const calculatedSpeed =
    actualDuration > 0
      ? Math.min(100, Math.max(0, (targetDuration / actualDuration) * 100))
      : 0;
  const speedVal = backendSpeed > 0 ? backendSpeed : calculatedSpeed;

  const [animatedSpeed, setAnimatedSpeed] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedSpeed(speedVal);
    }, 150);
    return () => clearTimeout(timer);
  }, [speedVal]);

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans">
      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <div className="mx-auto w-full max-w-xs">
          <CircularProgress
            percentage={animatedSpeed}
            label="Assessment Speed"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-gray-900">
            Identified Knowledge Gaps
          </h2>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            {gaps.length > 0 &&
            gaps.some((gap) => displayValue(gap) !== "Not provided") ? (
              gaps.map((gap, i) => <li key={i}>{displayValue(gap)}</li>)
            ) : (
              <li>No specific knowledge gaps were identified.</li>
            )}
          </ul>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-gray-900">Recommendations</h2>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <li key={i}>{displayValue(rec)}</li>
              ))
            ) : (
              <li>
                Keep practising and review the topics you found difficult.
              </li>
            )}
          </ul>
        </div>

        {/* Open-Ended Question Detailed Breakdown */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900">
            Question Evaluation Breakdown
          </h2>
          {detailedReview.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3"
            >
              <div>
                <p className="text-xs font-bold text-gray-900">
                  Q{index + 1}. {displayValue(item.question)}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1 border border-gray-100">
                <p className="text-gray-500 font-medium">Your Response:</p>
                <p className="text-gray-800 italic">
                  &quot;{displayValue(item.userAnswer, "No answer")}&quot;
                </p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-xs">
                <p className="font-semibold text-emerald-800">
                  Correct Answer:
                </p>
                <p className="mt-1 text-gray-800">
                  {displayValue(item.correctAnswer, "Not provided")}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={onReturn}
            className="bg-[#263884] text-white px-8 py-3 rounded-full text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
          >
            Back to Assessments Overview
          </button>
        </div>
      </main>
    </div>
  );
}
