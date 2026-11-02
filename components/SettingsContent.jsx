"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/authApi";
import {
  applyTextSizePreference,
  getTextSizePreference,
} from "@/lib/textSizePreference";
import {
  clearSession,
  getSession,
  getUserClass,
  getUserName,
  setSession,
} from "@/lib/session";

export default function SettingsContent() {
  const router = useRouter();
  const [userName, setUserName] = useState("Student");
  const [displayNameDraft, setDisplayNameDraft] = useState("Student");
  const [learnerClass, setLearnerClass] = useState("Student");
  const textSizeSelectRef = useRef(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    let active = true;

    localStorage.removeItem("app-theme");
    const savedTextSize = getTextSizePreference();
    applyTextSizePreference(savedTextSize);
    if (textSizeSelectRef.current) {
      textSizeSelectRef.current.value = savedTextSize;
    }

    async function loadUserProfile() {
      const name = await getUserName();
      const userClass = await getUserClass();
      if (active && name) {
        setUserName(name);
        setDisplayNameDraft(name);
      }
      if (active && userClass) {
        setLearnerClass(userClass);
      }
    }

    loadUserProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveDisplayName = async () => {
    const nextName = displayNameDraft.trim();
    if (!nextName) return;

    const session = await getSession();
    await setSession({
      userId: session.userId ?? null,
      token: session.token ?? null,
      userName: nextName,
      userClass: session.userClass ?? learnerClass,
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("learnerDisplayName", nextName);
      window.dispatchEvent(new Event("learner-name-updated"));
    }

    setUserName(nextName);
    setShowNameModal(false);
  };

  const handleLogout = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    try {
      await logoutRequest(token);
    } catch {
      // Ignore backend logout failures and continue with local cleanup.
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminUser");
    }

    await clearSession();
    router.push("/login");
  };

  const addInterest = () => {
    const nextInterest = newInterest.trim();
    if (nextInterest && !interests.includes(nextInterest)) {
      setInterests([...interests, nextInterest]);
      setNewInterest("");
    }
  };

  const removeInterest = (item) => {
    setInterests(interests.filter((i) => i !== item));
  };

  const currentTheme = {
    cardBg: "bg-white",
    cardBorder: "border-[#bfdbfe]",
    accentBg: "bg-[#dbeafe]",
    badgeBg: "bg-white border-2 border-[#1B2269]",
    badgeText: "text-[#1B2269]",
    learningBadge: "bg-white border-2 border-[#1B2269]",
    accountBadge: "bg-white border-2 border-[#1B2269]",
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 p-6 text-[#1e293b]">
      <div
        className="text-white rounded-xl p-6 shadow-md border-2 flex items-center justify-between"
        style={{
          backgroundColor: "var(--nav-bg, #1B2269)",
          borderColor: "var(--nav-bg, #1B2269)",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-xl border border-white/25">
            {userName.charAt(0)?.toUpperCase() || "S"}
          </div>
          <div>
            <h2 className="text-xl font-bold">{userName}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setDisplayNameDraft(userName);
            setShowNameModal(true);
          }}
          className="bg-white text-[#1B2269] text-sm font-bold px-4 py-1.5 rounded-full border-2 border-white hover:bg-slate-100 active:scale-[0.98] transition-all"
        >
          Edit
        </button>
      </div>

      <div
        className={`${currentTheme.cardBg} rounded-xl p-6 border-2 ${currentTheme.cardBorder} shadow-sm space-y-4`}
      >
        <span
          className={`text-xs font-bold ${currentTheme.learningBadge} text-[#1B2269] px-3 py-1 rounded-full uppercase tracking-wider inline-block`}
        >
          Accessibility
        </span>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-amber-50 border ${currentTheme.cardBorder} flex items-center justify-center`}
            >
              T
            </div>
            <div>
              <p className="text-sm font-bold">Text size</p>
              <p className="text-sm opacity-70">Make reading comfy</p>
            </div>
          </div>
          <select
            ref={textSizeSelectRef}
            defaultValue="medium"
            onChange={(e) => {
              applyTextSizePreference(e.target.value);
            }}
            className={`text-sm font-bold border-2 ${currentTheme.cardBorder} rounded-lg px-3 py-1 bg-white text-black outline-none`}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div
        className={`${currentTheme.cardBg} rounded-xl p-6 border-2 ${currentTheme.cardBorder} shadow-sm space-y-4`}
      >
        <span
          className={`text-xs font-bold ${currentTheme.learningBadge} text-[#1B2269] px-3 py-1 rounded-full uppercase tracking-wider inline-block`}
        >
          Learning Goals & Interests
        </span>

        <div className="flex flex-wrap gap-2">
          {interests.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1 text-sm font-bold bg-white border-2 border-[#1B2269] px-3 py-1 rounded-full text-[#1B2269]"
            >
              {item}
              <button
                type="button"
                onClick={() => removeInterest(item)}
                className="hover:text-red-500"
              >
                X
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add new subject interest..."
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            className={`flex-1 border-2 ${currentTheme.cardBorder} rounded-lg px-3 py-1.5 text-sm text-black outline-none bg-white`}
          />
          <button
            type="button"
            onClick={addInterest}
            className="bg-[#1B2269] text-white text-sm font-bold px-4 py-1.5 rounded-xl hover:opacity-90 flex items-center gap-1 border-2 border-[#1B2269]"
          >
            + Add
          </button>
        </div>
      </div>

      <div
        className={`${currentTheme.cardBg} rounded-xl p-6 border-2 ${currentTheme.cardBorder} shadow-sm space-y-4`}
      >
        <span
          className={`text-xs font-bold ${currentTheme.accountBadge} text-[#1B2269] px-3 py-1 rounded-full uppercase tracking-wider inline-block`}
        >
          Account & Security
        </span>

        <button
          type="button"
          onClick={() => setShowAccountModal(true)}
          className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border-2 ${currentTheme.cardBorder} hover:opacity-80 transition-opacity`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-teal-50 border ${currentTheme.cardBorder} flex items-center justify-center`}
            >
              U
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Account Settings</p>
              <p className="text-sm opacity-70">Manage credentials & session</p>
            </div>
          </div>
          <span className="font-bold">&rsaquo;</span>
        </button>
      </div>

      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-bold">Edit name</h3>
            <input
              type="text"
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              className="w-full border-2 border-[#bfdbfe] rounded-lg px-3 py-2 text-black outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNameModal(false)}
                className="px-4 py-2 rounded-lg border-2 border-[#bfdbfe] font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDisplayName}
                className="px-4 py-2 rounded-lg bg-[#1B2269] text-white font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-bold">Account & Security</h3>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-bold"
            >
              Log out
            </button>
            <button
              type="button"
              onClick={() => setShowAccountModal(false)}
              className="w-full px-4 py-2 rounded-lg border-2 border-[#bfdbfe] font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
