import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import LearnerHeader from "@/components/LearnerHeader";

export default function LearnerLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full pb-16 lg:pb-0">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 w-full min-w-0 flex flex-col pt-[92px] lg:pl-64">
        <LearnerHeader />
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
