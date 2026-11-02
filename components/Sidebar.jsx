"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navigationItems, settingsItem, logo } from "@/lib/navigation";

const ICON_VIEW_BOXES = {
  "/icons/learn.png": "inset(24.1% 35.4% 27.6% 31.25%)",
  "/icons/assessment.png": "inset(17.2% 27.1% 22.4% 20.8%)",
  "/icons/progress.png": "inset(31.8% 35.4% 34.1% 27.1%)",
  "/icons/settings.png": "inset(33.3% 33.3% 19.4% 31.25%)",
};

function SidebarIcon({ item, isActive = false, className }) {
  const iconClassName = `${className} shrink-0 transition-transform group-hover:scale-105`;

  if (item.name === "Offline Packages") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${iconClassName} ${isActive ? "text-white" : "text-[#303781]"}`}
      >
        <path d="M23 24H10.5a7.5 7.5 0 1 1 2.3-14.6A9.5 9.5 0 0 1 31 12a5.8 5.8 0 0 1-2.5 11.8H23" />
        <path d="M4 4l24 24" />
      </svg>
    );
  }

  return (
    <Image
      src={item.icon}
      alt={item.name}
      width={48}
      height={48}
      style={{ objectViewBox: ICON_VIEW_BOXES[item.icon] }}
      className={`${iconClassName} object-contain ${isActive ? "brightness-0 invert" : ""}`}
    />
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const isSettingsActive =
    pathname === settingsItem.href ||
    pathname.startsWith(`${settingsItem.href}/`);

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-gray-200 bg-white px-4 pt-0 pb-8 lg:flex">
        <div>
          <div className="flex items-center justify-center mb-20">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={144}
              height={64}
              className="h-16 w-36 translate-y-2 object-contain"
              priority
            />
          </div>

          <nav className="flex flex-col">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));

              return (
                <div
                  key={item.name}
                  className="border-b border-gray-200 py-4 last:border-b-0"
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-5 py-1 px-3 rounded-xl group transition-all"
                  >
                    <div
                      className={`flex items-center justify-center transition-all shrink-0 w-16 h-16 rounded-full ${
                        isActive
                          ? "bg-[#38bdf8] shadow-md shadow-sky-200" // Light blue circular background when active
                          : "bg-white group-hover:bg-gray-50"
                      }`}
                    >
                      <SidebarIcon
                        item={item}
                        isActive={isActive}
                        className="h-8 w-8"
                      />
                    </div>
                    <div className="flex flex-col relative pb-0.5">
                      <span
                        className={`text-[0.9375rem] tracking-wide transition-colors ${
                          isActive
                            ? "text-[#38bdf8] font-bold"
                            : "text-[#1B2269] font-semibold"
                        }`}
                      >
                        {item.name}
                      </span>
                      <div
                        className={`absolute bottom-0 left-0 h-[2px] bg-[#38bdf8] rounded-full transition-all duration-200 ${
                          isActive ? "w-full" : "w-0 group-hover:w-full"
                        }`}
                      />
                    </div>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-200 mb-2">
          <Link
            href={settingsItem.href}
            className="flex items-center gap-5 py-2 px-3 rounded-xl group transition-all hover:bg-gray-50"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isSettingsActive
                  ? "bg-[#38bdf8] shadow-md shadow-sky-200"
                  : "bg-white"
              }`}
            >
              <SidebarIcon
                item={settingsItem}
                isActive={isSettingsActive}
                className="h-8 w-8"
              />
            </div>
            <div className="flex flex-col relative pb-0.5">
              <span
                className={`text-[0.9375rem] transition-colors ${
                  isSettingsActive
                    ? "text-[#38bdf8] font-bold"
                    : "text-[#1B2269] font-semibold"
                }`}
              >
                {settingsItem.name}
              </span>
              <div
                className={`absolute bottom-0 left-0 h-[2px] bg-[#38bdf8] rounded-full transition-all duration-200 ${
                  isSettingsActive ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </div>
          </Link>
        </div>
      </aside>

      {/* MOBILE HORIZONTAL BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-center justify-around py-2 px-2 shadow-lg">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
                isActive
                  ? "text-[#38bdf8] font-bold"
                  : "text-[#1B2269] font-semibold"
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  isActive ? "bg-[#38bdf8]" : "bg-transparent"
                }`}
              >
                <SidebarIcon
                  item={item}
                  isActive={isActive}
                  className="h-8 w-8"
                />
              </div>
              <span className="text-[0.625rem] mt-1 tracking-tight truncate max-w-[3.75rem]">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Settings item on mobile bar */}
        <Link
          href={settingsItem.href}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
            isSettingsActive
              ? "text-[#38bdf8] font-bold"
              : "text-[#1B2269] font-semibold"
          }`}
        >
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full ${
              isSettingsActive ? "bg-[#38bdf8]" : "bg-transparent"
            }`}
          >
            <SidebarIcon
              item={settingsItem}
              isActive={isSettingsActive}
              className="h-8 w-8"
            />
          </div>
          <span className="text-[0.625rem] mt-1 tracking-tight">Settings</span>
        </Link>
      </nav>
    </>
  );
}
