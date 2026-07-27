"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import SurahInput from "@/components/SurahInput";
import { getJuz, getSurahNamesForJuz } from "@/lib/juz";
import { surahList } from "@/lib/surahs";
import {
  getRecordMaterialPreferenceKey,
  parseRecordMaterialPreference,
} from "@/lib/ui-session-state";
import { traceSmartDefault } from "@/lib/smart-default-trace";

type JuzFilter = number | "all";

type JuzFilteredSurahInputProps = {
  defaultFromAyah?: number;
  defaultValue?: string;
  id?: string;
  inputResetKey?: number;
  name?: string;
  required?: boolean;
  sessionPreferenceKey?: "hafalan" | "murojaah";
  sessionPreferenceStudentId?: string;
};

const juzOptions = Array.from({ length: 30 }, (_, index) => 30 - index);
const validSurahNames = new Set(surahList.map(({ name }) => name));

function initialJuz(defaultValue?: string, defaultFromAyah?: number): JuzFilter {
  if (!defaultValue) return 30;
  return getJuz(defaultValue, defaultFromAyah ?? 1) ?? "all";
}

export default function JuzFilteredSurahInput({
  defaultFromAyah,
  defaultValue,
  id,
  inputResetKey,
  name = "surah",
  required = true,
  sessionPreferenceKey,
  sessionPreferenceStudentId,
}: JuzFilteredSurahInputProps) {
  const t = useTranslations("SurahInput");
  const [selectedJuz, setSelectedJuz] = useState<JuzFilter>(() => {
    const value = initialJuz(defaultValue, defaultFromAyah);
    traceSmartDefault("JuzFilteredSurahInput local-state init", {
      id: id ?? name,
      source: "server-props",
      defaultValue: defaultValue ?? null,
      defaultFromAyah: defaultFromAyah ?? null,
      selectedJuz: value,
    });
    return value;
  });
  const [currentValue, setCurrentValue] = useState(defaultValue ?? "");
  const [inputDefaultValue, setInputDefaultValue] = useState(defaultValue);
  const [inputVersion, setInputVersion] = useState(0);
  const previousResetKey = useRef(inputResetKey);
  const inputId = id ?? name;
  const juzSelectId = `${inputId}-juz`;
  const storageKey = sessionPreferenceKey && sessionPreferenceStudentId
    ? getRecordMaterialPreferenceKey(
        sessionPreferenceStudentId,
        sessionPreferenceKey,
      )
    : null;

  useEffect(() => {
    traceSmartDefault("JuzFilteredSurahInput hydrated", {
      id: inputId,
      defaultValue: defaultValue ?? null,
      storageKey,
      currentValue,
      inputVersion,
    });
    // This is intentionally mount-only: it marks the hydration boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (defaultValue || !storageKey) {
      traceSmartDefault("session restore skipped", {
        id: inputId,
        reason: defaultValue ? "server-default-wins" : "no-student-scoped-key",
        defaultValue: defaultValue ?? null,
        storageKey,
      });
      return;
    }
    try {
      const rawPreference = window.sessionStorage.getItem(storageKey);
      const preference = parseRecordMaterialPreference(
        rawPreference,
        validSurahNames,
      );
      traceSmartDefault("session restore read", {
        id: inputId,
        storageKey,
        rawPreference,
        parsedPreference: preference,
        overwritesCurrentValue: Boolean(preference),
      });
      if (!preference) return;
      setSelectedJuz(preference.juz);
      setCurrentValue(preference.surah);
      setInputDefaultValue(preference.surah);
      setInputVersion((version) => version + 1);
    } catch (error) {
      traceSmartDefault("session restore failed", {
        id: inputId,
        storageKey,
        error: error instanceof Error ? error.message : String(error),
      });
      // Session preferences are an optional enhancement.
    }
  }, [defaultValue, inputId, storageKey]);

  function saveSessionPreference(juz: JuzFilter, surah: string) {
    if (!storageKey || !surah) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({ juz, surah }));
      traceSmartDefault("session preference saved", {
        id: inputId,
        storageKey,
        juz,
        surah,
      });
    } catch (error) {
      traceSmartDefault("session preference save failed", {
        id: inputId,
        storageKey,
        error: error instanceof Error ? error.message : String(error),
      });
      // Session preferences are an optional enhancement.
    }
  }

  useEffect(() => {
    if (previousResetKey.current === inputResetKey) return;
    previousResetKey.current = inputResetKey;
    traceSmartDefault("input reset overwrites local state", {
      id: inputId,
      inputResetKey,
      previousValue: currentValue,
      nextValue: "",
    });
    setCurrentValue("");
    setInputDefaultValue(undefined);
    setInputVersion((version) => version + 1);
  }, [currentValue, inputId, inputResetKey]);

  useEffect(() => {
    traceSmartDefault("JuzFilteredSurahInput state committed", {
      id: inputId,
      selectedJuz,
      currentValue,
      inputDefaultValue: inputDefaultValue ?? null,
      inputVersion,
    });
  }, [currentValue, inputDefaultValue, inputId, inputVersion, selectedJuz]);

  const options = useMemo(() => {
    if (selectedJuz === "all") return surahList;
    const names = new Set(getSurahNamesForJuz(selectedJuz));
    return surahList.filter((surah) => names.has(surah.name));
  }, [selectedJuz]);

  const selectedSurah = surahList.find((surah) => surah.name === currentValue);
  const selectionOutsideFilter = Boolean(
    selectedJuz !== "all" &&
      selectedSurah &&
      !options.some((surah) => surah.name === selectedSurah.name),
  );
  const placeholder = selectedJuz === "all"
    ? t("allSurahsPlaceholder")
    : t("placeholderInJuz", { juz: selectedJuz });

  return (
    <div className="space-y-3">
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          htmlFor={juzSelectId}
        >
          {t("juzLabel")}
        </label>
        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
          id={juzSelectId}
          onChange={(event) => {
            const value = event.target.value;
            const nextJuz = value === "all" ? "all" : Number(value);
            setSelectedJuz(nextJuz);
            saveSessionPreference(nextJuz, currentValue);
          }}
          value={selectedJuz}
        >
          <option value="all">{t("allSurahs")}</option>
          {juzOptions.map((juz) => (
            <option key={juz} value={juz}>
              {t("juzOption", { juz })}
            </option>
          ))}
        </select>
      </div>

      <SurahInput
        defaultValue={inputDefaultValue}
        id={id}
        key={inputVersion}
        name={name}
        onValueChange={(value) => {
          traceSmartDefault("SurahInput user value committed to parent", {
            id: inputId,
            previousValue: currentValue,
            nextValue: value,
          });
          setCurrentValue(value);
          saveSessionPreference(selectedJuz, value);
        }}
        options={options}
        placeholder={placeholder}
        required={required}
      />

      {selectionOutsideFilter && selectedSurah && selectedJuz !== "all" ? (
        <p aria-live="polite" className="text-xs text-amber-700 dark:text-amber-300">
          {t("selectionKept", { surah: selectedSurah.name, juz: selectedJuz })}
        </p>
      ) : null}
    </div>
  );
}
