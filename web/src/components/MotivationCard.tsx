"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllMotivations, Motivation } from "@/lib/motivations";

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

export default function MotivationCard() {
  const verses = getAllMotivations();
  const [verseIdx, setVerseIdx] = useState(() =>
    Math.floor(Math.random() * verses.length)
  );
  const [phase, setPhase] = useState<Phase>("typing-arabic");
  const [charCount, setCharCount] = useState(0);
  const [opacity, setOpacity] = useState(1);

  const verse = verses[verseIdx];
  const hasArabic = Boolean(verse.arabic);

  const goNext = useCallback(() => {
    setOpacity(0);
    setPhase("fadeout");
  }, []);

  useEffect(() => {
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
          setVerseIdx((i) => (i + 1) % verses.length);
          setCharCount(0);
          setOpacity(1);
          setPhase("typing-arabic");
        }, FADE_MS);
        break;
    }

    return () => clearTimeout(timer);
  }, [phase, charCount, verse, goNext, verses.length, hasArabic]);

  const arabicVisible =
    phase === "typing-arabic"
      ? (verse.arabic ?? "").slice(0, charCount)
      : phase !== "fadeout"
      ? verse.arabic ?? ""
      : "";

  const showArabic = hasArabic && phase !== "fadeout";
  const showText =
    phase === "typing-text" ||
    phase === "show-ref" ||
    phase === "hold";
  const showRef = phase === "show-ref" || phase === "hold";

  const textVisible =
    phase === "typing-text"
      ? verse.text.slice(0, charCount)
      : verse.text;

  const sourceIcon =
    verse.type === "quran"
      ? "📖"
      : verse.type === "hadith"
      ? "📜"
      : "✨";

  return (
    <div
      className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition-opacity duration-[1200ms] ease-in-out dark:border-emerald-900 dark:bg-slate-900"
      style={{ opacity }}
    >
      {showArabic && (
        <p
          className="text-center text-lg leading-relaxed text-emerald-900 min-h-[2rem] dark:text-emerald-300"
          dir="rtl"
        >
          {arabicVisible}
          {phase === "typing-arabic" && (
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
            &ldquo;{textVisible}
            {phase === "typing-text" && (
              <span
                className="inline-block w-0.5 animate-pulse bg-emerald-700 ml-0.5 align-middle dark:bg-emerald-400"
                style={{ height: "1em" }}
              />
            )}
            {phase !== "typing-text" && <span>&rdquo;</span>}
          </>
        )}
      </div>
      <p
        className={`mt-2 text-center text-xs font-medium text-emerald-700 transition-opacity duration-500 dark:text-emerald-400 ${
          showRef ? "opacity-100" : "opacity-0"
        }`}
      >
        {sourceIcon} {verse.source}
      </p>
    </div>
  );
}
