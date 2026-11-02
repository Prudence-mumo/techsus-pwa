"use client";

import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { saveLessonProgress } from "../../lib/packages";
import { getSession } from "../../lib/session";

export default function LessonProgressTracker({
  studentId: initialStudentId,
  topicId,
  contentId,
}) {
  const [localStatus, setLocalStatus] = useState("in_progress");
  const [activeStudentId, setActiveStudentId] = useState(
    initialStudentId || null,
  );

  useEffect(() => {
    if (!activeStudentId) {
      getSession().then((session) => {
        if (session?.userId) setActiveStudentId(session.userId);
      });
    }
  }, [activeStudentId]);

  const activeProgress = useLiveQuery(async () => {
    if (!activeStudentId) return null;
    return await db.lessonProgress
      .where("[student_id+content_id]")
      .equals([activeStudentId, contentId || ""])
      .first();
  }, [activeStudentId, contentId]);

  const displayStatus = activeProgress?.status || localStatus;

  const handleMarkAsComplete = async () => {
    if (!activeStudentId) {
      alert(
        "Missing active student session identifier. Please verify your active login state.",
      );
      return;
    }

    try {
      await saveLessonProgress({
        studentId: activeStudentId,
        topicId,
        contentId,
        status: "completed",
        sync: true,
      });
      setLocalStatus("completed");
    } catch (error) {
      console.error("Failed to update execution progress:", error);
    }
  };

  if (typeof window === "undefined") return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-md mx-auto space-y-4">
      <div className="space-y-1">
        <h3 className="text-[18px] font-bold text-[#2C3691]">
          Your Lesson Progress
        </h3>
        <p className="text-[13px] text-gray-500">
          Track your course completion states. Don&apos;t forget to synchronize
          updates once you&apos;re back online.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-gray-700">
            Status:
          </span>
          <span
            className={`text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              displayStatus === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {displayStatus === "completed" ? "Completed" : "In Progress"}
          </span>
        </div>

        {displayStatus !== "completed" && (
          <button
            onClick={handleMarkAsComplete}
            className="bg-[#3FA9F5] hover:bg-[#2C3691] text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Mark as Complete
          </button>
        )}
      </div>
    </div>
  );
}
