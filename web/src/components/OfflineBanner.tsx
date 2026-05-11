"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    const onOff = () => setOffline(true);
    const onOn = () => setOffline(false);

    window.addEventListener("offline", onOff);
    window.addEventListener("online", onOn);
    return () => {
      window.removeEventListener("offline", onOff);
      window.removeEventListener("online", onOn);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#d97706",
        color: "white",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 500,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      <WifiOff size={14} />
      Anda sedang offline. Beberapa fitur tidak tersedia.
    </div>
  );
}
