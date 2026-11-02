"use client";

import { db } from "./db";
import { ENDPOINTS } from "./config";
import { apiBase } from "./sync";
import { getSession, authHeaders } from "./session";
// (mock data removed)

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sha256Hex(blob) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await blob.arrayBuffer(),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hasSpaceFor(sizeBytes) {
  if (!navigator.storage?.estimate) return true;
  const { quota = 0, usage = 0 } = await navigator.storage.estimate();
  return quota - usage > sizeBytes * 1.5;
}

export async function warmRoutes(urls) {
  const reg = await navigator.serviceWorker?.getRegistration();
  reg?.active?.postMessage({ type: "REDU_CACHE_PAGES", urls });
}

export async function refreshPackageCatalog() {
  if (typeof window !== "undefined" && !navigator.onLine)
    throw new Error("offline");

  const res = await fetch(
    `${await apiBase()}${ENDPOINTS.packages}?status=published&limit=200`,
    {
      headers: await authHeaders(),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!res.ok)
    throw new Error(`Package list request failed (HTTP ${res.status})`);
  const body = await res.json();
  const remote = (Array.isArray(body) ? body : (body.items ?? [])).filter(
    (r) => !r.status || r.status === "published",
  );

  await db.transaction("rw", db.offlinePackages, async () => {
    const local = await db.offlinePackages.toArray();
    const localById = new Map(local.map((p) => [p.id, p]));
    const seen = new Set();

    for (const r of remote) {
      const id = r.package_id ?? r.id;
      if (!id) continue;
      seen.add(id);

      const prev = localById.get(id);
      const manifest = Array.isArray(r.manifest) ? r.manifest : null;
      const fields = {
        title: r.title,
        subject: r.subject_name ?? r.subject ?? "Unknown",
        stage: r.class_level ?? r.stage ?? "Unknown",
        files: manifest
          ? `${manifest.length} file${manifest.length === 1 ? "" : "s"}`
          : (r.files ?? "1 file"),
        manifestIds: manifest
          ? manifest
              .map((m) => (typeof m === "string" ? m : m.content_id))
              .filter(Boolean)
          : [],
        fileUrl: r.file_path_url ?? prev?.fileUrl ?? "",
        checksum: r.checksum ?? null,
        sizeBytes: r.size_bytes ?? null,
        remoteVersion: r.package_version ?? null,
      };

      if (!prev) {
        await db.offlinePackages.put({
          id,
          ...fields,
          packageVersion: null,
          isDownloaded: 0,
          isSynced: 1,
          isMock: 0,
        });
      } else {
        const outdated =
          prev.isDownloaded === 1 &&
          fields.remoteVersion &&
          prev.packageVersion !== fields.remoteVersion;
        await db.offlinePackages.update(id, {
          ...fields,
          updateAvailable: outdated ? 1 : 0,
        });
      }
    }

    for (const p of local) {
      if (seen.has(p.id)) continue;
      if (p.isMock && remote.length > 0) await db.offlinePackages.delete(p.id);
      else if (!p.isMock && p.isDownloaded !== 1)
        await db.offlinePackages.delete(p.id);
    }
  });

  return remote.length;
}

export async function seedMockPackages() {
  return;
}

async function unpackBundle(blob) {
  try {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(blob);
    const file = zip.file("content.json");
    if (!file) return null;
    const data = JSON.parse(await file.async("string"));
    return {
      topics: data.topics ?? [],
      content: Array.isArray(data) ? data : (data.content ?? []),
    };
  } catch {
    return null;
  }
}

async function saveDownloaded(pkg, { blob, topics, content }) {
  const contentIds = pkg.manifestIds?.length
    ? pkg.manifestIds
    : content.map((c) => c.content_id);
  await db.transaction(
    "rw",
    db.offlinePackages,
    db.topics,
    db.content,
    async () => {
      if (topics.length) await db.topics.bulkPut(topics);
      if (content.length) await db.content.bulkPut(content);
      await db.offlinePackages.update(pkg.id, {
        cachedBlob: blob,
        contentIds,
        isDownloaded: 1,
        packageVersion: pkg.remoteVersion ?? pkg.packageVersion ?? null,
        updateAvailable: 0,
        downloadedAt: new Date().toISOString(),
      });
    },
  );
}

export async function downloadPackage(pkg, { onProgress } = {}) {
  if (pkg.isMock) {
    for (let p = 10; p <= 90; p += 10) {
      onProgress?.(p);
      await sleep(120);
    }
    const mock = buildMockContent(pkg);
    await saveDownloaded(pkg, {
      blob: new Blob([JSON.stringify(mock)], { type: "application/json" }),
      ...mock,
    });
    onProgress?.(100);
    warmRoutes([`/offline/${pkg.id}`]);
    return;
  }

  const base = await apiBase();
  const rawUrl = pkg.fileUrl?.trim();
  if (!rawUrl) {
    throw new Error(
      "This package has no file attached yet. Ask the backend team to add its file (file_path_url).",
    );
  }
  const url = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `${new URL(base).origin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

  if (pkg.sizeBytes && !(await hasSpaceFor(pkg.sizeBytes))) {
    throw new Error("Not enough storage space on this device.");
  }

  const sameServer = url.startsWith(new URL(base).origin);
  const res = await fetch(url, {
    headers: sameServer ? await authHeaders() : {},
  });
  if (!res.ok || !res.body) {
    console.error("Download URL that failed:", url);
    throw new Error(`Download failed (HTTP ${res.status}). Please try again.`);
  }
  const total = Number(res.headers.get("content-length")) || pkg.sizeBytes || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(
      total ? Math.min(99, Math.round((received / total) * 100)) : 50,
    );
  }

  const blob = new Blob(chunks, {
    type: res.headers.get("content-type") || "application/octet-stream",
  });

  if (pkg.checksum && (await sha256Hex(blob)) !== pkg.checksum.toLowerCase()) {
    throw new Error(
      "The downloaded file is corrupted. Please download it again.",
    );
  }

  const unpacked = await unpackBundle(blob);
  if (!unpacked) {
    throw new Error(
      "Invalid zip bundle structure: extraction failed or content.json is missing.",
    );
  }

  await saveDownloaded(pkg, { blob, ...unpacked });
  onProgress?.(100);

  const { userId } = await getSession();
  if (userId) {
    const { enqueueEvent } = await import("./sync");
    await enqueueEvent({
      studentId: userId,
      eventType: "package_download",
      extra: {
        package_id: pkg.id,
        package_version: pkg.remoteVersion ?? pkg.packageVersion ?? null,
      },
    });
  }
  warmRoutes([`/offline/${pkg.id}`]);
}

export async function saveLessonProgress({
  studentId,
  topicId,
  contentId,
  status = "in_progress",
  position = null,
  sync = true,
}) {
  const now = new Date().toISOString();
  const { buildEvent, requestSync } = await import("./sync");

  const event = sync
    ? await buildEvent({ userId: studentId, eventType: "progress_sync" })
    : null;

  const ORDER = { not_started: 0, in_progress: 1, completed: 2 };

  await db.transaction("rw", db.lessonProgress, db.outbox, async () => {
    const existing = await db.lessonProgress
      .where("[student_id+content_id]")
      .equals([studentId, contentId])
      .first();

    const finalStatus =
      existing && ORDER[existing.status] > ORDER[status]
        ? existing.status
        : status;

    const lesson = {
      lesson_progress_id: existing?.lesson_progress_id ?? crypto.randomUUID(),
      student_id: studentId,
      topic_id: topicId,
      content_id: contentId,
      status: finalStatus,
      last_view_at: now,
      completed_at:
        finalStatus === "completed" ? (existing?.completed_at ?? now) : null,
      position: position ?? existing?.position ?? null,
      updated_at: now,
    };
    await db.lessonProgress.put(lesson);

    if (event) {
      const { ...forServer } = lesson;
      delete forServer.position;
      delete forServer.updated_at;
      delete forServer.student_id;

      await db.outbox.add({
        ...event,
        event_payload: { lesson_progress: [forServer] },
      });
    }
  });

  if (event) requestSync();
}
