"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  type BeforeInstallPromptEvent,
  getDeferredPrompt,
  setDeferredPrompt,
} from "@/lib/pwa-install";

type InstallPromptProps = {
  labels: {
    buttonInstall: string;
    buttonLater: string;
    description: string;
    title: string;
  };
};

export default function InstallPrompt({ labels }: InstallPromptProps) {
  const [hasPrompt, setHasPrompt] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setHasPrompt(true);
      const dismissed = localStorage.getItem("pwa-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!showPrompt || !hasPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl dark:border-emerald-800 dark:bg-slate-900 sm:left-auto sm:right-8">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-900 text-white">
          <Download aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-950 dark:text-white">{labels.title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {labels.description}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          className="flex-1 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950"
          onClick={async () => {
            const prompt = getDeferredPrompt();
            if (prompt) {
              await prompt.prompt();
              setDeferredPrompt(null);
            }
            setShowPrompt(false);
          }}
          type="button"
        >
          {labels.buttonInstall}
        </button>
        <button
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          onClick={() => {
            setShowPrompt(false);
            localStorage.setItem("pwa-dismissed", "1");
          }}
          type="button"
        >
          {labels.buttonLater}
        </button>
      </div>
    </div>
  );
}
