"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "./splash.css";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/get-started");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="splash-screen">
      <div className="splash-content">
        <Image
          src="/Group 293.png"
          alt="Redu"
          width={160}
          height={160}
          priority
          className="splash-logo"
        />
      </div>
    </main>
  );
}
