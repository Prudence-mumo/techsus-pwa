"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserName } from "@/lib/session";

export default function LearnerHeader() {
  const router = useRouter();
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    let active = true;

    const applyUserName = async () => {
      const storedName =
        typeof window !== "undefined"
          ? localStorage.getItem("learnerDisplayName")
          : null;
      const name = storedName || (await getUserName());
      if (active && name) {
        setUserName(name);
      }
    };

    applyUserName();

    const handleNameUpdate = () => {
      if (active) {
        applyUserName();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("learner-name-updated", handleNameUpdate);
    }

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("learner-name-updated", handleNameUpdate);
      }
    };
  }, []);

  const badgeLetter = userName.trim().charAt(0)?.toUpperCase() || "S";

  return (
    <header
      className="fixed top-0 left-0 z-40 flex h-[92px] w-full items-center justify-between px-8 py-6 shadow-md lg:left-64 lg:w-[calc(100%-16rem)]"
      style={{
        backgroundColor: "var(--nav-bg, #1B2269)",
        color: "var(--nav-text, #ffffff)",
      }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-colors cursor-pointer"
        aria-label="Go back"
        style={{
          backgroundColor: "transparent",
          border: "none",
          padding: 0,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
          className="h-9 w-9 text-white"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
      </button>

      <div className="flex items-center gap-3.5">
        <span className="font-extrabold text-base tracking-wide">
          {userName}
        </span>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden relative"
          style={{
            backgroundColor: "var(--nav-surface, rgba(255,255,255,0.25))",
          }}
        >
          <span className="text-sm font-bold" style={{ color: "#1B2269" }}>
            {badgeLetter}
          </span>
          <Image
            src="/icons/user.png"
            alt="User profile"
            width={38}
            height={38}
            style={{ width: "auto", height: "auto" }}
            className="h-full w-full object-contain hidden"
          />
        </div>
      </div>
    </header>
  );
}
