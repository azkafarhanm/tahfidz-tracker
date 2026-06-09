"use client";

import { useId, useRef, useTransition } from "react";
import { Globe } from "lucide-react";
import { setLocale } from "@/i18n/actions";

const languages = [
  { code: "id", label: "Indonesia" },
  { code: "en", label: "English" },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
] as const;

function FlagIcon({ code }: { code: (typeof languages)[number]["code"] }) {
  const clipId = useId();

  if (code === "id") {
    return (
      <svg
        aria-hidden="true"
        className="h-3 w-[18px] rounded-[4px] shadow-sm ring-1 ring-black/5"
        viewBox="0 0 20 14"
      >
        <rect width="20" height="14" rx="2.5" fill="#ffffff" />
        <path d="M0 0h20v7H0z" fill="#dc2626" />
      </svg>
    );
  }

  if (code === "en") {
    return (
      <svg
        aria-hidden="true"
        className="h-3 w-[18px] rounded-[4px] shadow-sm ring-1 ring-black/5"
        viewBox="0 0 20 14"
      >
        <defs>
          <clipPath id={clipId}>
            <rect width="20" height="14" rx="2.5" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="20" height="14" fill="#1d4ed8" />
          <path d="M0 0 20 14M20 0 0 14" stroke="#ffffff" strokeWidth="3.2" />
          <path d="M0 0 20 14M20 0 0 14" stroke="#dc2626" strokeWidth="1.4" />
          <path d="M10 0v14M0 7h20" stroke="#ffffff" strokeWidth="4.8" />
          <path d="M10 0v14M0 7h20" stroke="#dc2626" strokeWidth="2.4" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-3 w-[18px] rounded-[4px] shadow-sm ring-1 ring-black/5"
      viewBox="0 0 20 14"
    >
      <rect width="20" height="14" rx="2.5" fill="#16a34a" />
      <path
        d="M11.7 4.3a3 3 0 1 0 0 5.4 2.45 2.45 0 1 1 0-5.4Z"
        fill="#ffffff"
      />
      <path
        d="m12.7 5.1.32.94h.98l-.8.58.31.94-.81-.59-.81.59.31-.94-.8-.58h.99Z"
        fill="#ffffff"
      />
    </svg>
  );
}

type LanguageSwitcherProps = {
  currentLocale: string;
};

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [pending, startTransition] = useTransition();
  const inFlightRef = useRef(false);

  function handleChange(code: string) {
    if (code === currentLocale || inFlightRef.current) return;
    inFlightRef.current = true;

    startTransition(async () => {
      try {
        await setLocale(code);
      } finally {
        inFlightRef.current = false;
      }
    });
  }

  return (
    <div className="flex items-start gap-2">
      <Globe
        aria-hidden="true"
        className="mt-2 shrink-0 text-slate-500 dark:text-slate-400"
        size={16}
      />
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5">
        {languages.map(({ code, label }) => (
          <button
            aria-label={label}
            aria-pressed={currentLocale === code}
            className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-medium transition ${
              currentLocale === code
                ? "bg-emerald-50 text-emerald-900 shadow-sm dark:bg-emerald-950 dark:text-emerald-400"
                : "text-slate-500 active:bg-black/5 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:active:bg-white/10 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
            disabled={pending}
            key={code}
            onClick={() => handleChange(code)}
            type="button"
          >
            <FlagIcon code={code} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
