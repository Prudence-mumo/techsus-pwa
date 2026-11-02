"use client";

export default function OfflineFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F6F7FC] p-8 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-[24px] font-bold text-[#2C3691]">
          You&apos;re offline
        </h1>
        <p className="text-gray-600">
          This page isn&apos;t saved on your device yet. Pages and packages you
          have already opened still work.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#2C3691] hover:bg-[#1e2566] text-white font-bold px-8 py-2.5 rounded-lg"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
