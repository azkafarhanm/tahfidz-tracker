"use client";

import { useEffect, useState } from "react";

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

export function useMediaQuery(query: string, initialValue: boolean | null = null) {
  const [matches, setMatches] = useState<boolean | null>(initialValue);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setMatches(initialValue);
      return;
    }

    const media: LegacyMediaQueryList = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener?.(update);
    return () => media.removeListener?.(update);
  }, [initialValue, query]);

  return matches;
}
