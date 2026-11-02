"use client";
import { useEffect } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { db } from "@/lib/db";
import { flushOutbox } from "@/lib/sync";

const WARM_ROUTES = [
  "/dashboard",
  "/learn",
  "/offline",
  "/progress",
  "/assessments",
];
const IS_PROD = process.env.NODE_ENV === "production";

export default function OfflineProvider({ children }) {
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (api) db.meta.put({ key: "api_base", value: api });

    navigator.storage?.persist?.();

    if (IS_PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (navigator.onLine)
          reg.active?.postMessage({
            type: "REDU_CACHE_PAGES",
            urls: WARM_ROUTES,
          });
      });
    }

    const flush = () => flushOutbox();
    const onVisible = () => document.visibilityState === "visible" && flush();
    flush();
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return IS_PROD ? (
    <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
  ) : (
    children
  );
}
