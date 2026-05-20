"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";

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

function AutoThemeController() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme !== AUTO_THEME) {
      return;
    }

    let timeoutId: number | undefined;

    function applyAutoTheme() {
      const nextTheme = getTimeBasedTheme();
      const root = document.documentElement;

      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      root.style.colorScheme = nextTheme;

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(
        applyAutoTheme,
        getNextThemeBoundaryDelay(),
      );
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        applyAutoTheme();
      }
    }

    applyAutoTheme();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [theme]);

  return null;
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={AUTO_THEME}
      enableSystem
      themes={["light", "dark", "system", AUTO_THEME]}
    >
      <AutoThemeController />
      {children}
    </NextThemesProvider>
  );
}
