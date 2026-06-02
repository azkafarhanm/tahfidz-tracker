"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentsPageAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [router]);

  return null;
}
