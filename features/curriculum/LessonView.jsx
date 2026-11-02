"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { askTutor } from "@/lib/tutorApi";
import { getUserId } from "@/lib/session";
import { tutorDb } from "@/lib/tutorDb";
async function requestAnswer({ question, subject, conversationId }) {
  return await askTutor({ question, subject, conversationId });
}

export default function LessonView({ subject = "mathematics", lesson = "" }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [conversationId] = useState(() => crypto.randomUUID());

  const subjectLabel = lesson ? lesson.replaceAll("-", " ") : subject;

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setError("");
    setLoading(true);

    try {
      const answer = await requestAnswer({
        question: trimmed,
        subject,
        conversationId,
      });
      const entry = {
        interaction_id: `int_${Date.now()}`,
        question: trimmed,
        answer,
      };
      const interactions = [...messages, entry];

      setMessages(interactions);
      setQuestion("");

      try {
        const studentId = await getUserId();
        if (!studentId) {
          console.error("Missing studentId");
          return;
        }

        await tutorDb.tutorConversations.put({
          conversationId: conversationId,
          studentId,
          subjectName: subject.charAt(0).toUpperCase() + subject.slice(1),
          title: interactions[0].question,
          interactions,
        });
      } catch (saveErr) {
        console.error("Failed to save conversation:", saveErr);
      }
    } catch (err) {
      console.error("Failed to get answer:", err);
      setError("Could not get an answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-redu-bg p-4 lg:p-8 flex flex-col items-center gap-6">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <Link
          href={`/subjects/${subject}`}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 self-start"
        >
          ← Back to {subject}
        </Link>

        <Link
          href="/tutor"
          className="text-xs font-semibold text-redu-navy hover:underline"
        >
          Saved Conversations & Downloads →
        </Link>
      </div>

      <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 mt-4">
        <h2 className="text-sm sm:text-base font-bold text-gray-900 capitalize">
          Ask AI Tutor about {subjectLabel}
        </h2>

        {messages.length > 0 && (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div key={m.interaction_id} className="flex flex-col gap-2">
                <div className="self-end max-w-[85%] bg-redu-navy text-white text-xs rounded-2xl rounded-br-sm px-4 py-2.5">
                  {m.question}
                </div>
                <div className="self-start max-w-[85%] bg-indigo-50 text-gray-800 text-xs rounded-2xl rounded-bl-sm px-4 py-2.5 leading-relaxed">
                  {m.answer}
                </div>
              </div>
            ))}
            {loading && (
              <div className="self-start bg-indigo-50 text-gray-500 text-xs rounded-2xl px-4 py-2.5">
                Thinking...
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <label htmlFor="lesson-question" className="sr-only">
            Ask a question about {subjectLabel}
          </label>
          <input
            id="lesson-question"
            name="question"
            type="text"
            placeholder={`Ask a question about ${subjectLabel}...`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl py-3 pl-4 pr-14 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Send Question"
            title="Send Question"
            className="absolute right-2 top-1.5 bg-redu-navy text-white p-2 rounded-lg text-xs hover:bg-indigo-900 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              "..."
            ) : (
              <Image
                src="/icons/logos_telegram.png"
                alt=""
                width={16}
                height={16}
              />
            )}
          </button>
        </form>

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        <Link
          href={`/subjects/${subject}`}
          className="text-xs font-bold text-center text-redu-navy border border-indigo-200 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors mt-2"
        >
          ← Back to Topics
        </Link>
      </div>
    </div>
  );
}
