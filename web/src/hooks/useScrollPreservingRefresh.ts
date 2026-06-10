"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useLayoutEffect } from "react";

export function useScrollPreservingRefresh() {
  const router = useRouter();
  const savedScrollY = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (savedScrollY.current === null) return;
    const y = savedScrollY.current;
    savedScrollY.current = null;
    window.scrollTo(0, y);
  });

  const refresh = useCallback(() => {
    savedScrollY.current = window.scrollY;
    router.refresh();
  }, [router]);

  return refresh;
}
