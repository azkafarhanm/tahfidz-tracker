"use client";

import { useEffect, useId, useOptimistic, useRef, useState, useTransition } from "react";
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

type Phase =
  | "click"
  | "optimistic"
  | "serverStart"
  | "cookie"
  | "serverEnd"
  | "propUpdated"
  | "langUpdated"
  | "dirUpdated";

type TraceEvent = { phase: Phase; ts: number; detail?: string };

type RequestTrace = {
  id: number;
  target: string;
  events: TraceEvent[];
};

let nextRequestId = 1;

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [pending, startTransition] = useTransition();
  const [optimisticLocale, setOptimisticLocale] = useOptimistic(currentLocale);
  const inFlightRef = useRef(false);
  const activeIdRef = useRef<number | null>(null);
  const [traces, setTraces] = useState<RequestTrace[]>([]);
  const prevPropRef = useRef(currentLocale);
  const prevLangRef = useRef<string | null>(null);
  const prevDirRef = useRef<string | null>(null);

  if (typeof document !== "undefined") {
    if (prevLangRef.current === null) prevLangRef.current = document.documentElement.lang;
    if (prevDirRef.current === null) prevDirRef.current = document.documentElement.dir;
  }

  function addEvent(id: number, phase: Phase, detail?: string) {
    setTraces((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, events: [...t.events, { phase, ts: performance.now(), detail }] }
          : t,
      ),
    );
  }

  const activeId = activeIdRef.current;
  if (activeId !== null) {
    const trace = traces.find((t) => t.id === activeId);
    if (trace) {
      if (!trace.events.some((e) => e.phase === "propUpdated") && currentLocale === trace.target && prevPropRef.current !== currentLocale) {
        addEvent(activeId, "propUpdated");
      }
      if (typeof document !== "undefined") {
        const curLang = document.documentElement.lang;
        const curDir = document.documentElement.dir;
        if (!trace.events.some((e) => e.phase === "langUpdated") && curLang === trace.target && prevLangRef.current !== curLang) {
          addEvent(activeId, "langUpdated");
        }
        if (!trace.events.some((e) => e.phase === "dirUpdated") && curDir === (trace.target === "ar" ? "rtl" : "ltr") && prevDirRef.current !== curDir) {
          addEvent(activeId, "dirUpdated");
        }
        prevLangRef.current = curLang;
        prevDirRef.current = curDir;
      }
    }
  }
  prevPropRef.current = currentLocale;

  useEffect(() => {
    if (activeIdRef.current === null) return;
    const trace = traces.find((t) => t.id === activeIdRef.current);
    if (!trace) return;
    const hasEnd = trace.events.some((e) => e.phase === "serverEnd");
    const hasProp = trace.events.some((e) => e.phase === "propUpdated");
    if (hasEnd && hasProp) {
      activeIdRef.current = null;
    }
  });

  function handleChange(code: string) {
    if (code === optimisticLocale || inFlightRef.current) return;
    inFlightRef.current = true;

    const id = nextRequestId++;
    activeIdRef.current = id;
    const trace: RequestTrace = { id, target: code, events: [{ phase: "click", ts: performance.now() }] };
    setTraces((prev) => [...prev.slice(-19), trace]);

    startTransition(async () => {
      addEvent(id, "optimistic");
      setOptimisticLocale(code);
      addEvent(id, "serverStart");
      try {
        await setLocale(code);
        const cookieVal = typeof document !== "undefined" ? document.cookie.match(/locale=(\w+)/)?.[1] ?? "?" : "?";
        addEvent(id, "cookie", cookieVal);
      } catch {
        addEvent(id, "serverEnd", "error");
      } finally {
        addEvent(id, "serverEnd");
        inFlightRef.current = false;
      }
    });
  }

  const cookieLocale =
    typeof document !== "undefined"
      ? document.cookie.match(/locale=(\w+)/)?.[1] ?? "—"
      : "—";
  const htmlLang = typeof document !== "undefined" ? document.documentElement.lang : "—";
  const htmlDir = typeof document !== "undefined" ? document.documentElement.dir : "—";
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
          className="pointer-events-none fixed bottom-20 left-2 z-[9999] min-w-[280px] max-h-[60vh] overflow-y-auto rounded-lg bg-black/70 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-green-400 dark:bg-black/80"
          aria-hidden="true"
        >
          <div className="mb-0.5 font-bold text-white">LOCALE DEBUG</div>
          <div>prop: <b className="text-white">{currentLocale}</b> | optim: <b className="text-white">{optimisticLocale}</b></div>
          <div>cookie: <b className="text-white">{cookieLocale}</b> | lang: <b className="text-white">{htmlLang}</b> | dir: <b className="text-white">{htmlDir}</b></div>
          <div>pending: <b className="text-white">{String(pending)}</b> | inFlight: <b className="text-white">{String(inFlightRef.current)}</b></div>
          {diverged ? <div className="font-bold text-red-400">DIVERGED</div> : null}
          <div className="mt-1 border-t border-white/20 pt-1">
            <div className="font-bold text-white">REQUEST TRACES ({traces.length})</div>
            {traces.map((tr) => {
              const hasEnd = tr.events.some((e) => e.phase === "serverEnd");
              const hasProp = tr.events.some((e) => e.phase === "propUpdated");
              const firstTs = tr.events[0]?.ts ?? 0;
              const isOrphan = hasEnd && !hasProp;
              return (
                <div key={tr.id} className={isOrphan ? "text-red-400" : !hasEnd ? "text-yellow-400" : ""}>
                  {tr.events.map((ev, j) => {
                    const dt = j === 0 ? "" : ` +${Math.round(ev.ts - firstTs)}ms`;
                    return (
                      <div key={j}>
                        <span className="text-white">#{tr.id}</span>{" "}
                        <span className="text-cyan-400">{ev.phase}</span>{" "}
                        <span className="text-white">{tr.target}</span>
                        {dt ? <span className="text-white/50">{dt}</span> : null}
                        {ev.detail ? <span className="text-white/40"> [{ev.detail}]</span> : null}
                      </div>
                    );
                  })}
                  {isOrphan ? <div className="text-red-500 font-bold">serverEnd but NO propUpdated</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
