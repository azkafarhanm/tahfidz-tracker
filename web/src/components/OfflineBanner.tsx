"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const t = useTranslations("Offline");
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
    <div className="fixed inset-x-0 top-0 z-[60] bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white shadow-lg">
      <span className="inline-flex items-center gap-2">
        <WifiOff aria-hidden="true" size={14} />
        {t("banner")}
      </span>
    </div>
  );
}
