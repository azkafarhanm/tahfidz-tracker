"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useCallback, useEffect, useState } from "react";

const AUTO_THEME = "auto";
const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

function getTimeBasedTheme(date = new Date()) {
  const hour = date.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR
    ? "light"
    : "dark";
}

function getNextThemeBoundaryDelay(date = new Date()) {
  const nextBoundary = new Date(date);
  const hour = date.getHours();

  if (hour < DAY_START_HOUR) {
    nextBoundary.setHours(DAY_START_HOUR, 0, 0, 0);
  } else if (hour < NIGHT_START_HOUR) {
    nextBoundary.setHours(NIGHT_START_HOUR, 0, 0, 0);
  } else {
    nextBoundary.setDate(nextBoundary.getDate() + 1);
    nextBoundary.setHours(DAY_START_HOUR, 0, 0, 0);
  }

  return Math.max(nextBoundary.getTime() - date.getTime(), 1_000);
}

function AutoThemeBoundaryTimer({
  onBoundary,
}: {
  onBoundary: (theme: "light" | "dark") => void;
}) {
  const scheduleBoundary = useCallback(() => {
    function tick() {
      onBoundary(getTimeBasedTheme());
      timeoutId = window.setTimeout(tick, getNextThemeBoundaryDelay());
    }

    let timeoutId = window.setTimeout(tick, getNextThemeBoundaryDelay());

    function handleVisibility() {
      if (!document.hidden) {
        window.clearTimeout(timeoutId);
        tick();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [onBoundary]);

  useEffect(scheduleBoundary, [scheduleBoundary]);

  return null;
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [autoResolved, setAutoResolved] = useState<"light" | "dark">(() =>
    getTimeBasedTheme(),
  );

  if (typeof window !== "undefined") {
    (window as any).__autoResolved = autoResolved;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={AUTO_THEME}
      enableSystem
      themes={["light", "dark", "system", AUTO_THEME]}
      value={{ auto: autoResolved, light: "light", dark: "dark" }}
    >
      <AutoThemeBoundaryTimer onBoundary={setAutoResolved} />
      {children}
    </NextThemesProvider>
  );
}
