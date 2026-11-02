"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import MarkdownRenderer from "@/features/curriculum/MarkdownRenderer";

function PackageViewerContent() {
  const { packageId } = useParams();
  const [studentId, setStudentId] = React.useState(null);
  React.useEffect(() => {
    getUserId().then((id) => setStudentId(id || ""));
  }, []);

  const pkg = useLiveQuery(
    () => db.offlinePackages.get(packageId),
    [packageId],
  );

  const savedConv = useLiveQuery(
    () => db.tutorConversations?.get(packageId) ?? null,
    [packageId],
  );

  const resolvedPkg = pkg || savedConv;

  if (resolvedPkg === undefined || studentId === null) {
    return <main className="p-8 text-gray-400 font-medium">Loading...</main>;
  }

  if (savedConv && savedConv.studentId && savedConv.studentId !== studentId) {
    return (
      <main className="p-8 max-w-[1100px] mx-auto space-y-4">
        <p className="text-gray-600">
          This conversation does not belong to your account.
        </p>
        <Link href="/offline" className="text-[#2C3691] font-bold underline">
          Back to Offline
        </Link>
      </main>
    );
  }

  if (!resolvedPkg) {
    return (
      <main className="p-8 max-w-[1100px] mx-auto space-y-4">
        <p className="text-gray-600">
          This conversation was not found on this device.
        </p>
        <Link href="/offline" className="text-[#2C3691] font-bold underline">
          Back to Offline
        </Link>
      </main>
    );
  }

  const interactions = savedConv?.interactions || [];
  const title = savedConv?.title || pkg?.title || "Saved Conversation";
  const subject = savedConv?.subjectName || pkg?.subject || "Unknown";

  return (
    <main className="p-8 max-w-[1100px] mx-auto w-full space-y-6">
      <div className="bg-[#2C3691] text-white rounded-xl px-8 py-5 shadow-md">
        <Link
          href="/offline"
          className="text-[13px] text-white/80 hover:text-white"
        >
          &larr; Offline
        </Link>
        <h1 className="text-[24px] font-semibold tracking-wide mt-1">
          {title}
        </h1>
        <p className="text-[13px] text-white/80">{subject}</p>
      </div>

      {interactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400 font-medium bg-white rounded-xl border border-gray-200 shadow-sm">
          No messages in this conversation yet.
        </div>
      ) : (
        <div className="space-y-4">
          {interactions.map((item, index) => {
            const question = item.student_query || item.question || "";
            const answer = item.ai_response || item.answer || "";
            const mediaUrl = item.media_url || item.mediaUrl || null;

            return (
              <div
                key={index}
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#2C3691] text-white text-[12px] font-bold flex items-center justify-center">
                    Q
                  </span>
                  <span className="text-[14px] font-bold text-[#2C3691]">
                    You
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed pl-9">
                  {question}
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-[12px] font-bold flex items-center justify-center">
                    A
                  </span>
                  <span className="text-[14px] font-bold text-emerald-700">
                    AI Tutor
                  </span>
                </div>
                <div className="pl-9">
                  <MarkdownRenderer
                    content={answer}
                    subject={subject}
                    mediaUrl={mediaUrl}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="p-8 text-gray-400 font-medium">
          Loading conversation...
        </main>
      }
    >
      <PackageViewerContent />
    </Suspense>
  );
}
