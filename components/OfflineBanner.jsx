"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const pending = useLiveQuery(
    () => db.outbox.where("qStatus").equals("pending").count(),
    [],
    0,
  );

  if (online && pending === 0) return null;

  const text = !online
    ? "You're offline. Your progress is saved on this device."
    : `Syncing ${pending} update${pending === 1 ? "" : "s"}...`;

  return (
    <div
      role="status"
      style={{
        background: online ? "#3FA9F5" : "#2C3691",
        color: "#fff",
        padding: "8px 16px",
        fontSize: 14,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}
