"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getStudentId } from "@/lib/session";
import { db } from "@/lib/db";
import { getClassLevel } from "@/lib/session";
import { useAppConfig } from "@/hooks/useAppConfig";
import PackageCard from "@/components/PackageCard";

export default function OfflinePackages() {
  const router = useRouter();
  const { config } = useAppConfig();
  const [selectedSubject, setSelectedSubject] = useState("All subjects");
  const [selectedClass, setSelectedClass] = useState("All classes");
  const [selectedStatus, setSelectedStatus] = useState("Status");
  const [learnerClassLevel, setLearnerClassLevel] = useState("");

  const [studentId, setStudentId] = useState("");
  useEffect(() => {
    getStudentId().then((id) => setStudentId(id || ""));
  }, []);
  const localPackages = useLiveQuery(
    () =>
      studentId
        ? db.offlinePackages.where("studentId").equals(studentId).toArray()
        : db.offlinePackages.toArray(),
    [studentId],
  );
  const loading = localPackages === undefined;
  const coursePackages = (localPackages ?? []).filter(
    (pkg) =>
      !pkg.isMock && !/^Package [\da-f]{8}$/i.test(pkg.title?.trim() ?? ""),
  );

  // Also load tutor conversations that have been saved for offline use
  const savedConversations = useLiveQuery(
    () =>
      studentId
        ? db.tutorConversations.where("studentId").equals(studentId).toArray()
        : [],
    [studentId],
  );

  useEffect(() => {
    let active = true;
    getClassLevel()
      .then((classLevel) => {
        if (active) setLearnerClassLevel(classLevel || "");
      })
      .catch(() => {
        if (active) setLearnerClassLevel("");
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePackageAction = (pkg) => {
    if (pkg.isDownloaded === 1 || pkg.isConversation) {
      router.push(`/offline/${pkg.id}`);
      return;
    }
    alert(
      "This conversation has not been saved for offline use yet. Visit the conversation history page and click Download to save it.",
    );
  };

  // Build package list from saved conversations
  const allPackages = [
    ...coursePackages.map((p) => ({ ...p, id: p.id })),
    ...(savedConversations || []).map((conv) => ({
      id: conv.conversationId,
      title: conv.title || `Conversation ${conv.conversationId?.slice(0, 8)}`,
      subject: conv.subjectName || "Unknown",
      stage: conv.classLevel || learnerClassLevel || "Unknown",
      files: `${conv.interactions?.length || 0} messages`,
      isDownloaded: 1,
      isConversation: 1,
      isSynced: 1,
      isMock: 0,
      manifestIds: [],
      fileUrl: "",
      downloadedAt: conv.savedAt || new Date().toISOString(),
    })),
  ];

  const filteredPackages = allPackages.filter((pkg) => {
    const matchesSubject =
      selectedSubject === "All subjects" ||
      pkg.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesClass =
      selectedClass === "All classes" ||
      pkg.stage.toLowerCase() === selectedClass.toLowerCase();

    let matchesStatus = true;
    if (selectedStatus === "Downloaded") {
      matchesStatus = pkg.isDownloaded === 1;
    } else if (selectedStatus === "Available") {
      matchesStatus = pkg.isDownloaded === 0;
    }

    return matchesSubject && matchesClass && matchesStatus;
  });

  return (
    <main className="p-8 max-w-[1100px] mx-auto w-full space-y-8">
      <div className="bg-[#2C3691] text-white rounded-xl px-8 py-5 flex justify-between items-center shadow-md">
        <h1 className="text-[24px] font-semibold tracking-wide">
          Learning, wherever you are
        </h1>
      </div>

      <section className="space-y-4">
        <div className="space-y-1 pl-0.5">
          <h2 className="text-[22px] font-bold text-[#2C3691] tracking-tight">
            Saved for Offline
          </h2>
          <p className="text-[13px] text-gray-500">
            Conversations you have downloaded will appear here and be available
            even without an internet connection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="relative w-[180px]">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 text-[14px] font-medium text-gray-700 shadow-sm focus:outline-none focus:border-[#3FA9F5] pr-10 cursor-pointer transition-colors"
            >
              <option value="All subjects">All subjects</option>
              <option value="English">English</option>
              <option value="Biology">Biology</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
              ▼
            </div>
          </div>

          <div className="relative w-[160px]">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 text-[14px] font-medium text-gray-700 shadow-sm focus:outline-none focus:border-[#3FA9F5] pr-10 cursor-pointer transition-colors"
            >
              <option value="All classes">All classes</option>
              {(config?.classLevels || []).map((classLevel) => (
                <option key={classLevel} value={classLevel}>
                  {classLevel}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
              ▼
            </div>
          </div>

          <div className="relative w-[150px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 text-[14px] font-medium text-gray-700 shadow-sm focus:outline-none focus:border-[#3FA9F5] pr-10 cursor-pointer transition-colors"
            >
              <option value="Status">Status</option>
              <option value="Downloaded">Downloaded</option>
              <option value="Available">Available</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-2">
        {loading ? (
          <div className="text-center py-12 text-gray-400 font-medium bg-white rounded-xl border border-gray-200 shadow-sm">
            Loading localized packages...
          </div>
        ) : filteredPackages.length > 0 ? (
          filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              downloadProgress={undefined}
              onAction={handlePackageAction}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-400 font-medium bg-white rounded-xl border border-gray-200 shadow-sm">
            No saved conversations yet. Visit the conversation history page
            (Saved Conversations & Downloads tab) and click Download on any
            conversation to save it for offline use.
          </div>
        )}
      </section>
    </main>
  );
}
