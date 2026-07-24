"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import {
  surahList,
  type SurahInfo,
} from "@/lib/surahs";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import {
  getCenteredSurahScrollTop,
  getSurahPickerListMaxHeight,
  getSelectedSurahIndex,
  getVisibleSurahOptions,
} from "@/lib/surah-picker";

type SurahInputProps = {
  defaultValue?: string;
  id?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  options?: readonly SurahInfo[];
  placeholder?: string;
  required?: boolean;
};

const LIST_MAX_HEIGHT = 208;

export default function SurahInput({
  defaultValue,
  id,
  name = "surah",
  onValueChange,
  options = surahList,
  placeholder,
  required = true,
}: SurahInputProps) {
  const t = useTranslations("SurahInput");
  const [value, setValue] = useState(defaultValue ?? "");
  const [selectedValue, setSelectedValue] = useState(
    options.some(({ name: surahName }) => surahName === defaultValue)
      ? defaultValue ?? ""
      : "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleListMaxHeight, setVisibleListMaxHeight] = useState<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(() =>
    getSelectedSurahIndex(options, defaultValue ?? ""),
  );
  const justSelected = useRef(false);
  const isPointerFocus = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const initialPositionIndexRef = useRef<number | null>(null);
  const listboxId = `${id ?? "surah"}-listbox`;
  const filtered = useMemo(
    () => getVisibleSurahOptions(options, searchQuery, isSearching),
    [isSearching, options, searchQuery],
  );
  const activeOptionId =
    isOpen && filtered[highlightIndex]
      ? `${listboxId}-option-${filtered[highlightIndex].number}`
      : undefined;

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
    if (isSearching) {
      setHighlightIndex(0);
      return;
    }
    setHighlightIndex(getSelectedSurahIndex(filtered, selectedValue));
  }, [filtered, isSearching, selectedValue]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setVisibleListMaxHeight(null);
      return;
    }

    const visualViewport = window.visualViewport;

    function syncListHeight() {
      const input = inputRef.current;
      if (!input) return;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      setVisibleListMaxHeight(
        getSurahPickerListMaxHeight(
          input.getBoundingClientRect().bottom,
          viewportHeight,
          LIST_MAX_HEIGHT,
        ),
      );
    }

    syncListHeight();
    visualViewport?.addEventListener("resize", syncListHeight);
    visualViewport?.addEventListener("scroll", syncListHeight);
    window.addEventListener("resize", syncListHeight);
    window.addEventListener("scroll", syncListHeight, { passive: true });

    return () => {
      visualViewport?.removeEventListener("resize", syncListHeight);
      visualViewport?.removeEventListener("scroll", syncListHeight);
      window.removeEventListener("resize", syncListHeight);
      window.removeEventListener("scroll", syncListHeight);
    };
  }, [isOpen]);

  useEffect(() => {
    const initialIndex = initialPositionIndexRef.current;
    const list = listRef.current;
    if (!isOpen || initialIndex === null || !list) return;
    initialPositionIndexRef.current = null;
    const item = list.children[initialIndex] as HTMLElement | undefined;
    if (!item) return;
    list.scrollTop = getCenteredSurahScrollTop(
      item.offsetTop,
      item.offsetHeight,
      list.clientHeight,
    );
  }, [isOpen]);

  function selectSurah(name: string) {
    setValue(name);
    setSelectedValue(name);
    setSearchQuery("");
    setIsSearching(false);
    onValueChange?.(name);
    setIsOpen(false);
    justSelected.current = true;
    inputRef.current?.focus();
    setTimeout(() => {
      justSelected.current = false;
    }, 200);
  }

  function openDropdown() {
    const selectedIndex = getSelectedSurahIndex(
      options,
      selectedValue || value,
    );
    setSearchQuery("");
    setIsSearching(false);
    setHighlightIndex(selectedIndex);
    initialPositionIndexRef.current = selectedIndex;
    setIsOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.select());
  }

  function toggleDropdown() {
    isPointerFocus.current = false;

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (!justSelected.current) openDropdown();
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        autoCapitalize="none"
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
        id={id}
        name={name}
        onClick={toggleDropdown}
        onChange={(e) => {
          const nextValue = e.target.value;
          setValue(nextValue);
          setSelectedValue("");
          setSearchQuery(nextValue);
          setIsSearching(true);
          onValueChange?.(nextValue);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (!justSelected.current && !isPointerFocus.current) {
            openDropdown();
          }
        }}
        onKeyDown={(e) => {
          if (!isOpen) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (filtered.length > 0) {
              setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
            }
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && filtered.length > 0) {
            e.preventDefault();
            selectSurah(filtered[highlightIndex].name);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        placeholder={placeholder ?? t("placeholder")}
        onPointerCancel={() => {
          isPointerFocus.current = false;
        }}
        onPointerDown={(event) => {
          isPointerFocus.current = event.button === 0;
        }}
        ref={inputRef}
        required={required}
        role="combobox"
        spellCheck={false}
        type="text"
        value={value}
      />
      {isOpen && filtered.length > 0 ? (
        <ul
          className="absolute z-50 mt-1 max-h-52 w-full touch-pan-y overflow-y-auto overscroll-y-contain rounded-xl border border-slate-200 bg-white py-1 shadow-lg [-webkit-overflow-scrolling:touch] dark:border-slate-700 dark:bg-slate-900"
          id={listboxId}
          ref={listRef}
          role="listbox"
          style={visibleListMaxHeight === null
            ? undefined
            : { maxHeight: visibleListMaxHeight }}
        >
          {filtered.map((surah, i) => (
            <li key={surah.number}>
              <button
                aria-selected={surah.name === selectedValue}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                  i === highlightIndex
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
                id={`${listboxId}-option-${surah.number}`}
                onClick={() => selectSurah(surah.name)}
                onMouseEnter={() => setHighlightIndex(i)}
                role="option"
                type="button"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {surah.number}
                </span>
                <span className="font-medium">{surah.name}</span>
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                  {t("ayahCount", { count: surah.ayahs })}
                </span>
                {surah.name === selectedValue ? (
                  <Check
                    aria-hidden="true"
                    className="shrink-0 text-emerald-700 dark:text-emerald-400"
                    size={16}
                    strokeWidth={2.5}
                  />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
