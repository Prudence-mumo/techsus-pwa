"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssessmentRunner } from "@/features/assessments/components/AssessmentRunner";
import { AssessmentResults } from "@/features/assessments/components/AssessmentResults";

import { authHeaders } from "@/lib/session";

function AssessmentFlowContent() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId;

  const [viewState, setViewState] = useState("taking"); // "taking" | "results"
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const submittedRef = useRef(false);

  function getApiBaseUrl() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL is missing from the frontend environment.",
      );
    }
    return baseUrl.replace(/\/+$/, "");
  }

  // Fetch assessment open-ended questions on mount
  useEffect(() => {
    async function fetchAssessment() {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(
          `${baseUrl}/api/v1/assessments/${assessmentId}`,
          {
            credentials: "include",
            headers: { ...(await authHeaders()) },
          },
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        setAssessment(data);
      } catch (err) {
        console.error("fetch assessment failed", err);
        setAssessment(null);
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    fetchAssessment();
  }, [assessmentId]);

  // Handle submit to backend
  const handleSubmit = async (answers) => {
    if (submitting || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const baseUrl = getApiBaseUrl();
      const headers = await authHeaders();
      const questionList =
        assessment?.question_snapshot || assessment?.questions || [];
      const answersPayload = {};
      for (const q of questionList) {
        const id = q.question_id || q.id;
        answersPayload[id] = answers[id] || "";
      }
      if (Object.keys(answersPayload).length === 0) {
        answersPayload["unanswered"] = "";
      }

      const res = await fetch(
        `${baseUrl}/api/v1/assessments/${assessmentId}/submit`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ answers: answersPayload }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const backendMessage =
          typeof data?.detail === "string"
            ? data.detail
            : typeof data?.message === "string"
              ? data.message
              : "";

        if (res.status === 401) {
          throw new Error(
            backendMessage ||
              "Your learner session has expired or is not connected. Sign in again, then retry the assessment.",
          );
        }

        if (res.status === 409) {
          throw new Error(
            backendMessage ||
              "This assessment has already been submitted. Please return to the assessments page and start a new one.",
          );
        }

        throw new Error(
          backendMessage ||
            `Could not submit assessment (status ${res.status}).`,
        );
      }

      // Keep the answers locally as well because some backend response shapes
      // return the assessment result without echoing the submitted answers.
      setResultsData({
        ...data,
        submittedAnswers: answers,
      });
      setViewState("results");
    } catch (err) {
      console.error("submit failed", err);
      submittedRef.current = false;
      setSubmitError(err?.message || "Could not submit the assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center text-xs text-gray-500">
        Loading assessment...
      </div>
    );
  }

  if (viewState === "results") {
    return (
      <AssessmentResults
        assessment={assessment}
        resultsData={resultsData}
        onReturn={() => router.push("/assessments")}
      />
    );
  }

  if (submitError) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] px-6 py-10 text-[#1f2340]">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-700">
            Assessment could not be submitted
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-700">{submitError}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSubmitError("")}
              className="rounded-full bg-[#303795] px-6 py-3 text-sm text-white"
            >
              Return to assessment
            </button>
            <button
              type="button"
              onClick={() => router.push("/assessments")}
              className="rounded-full border border-[#303795] px-6 py-3 text-sm text-[#303795]"
            >
              Back to assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AssessmentRunner
      assessment={assessment}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}
export default function AssessmentFlowPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center text-xs text-gray-500">
          Loading...
        </div>
      }
    >
      <AssessmentFlowContent />
    </Suspense>
  );
}
