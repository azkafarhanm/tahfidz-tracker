"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllMotivations } from "@/lib/motivations";

type Phase = "typing-arabic" | "pause" | "typing-translation" | "show-ref" | "hold" | "fadeout";

const SPEED_ARABIC = 55;
const SPEED_TRANSLATION = 30;
const PAUSE_MS = 600;
const HOLD_MS = 5000;
const FADE_MS = 1200;

export default function MotivationCard() {
  const verses = getAllMotivations();
  const [verseIdx, setVerseIdx] = useState(() => Math.floor(Math.random() * verses.length));
  const [phase, setPhase] = useState<Phase>("typing-arabic");
  const [charCount, setCharCount] = useState(0);
  const [opacity, setOpacity] = useState(1);

  const verse = verses[verseIdx];

  const goNext = useCallback(() => {
    setOpacity(0);
    setPhase("fadeout");
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    switch (phase) {
      case "typing-arabic":
        if (charCount < verse.arabic.length) {
          timer = setTimeout(() => setCharCount((c) => c + 1), SPEED_ARABIC);
        } else {
          timer = setTimeout(() => setPhase("pause"), 200);
        }
        break;

      case "pause":
        timer = setTimeout(() => {
          setCharCount(0);
          setPhase("typing-translation");
        }, PAUSE_MS);
        break;

      case "typing-translation":
        if (charCount < verse.translation.length) {
          timer = setTimeout(() => setCharCount((c) => c + 1), SPEED_TRANSLATION);
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
  }, [phase, charCount, verse, goNext, verses.length]);

  const arabicVisible = phase === "typing-arabic"
    ? verse.arabic.slice(0, charCount)
    : (phase === "fadeout" ? "" : verse.arabic);

  const showArabic = phase !== "fadeout";
  const showTranslation = phase === "typing-translation" || phase === "show-ref" || phase === "hold";
  const showRef = phase === "show-ref" || phase === "hold";

  const transVisible = phase === "typing-translation"
    ? verse.translation.slice(0, charCount)
    : verse.translation;

  return (
    <div
      className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition-opacity duration-[1200ms] ease-in-out"
      style={{ opacity }}
    >
      {showArabic && (
        <p className="text-center text-lg leading-relaxed text-emerald-900 min-h-[2rem]" dir="rtl">
          {arabicVisible}
          {phase === "typing-arabic" && (
            <span className="inline-block w-0.5 animate-pulse bg-emerald-700 mr-1 align-middle" style={{ height: "1em" }} />
          )}
        </p>
      )}
      <div className="mt-3 text-center text-sm italic text-slate-600 min-h-[2.5rem]">
        {showTranslation && (
          <>
            &ldquo;{transVisible}
            {phase === "typing-translation" && (
              <span className="inline-block w-0.5 animate-pulse bg-emerald-700 ml-0.5 align-middle" style={{ height: "1em" }} />
            )}
            {phase !== "typing-translation" && <span>&rdquo;</span>}
          </>
        )}
      </div>
      <p
        className={`mt-2 text-center text-xs font-medium text-emerald-700 transition-opacity duration-500 ${
          showRef ? "opacity-100" : "opacity-0"
        }`}
      >
        — QS. {verse.surah}: {verse.ayah}
      </p>
    </div>
  );
}
