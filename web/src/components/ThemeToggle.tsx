"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Clock3, Moon, Sun, Monitor } from "lucide-react";

type ThemeToggleProps = {
  labels: {
    auto: string;
    system: string;
    light: string;
    dark: string;
  };
};

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
  );
}
