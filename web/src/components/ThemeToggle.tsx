"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

const themes = [
  { value: "system", label: "Sistem", icon: Monitor },
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              active
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title={t.label}
          >
            <t.icon size={18} />
          </button>
        );
      })}
    </div>
  );
}
