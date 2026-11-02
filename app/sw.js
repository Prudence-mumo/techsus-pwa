/// <reference lib="webworker" />
// Redu service worker (built by Serwist). Relative imports only: esbuild bundles this file.
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";
import { flushOutbox } from "../lib/sync";

const day = 24 * 60 * 60;

// ================= NETWORK POLICIES (first match wins) =================
const runtimeCaching = [
  // 1. Backend images (lesson pictures): show cached copy, refresh in background.
  {
    matcher: ({ request, sameOrigin }) =>
      !sameOrigin && request.destination === "image",
    handler: new StaleWhileRevalidate({
      cacheName: "remote-images",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * day }),
      ],
    }),
  },
  // 2. Everything else cross-origin = the Redu API. NETWORK ONLY: learner data lives in
  //    IndexedDB, and API responses/package ZIPs must never be duplicated in the SW cache.
  { matcher: ({ sameOrigin }) => !sameOrigin, handler: new NetworkOnly() },
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  // 3. Hashed build files never change: cache first (they are also precached).
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin && url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 365 * day }),
      ],
    }),
  },
  // 4. Images, icons and fonts: instant from cache, refreshed in background.
  {
    matcher: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      (url.pathname.startsWith("/_next/image") ||
        ["image", "font"].includes(request.destination)),
    handler: new StaleWhileRevalidate({
      cacheName: "assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * day }),
      ],
    }),
  },
  // 5. Next.js page data (client-side navigation): network first, cached copy offline.
  {
    matcher: ({ request, sameOrigin }) =>
      sameOrigin && request.headers.get("RSC") === "1",
    handler: new NetworkFirst({
      cacheName: "pages-rsc",
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 7 * day }),
      ],
    }),
  },
  // 6. Full page loads: network first (fresh when online), cached page when offline/slow.
  {
    matcher: ({ request, sameOrigin }) =>
      sameOrigin && request.mode === "navigate",
    handler: new NetworkFirst({
      cacheName: "pages",
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 7 * day }),
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  // Nothing cached and no network -> friendly offline page instead of the browser error.
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

// ================= BACKGROUND SYNC =================
// The browser wakes this worker when the connection returns, even if the app is closed.
// Throwing makes the browser retry later (with back-off) while events are still queued.
self.addEventListener("sync", (event) => {
  if (event.tag === "redu-sync") {
    event.waitUntil(
      flushOutbox().then((r) => {
        if (r?.remaining > 0) throw new Error("Outbox not empty, retry later");
      }),
    );
  }
});

// The app asks us to make pages available offline (after login, after a package download).
self.addEventListener("message", (event) => {
  if (event.data?.type !== "REDU_CACHE_PAGES") return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open("pages");
      await Promise.allSettled(
        event.data.urls.map(async (u) => {
          const res = await fetch(u, { credentials: "include" });
          if (res.ok && !res.redirected) await cache.put(u, res);
        }),
      );
    })(),
  );
});
