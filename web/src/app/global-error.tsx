"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <main style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f4ee",
          padding: "1rem",
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 24,
              background: "#fee2e2",
              display: "grid",
              placeItems: "center",
              margin: "0 auto",
            }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#7f1d1d" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 style={{ marginTop: 24, fontSize: 24, fontWeight: 600, color: "#0f172a" }}>
              Terjadi Kesalahan
            </h1>
            <p style={{ marginTop: 8, color: "#64748b", fontSize: 14 }}>
              {process.env.NODE_ENV === "development" && error.message
                ? error.message
                : "Sistem mengalami gangguan. Silakan coba lagi."}
            </p>
            <button
              onClick={reset}
              type="button"
              style={{
                marginTop: 32,
                padding: "12px 24px",
                borderRadius: 16,
                background: "#064e3b",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
              }}
            >
              Coba Lagi
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
