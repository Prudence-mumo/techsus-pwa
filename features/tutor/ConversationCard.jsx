"use client";

import React from "react";
import Link from "next/link";

const SUBJECT_STYLES = {
  biology: { bg: "bg-rose-50", icon: "🫀" },
  chemistry: { bg: "bg-sky-50", icon: "🧪" },
  english: { bg: "bg-amber-50", icon: "📘" },
  physics: { bg: "bg-violet-50", icon: "⚛️" },
  mathematics: { bg: "bg-emerald-50", icon: "📐" },
};

const DEFAULT_STYLE = { bg: "bg-indigo-50", icon: "📚" };

export default function ConversationCard({
  conversation,
  isDownloaded = false,
  isDownloading = false,
  onDownload,
}) {
  const subjectKey = String(conversation.subjectName ?? "")
    .trim()
    .toLowerCase();
  const style = SUBJECT_STYLES[subjectKey] || DEFAULT_STYLE;

  let downloadLabel = "Download";
  if (isDownloading) downloadLabel = "Downloading...";
  if (isDownloaded) downloadLabel = "Downloaded";

  return (
    <article className="flex flex-col gap-4 rounded-[26px] border border-[#2C3691]/50 bg-white px-4 py-3 shadow-[0_3px_8px_rgba(44,54,145,0.15)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md text-3xl ${style.bg}`}
          aria-hidden="true"
        >
          {style.icon}
        </div>

        <div className="min-w-0">
          <h4 className="truncate text-[15px] font-bold text-black">
            {conversation.subjectName}
          </h4>
          <p className="truncate text-[12px] text-gray-800">
            {conversation.title}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:justify-end">
        <Link
          href={`/learn/${conversation.conversationId}`}
          className="flex h-[46px] w-[84px] items-center justify-center rounded-sm border border-[#2C3691]/60 bg-white text-[15px] font-medium text-black transition hover:bg-[#F3F5FD]"
        >
          View
        </Link>

        <button
          type="button"
          onClick={() => onDownload?.(conversation)}
          disabled={isDownloading || isDownloaded}
          className={`flex h-[46px] w-[166px] items-center justify-center rounded-sm text-[15px] font-medium text-white transition disabled:cursor-default ${
            isDownloaded
              ? "bg-emerald-600"
              : "bg-[#2C3691] hover:bg-[#222B79] disabled:opacity-70"
          }`}
        >
          {downloadLabel}
        </button>
      </div>
    </article>
  );
}
