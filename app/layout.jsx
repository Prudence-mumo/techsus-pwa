"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Nunito_Sans } from "next/font/google";
import OfflineProvider from "@/components/OfflineProvider";
import OfflineBanner from "@/components/OfflineBanner";
import {
  applyTextSizePreference,
  getTextSizePreference,
} from "@/lib/textSizePreference";
import "./globals.css";
import "katex/dist/katex.min.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
  variable: "--font-nunito",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

function LayoutContent({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    applyTextSizePreference(getTextSizePreference());
  }, []);

  const hideSidebarRoutes = ["/", "/splash", "/login"];
  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);

  const learnerRoutePrefixes = [
    "/dashboard",
    "/learn",
    "/assessments",
    "/progress",
    "/offline",
    "/lessons",
    "/subjects",
    "/settings",
    "/profile",
    "/tutor",
  ];

  const isLearnerRoute = learnerRoutePrefixes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const showRootSidebar = !shouldHideSidebar && !isLearnerRoute;

  const navigationItems = [
    { name: "Home", icon: "/icons/home.png", href: "/dashboard" },
    { name: "Learn", icon: "/icons/learn.png", href: "/learn" },
    {
      name: "Assessment",
      icon: "/icons/assessment.png",
      href: "/assessments",
    },
    { name: "Progress", icon: "/icons/progress.png", href: "/progress" },
    {
      name: "Offline Packages",
      icon: "/icons/offline.png",
      href: "/offline",
    },
  ];

  return (
    <div className="flex min-h-screen w-full overflow-x-clip">
      {showRootSidebar && (
        <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col justify-between py-8 px-4 shrink-0 fixed h-full left-0 top-0 z-50">
          <div>
            <div className="flex items-center justify-center mb-6 w-full relative h-16">
              <Image
                src="/Group 191.png"
                alt="redu logo"
                fill
                sizes="90px"
                className="object-contain"
                priority
              />
            </div>

            <nav className="flex flex-col">
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

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
                        className={`flex items-center justify-center transition-all shrink-0 w-16 h-16 rounded-2xl relative overflow-hidden ${
                          isActive
                            ? "bg-[#3FA9F5] shadow-md shadow-blue-200"
                            : "bg-white group-hover:bg-gray-50"
                        }`}
                      >
                        <Image
                          src={item.icon}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className={`object-contain shrink-0 transition-transform group-hover:scale-105 ${
                            isActive ? "brightness-0 invert" : ""
                          }`}
                        />
                      </div>

                      <div className="flex flex-col relative pb-0.5">
                        <span
                          className={`text-[0.9375rem] tracking-wide transition-colors ${
                            isActive
                              ? "text-[#3FA9F5] font-bold"
                              : "text-gray-500 font-semibold group-hover:text-gray-900"
                          }`}
                        >
                          {item.name}
                        </span>
                        <div
                          className={`absolute bottom-0 left-0 h-[2px] bg-[#3FA9F5] rounded-full transition-all duration-200 ${
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
              href="/settings"
              className="flex items-center gap-5 py-2 px-3 rounded-xl group transition-all hover:bg-gray-50"
            >
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shrink-0 transition-colors relative overflow-hidden">
                <Image
                  src="/icons/settings.png"
                  alt="Settings"
                  fill
                  sizes="64px"
                  className="object-contain shrink-0"
                />
              </div>
              <div className="flex flex-col relative pb-0.5">
                <span className="text-[15px] font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                  Settings
                </span>
                <div className="absolute bottom-0 left-0 h-[2px] bg-gray-400 rounded-full w-0 group-hover:w-full transition-all duration-200" />
              </div>
            </Link>
          </div>
        </aside>
      )}

      <div
        className={`flex-1 flex flex-col min-w-0 ${showRootSidebar ? "lg:pl-64" : ""}`}
      >
        <OfflineBanner />

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <body className="antialiased bg-redu-bg text-gray-800">
        <OfflineProvider>
          <Suspense
            fallback={
              <div className="p-8 text-center text-gray-400">
                Loading layout...
              </div>
            }
          >
            <LayoutContent>{children}</LayoutContent>
          </Suspense>
        </OfflineProvider>
      </body>
    </html>
  );
}
