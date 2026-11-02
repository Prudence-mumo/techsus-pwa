"use client";

import { useState } from "react";
import { assessmentsContent } from "../content";
import { askTutor } from "../api";

export function TutorInput() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(false);

    try {
      await askTutor(query);
      setQuery("");
    } catch (err) {
      console.error("Failed to send question:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-6">
      {error && (
        <p className="text-xs text-red-500 text-center mb-2">
          {assessmentsContent.tutorError}
        </p>
      )}

      {/* Outer wrapper container matching target design */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between"
      >
        {/* Inner pill input field */}
        <div className="flex-grow bg-white rounded-full border border-gray-300 px-4 py-2 mr-4 flex items-center shadow-inner">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={assessmentsContent.tutorPlaceholder}
            className="w-full bg-transparent text-sm text-gray-700 focus:outline-none placeholder-gray-400"
          />
        </div>

        {/* Circular dark blue send button with arrow */}
        <button
          type="submit"
          disabled={loading}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-[#263884] flex items-center justify-center text-white hover:bg-blue-900 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <svg
            className="w-4 h-4 transform rotate-45 translate-x-[-1px]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
