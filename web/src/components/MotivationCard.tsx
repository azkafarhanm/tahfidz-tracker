"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllMotivations } from "@/lib/motivations";
import { useMediaQuery } from "@/components/useMediaQuery";

type Phase =
  | "typing-arabic"
  | "pause"
  | "typing-text"
  | "show-ref"
  | "hold"
  | "fadeout";

const SPEED_ARABIC = 55;
const SPEED_TEXT = 28;
const PAUSE_MS = 600;
const HOLD_MS = 5500;
const FADE_MS = 1200;
const STORAGE_KEY = "tahfidzflow-motivation-idx";

type VerseBodyProps = {
  arabic: string;
  cursor: "arabic" | "text" | null;
  showArabic: boolean;
  showClosingQuote: boolean;
  showRef: boolean;
  showText: boolean;
  source: string;
  sourceIcon: string;
  text: string;
};

function VerseBody({
  arabic,
  cursor,
  showArabic,
  showClosingQuote,
  showRef,
  showText,
  source,
  sourceIcon,
  text,
}: VerseBodyProps) {
  const refClassName = [
    "mt-2 text-center text-xs font-medium text-emerald-700",
    "transition-opacity duration-500 dark:text-emerald-400",
    showRef ? "opacity-100" : "opacity-0",
  ].join(" ");

  return (
    <>
      {showArabic && (
        <p
          className="text-center text-xl leading-loose text-emerald-900 min-h-[2rem] font-arabic dark:text-emerald-300"
          dir="rtl"
        >
          {arabic}
          {cursor === "arabic" && (
            <span
              className="inline-block w-0.5 animate-pulse bg-emerald-700 mr-1 align-middle dark:bg-emerald-400"
              style={{ height: "1em" }}
            />
          )}
        </p>
      )}
      <div className="mt-2 text-center text-sm italic text-slate-600 min-h-[2.5rem] dark:text-slate-400">
        {showText && (
          <>
            &ldquo;{text}
            {cursor === "text" && (
              <span
                className="inline-block w-0.5 animate-pulse bg-emerald-700 ml-0.5 align-middle dark:bg-emerald-400"
                style={{ height: "1em" }}
              />
            )}
            {showClosingQuote && <span>&rdquo;</span>}
          </>
        )}
      </div>
      <p className={refClassName}>
        {sourceIcon} {source}
      </p>
    </>
  );
}

export default function MotivationCard() {
  const verses = getAllMotivations();
  const [mounted, setMounted] = useState(false);
  const [verseIdx, setVerseIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing-arabic");
  const [charCount, setCharCount] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);

  const verse = verses[verseIdx];
  const hasArabic = Boolean(verse.arabic);

  const goNext = useCallback(() => {
    setOpacity(0);
    setPhase("fadeout");
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n >= 0 && n < verses.length) setVerseIdx(n);
      }
    } catch {}
    setMounted(true);
  }, [verses.length]);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    let timer: ReturnType<typeof setTimeout>;

    switch (phase) {
      case "typing-arabic":
        if (!hasArabic) {
          setCharCount(0);
          setPhase("typing-text");
          break;
        }
        if (charCount < (verse.arabic?.length ?? 0)) {
          timer = setTimeout(() => setCharCount((c) => c + 1), SPEED_ARABIC);
        } else {
          timer = setTimeout(() => setPhase("pause"), 200);
        }
        break;

      case "pause":
        timer = setTimeout(() => {
          setCharCount(0);
          setPhase("typing-text");
        }, PAUSE_MS);
        break;

      case "typing-text":
        if (charCount < verse.text.length) {
          timer = setTimeout(() => setCharCount((c) => c + 1), SPEED_TEXT);
        } else {
          timer = setTimeout(() => setPhase("show-ref"), 300);
        }
        break;

      case "show-ref":
        timer = setTimeout(() => setPhase("hold"), 300);
        break;

      case "hold":
        timer = setTimeout(goNext, HOLD_MS);
        break;

      case "fadeout":
        timer = setTimeout(() => {
          setVerseIdx((i) => {
            const next = (i + 1) % verses.length;
            try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
            return next;
          });
          setCharCount(0);
          setOpacity(1);
          setPhase("typing-arabic");
        }, FADE_MS);
        break;
    }

    return () => clearTimeout(timer);
  }, [phase, charCount, verse, goNext, verses.length, hasArabic, mounted, reducedMotion]);

  const arabicVisible =
    reducedMotion
      ? verse.arabic ?? ""
      : phase === "typing-arabic"
      ? (verse.arabic ?? "").slice(0, charCount)
      : phase !== "fadeout"
      ? verse.arabic ?? ""
      : "";

  const showArabic = hasArabic && (reducedMotion || phase !== "fadeout");
  const showText =
    reducedMotion ||
    phase === "typing-text" ||
    phase === "show-ref" ||
    phase === "hold";
  const showRef = reducedMotion || phase === "show-ref" || phase === "hold";

  const textVisible =
    !reducedMotion && phase === "typing-text"
      ? verse.text.slice(0, charCount)
      : verse.text;

  const sourceIcon =
    verse.type === "quran"
      ? "📖"
      : verse.type === "hadith"
      ? "📜"
      : "✨";

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-900 dark:bg-slate-900">
        <div className="h-6 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="mt-3 h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="mt-2 h-3 w-2/3 mx-auto animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div
      className="grid rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition-opacity duration-[1200ms] ease-in-out dark:border-emerald-900 dark:bg-slate-900"
      style={{ opacity: reducedMotion ? 1 : opacity }}
    >
      {/*
        The finished verse, laid out but invisible, holds the card at its final
        height from the first keystroke. Without it the card grew a line at a
        time while typing and dropped the Arabic line entirely during the fade,
        and every one of those resizes shifted whatever sat below it — in the
        sidebar, that meant the nav jumping under the reader mid-scroll.
      */}
      <div aria-hidden="true" className="invisible col-start-1 row-start-1">
        <VerseBody
          arabic={verse.arabic ?? ""}
          cursor={null}
          showArabic={hasArabic}
          showClosingQuote
          showRef
          showText
          source={verse.source}
          sourceIcon={sourceIcon}
          text={verse.text}
        />
      </div>

      <div className="col-start-1 row-start-1">
        <VerseBody
          arabic={arabicVisible}
          cursor={
            reducedMotion
              ? null
              : phase === "typing-arabic"
              ? "arabic"
              : phase === "typing-text"
              ? "text"
              : null
          }
          showArabic={showArabic}
          showClosingQuote={reducedMotion || phase !== "typing-text"}
          showRef={showRef}
          showText={showText}
          source={verse.source}
          sourceIcon={sourceIcon}
          text={textVisible}
        />
      </div>
    </div>
  );
}
