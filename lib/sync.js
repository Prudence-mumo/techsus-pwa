import { db, getDeviceId } from "./db";
import { ENDPOINTS } from "./config";
import { getSession, getUserId, authHeaders } from "./session";

const SYNC_TAG = "redu-sync";

let ENV_BASE = "";
try {
  ENV_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
} catch {}

export async function apiBase() {
  const base = (ENV_BASE || (await db.meta.get("api_base"))?.value || "")
    .trim()
    .replace(/\/$/, "");
  if (!base)
    throw new Error("NEXT_PUBLIC_API_BASE_URL is missing from .env.local");
  return base;
}

export async function buildEvent({
  userId,
  eventType,
  payload = null,
  extra = {},
}) {
  return {
    client_event_id: crypto.randomUUID(),
    device_id: await getDeviceId(),
    event_type: eventType,
    event_payload: payload,
    client_occurred_at: new Date().toISOString(),
    ...extra,
    student_id: userId,
    qStatus: "pending",
    qAttempts: 0,
    qCreatedAt: Date.now(),
    qError: null,
  };
}

export async function enqueueEvent({ eventType, payload = null, extra = {} }) {
  const userId = await getUserId();
  if (!userId) return null;

  const event = await buildEvent({ userId, eventType, payload, extra });
  await db.outbox.add(event);
  requestSync();
  return event;
}

function toRequestBody(event) {
  const body = { ...event };
  delete body.qStatus;
  delete body.qAttempts;
  delete body.qCreatedAt;
  delete body.qError;
  return body;
}

async function registerBackgroundSync() {
  try {
    const reg =
      self.registration ?? (await navigator.serviceWorker?.getRegistration());
    if (reg && "sync" in reg) await reg.sync.register(SYNC_TAG);
  } catch {}
}

async function runFlush() {
  const { userId } = await getSession();
  if (!userId) return { sent: 0, remaining: null };

  const base = await apiBase();
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
  };

  const pendingFor = async () =>
    (
      await db.outbox.where("qStatus").equals("pending").sortBy("qCreatedAt")
    ).filter((e) => e.student_id === userId);

  let sent = 0;
  for (const event of await pendingFor()) {
    try {
      const res = await fetch(`${base}${ENDPOINTS.syncEvent}`, {
        method: "POST",
        headers,
        body: JSON.stringify(toRequestBody(event)),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok || res.status === 409) {
        await db.outbox.delete(event.client_event_id);
        sent++;
      } else if (res.status === 401 || res.status === 403) {
        break;
      } else if (res.status >= 400 && res.status < 500) {
        await db.outbox.update(event.client_event_id, {
          qStatus: "rejected",
          qError: `HTTP ${res.status}`,
        });
      } else {
        await db.outbox.update(event.client_event_id, {
          qAttempts: event.qAttempts + 1,
        });
        break;
      }
    } catch {
      break;
    }
  }

  if (sent > 0)
    await db.meta.put({ key: "last_sync_at", value: new Date().toISOString() });

  const remaining = (await pendingFor()).length;
  if (remaining > 0) await registerBackgroundSync();
  return { sent, remaining };
}

export async function flushOutbox() {
  if (typeof navigator !== "undefined" && !navigator.onLine)
    return { sent: 0, remaining: null };
  try {
    if (navigator.locks) {
      return await navigator.locks.request(
        "redu-outbox-flush",
        { ifAvailable: true },
        (lock) => (lock ? runFlush() : { sent: 0, remaining: null }),
      );
    }
    return await runFlush();
  } catch (err) {
    console.warn("Sync skipped:", err.message);
    return { sent: 0, remaining: null };
  }
}

export const syncUnfinishedData = flushOutbox;

export async function requestSync() {
  if (typeof navigator !== "undefined" && navigator.onLine)
    return flushOutbox();
  return registerBackgroundSync();
}
