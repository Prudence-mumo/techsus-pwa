"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { tutorDb } from "@/lib/tutorDb";
import { fetchConversations } from "@/features/tutor/api";
import { getUserId } from "@/lib/session";

export default function RecentConversationsSection() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setLoading(true);
      let cached = [];

      try {
        const studentId = await getUserId();
        const allCached = await tutorDb.tutorConversations.toArray();
        cached = studentId
          ? allCached.filter((item) => item.studentId === studentId)
          : allCached;

        if (!cancelled && cached.length > 0) {
          // Sort by date descending and show top 3
          const sorted = [...cached].sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
          );
          setConversations(sorted.slice(0, 3));
        }
      } catch (err) {
        console.error("Could not read offline conversations:", err);
      }

      try {
        if (navigator.onLine) {
          const fresh = await fetchConversations({
            search: "",
            subject: "all",
          });
          const list = Array.isArray(fresh)
            ? fresh
            : fresh?.conversations || fresh?.items || [];

          if (!cancelled && list.length > 0) {
            setConversations(list.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn(
          "Could not fetch remote conversations for dashboard:",
          err,
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-400">
          Loading recent conversations...
        </p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#2C3691]">
          Recent Tutor Conversations
        </h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-400">
            No tutor conversations yet. Start a chat with the AI to see your
            history here!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2C3691]">
          Recent Tutor Conversations
        </h2>
        <Link
          href="/tutor"
          className="text-xs font-semibold text-[#3FA9F5] hover:underline"
        >
          View all history →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
        {conversations.map((chat) => (
          <Link
            key={chat.conversationId}
            href={`/tutor/${chat.conversationId}`}
            className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-[#3FA9F5]/50 hover:shadow-md"
          >
            <div>
              <span className="mb-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#3FA9F5]">
                {chat.subjectName || chat.subject || "Unknown"}
              </span>
              <h3 className="line-clamp-1 text-sm font-bold text-gray-800 group-hover:text-[#2C3691]">
                {chat.title || "Tutor Session"}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                {chat.last_message ||
                  chat.lastMessage ||
                  "Click to resume this conversation."}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-2 text-[11px] text-gray-400">
              <span>Resume Chat</span>
              <span className="font-bold text-[#2C3691] transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
