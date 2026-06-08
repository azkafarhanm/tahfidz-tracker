"use client";

import { useId, useOptimistic, useRef, useState, useTransition } from "react";
import { Globe } from "lucide-react";
import { setLocale } from "@/i18n/actions";

const FORCE_LOCALE_DEBUG = true;

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

type TelemetryEntry = {
  target: string;
  start: number;
  end: number | null;
  ms: number | null;
  status: "pending" | "ok" | "error";
};

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [pending, startTransition] = useTransition();
  const [optimisticLocale, setOptimisticLocale] = useOptimistic(currentLocale);
  const inFlightRef = useRef(false);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);

  function handleChange(code: string) {
    if (code === optimisticLocale || inFlightRef.current) return;
    inFlightRef.current = true;

    const start = Date.now();
    const entry: TelemetryEntry = { target: code, start, end: null, ms: null, status: "pending" };
    setTelemetry((prev) => [...prev.slice(-9), entry]);

    startTransition(async () => {
      setOptimisticLocale(code);
      try {
        await setLocale(code);
        const end = Date.now();
        setTelemetry((prev) =>
          prev.map((e, i) =>
            i === prev.length - 1 ? { ...e, end, ms: end - e.start, status: "ok" as const } : e,
          ),
        );
      } catch {
        const end = Date.now();
        setTelemetry((prev) =>
          prev.map((e, i) =>
            i === prev.length - 1 ? { ...e, end, ms: end - e.start, status: "error" as const } : e,
          ),
        );
      } finally {
        inFlightRef.current = false;
      }
    });
  }

  const cookieLocale =
    typeof document !== "undefined"
      ? document.cookie.match(/locale=(\w+)/)?.[1] ?? "—"
      : "—";

  const diverged = currentLocale !== optimisticLocale;

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
            aria-pressed={optimisticLocale === code}
            className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-medium transition ${
              optimisticLocale === code
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
      {FORCE_LOCALE_DEBUG ? (
        <div
          className="pointer-events-none fixed bottom-20 left-2 z-[9999] min-w-[220px] rounded-lg bg-black/70 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-green-400 dark:bg-black/80"
          aria-hidden="true"
        >
          <div className="mb-0.5 font-bold text-white">LOCALE DEBUG</div>
          <div>prop: <b className="text-white">{currentLocale}</b></div>
          <div>optim: <b className="text-white">{optimisticLocale}</b></div>
          <div>cookie: <b className="text-white">{cookieLocale}</b></div>
          <div>pending: <b className="text-white">{String(pending)}</b></div>
          <div>inFlight: <b className="text-white">{String(inFlightRef.current)}</b></div>
          {diverged ? (
            <div className="mt-0.5 font-bold text-red-400">DIVERGED</div>
          ) : null}
          {telemetry.length > 0 ? (
            <div className="mt-1 border-t border-white/20 pt-1">
              <div className="font-bold text-white">TELEMETRY (last {telemetry.length})</div>
              {telemetry.map((t, i) => (
                <div key={i} className={t.status === "error" ? "text-red-400" : t.status === "pending" ? "text-yellow-400" : ""}>
                  {t.target} {t.status === "pending" ? "…" : t.ms + "ms"} <span className="text-white/50">{t.status}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
