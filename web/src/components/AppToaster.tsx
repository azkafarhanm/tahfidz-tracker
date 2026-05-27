"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export default function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      closeButton
      duration={3600}
      position="top-center"
      richColors
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast:
            "border border-slate-200 bg-white text-slate-950 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
          title: "text-sm font-semibold",
          description: "text-sm text-slate-600 dark:text-slate-300",
          actionButton:
            "bg-emerald-900 text-white hover:bg-emerald-950 dark:bg-emerald-700 dark:hover:bg-emerald-600",
          cancelButton:
            "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
          closeButton:
            "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800",
        },
      }}
      visibleToasts={1}
    />
  );
}
