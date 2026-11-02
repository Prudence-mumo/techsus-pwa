import { Suspense } from "react";
import ConversationView from "@/features/tutor/ConversationView"; // Or your component path

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">
          Loading conversation...
        </div>
      }
    >
      <ConversationView />
    </Suspense>
  );
}
