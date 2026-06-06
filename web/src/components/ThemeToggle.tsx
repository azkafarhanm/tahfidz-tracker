"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, Moon, Sun, Monitor } from "lucide-react";

type ThemeToggleProps = {
  labels: {
    auto: string;
    system: string;
    light: string;
    dark: string;
  };
};

type DebugSnapshot = {
  ts: string;
  theme: string | undefined;
  resolvedTheme: string | undefined;
  systemTheme: string | undefined;
  prefersDark: boolean | undefined;
  htmlClass: string;
  colorScheme: string;
  localStorageTheme: string | null;
  autoResolved: string | undefined;
  userAgent: string;
};

function useDebugSnapshot(enabled: boolean) {
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const [snapshot, setSnapshot] = useState<DebugSnapshot | null>(null);

  const capture = useCallback(() => {
    if (!enabled) return;
    const now = new Date();
    const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const htmlClass = document.documentElement.className;
    const colorScheme =
      getComputedStyle(document.documentElement).colorScheme;
    const localStorageTheme = localStorage.getItem("theme");
    const autoResolved = (
      window as Window & { __autoResolved?: string }
    ).__autoResolved;
    const userAgent = navigator.userAgent;
    setSnapshot({
      ts,
      theme,
      resolvedTheme,
      systemTheme,
      prefersDark,
      htmlClass,
      colorScheme,
      localStorageTheme,
      autoResolved,
      userAgent,
    });
  }, [enabled, theme, resolvedTheme, systemTheme]);

  useEffect(() => {
    if (!enabled) return;
    capture();
  }, [enabled, capture]);

  useEffect(() => {
    if (!enabled) return;
    const onVis = () => {
      if (!document.hidden) capture();
    };
    const onFocus = () => capture();
    const onMedia = () => capture();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    mq.addEventListener("change", onMedia);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      mq.removeEventListener("change", onMedia);
    };
  }, [enabled, capture]);

  return snapshot;
}

export default function ThemeToggle({ labels }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const themes = [
    { value: "auto", label: labels.auto, icon: Clock3 },
    { value: "system", label: labels.system, icon: Monitor },
    { value: "light", label: labels.light, icon: Sun },
    { value: "dark", label: labels.dark, icon: Moon },
  ] as const;

  useEffect(() => setMounted(true), []);

  const snapshot = useDebugSnapshot(mounted);
  const panelRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!snapshot || !panelRef.current) return;
    const lines = [
      snapshot.ts,
      `theme:            ${snapshot.theme}`,
      `resolvedTheme:    ${snapshot.resolvedTheme}`,
      `systemTheme:      ${snapshot.systemTheme}`,
      `prefersDark:      ${snapshot.prefersDark}`,
      `htmlClass:        ${snapshot.htmlClass}`,
      `colorScheme:      ${snapshot.colorScheme}`,
      `localStorage:     ${snapshot.localStorageTheme}`,
      `autoResolved:     ${snapshot.autoResolved}`,
      `userAgent:        ${snapshot.userAgent}`,
    ];
    panelRef.current.textContent = lines.join("\n");
  }, [snapshot]);

  if (!mounted) {
    return (
      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
        {themes.map((t) => (
          <div
            key={t.value}
            className="flex h-10 w-10 items-center justify-center rounded-xl"
          >
            <t.icon size={18} className="text-slate-300" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
        {themes.map((t) => {
          const active = theme === t.value;
          return (
            <button
              aria-label={t.label}
              aria-pressed={active}
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                active
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
              type="button"
              title={t.label}
            >
              <t.icon size={18} />
            </button>
          );
        })}
      </div>
      <pre
        ref={panelRef}
        className="rounded bg-yellow-100 p-2 text-[10px] text-black whitespace-pre-wrap break-all"
      />
    </div>
  );
}
