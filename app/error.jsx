"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", background: "#FAF4ED", minHeight: "100vh", color: "#333" }}>
      <h2>Something went wrong!</h2>
      <p style={{ background: "#f8d7da", color: "#721c24", padding: "12px", borderRadius: "8px", fontFamily: "monospace", overflowX: "auto" }}>
        {error.message || "Unknown error"}
      </p>
      <pre style={{ fontSize: "12px", background: "#eee", padding: "12px", borderRadius: "8px", overflowX: "auto" }}>
        {error.stack}
      </pre>
      <button 
        onClick={() => reset()} 
        style={{ marginTop: "20px", padding: "10px 20px", background: "#48006E", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
