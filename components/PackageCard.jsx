"use client";

import React from "react";

export default function PackageCard({ pkg, downloadProgress, onAction }) {
  const isCurrentlyDownloading = downloadProgress !== undefined;

  return (
    <div className="bg-white border border-gray-100 rounded-xl py-5 px-8 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 gap-4">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[18px] font-bold text-[#2C3691] tracking-tight truncate">
            {pkg.title}
          </h3>
          {pkg.isDownloaded === 1 && (
            <span className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide whitespace-nowrap">
              Ready Offline
            </span>
          )}
        </div>
        <div className="text-[13px] text-gray-500 flex items-center gap-2 font-medium">
          <span className="text-gray-600">{pkg.subject}</span>
          <span className="text-gray-300 font-normal">•</span>
          <span className="text-gray-400 font-normal">{pkg.stage}</span>
          <span className="text-gray-300 font-normal">•</span>
          <span className="text-gray-400 font-normal">{pkg.files}</span>
        </div>

        {isCurrentlyDownloading && (
          <div className="w-full max-w-[250px] bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#3FA9F5] h-full transition-all duration-200 ease-out"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
        <button
          onClick={() => onAction(pkg)}
          disabled={isCurrentlyDownloading && downloadProgress < 100}
          className={`text-[14px] font-bold px-12 py-2.5 rounded-lg transition-colors shadow-sm tracking-wide min-w-[150px] text-center ${
            pkg.isDownloaded === 1
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : isCurrentlyDownloading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#2C3691] hover:bg-[#1e2566] text-white"
          }`}
        >
          {pkg.isDownloaded === 1
            ? "Open"
            : isCurrentlyDownloading
              ? `Downloading ${downloadProgress}%`
              : "Download"}
        </button>
      </div>
    </div>
  );
}
