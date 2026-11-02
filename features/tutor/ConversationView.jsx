"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { API_BASE_URL, ENDPOINTS } from "@/lib/config";
import { authHeaders, getClassLevel, getUserId } from "@/lib/session";
import { fetchConversationInteractions, saveConversationOffline } from "./api";
import MarkdownRenderer from "@/features/curriculum/MarkdownRenderer";

function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return null;

  if (/^https?:\/\//i.test(url)) return url;

  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

const NOT_TEXT =
  /(^|_)(id|ids|uuid|at|date|time|subject|topic|title|status|type|index|count|saved)(_|$)/i;

function normalize(interaction) {
  const entries = Object.entries(interaction || {}).filter(
    ([key, value]) =>
      typeof value === "string" && value.trim() && !NOT_TEXT.test(key),
  );
  const questionEntry = entries.find(([key]) =>
    /question|query|prompt|ask/i.test(key),
  );
  const question = questionEntry ? questionEntry[1] : "";
  const rest = entries.filter(([key]) => key !== questionEntry?.[0]);
  const named = rest.find(([key]) => /answer|response|reply/i.test(key));
  const longest = [...rest].sort((x, y) => y[1].length - x[1].length)[0];
  const answer = (named || longest)?.[1] || "";

  return {
    id: interaction?.interaction_id || interaction?.id,
    question,
    answer,
    mediaUrl:
      interaction?.media_url ||
      interaction?.mediaUrl ||
      interaction?.image_url ||
      interaction?.imageUrl ||
      null,
    raw: interaction,
  };
}

function toList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.interactions)) return data.interactions;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
}

export default function ConversationView() {
  const { conversationId } = useParams();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      let cached = null;
      try {
        const currentUserId = await getUserId();
        const all = await db.tutorConversations.toArray();
        const match = all.find(
          (c) => String(c.conversationId) === String(conversationId),
        );

        if (match && currentUserId && match.studentId !== currentUserId) {
          setError("You do not have permission to view this conversation.");
          setLoading(false);
          return;
        }

        cached = match || null;

        if (cached && !cancelled) {
          setMeta(cached);
          setIsDownloaded(Boolean(cached.interactions?.length));
        }
      } catch (err) {
        console.warn("Could not read offline conversation:", err);
      }

      try {
        if (!navigator.onLine) throw new Error("You are offline.");
        const data = await fetchConversationInteractions(conversationId);
        if (cancelled) return;
        setItems(toList(data).map(normalize));
      } catch (err) {
        if (cancelled) return;
        if (cached?.interactions?.length) {
          setItems(cached.interactions.map(normalize));
        } else {
          setError(err.message || "Could not load this conversation.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function handleDownload() {
    if (downloading || isDownloaded) return;
    setDownloading(true);
    try {
      const interactions = await saveConversationOffline(conversationId);
      const currentStudentId = await getUserId();

      try {
        const classLevel = await getClassLevel();
        const cached = await db.tutorConversations.get(conversationId);
        const subjectName = cached?.subjectName || meta?.subjectName;
        if (currentStudentId && classLevel && subjectName) {
          const title =
            meta?.title || `Conversation ${conversationId.slice(0, 8)}`;
          const packagePath = `${ENDPOINTS.packages.replace(/\/+$/, "")}/from-conversation`;
          const packageQuery = new URLSearchParams({
            conversation_id: conversationId,
            student_id: currentStudentId,
            subject_name: subjectName,
            class_level: classLevel,
            title,
            package_version: "1.0",
          });
          const packageRes = await fetch(
            `${API_BASE_URL}${packagePath}?${packageQuery}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(await authHeaders()),
              },
            },
          );
          if (packageRes.ok) {
            const pkg = await packageRes.json();

            try {
              db.offlinePackages?.put({
                packageId: pkg.package_id,
                conversationId: conversationId,
                studentId: currentStudentId,
                title: pkg.title,
                manifest: pkg.manifest,
                file_path_url: pkg.file_path_url,
                downloadedAt: new Date().toISOString(),
              });
            } catch (e) {
              console.warn("Could not store offline package locally:", e);
            }
          }
        }
      } catch (pkgErr) {
        console.warn(
          "Offline package creation failed, using local storage only:",
          pkgErr,
        );
      }

      await db.tutorConversations.put({
        ...(meta || { conversationId }),
        conversationId: meta?.conversationId || conversationId,
        studentId: currentStudentId,
        subjectName: meta?.subjectName || "",
        title: meta?.title || `Conversation ${conversationId.slice(0, 8)}`,
        interactions,
        savedAt: new Date().toISOString(),
      });
      setIsDownloaded(true);
    } catch (err) {
      console.error("Conversation download failed:", err);
      alert("Download failed. Check your connection and try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#F3F5FD]">
      <div className="mx-auto max-w-[1000px] px-8 pb-12 pt-10">
        <h2 className="text-[26px] font-bold capitalize leading-tight text-[#2C3691]">
          {meta?.subjectName || "Conversation"}
        </h2>
        {meta?.title && (
          <p className="text-[13px] font-semibold text-[#2C3691]">
            {meta.title}
          </p>
        )}

        {error && (
          <p
            role="status"
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800"
          >
            {error}
          </p>
        )}

        <div className="mt-8 min-h-[340px] max-h-[65vh] overflow-y-auto rounded-[40px] border border-[#2C3691]/60 bg-white/40 p-8">
          {loading ? (
            <p className="py-10 text-center font-medium text-gray-400">
              Loading conversation...
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center font-medium text-gray-400">
              No messages in this conversation.
            </p>
          ) : (
            <div className="space-y-8">
              {items.map((item, index) => (
                <section key={item.id || index} className="space-y-3">
                  {item.question && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%]">
                        <p className="mb-1 text-right text-[11px] font-bold uppercase tracking-wide text-[#2C3691]">
                          You asked
                        </p>
                        <div className="rounded-2xl rounded-br-sm bg-[#2C3691] px-4 py-3 text-[14px] text-white shadow-sm">
                          {item.question}
                        </div>
                      </div>
                    </div>
                  )}

                  {item.answer && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%]">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#2C3691]">
                          AI Tutor
                        </p>
                        <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-[#2C3691]/30 bg-white px-4 py-3 text-[14px] text-gray-800 shadow-sm">
                          <MarkdownRenderer content={item.answer} />
                        </div>
                        {item.mediaUrl && (
                          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <img
                              src={resolveMediaUrl(item.mediaUrl)}
                              alt="Curriculum illustration"
                              className="mx-auto max-h-80 w-auto rounded-lg object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!item.question && !item.answer && (
                    <pre className="overflow-auto rounded-lg bg-white p-3 text-xs text-gray-600">
                      {JSON.stringify(item.raw, null, 2)}
                    </pre>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || isDownloaded || loading}
            className={`h-[52px] w-[140px] rounded-md text-[15px] font-semibold text-white shadow-md transition disabled:cursor-default ${
              isDownloaded
                ? "bg-emerald-600"
                : "bg-[#2C3691] hover:bg-[#222B79] disabled:opacity-70"
            }`}
          >
            {downloading
              ? "Downloading..."
              : isDownloaded
                ? "Downloaded"
                : "Download"}
          </button>
        </div>
      </div>
    </main>
  );
}
