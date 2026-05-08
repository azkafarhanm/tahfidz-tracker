"use client";

import { useState, useRef, useEffect } from "react";
import { surahList } from "@/lib/surahs";

export default function SurahInput({
  defaultValue,
  id,
}: {
  defaultValue?: string;
  id?: string;
}) {
  const [query, setQuery] = useState(defaultValue ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query.trim()
    ? surahList.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          String(s.number).includes(query.trim()),
      )
    : surahList;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        id={id}
        name="surah"
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (!isOpen) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && filtered.length > 0) {
            e.preventDefault();
            const selected = filtered[highlightIndex];
            setQuery(selected.name);
            setIsOpen(false);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        placeholder="Ketik nama surah..."
        ref={inputRef}
        required
        type="text"
        value={query}
      />
      {isOpen && filtered.length > 0 ? (
        <ul
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          ref={listRef}
          role="listbox"
        >
          {filtered.slice(0, 20).map((surah, i) => (
            <li key={surah.number}>
              <button
                aria-selected={i === highlightIndex}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                  i === highlightIndex
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => {
                  setQuery(surah.name);
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                role="option"
                type="button"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">
                  {surah.number}
                </span>
                <span className="font-medium">{surah.name}</span>
                <span className="ml-auto text-xs text-slate-400">{surah.ayahs} ayat</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
