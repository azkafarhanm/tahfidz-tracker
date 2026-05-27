"use client";

import { useEffect, useState } from "react";

const ARABIC_HOURS = [
  "\u0661\u0662",
  "\u0661",
  "\u0662",
  "\u0663",
  "\u0664",
  "\u0665",
  "\u0666",
  "\u0667",
  "\u0668",
  "\u0669",
  "\u0661\u0660",
  "\u0661\u0661",
];
const HOUR_TICKS = Array.from({ length: 12 }, (_, i) => i * 30);
const MINUTE_TICKS = Array.from({ length: 60 }, (_, i) => i * 6);

const PRAYERS = [
  { name: "Subuh", h: 4, m: 45 },
  { name: "Dzuhur", h: 12, m: 0 },
  { name: "Ashar", h: 15, m: 15 },
  { name: "Maghrib", h: 18, m: 5 },
  { name: "Isya", h: 19, m: 15 },
];

type PrayerState = "normal" | "warning" | "urgent" | "active";

type PrayerInfo = {
  text: string;
  state: PrayerState;
};

function formatCountdown(totalMin: number): string {
  if (totalMin >= 60) {
    const jam = Math.floor(totalMin / 60);
    const menit = totalMin % 60;
    return menit > 0 ? `${jam} jam ${menit} menit lagi` : `${jam} jam lagi`;
  }
  return `${totalMin} menit lagi`;
}

function getPrayerInfo(now: Date): PrayerInfo {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const p of PRAYERS) {
    const pMin = p.h * 60 + p.m;
    const diff = pMin - nowMin;
    if (diff <= 0 && diff > -15) {
      return { text: `\uD83D\uDD4C Waktu ${p.name} sedang berlangsung`, state: "active" };
    }
    if (diff > 0) {
      const text = `Menuju ${p.name} \u2022 ${formatCountdown(diff)}`;
      if (diff <= 10) return { text, state: "urgent" };
      if (diff <= 30) return { text, state: "warning" };
      return { text, state: "normal" };
    }
  }
  const subuhTomorrow = 24 * 60 + PRAYERS[0].h * 60 + PRAYERS[0].m;
  const diff = subuhTomorrow - nowMin;
  const text = `Menuju Subuh \u2022 ${formatCountdown(diff)}`;
  if (diff <= 10) return { text, state: "urgent" };
  if (diff <= 30) return { text, state: "warning" };
  return { text, state: "normal" };
}

function getAngles(now: Date) {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();
  const secExact = s + ms / 1000;
  const minExact = m + secExact / 60;
  const hourExact = h + minExact / 60;
  return { hour: hourExact * 30, minute: minExact * 6, second: secExact * 6 };
}

function polar(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
}

function Hand({ angle, length, width, color, rounded }: {
  angle: number; length: number; width: number; color: string; rounded?: boolean;
}) {
  const p = polar(angle, length);
  return <line x1="50" y1="50" x2={p.x} y2={p.y} stroke={color} strokeWidth={width} strokeLinecap={rounded ? "round" : "butt"} />;
}

function AnalogClock({ time }: { time: Date }) {
  const { hour, minute, second } = getAngles(time);
  const tail = polar(second + 180, 8);
  return (
    <svg viewBox="0 0 100 100" className="w-full" aria-hidden="true">
      <defs>
        <filter id="cs"><feDropShadow dx="0" dy="0.3" stdDeviation="0.4" floodOpacity="0.08" /></filter>
        <filter id="hs"><feDropShadow dx="0" dy="0.5" stdDeviation="0.3" floodOpacity="0.15" /></filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="var(--clock-bg)" filter="url(#cs)" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="var(--clock-ring)" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="var(--clock-ring)" strokeWidth="0.2" />

      <g opacity="0.06">
        <path d="M 25 75 L 25 50 Q 25 18 50 12 Q 75 18 75 50 L 75 75 Z" fill="var(--clock-dome)" />
        <rect x="22" y="75" rx="1" width="56" height="4" fill="var(--clock-dome)" />
        <rect x="30" y="79" rx="0.5" width="40" height="8" fill="var(--clock-dome)" />
        <rect x="35" y="87" rx="0.5" width="30" height="5" fill="var(--clock-dome)" />
        <path d="M 47 12 L 50 2 L 53 12" fill="var(--clock-dome)" />
        <circle cx="50" cy="1.5" r="1.5" fill="var(--clock-dome)" />
        <rect x="40" y="40" rx="1" width="20" height="35" fill="var(--clock-dome)" />
        <path d="M 50 40 L 50 18" stroke="var(--clock-dome)" strokeWidth="1" />
      </g>

      <path d="M 35 6 Q 50 -4 65 6 L 62 14 Q 50 8 38 14 Z" fill="var(--clock-dome)" filter="url(#cs)" />
      <line x1="50" y1="6" x2="50" y2="14" stroke="var(--clock-dome)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="50" cy="4" r="1.2" fill="var(--clock-dome)" />
      <rect x="33" y="14" rx="0.5" width="34" height="3" fill="var(--clock-dome)" opacity="0.12" />
      {MINUTE_TICKS.map((deg, i) => {
        const a = polar(deg, 42), b = polar(deg, 44);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--clock-tick-minor)" strokeWidth="0.3" />;
      })}
      {HOUR_TICKS.map((deg, i) => {
        const a = polar(deg, 39), b = polar(deg, 44);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--clock-tick)" strokeWidth="0.8" strokeLinecap="round" />;
      })}
      {ARABIC_HOURS.map((num, i) => {
        const p = polar(i * 30, 34);
        const isDome = i === 0;
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
            fontSize={isDome ? "4.5" : "5.5"} fontFamily="var(--font-amiri, serif)"
            fill={isDome ? "var(--clock-dome)" : "var(--clock-numeral)"}
            fontWeight={isDome ? "600" : "400"}>{num}</text>
        );
      })}
      <g filter="url(#hs)">
        <Hand angle={hour} length={20} width={2.5} color="var(--clock-hand)" rounded />
        <Hand angle={minute} length={28} width={1.8} color="var(--clock-hand)" rounded />
        <Hand angle={second} length={32} width={0.6} color="var(--clock-second)" />
        <line x1={tail.x} y1={tail.y} x2="50" y2="50" stroke="var(--clock-second)" strokeWidth={0.6} />
      </g>
      <circle cx="50" cy="50" r="2" fill="var(--clock-dome)" />
      <circle cx="50" cy="50" r="0.8" fill="var(--clock-bg)" />
    </svg>
  );
}

function DigitalTime({ time }: { time: Date }) {
  const h = String(time.getHours()).padStart(2, "0");
  const m = String(time.getMinutes()).padStart(2, "0");
  const s = String(time.getSeconds()).padStart(2, "0");
  return (
    <p className="font-mono text-xs tracking-[0.15em] text-slate-700 dark:text-slate-300">
      {h}<span className="opacity-40">:</span>{m}<span className="opacity-40">:</span>{s}
    </p>
  );
}

const prayerStyles: Record<PrayerState, { wrapper: string; text: string }> = {
  normal: {
    wrapper: "",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    wrapper: "",
    text: "text-amber-600 dark:text-amber-400 animate-[clock-pulse-soft_3s_ease-in-out_infinite]",
  },
  urgent: {
    wrapper: "",
    text: "text-red-600 dark:text-red-400 animate-[clock-breathe_2.5s_ease-in-out_infinite]",
  },
  active: {
    wrapper:
      "rounded-lg bg-emerald-50 border border-emerald-200/60 dark:bg-emerald-950/50 dark:border-emerald-800/40 shadow-[0_0_8px_rgba(6,78,59,0.12)] dark:shadow-[0_0_8px_rgba(52,211,153,0.1)]",
    text: "text-emerald-800 dark:text-emerald-300",
  },
};

function PrayerReminder({ time }: { time: Date }) {
  const { text, state } = getPrayerInfo(time);
  const { wrapper, text: textCls } = prayerStyles[state];
  return (
    <div className={`w-full transition-all duration-700 ease-out ${wrapper}`}>
      <p className={`text-center text-[10px] leading-snug px-2 py-1 transition-colors duration-700 ${textCls}`}>
        {text}
      </p>
    </div>
  );
}

export default function SidebarIslamicClock() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    setMounted(true);
    let intervalId: number | undefined;

    function startClock() {
      setTime(new Date());
      window.clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        setTime(new Date());
      }, 1000);
    }

    function stopClock() {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }

    function syncOnVisibility() {
      if (document.hidden) {
        stopClock();
      } else {
        startClock();
      }
    }

    if (!document.hidden) {
      startClock();
    }

    document.addEventListener("visibilitychange", syncOnVisibility);
    return () => {
      stopClock();
      document.removeEventListener("visibilitychange", syncOnVisibility);
    };
  }, []);

  return (
    <>
      <style>{`
        :root {
          --clock-bg: #ffffff;
          --clock-ring: #e2e8f0;
          --clock-dome: #064e3b;
          --clock-tick: #334155;
          --clock-tick-minor: #cbd5e1;
          --clock-numeral: #1e293b;
          --clock-hand: #0f172a;
          --clock-second: #064e3b;
        }
        .dark {
          --clock-bg: #0f172a;
          --clock-ring: #1e293b;
          --clock-dome: #34d399;
          --clock-tick: #94a3b8;
          --clock-tick-minor: #334155;
          --clock-numeral: #cbd5e1;
          --clock-hand: #e2e8f0;
          --clock-second: #34d399;
        }
        @keyframes clock-pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes clock-breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[clock-pulse-soft_3s_ease-in-out_infinite\\],
          .animate-\\[clock-breathe_2\\.5s_ease-in-out_infinite\\] {
            animation: none !important;
          }
        }
      `}</style>
      <div className="flex flex-col items-center gap-2">
        {mounted ? (
          <>
            <div className="w-full max-w-[140px]">
              <AnalogClock time={time} />
            </div>
            <DigitalTime time={time} />
            <PrayerReminder time={time} />
          </>
        ) : (
          <div className="flex h-[160px] w-full max-w-[140px] items-center justify-center">
            <div className="h-14 w-14 rounded-full border-2 border-slate-100 dark:border-slate-800" />
          </div>
        )}
      </div>
    </>
  );
}
