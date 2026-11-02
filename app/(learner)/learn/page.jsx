"use client";

import React, { useState } from "react";
import LearnDashboardView from "@/features/curriculum/LearnDashboardView";
import TutorConversations from "@/features/tutor/TutorConversations";

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex flex-col flex-1 w-full">
      {/* Tab Switcher Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end shadow-xs">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-white text-[#1B2269] shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Explore Subjects
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-white text-[#1B2269] shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Saved Conversations & Downloads
          </button>
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col w-full">
        {activeTab === "dashboard" ? (
          <LearnDashboardView />
        ) : (
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
            <TutorConversations />
          </div>
        )}
      </div>
    </div>
  );
}
