"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import LearnerHeader from "@/components/LearnerHeader";
import { authHeaders } from "@/lib/session";
import { API_BASE_URL, ENDPOINTS, MESSAGES } from "@/lib/config";

const SAVED_WORDS_KEY = "language-tutor-saved-words";

function normalizeEntry(data, word) {
  const entry = Array.isArray(data) ? data[0] : (data?.results?.[0] ?? data);
  if (!entry || entry.found === false) return null;
  return {
    word: entry.word ?? word,
    definition:
      entry.definition ?? entry.meaning ?? entry.answer ?? entry.content ?? "",
    example: entry.example || MESSAGES.noExample,
  };
}

async function searchWord(word) {
  const endpointUrl = `${API_BASE_URL}${ENDPOINTS.dictionarySearch}`;

  const res = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({
      query: word,
    }),
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("FastAPI Validation Error Details:", errorData);
    throw new Error(`Request failed with status ${res.status}`);
  }

  return normalizeEntry(await res.json(), word);
}

export default function TutorView() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [savedWords, setSavedWords] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = localStorage.getItem(SAVED_WORDS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Failed to load saved vocabulary:", err);
      return [];
    }
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(savedWords));
  }, [savedWords]);

  async function handleSubmit(e) {
    e.preventDefault();
    const word = prompt.trim();
    if (!word || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const entry = await searchWord(word);
      if (!entry) {
        setError(MESSAGES.wordNotFound);
        return;
      }

      setResult(entry);
      setSavedWords((prev) => [
        {
          ...entry,
          savedAt: Date.now(),
          askedWord: word,
        },
        ...prev,
      ]);
      setPrompt("");
    } catch (err) {
      console.error("Dictionary search failed:", err);
      setError(MESSAGES.requestFailed);
    } finally {
      setLoading(false);
    }
  }

  const visibleSavedWords = showAll ? savedWords : savedWords.slice(0, 1);

  return (
    <div className="flex min-h-screen bg-[#F6F7FC]">
      <Sidebar />

      <div className="flex-1 w-full min-w-0 flex flex-col pt-[92px] lg:pl-64">
        <LearnerHeader />

        <div className="flex-1 p-4 lg:p-8 flex flex-col items-center gap-6">
          <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-center mt-6">
            <span className="bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full border border-sky-100">
              🟢 Redu Dictionary & Language Tutor Active
            </span>

            <h1 className="text-xl font-bold text-gray-900">
              Ask AI Tutor Anything About Vocabulary
            </h1>

            <form onSubmit={handleSubmit} className="w-full relative">
              <label htmlFor="vocab-prompt" className="sr-only">
                Ask about a word
              </label>
              <input
                id="vocab-prompt"
                name="prompt"
                type="text"
                placeholder="Ask about a word...."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl py-3 pl-4 pr-24 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="absolute right-2 top-1.5 bg-[#1B2269] text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-indigo-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "..." : "Ask AI →"}
              </button>
            </form>

            {error && (
              <p role="alert" className="w-full text-left text-xs text-red-600">
                {error}
              </p>
            )}

            {result && (
              <div className="w-full text-left bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col gap-2">
                <h2 className="text-sm font-bold text-[#1B2269] capitalize">
                  {result.word}
                </h2>
                <p className="text-xs text-gray-800 leading-relaxed">
                  {result.definition}
                </p>
                <p className="text-xs text-gray-500 italic">{result.example}</p>
              </div>
            )}
          </div>

          <div className="w-full max-w-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                Your Saved Vocabulary
              </h2>
              {savedWords.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  {showAll ? "Show less" : "View all"}
                </button>
              )}
            </div>

            {savedWords.length === 0 ? (
              <p className="text-xs text-gray-400">
                No saved words yet. Search for a word and save it to your list!
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleSavedWords.map((item, index) => (
                  <div
                    key={`${item.word}-${item.savedAt ?? index}`}
                    className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-left"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-[#1B2269]">
                      {item.word}
                    </p>
                    <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                      {item.definition}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500 italic">
                      {item.example}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
