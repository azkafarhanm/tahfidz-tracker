"use client";

import { useState, useEffect } from "react";
import { getDailyMotivation } from "@/lib/motivations";

export default function MotivationCard() {
  const motivation = getDailyMotivation();
  const [displayedCount, setDisplayedCount] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const fullText = motivation.translation;

  useEffect(() => {
    if (displayedCount < fullText.length) {
      const delay = displayedCount === 0 ? 800 : 35;
      const timer = setTimeout(() => {
        setDisplayedCount((c) => c + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowTranslation(true), 400);
      return () => clearTimeout(timer);
    }
  }, [displayedCount, fullText.length]);

  const visibleText = fullText.slice(0, displayedCount);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <p
        className="text-center text-lg leading-relaxed text-emerald-900"
        dir="rtl"
      >
        {motivation.arabic}
      </p>
      <div className="mt-3 text-center text-sm italic text-slate-600 min-h-[2.5rem]">
        <span>&ldquo;{visibleText}</span>
        {displayedCount < fullText.length && (
          <span className="inline-block w-0.5 animate-pulse bg-emerald-700 ml-0.5 align-middle" style={{ height: "1em" }} />
        )}
        {displayedCount >= fullText.length && <span>&rdquo;</span>}
      </div>
      <p
        className={`mt-2 text-center text-xs font-medium text-emerald-700 transition-opacity duration-700 ${
          showTranslation ? "opacity-100" : "opacity-0"
        }`}
      >
        — QS. {motivation.surah}: {motivation.ayah}
      </p>
    </div>
  );
}
