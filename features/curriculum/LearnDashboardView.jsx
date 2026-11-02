"use client";

import React, { useState, useEffect } from "react";
import { getUserName, getUserId, authHeaders } from "@/lib/session";
import Link from "next/link";
import Image from "next/image";

const SUBJECTS = [
  {
    id: "mathematics",
    name: "Mathematics",
    icon: "/icons/math.png",
    color: "bg-indigo-100 hover:bg-indigo-100",
  },
  {
    id: "english",
    name: "English",
    icon: "/icons/english.png",
    color: "bg-emerald-100 hover:bg-emerald-100",
  },
  {
    id: "biology",
    name: "Biology",
    icon: "/icons/biology.png",
    color: "bg-pink-100 hover:bg-pink-100",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    icon: "/icons/chemistry.png",
    color: "bg-amber-100 hover:bg-amber-100",
  },
  {
    id: "physics",
    name: "Physics",
    icon: "/icons/physics.png",
    color: "bg-purple-100 hover:bg-purple-100",
  },
  {
    id: "ai-tutor",
    name: "Language Tutor",
    icon: "/icons/language.png",
    color: "bg-sky-100 hover:bg-sky-100",
    href: "/tutor",
  },
];

export default function LearnDashboardView() {
  const [studentName, setStudentName] = useState("Student");
  const [stats, setStats] = useState({
    lessons: 0,
    hours: 0,
    average: 0,
    streak: 0,
  });

  useEffect(() => {
    let active = true;
    const loadName = async () => {
      const storedName =
        typeof window !== "undefined"
          ? localStorage.getItem("learnerDisplayName")
          : null;
      const name = storedName || (await getUserName());
      if (active && name) setStudentName(name);
    };
    loadName();
    const handler = () => loadName();
    if (typeof window !== "undefined") {
      window.addEventListener("learner-name-updated", handler);
    }

    (async () => {
      try {
        const id = await getUserId();
        if (!id || id === "null") return;

        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        const progressPath =
          process.env.NEXT_PUBLIC_PROGRESS_STUDENT_PATH ||
          "/api/v1/progress/student";
        const headers = await authHeaders();

        const progressRes = await fetch(`${base}${progressPath}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        });

        if (progressRes.ok) {
          const d = await progressRes.json();
          const statsData = d.data || d;
          setStats((prev) => ({
            ...prev,
            lessons: statsData.lessons_completed ?? 0,
            hours: statsData.hours_of_learning ?? 0,
            average: statsData.average_assessment ?? 0,
            streak: statsData.learning_streak ?? prev.streak,
          }));
        }
      } catch (e) {
        console.error("Error fetching student session or stats:", e);
      }
    })();

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("learner-name-updated", handler);
      }
    };
  }, []);

  const displayedSubjects = SUBJECTS;

  return (
    <div className="min-h-screen bg-[#F6F7FC] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="bg-[#E6ECFC] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden border border-indigo-100/60 shadow-xs">
        <div className="flex flex-col gap-2 z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2269] tracking-tight">
            Hello {studentName}
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            Big discoveries start with small steps.
          </p>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
            A new day, a new chance to learn something great.
          </p>
        </div>
        <div className="relative w-36 h-28 sm:w-44 sm:h-32 shrink-0 flex items-center justify-center">
          <Image
            src="/icons/english.png"
            alt="Learning illustrations"
            width={160}
            height={120}
            style={{ width: "auto", height: "auto" }}
            className="object-contain drop-sm"
            priority
          />
        </div>
      </div>

      <div className="mt-2">
        <h2 className="text-base font-bold text-gray-900">
          Available subjects
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {displayedSubjects.map((sub) => (
          <Link
            key={sub.id}
            href={sub.href || `/subjects/${sub.id}`}
            className={`${sub.color} transition-all min-h-[180px] p-7 rounded-2xl border border-transparent hover:border-indigo-200 flex flex-col items-center justify-center gap-4 text-center shadow-sm group`}
          >
            <div className="w-14 h-14 relative flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image
                src={sub.icon}
                alt={sub.name}
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>
            <span className="font-bold text-lg text-gray-800">{sub.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
