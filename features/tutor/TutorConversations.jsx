"use client";

import React, { useEffect, useState } from "react";
import { tutorDb } from "@/lib/tutorDb";
import ConversationCard from "./ConversationCard";
import {
  fetchConversations,
  getStudentId,
  saveStudentId,
  saveConversationOffline,
} from "./api";
import { getUserId } from "@/lib/session";

const SUBJECTS = [
  { value: "all", label: "All subjects" },
  { value: "english", label: "English" },
  { value: "biology", label: "Biology" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "mathematics", label: "Mathematics" },
];

function normalizeSubject(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getConversationText(conversation) {
  return [
    conversation.title,
    conversation.subjectName,
    conversation.subject,
    conversation.last_message,
    conversation.lastMessage,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function TutorConversations() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [conversations, setConversations] = useState([]);
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      let cached = [];

      try {
        const studentId = await getUserId();
        const allCached = await tutorDb.tutorConversations.toArray();
        cached = studentId
          ? allCached.filter((item) => item.studentId === studentId)
          : allCached;

        if (cancelled) return;

        setDownloadedIds(
          new Set(
            cached
              .filter((item) => item.interactions?.length)
              .map((item) => item.conversationId),
          ),
        );
      } catch (err) {
        console.error("Could not read offline conversations:", err);
      }

      try {
        if (!navigator.onLine) {
          throw new Error("You are offline.");
        }

        const fresh = await fetchConversations({
          search: "",
          subject: "all",
        });

        if (cancelled) return;

        const serverConversations = Array.isArray(fresh)
          ? fresh
          : Array.isArray(fresh?.conversations)
            ? fresh.conversations
            : Array.isArray(fresh?.items)
              ? fresh.items
              : [];

        setConversations(serverConversations);

        for (const item of serverConversations) {
          if (!item.conversationId) continue;

          const existing = cached.find(
            (saved) =>
              String(saved.conversationId) === String(item.conversationId),
          );

          const currentStudentId = await getUserId();
          await tutorDb.tutorConversations.put({
            ...existing,
            ...item,
            studentId: currentStudentId,
            interactions: existing?.interactions?.length
              ? existing.interactions
              : item.interactions || [],
          });
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Could not fetch tutor conversations:", err);

        setConversations(cached);

        setError(
          cached.length
            ? "Could not reach the backend. Showing conversations saved on this device."
            : "Could not load conversations. Please try again later.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredConversations = conversations.filter((conversation) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query || getConversationText(conversation).includes(query);

    const matchesSubject =
      subject === "all" ||
      normalizeSubject(conversation.subjectName || conversation.subject) ===
        subject;

    const matchesDate =
      !dateFilter ||
      (conversation.createdAt &&
        new Date(conversation.createdAt).toISOString().slice(0, 10) ===
          dateFilter);

    return matchesSearch && matchesSubject && matchesDate;
  });

  async function handleDownload(conversation) {
    const id = conversation.conversationId;

    if (!id || downloadingIds.has(id) || downloadedIds.has(id)) return;

    setDownloadingIds((previous) => new Set(previous).add(id));

    try {
      const interactions = await saveConversationOffline(id);
      const currentStudentId = await getUserId();

      await tutorDb.tutorConversations.put({
        ...conversation,
        studentId: currentStudentId,
        interactions,
      });

      setDownloadedIds((previous) => new Set(previous).add(id));
    } catch (err) {
      console.error("Conversation download failed:", err);
      alert("Download failed. Check your connection and try again.");
    } finally {
      setDownloadingIds((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#F3F5FD]">
      {/* Blue header banner has been completely removed from here */}

      <div className="mx-auto max-w-[1000px] px-8 pb-12 pt-12">
        {process.env.NODE_ENV === "development" &&
          mounted &&
          !getStudentId() && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              <p className="mb-2">
                Enter your learner ID to load conversations.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder="Learner UUID"
                  className="h-[36px] flex-1 rounded border px-3 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (studentInput.trim()) {
                      saveStudentId(studentInput.trim());
                      window.location.reload();
                    }
                  }}
                  className="h-[36px] rounded bg-[#2C3691] px-4 text-[13px] text-white"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        <h2 className="text-[26px] font-bold leading-tight text-[#2C3691]">
          Your learning conversations
        </h2>
        <p className="text-[11px] text-[#2C3691]">
          Revisit explanations and save helpful answers
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <label className="relative min-w-[240px] max-w-[390px] flex-1">
            <span className="sr-only">Search your conversations</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#2C3691]"
            >
              <circle
                cx="10.5"
                cy="10.5"
                r="6.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m15.5 15.5 5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your conversations"
              className="h-[46px] w-full rounded-md border border-[#2C3691]/60 bg-[#F3F5FD] pl-14 pr-4 text-[14px] text-gray-700 shadow-[0_2px_4px_rgba(44,54,145,0.25)] placeholder:text-gray-300 focus:border-[#3FA9F5] focus:outline-none"
            />
          </label>

          <div className="relative w-[165px]">
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              aria-label="Filter by subject"
              className="h-[46px] w-full cursor-pointer appearance-none rounded-md border border-[#2C3691]/60 bg-[#F3F5FD] px-4 pr-10 text-[14px] text-gray-400 shadow-[0_2px_4px_rgba(44,54,145,0.25)] focus:border-[#3FA9F5] focus:outline-none"
            >
              {SUBJECTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-black">
              ▼
            </span>
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
            className="h-[46px] rounded-md border border-[#2C3691]/60 bg-[#F3F5FD] px-3 text-[14px] text-gray-700 shadow-[0_2px_4px_rgba(44,54,145,0.25)] focus:border-[#3FA9F5] focus:outline-none"
          />
        </div>

        {error && (
          <p
            role="status"
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800"
          >
            {error}
          </p>
        )}

        <h3 className="mb-4 mt-9 text-[24px] font-bold text-[#2C3691]">
          Recent conversations
        </h3>

        <div className="space-y-4">
          {loading ? (
            <p className="py-10 text-center font-medium text-gray-400">
              Loading conversations...
            </p>
          ) : filteredConversations.length === 0 ? (
            <p className="py-10 text-center font-medium text-gray-400">
              {search.trim() || subject !== "all"
                ? "No conversations match your search or subject filter."
                : "No conversations found yet."}
            </p>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationCard
                key={conversation.conversationId}
                conversation={{
                  ...conversation,
                  subjectName:
                    conversation.subjectName ||
                    conversation.subject ||
                    "Unknown",
                  title: conversation.title || "Untitled conversation",
                }}
                isDownloaded={downloadedIds.has(conversation.conversationId)}
                isDownloading={downloadingIds.has(conversation.conversationId)}
                onDownload={handleDownload}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
