"use client";

import React, { Suspense, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { askTutor } from "@/lib/tutorApi";
import { tutorDb } from "@/lib/tutorDb";
import { getUserId } from "@/lib/session";
import MarkdownRenderer from "@/features/curriculum/MarkdownRenderer";

const VALID_SUBJECTS = [
  "biology",
  "chemistry",
  "physics",
  "english",
  "mathematics",
];

function SubjectAskContent() {
  const params = useParams();
  const rawSubject = params?.subjectId
    ? decodeURIComponent(params.subjectId).toLowerCase().trim()
    : "";
  const isValid = VALID_SUBJECTS.includes(rawSubject);
  const subjectName = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);

  const conversationIdRef = useRef(crypto.randomUUID());
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[#F6F7FC] flex flex-col items-center justify-center gap-3 p-6 text-sm text-gray-600">
        <p>This subject was not found.</p>
        <Link
          href="/subjects"
          className="text-indigo-600 font-medium hover:underline"
        >
          Back to subjects
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isThinking) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsThinking(true);

    try {
      const result = await askTutor({
        question,
        subject: rawSubject,
        conversationId: conversationIdRef.current,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer || result.content || result.ai_response,
          mediaUrl: result.media_url || result.mediaUrl,
        },
      ]);

      try {
        const studentId = await getUserId();
        if (studentId) {
          await tutorDb.tutorConversations.put({
            conversationId: conversationIdRef.current,
            studentId,
            subjectName:
              rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1),
            title: question,
            interactions: [
              {
                interaction_id: `int_${Date.now()}`,
                question,
                answer: result.answer || result.content || result.ai_response,
              },
            ],
          });
        }
      } catch (saveErr) {
        console.error("Failed to save conversation:", saveErr);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: process.env.NEXT_PUBLIC_MESSAGE_REQUEST_FAILED,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FC] p-3 sm:p-4 lg:p-8 flex flex-col gap-4 sm:gap-6 w-full max-w-4xl mx-auto">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5 flex-1 min-h-[500px]">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h1 className="text-base sm:text-lg font-bold text-[#1B2269]">
            Ask AI Tutor About {subjectName}
          </h1>
          <Link
            href={`/subjects/${rawSubject}`}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            &larr; Back to {subjectName}
          </Link>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
          {messages.length === 0 && (
            <div className="mr-auto max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed bg-gray-50 text-gray-800 border border-gray-100">
              Hello! I am your AI Tutor for {subjectName}. Ask me any question,
              even if you are not sure which topic it belongs to.
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "ml-auto bg-[#1B2269] text-white"
                  : "mr-auto bg-gray-50 text-gray-800 border border-gray-100"
              }`}
            >
              <span className="font-semibold text-[10px] opacity-75 mb-1">
                {msg.role === "user" ? "You" : `AI Tutor (${subjectName})`}
              </span>
              {msg.role === "assistant" ? (
                <MarkdownRenderer
                  content={msg.content}
                  subject={subjectName}
                  mediaUrl={msg.mediaUrl}
                />
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="mr-auto bg-indigo-50/70 border border-indigo-100 text-[#1B2269] p-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-pulse">
              <span
                className="w-2 h-2 rounded-full bg-[#1B2269] animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-[#1B2269] animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-[#1B2269] animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
              <span className="font-semibold ml-1">
                AI Tutor is thinking...
              </span>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative flex flex-col w-full pt-2 border-t border-gray-100"
        >
          <label htmlFor="ask-question" className="sr-only">
            Your question
          </label>
          <textarea
            id="ask-question"
            name="question"
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question about ${rawSubject}...`}
            disabled={isThinking}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 pr-14 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1B2269] focus:bg-white transition-all resize-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            aria-label="Send question"
            className="absolute right-3 bottom-4 w-9 h-9 rounded-xl bg-[#1B2269] hover:bg-indigo-900 flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Image
              src="/icons/logos_telegram.png"
              alt=""
              width={16}
              height={16}
            />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SubjectAskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F7FC] flex items-center justify-center text-xs text-gray-500">
          Loading AI Tutor...
        </div>
      }
    >
      <SubjectAskContent />
    </Suspense>
  );
}
