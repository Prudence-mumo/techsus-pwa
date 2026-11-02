"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Settings as SettingsIcon,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

function getApiBase() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("__config_error__");
  return base.replace(/\/$/, "");
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const popupRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({
    name: "",
    role: "ADMIN",
    email: "",
    avatar: "/icons/admin_avatar.png",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const base = getApiBase();
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("authToken")
            : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const meRes = await fetch(`${base}/api/v1/users/me`, {
          headers,
        }).catch(() => null);
        if (meRes && meRes.ok) {
          const me = await meRes.json().catch(() => null);
          if (me && typeof me === "object" && !Array.isArray(me)) {
            const role = String(me.role || "").toUpperCase();
            const user = {
              name:
                me.display_name ||
                me.name ||
                me.full_name ||
                me.username ||
                me.email ||
                "Admin User",
              role: role || "ADMIN",
              email: me.email || "",
              avatar: me.avatar || "/icons/admin_avatar.png",
            };
            if (!cancelled) {
              setCurrentUser(user);
              if (typeof window !== "undefined") {
                localStorage.setItem("adminUser", JSON.stringify(user));
              }

              if (role && role !== "ADMIN" && role !== "ADMINISTRATOR") {
                router.push("/learn");
              }
            }
            return;
          }
        }

        const res = await fetch(`${base}/api/v1/users`, { headers }).catch(
          () => null,
        );
        if (res && res.ok) {
          const data = await res.json().catch(() => []);
          const users = Array.isArray(data)
            ? data
            : data.items || data.data || [];
          const meFromList =
            users.find(
              (u) =>
                token &&
                (u.token === token ||
                  u.access_token === token ||
                  u.current === true ||
                  u.is_current === true),
            ) || users[0];
          if (meFromList) {
            const role = String(meFromList.role || "").toUpperCase();
            const user = {
              name:
                meFromList.display_name ||
                meFromList.name ||
                meFromList.full_name ||
                meFromList.email ||
                "Admin User",
              role: role || "ADMIN",
              email: meFromList.email || "",
              avatar: meFromList.avatar || "/icons/admin_avatar.png",
            };
            if (!cancelled) {
              setCurrentUser(user);
              if (typeof window !== "undefined") {
                localStorage.setItem("adminUser", JSON.stringify(user));
              }
              if (role && role !== "ADMIN" && role !== "ADMINISTRATOR") {
                router.push("/learn");
              }
            }
            return;
          }
        }
      } catch {}
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminUser");
      const { clearSession } = await import("@/lib/session");
      await clearSession();
    }
    router.push("/login");
  };

  const isActive = (path) =>
    pathname === path || (path !== "/admin" && pathname.startsWith(path));

  const adminNavItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/admin" },
    {
      name: "Learner Management",
      icon: GraduationCap,
      href: "/admin/learners",
    },
    { name: "Curriculum", icon: BookOpen, href: "/admin/curriculum" },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans text-slate-800 overflow-hidden">
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col justify-between py-8 px-5 shrink-0 fixed h-full left-0 top-0 z-50 select-none">
        <div>
          <div className="flex items-center justify-center mt-2 mb-30 pb-4 w-full relative h-16">
            <Image
              src="/Group 191.png"
              alt="redu logo"
              fill
              sizes="90px"
              className="object-contain"
              priority
            />
          </div>

          <nav className="flex flex-col space-y-2">
            {adminNavItems.map((item) => {
              const active = isActive(item.href);
              const IconComponent = item.icon;
              return (
                <div
                  key={item.name}
                  className="border-b border-gray-100 py-3 last:border-b-0"
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-4 py-1.5 px-2 rounded-xl group transition-all"
                  >
                    <div
                      className={`flex items-center justify-center transition-all shrink-0 w-16 h-16 rounded-2xl relative overflow-hidden shadow-sm ${active ? "bg-[#3FA9F5] text-white shadow-blue-200" : "bg-transparent group-hover:bg-gray-50"}`}
                    >
                      <IconComponent
                        className={`w-7 h-7 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`}
                      />
                    </div>
                    <div className="flex flex-col relative pb-0.5">
                      <span
                        className={`text-[15px] tracking-wide transition-colors ${active ? "text-[#3FA9F5] font-bold" : "text-gray-500 font-semibold group-hover:text-gray-900"}`}
                      >
                        {item.name}
                      </span>
                      <div
                        className={`absolute bottom-0 left-0 h-[2px] bg-[#3FA9F5] rounded-full transition-all duration-200 ${active ? "w-full" : "w-0 group-hover:w-full"}`}
                      />
                    </div>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-100 mb-2">
          <Link
            href="/admin/settings"
            className="flex items-center gap-4 py-2 px-2 rounded-xl group transition-all hover:bg-gray-50"
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors relative overflow-hidden ${isActive("/admin/settings") ? "bg-[#3FA9F5] text-white shadow-sm shadow-blue-200" : "bg-transparent group-hover:bg-gray-50"}`}
            >
              <SettingsIcon
                className={`w-7 h-7 ${isActive("/admin/settings") ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`}
              />
            </div>
            <div className="flex flex-col relative pb-0.5">
              <span
                className={`text-[15px] font-semibold transition-colors ${isActive("/admin/settings") ? "text-[#3FA9F5] font-bold" : "text-gray-500 group-hover:text-gray-900"}`}
              >
                Settings
              </span>
              <div
                className={`absolute bottom-0 left-0 h-[2px] bg-[#3FA9F5] rounded-full transition-all duration-200 ${isActive("/admin/settings") ? "w-full" : "w-0 group-hover:w-full"}`}
              />
            </div>
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <header className="h-24 bg-[#283593] px-8 flex items-center justify-between text-white shadow-md shrink-0 relative z-40">
          <h1 className="text-3xl font-semibold tracking-wide capitalize">
            {isActive("/admin") && pathname === "/admin" && "Overview"}
            {isActive("/admin/learners") && "Learner Management"}
            {isActive("/admin/curriculum") && "Curriculum"}
            {isActive("/admin/settings") && "Settings"}
          </h1>

          <div className="relative" ref={popupRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all cursor-pointer focus:outline-none"
            >
              <span className="text-sm font-semibold tracking-wider text-slate-100 pl-1">
                {currentUser.role} ({currentUser.name})
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-inner relative shrink-0">
                <User className="w-6 h-6 text-slate-700" />
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-200 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 px-2 text-slate-800 z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-700"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-500" />
                    <span>Account Settings</span>
                  </Link>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-rose-50 text-sm font-semibold text-rose-600"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
