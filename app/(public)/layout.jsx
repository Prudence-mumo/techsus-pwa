"use client";

import React from "react";

export default function PublicLayout({ children }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        minHeight: "100vh",
        zIndex: 99999,
        background: "linear-gradient(135deg, #eef2f7 0%, #e0e7ff 100%)",
        display:
          "block" /* Changed to block layout to safely pass down sizing rules */,
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  );
}
